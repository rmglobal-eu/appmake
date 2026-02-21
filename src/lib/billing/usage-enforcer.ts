import { db } from "@/lib/db";
import { subscriptions, projects, usageLogs } from "@/lib/db/schema";
import { eq, and, gte, sql, count } from "drizzle-orm";
import { getPlanLimits, isModelAvailable } from "./plan-limits";

interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  limit: number;
  used: number;
}

interface SimpleCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Get the user's current plan from the subscriptions table.
 */
async function getUserPlan(userId: string): Promise<string> {
  const sub = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .then((rows) => rows[0]);

  if (!sub || sub.status !== "active") {
    return "free";
  }

  return sub.plan ?? "free";
}

/**
 * Get the start of the current day (UTC midnight).
 */
function getStartOfDay(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

/**
 * Checks if a user can send a message based on their plan's daily limit.
 */
export async function canSendMessage(
  userId: string
): Promise<UsageCheckResult> {
  const plan = await getUserPlan(userId);
  const limits = getPlanLimits(plan);
  const startOfDay = getStartOfDay();

  // Count messages sent today
  const result = await db
    .select({ count: count() })
    .from(usageLogs)
    .where(
      and(
        eq(usageLogs.userId, userId),
        gte(usageLogs.createdAt, startOfDay)
      )
    )
    .then((rows) => rows[0]);

  const used = result?.count ?? 0;
  const limit = limits.messagesPerDay;

  if (used >= limit) {
    return {
      allowed: false,
      reason: `You've reached your daily message limit of ${limit}. Upgrade your plan for more messages.`,
      limit,
      used,
    };
  }

  return {
    allowed: true,
    limit,
    used,
  };
}

/**
 * Checks if a user can create a new project based on their plan's project limit.
 */
export async function canCreateProject(
  userId: string
): Promise<SimpleCheckResult> {
  const plan = await getUserPlan(userId);
  const limits = getPlanLimits(plan);

  // Unlimited projects
  if (limits.projects === -1) {
    return { allowed: true };
  }

  // Count user's current projects
  const result = await db
    .select({ count: count() })
    .from(projects)
    .where(eq(projects.userId, userId))
    .then((rows) => rows[0]);

  const currentCount = result?.count ?? 0;

  if (currentCount >= limits.projects) {
    return {
      allowed: false,
      reason: `You've reached your project limit of ${limits.projects}. Upgrade your plan to create more projects.`,
    };
  }

  return { allowed: true };
}

/**
 * Checks if a user can use a specific AI model based on their plan.
 */
export async function canUseModel(
  userId: string,
  modelId: string
): Promise<SimpleCheckResult> {
  const plan = await getUserPlan(userId);

  if (!isModelAvailable(plan, modelId)) {
    const requiredPlan = modelId.includes("gpt-4") || modelId.includes("opus") || modelId.includes("sonnet")
      ? "pro"
      : "team";

    return {
      allowed: false,
      reason: `The model "${modelId}" is not available on the ${plan} plan. Upgrade to ${requiredPlan} or higher to use this model.`,
    };
  }

  return { allowed: true };
}

/**
 * Gets the user's current usage summary.
 */
export async function getUsageSummary(userId: string) {
  const plan = await getUserPlan(userId);
  const limits = getPlanLimits(plan);
  const startOfDay = getStartOfDay();

  const [messageCount, projectCount] = await Promise.all([
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
    db
      .select({ count: count() })
      .from(projects)
      .where(eq(projects.userId, userId))
      .then((rows) => rows[0]?.count ?? 0),
  ]);

  return {
    plan,
    messages: {
      used: messageCount,
      limit: limits.messagesPerDay,
      resetsAt: new Date(
        getStartOfDay().getTime() + 24 * 60 * 60 * 1000
      ),
    },
    projects: {
      used: projectCount,
      limit: limits.projects,
    },
    storage: {
      limit: limits.storageBytes,
    },
    models: limits.models,
  };
}
