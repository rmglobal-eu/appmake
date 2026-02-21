import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { subscriptions, invoices, projects, usageLogs } from "@/lib/db/schema";
import { eq, and, gte, desc, count } from "drizzle-orm";
import { getPlanLimits } from "@/lib/billing/plan-limits";

function getStartOfDay(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get subscription
    const sub = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .then((rows) => rows[0]);

    const plan = sub?.status === "active" ? (sub.plan ?? "free") : "free";
    const limits = getPlanLimits(plan);
    const startOfDay = getStartOfDay();

    // Get usage data in parallel
    const [messageCount, projectCount, userInvoices] = await Promise.all([
      // Messages sent today (using usage_logs as proxy)
      db
        .select({ count: count() })
        .from(usageLogs)
        .where(
          and(
            eq(usageLogs.userId, userId),
            gte(usageLogs.createdAt, startOfDay)
          )
        )
        .then((rows) => rows[0]?.count ?? 0),

      // Total projects
      db
        .select({ count: count() })
        .from(projects)
        .where(eq(projects.userId, userId))
        .then((rows) => rows[0]?.count ?? 0),

      // Invoices
      db
        .select()
        .from(invoices)
        .where(eq(invoices.userId, userId))
        .orderBy(desc(invoices.createdAt))
        .limit(50),
    ]);

    const resetsAt = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    return NextResponse.json({
      plan,
      subscription: sub
        ? {
            status: sub.status,
            currentPeriodEnd: sub.currentPeriodEnd,
          }
        : null,
      usage: {
        messages: {
          used: messageCount,
          limit: limits.messagesPerDay,
          resetsAt: resetsAt.toISOString(),
        },
        projects: {
          used: projectCount,
          limit: limits.projects,
        },
        storage: {
          used: 0, // TODO: Calculate actual storage usage
          limit: limits.storageBytes,
        },
      },
      invoices: userInvoices.map((inv) => ({
        id: inv.id,
        date: inv.createdAt?.toISOString() ?? new Date().toISOString(),
        description: "Subscription payment",
        amount: inv.amount ?? 0,
        currency: inv.currency ?? "usd",
        status: inv.status ?? "paid",
        pdfUrl: inv.pdfUrl ?? null,
      })),
    });
  } catch (error) {
    console.error("[BILLING_USAGE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
