import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { subscriptions, invoices } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getStripe } from "@/lib/billing/stripe";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[WEBHOOK] STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;
  const stripe = getStripe();

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[WEBHOOK] Signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planId = (session.metadata?.planId ?? "pro") as "free" | "pro" | "team";

        if (!userId || !planId) {
          console.error("[WEBHOOK] Missing metadata on checkout session");
          break;
        }

        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        const stripeSubscription =
          await stripe.subscriptions.retrieve(subscriptionId) as unknown as {
            current_period_end: number;
          };

        await db
          .insert(subscriptions)
          .values({
            userId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            plan: planId,
            status: "active",
            currentPeriodEnd: new Date(
              stripeSubscription.current_period_end * 1000
            ),
          })
          .onConflictDoUpdate({
            target: subscriptions.userId,
            set: {
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              plan: planId,
              status: "active",
              currentPeriodEnd: new Date(
                stripeSubscription.current_period_end * 1000
              ),
            },
          });

        console.log(
          `[WEBHOOK] Checkout completed for user ${userId}, plan: ${planId}`
        );
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as unknown as {
          id: string;
          status: string;
          current_period_end: number;
          metadata?: Record<string, string>;
        };

        // Find user by subscription ID
        const sub = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
          .then((rows) => rows[0]);

        if (sub) {
          const status = subscription.status === "active"
            ? "active" as const
            : subscription.status === "past_due"
              ? "past_due" as const
              : subscription.status === "canceled"
                ? "canceled" as const
                : "active" as const;

          await db
            .update(subscriptions)
            .set({
              status,
              currentPeriodEnd: new Date(
                subscription.current_period_end * 1000
              ),
            })
            .where(eq(subscriptions.userId, sub.userId));
        }

        console.log(
          `[WEBHOOK] Subscription updated: ${subscription.id}, status: ${subscription.status}`
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as unknown as {
          id: string;
          metadata?: Record<string, string>;
        };

        await db
          .update(subscriptions)
          .set({
            status: "canceled",
            plan: "free",
          })
          .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

        console.log(
          `[WEBHOOK] Subscription canceled: ${subscription.id}`
        );
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const sub = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeCustomerId, customerId))
          .then((rows) => rows[0]);

        if (sub) {
          await db.insert(invoices).values({
            userId: sub.userId,
            stripeInvoiceId: invoice.id,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: "paid",
            pdfUrl: invoice.invoice_pdf ?? null,
          });

          console.log(
            `[WEBHOOK] Invoice paid for user ${sub.userId}: $${(invoice.amount_paid / 100).toFixed(2)}`
          );
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const sub = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeCustomerId, customerId))
          .then((rows) => rows[0]);

        if (sub) {
          await db
            .update(subscriptions)
            .set({ status: "past_due" })
            .where(eq(subscriptions.userId, sub.userId));

          await db.insert(invoices).values({
            userId: sub.userId,
            stripeInvoiceId: invoice.id,
            amount: 0,
            currency: invoice.currency,
            status: "open",
            pdfUrl: invoice.invoice_pdf ?? null,
          });

          console.log(
            `[WEBHOOK] Payment failed for user ${sub.userId}`
          );
        }
        break;
      }

      default:
        console.log(`[WEBHOOK] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[WEBHOOK] Error processing event:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
