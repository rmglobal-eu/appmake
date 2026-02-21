import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getStripe, getOrCreateCustomer } from "@/lib/billing/stripe";

const PRICE_IDS: Record<string, string | undefined> = {
  pro_month: process.env.STRIPE_PRO_MONTHLY,
  pro_year: process.env.STRIPE_PRO_YEARLY,
  team_month: process.env.STRIPE_TEAM_MONTHLY,
  team_year: process.env.STRIPE_TEAM_YEARLY,
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { planId, interval } = body as {
      planId: "pro" | "team";
      interval: "month" | "year";
    };

    if (!planId || !interval) {
      return NextResponse.json(
        { error: "Missing planId or interval" },
        { status: 400 }
      );
    }

    if (!["pro", "team"].includes(planId)) {
      return NextResponse.json(
        { error: "Invalid planId. Must be 'pro' or 'team'" },
        { status: 400 }
      );
    }

    if (!["month", "year"].includes(interval)) {
      return NextResponse.json(
        { error: "Invalid interval. Must be 'month' or 'year'" },
        { status: 400 }
      );
    }

    const priceKey = `${planId}_${interval}`;
    const priceId = PRICE_IDS[priceKey];

    if (!priceId) {
      return NextResponse.json(
        { error: `Price not configured for ${planId} ${interval}` },
        { status: 500 }
      );
    }

    const stripe = getStripe();
    const customerId = await getOrCreateCustomer(
      session.user.id,
      session.user.email
    );

    // Check if user already has an active subscription
    const existingSub = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, session.user.id))
      .then((rows) => rows[0]);

    if (existingSub?.stripeSubscriptionId && existingSub.status === "active") {
      // Redirect to portal for plan changes instead
      return NextResponse.json(
        {
          error:
            "You already have an active subscription. Use the billing portal to change plans.",
        },
        { status: 400 }
      );
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: {
        userId: session.user.id,
        planId,
        interval,
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          planId,
        },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("[BILLING_CHECKOUT]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
