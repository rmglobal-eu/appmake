import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const STRIPE_PRICE_PRO = process.env.STRIPE_PRICE_PRO_MONTHLY;
const STRIPE_PRICE_TEAM = process.env.STRIPE_PRICE_TEAM_MONTHLY;

async function stripeRequest(path: string, body?: Record<string, string>, method = "POST") {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body ? new URLSearchParams(body).toString() : undefined,
  });
  return res.json();
}

// Get current subscription
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, session.user.id),
  });

  return NextResponse.json({
    subscription: sub || { plan: "free", status: "active" },
  });
}

// Create checkout session
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!STRIPE_SECRET) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const { plan } = (await req.json()) as { plan: "pro" | "team" };
  const priceId = plan === "pro" ? STRIPE_PRICE_PRO : STRIPE_PRICE_TEAM;

  if (!priceId) {
    return NextResponse.json({ error: "Price not configured" }, { status: 503 });
  }

  // Get or create Stripe customer
  let sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, session.user.id),
  });

  let customerId = sub?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripeRequest("/customers", {
      email: session.user.email || "",
      "metadata[userId]": session.user.id,
    });
    customerId = customer.id;

    if (!sub) {
      [sub] = await db.insert(subscriptions).values({
        userId: session.user.id,
        stripeCustomerId: customerId,
      }).returning();
    } else {
      await db.update(subscriptions)
        .set({ stripeCustomerId: customerId })
        .where(eq(subscriptions.id, sub.id));
    }
  }

  // Create checkout session
  const origin = req.headers.get("origin") || "http://localhost:3000";
  const checkoutSession = await stripeRequest("/checkout/sessions", {
    customer: customerId!,
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    mode: "subscription",
    success_url: `${origin}/pricing?success=true`,
    cancel_url: `${origin}/pricing?canceled=true`,
    "metadata[userId]": session.user.id,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
