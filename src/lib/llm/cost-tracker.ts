import { db } from "@/lib/db";
import { usageLogs } from "@/lib/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";

// Cost per 1M tokens (in USD) — approximate pricing
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  "gpt-4.1-mini": { input: 0.40, output: 1.60 },
  "gpt-4.1": { input: 2.00, output: 8.00 },
  "gpt-4o": { input: 2.50, output: 10.00 },
  "gpt-5.2": { input: 5.00, output: 15.00 },
  "gpt-5.2-chat-latest": { input: 3.00, output: 12.00 },
  "gpt-5.2-codex": { input: 5.00, output: 15.00 },
  "o3-mini": { input: 1.10, output: 4.40 },
  "o4-mini": { input: 1.10, output: 4.40 },
  "claude-sonnet-4-20250514": { input: 3.00, output: 15.00 },
  "claude-opus-4-20250514": { input: 15.00, output: 75.00 },
};

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const costs = MODEL_COSTS[model] ?? { input: 2.00, output: 8.00 };
  return (inputTokens / 1_000_000) * costs.input + (outputTokens / 1_000_000) * costs.output;
}

export interface UsageLogEntry {
  userId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  projectId?: string;
}

export async function logUsage(entry: UsageLogEntry): Promise<void> {
  const cost = calculateCost(entry.model, entry.inputTokens, entry.outputTokens);

  try {
    await db.insert(usageLogs).values({
      userId: entry.userId,
      model: entry.model,
      inputTokens: entry.inputTokens,
      outputTokens: entry.outputTokens,
      cost: cost.toFixed(6),
      projectId: entry.projectId ?? null,
    });
  } catch {
    // Best-effort logging — don't break the main flow
    console.error("[cost-tracker] Failed to log usage");
  }
}

export interface DailyUsageSummary {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  requestCount: number;
}

export async function getDailyUsage(userId: string): Promise<DailyUsageSummary> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  try {
    const result = await db
      .select({
        totalInputTokens: sql<number>`COALESCE(SUM(${usageLogs.inputTokens}), 0)`,
        totalOutputTokens: sql<number>`COALESCE(SUM(${usageLogs.outputTokens}), 0)`,
        totalCost: sql<number>`COALESCE(SUM(CAST(${usageLogs.cost} AS NUMERIC)), 0)`,
        requestCount: sql<number>`COUNT(*)`,
      })
      .from(usageLogs)
      .where(
        and(eq(usageLogs.userId, userId), gte(usageLogs.createdAt, startOfDay))
      );

    return result[0] ?? { totalInputTokens: 0, totalOutputTokens: 0, totalCost: 0, requestCount: 0 };
  } catch {
    return { totalInputTokens: 0, totalOutputTokens: 0, totalCost: 0, requestCount: 0 };
  }
}
