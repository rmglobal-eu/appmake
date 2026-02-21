import { db } from "@/lib/db";
import { usageLogs, analyticsEvents } from "@/lib/db/schema";
import { sql, gte, eq, and, desc } from "drizzle-orm";

export interface DailyUsage {
  date: string;
  messages: number;
  tokens: number;
}

export interface ModelUsage {
  model: string;
  count: number;
  percentage: number;
}

export interface DailyCost {
  date: string;
  [model: string]: number | string;
}

export interface PerformanceMetrics {
  avgLatencyMs: number;
  p95LatencyMs: number;
  avgTokensPerRequest: number;
  successRate: number;
  totalRequests: number;
}

function daysAgoDate(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function aggregateUsageByDay(
  userId: string,
  days: number
): Promise<DailyUsage[]> {
  const since = daysAgoDate(days);

  const rows = await db
    .select({
      date: sql<string>`DATE(${usageLogs.createdAt})`.as("date"),
      messages: sql<number>`COUNT(*)`.as("messages"),
      tokens: sql<number>`COALESCE(SUM(${usageLogs.inputTokens} + ${usageLogs.outputTokens}), 0)`.as(
        "tokens"
      ),
    })
    .from(usageLogs)
    .where(and(eq(usageLogs.userId, userId), gte(usageLogs.createdAt, since)))
    .groupBy(sql`DATE(${usageLogs.createdAt})`)
    .orderBy(sql`DATE(${usageLogs.createdAt})`);

  return rows.map((r) => ({
    date: String(r.date),
    messages: Number(r.messages),
    tokens: Number(r.tokens),
  }));
}

export async function aggregateErrorsByDay(
  userId: string,
  days: number
): Promise<{ date: string; errors: number; total: number; rate: number }[]> {
  const since = daysAgoDate(days);

  const rows = await db
    .select({
      date: sql<string>`DATE(${usageLogs.createdAt})`.as("date"),
      total: sql<number>`COUNT(*)`.as("total"),
      errors:
        sql<number>`0`.as(
          "errors"
        ),
    })
    .from(usageLogs)
    .where(and(eq(usageLogs.userId, userId), gte(usageLogs.createdAt, since)))
    .groupBy(sql`DATE(${usageLogs.createdAt})`)
    .orderBy(sql`DATE(${usageLogs.createdAt})`);

  return rows.map((r) => {
    const total = Number(r.total);
    const errors = Number(r.errors);
    return {
      date: String(r.date),
      errors,
      total,
      rate: total > 0 ? Math.round((errors / total) * 10000) / 100 : 0,
    };
  });
}

export async function aggregateModelDistribution(
  userId: string,
  days: number
): Promise<ModelUsage[]> {
  const since = daysAgoDate(days);

  const rows = await db
    .select({
      model: usageLogs.model,
      count: sql<number>`COUNT(*)`.as("count"),
    })
    .from(usageLogs)
    .where(and(eq(usageLogs.userId, userId), gte(usageLogs.createdAt, since)))
    .groupBy(usageLogs.model)
    .orderBy(desc(sql`COUNT(*)`));

  const totalCount = rows.reduce((sum, r) => sum + Number(r.count), 0);

  return rows.map((r) => ({
    model: r.model ?? "unknown",
    count: Number(r.count),
    percentage:
      totalCount > 0
        ? Math.round((Number(r.count) / totalCount) * 10000) / 100
        : 0,
  }));
}

export async function aggregateCostsByDay(
  userId: string,
  days: number
): Promise<{ data: DailyCost[]; models: string[] }> {
  const since = daysAgoDate(days);

  const rows = await db
    .select({
      date: sql<string>`DATE(${usageLogs.createdAt})`.as("date"),
      model: usageLogs.model,
      cost: sql<number>`COALESCE(SUM(${usageLogs.cost}), 0)`.as("cost"),
    })
    .from(usageLogs)
    .where(and(eq(usageLogs.userId, userId), gte(usageLogs.createdAt, since)))
    .groupBy(sql`DATE(${usageLogs.createdAt})`, usageLogs.model)
    .orderBy(sql`DATE(${usageLogs.createdAt})`);

  const modelsSet = new Set<string>();
  const dateMap = new Map<string, DailyCost>();

  for (const row of rows) {
    const date = String(row.date);
    const model = row.model ?? "unknown";
    modelsSet.add(model);

    if (!dateMap.has(date)) {
      dateMap.set(date, { date });
    }
    const entry = dateMap.get(date)!;
    entry[model] = Number(row.cost);
  }

  const models = Array.from(modelsSet);
  const data = Array.from(dateMap.values());

  return { data, models };
}

export async function getPerformanceMetrics(
  userId: string,
  days: number
): Promise<PerformanceMetrics> {
  const since = daysAgoDate(days);

  const result = await db
    .select({
      avgLatency: sql<number>`0`.as(
        "avgLatency"
      ),
      avgTokens:
        sql<number>`COALESCE(AVG(${usageLogs.inputTokens} + ${usageLogs.outputTokens}), 0)`.as(
          "avgTokens"
        ),
      totalRequests: sql<number>`COUNT(*)`.as("totalRequests"),
      errors:
        sql<number>`0`.as(
          "errors"
        ),
    })
    .from(usageLogs)
    .where(and(eq(usageLogs.userId, userId), gte(usageLogs.createdAt, since)));

  const row = result[0];
  const totalRequests = Number(row?.totalRequests ?? 0);
  const errors = Number(row?.errors ?? 0);

  return {
    avgLatencyMs: 0,
    p95LatencyMs: 0,
    avgTokensPerRequest: Math.round(Number(row?.avgTokens ?? 0)),
    successRate:
      totalRequests > 0
        ? Math.round(((totalRequests - errors) / totalRequests) * 10000) / 100
        : 100,
    totalRequests,
  };
}

export async function getRecentActivity(
  userId: string,
  limit: number = 50
): Promise<
  {
    id: string;
    action: string;
    details: string;
    timestamp: Date;
    userId: string;
  }[]
> {
  const rows = await db
    .select()
    .from(analyticsEvents)
    .where(eq(analyticsEvents.userId, userId))
    .orderBy(desc(analyticsEvents.createdAt))
    .limit(limit);

  return rows.map((r) => {
    const meta =
      typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata;
    return {
      id: String(r.id),
      action: r.eventType,
      details: meta?.details ?? r.eventType,
      timestamp: r.createdAt ? new Date(r.createdAt) : new Date(),
      userId: r.userId,
    };
  });
}
