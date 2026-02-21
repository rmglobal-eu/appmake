import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!STRIPE_WEBHOOK_SECRET || !sig) {
    return new Response("Webhook secret not configured", { status: 400 });
  }

  // Simple signature verification (in production, use stripe SDK)
  // For now, parse the event directly
  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }

  const obj = event.data.object as Record<string, unknown>;

  switch (event.type) {
    case "checkout.session.completed": {
      const userId = (obj.metadata as Record<string, string>)?.userId;
      const subscriptionId = obj.subscription as string;
      if (userId && subscriptionId) {
        // Fetch subscription details from Stripe
        const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
          headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
        });
        const subData = await subRes.json();
        const priceId = subData.items?.data?.[0]?.price?.id;
        const plan = priceId === process.env.STRIPE_PRICE_TEAM_MONTHLY ? "team" : "pro";

        await db.update(subscriptions)
          .set({
            stripeSubscriptionId: subscriptionId,
            plan: plan as "pro" | "team",
            status: "active",
            currentPeriodEnd: new Date(subData.current_period_end * 1000),
          })
          .where(eq(subscriptions.userId, userId));
      }
      break;
    }

    case "customer.subscription.updated": {
      const subId = obj.id as string;
      const status = obj.status as string;
      const cancelAt = obj.cancel_at_period_end as boolean;

      const sub = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.stripeSubscriptionId, subId),
      });

      if (sub) {
        await db.update(subscriptions)
          .set({
            status: cancelAt ? "canceled" : (status === "active" ? "active" : status === "past_due" ? "past_due" : "active") as "active" | "canceled" | "past_due",
            currentPeriodEnd: new Date((obj.current_period_end as number) * 1000),
          })
          .where(eq(subscriptions.id, sub.id));
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subId = obj.id as string;
      const sub = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.stripeSubscriptionId, subId),
      });
      if (sub) {
        await db.update(subscriptions)
          .set({ plan: "free", status: "canceled", stripeSubscriptionId: null })
          .where(eq(subscriptions.id, sub.id));
      }
      break;
    }
  }

  return new Response("ok", { status: 200 });
}
