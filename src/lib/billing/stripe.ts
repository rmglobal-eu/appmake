import Stripe from "stripe";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

let stripeInstance: Stripe | null = null;

/**
 * Returns a singleton Stripe client instance.
 * Throws if STRIPE_SECRET_KEY is not set.
 */
export function getStripe(): Stripe {
  if (stripeInstance) {
    return stripeInstance;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Please add it to your environment variables."
    );
  }

  stripeInstance = new Stripe(secretKey, {
    apiVersion: "2026-01-28.clover",
    typescript: true,
  });

  return stripeInstance;
}

/**
 * Gets an existing Stripe customer ID for the user, or creates a new one.
 * Also stores the customer ID in the subscriptions table.
 */
export async function getOrCreateCustomer(
  userId: string,
  email: string
): Promise<string> {
  // Check if user already has a Stripe customer ID
  const existingSub = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .then((rows) => rows[0]);

  if (existingSub?.stripeCustomerId) {
    return existingSub.stripeCustomerId;
  }

  const stripe = getStripe();

  // Search for existing customer by email in Stripe
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  let customerId: string;

  if (existingCustomers.data.length > 0) {
    customerId = existingCustomers.data[0].id;
  } else {
    // Create new customer
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId,
      },
    });
    customerId = customer.id;
  }

  // Store/update the customer ID in our database
  if (existingSub) {
    await db
      .update(subscriptions)
      .set({
        stripeCustomerId: customerId,
      })
      .where(eq(subscriptions.userId, userId));
  } else {
    await db.insert(subscriptions).values({
      userId,
      stripeCustomerId: customerId,
      plan: "free",
      status: "active",
    });
  }

  return customerId;
}
