import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import {
  aggregateUsageByDay,
  aggregateErrorsByDay,
  aggregateModelDistribution,
  aggregateCostsByDay,
  getPerformanceMetrics,
  getRecentActivity,
} from "@/lib/analytics/aggregator";

function parsePeriod(period: string | null): number {
  switch (period) {
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
    default:
      return 30;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period");
    const userId = searchParams.get("userId") ?? session.user.id;
    const days = parsePeriod(period);

    // Only allow users to see their own analytics (unless admin logic is added later)
    const targetUserId =
      userId === session.user.id ? session.user.id : session.user.id;

    const [usage, errors, models, costsResult, performance, activity] =
      await Promise.all([
        aggregateUsageByDay(targetUserId, days),
        aggregateErrorsByDay(targetUserId, days),
        aggregateModelDistribution(targetUserId, days),
        aggregateCostsByDay(targetUserId, days),
        getPerformanceMetrics(targetUserId, days),
        getRecentActivity(targetUserId, 50),
      ]);

    return NextResponse.json({
      usage,
      errors,
      models,
      costs: costsResult.data,
      costModels: costsResult.models,
      performance,
      activity,
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
