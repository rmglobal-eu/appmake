import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import {
  aggregateUsageByDay,
  aggregateErrorsByDay,
  aggregateCostsByDay,
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

function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const headerLine = headers.join(",");
  const dataLines = rows.map((row) =>
    headers
      .map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return "";
        if (typeof val === "string" && (val.includes(",") || val.includes('"')))
          return `"${val.replace(/"/g, '""')}"`;
        return String(val);
      })
      .join(",")
  );
  return [headerLine, ...dataLines].join("\n");
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") ?? "json";
    const period = searchParams.get("period");
    const type = searchParams.get("type") ?? "usage";
    const days = parsePeriod(period);
    const userId = session.user.id;

    let data: Record<string, unknown>[];
    let headers: string[];

    switch (type) {
      case "errors": {
        const errors = await aggregateErrorsByDay(userId, days);
        data = errors as unknown as Record<string, unknown>[];
        headers = ["date", "errors", "total", "rate"];
        break;
      }
      case "costs": {
        const costsResult = await aggregateCostsByDay(userId, days);
        data = costsResult.data as unknown as Record<string, unknown>[];
        headers = ["date", ...costsResult.models];
        break;
      }
      case "usage":
      default: {
        const usage = await aggregateUsageByDay(userId, days);
        data = usage as unknown as Record<string, unknown>[];
        headers = ["date", "messages", "tokens"];
        break;
      }
    }

    if (format === "csv") {
      const csv = toCsv(headers, data);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="analytics-${type}-${days}d.csv"`,
        },
      });
    }

    return NextResponse.json(data, {
      headers: {
        "Content-Disposition": `attachment; filename="analytics-${type}-${days}d.json"`,
      },
    });
  } catch (error) {
    console.error("Analytics export error:", error);
    return NextResponse.json(
      { error: "Failed to export analytics" },
      { status: 500 }
    );
  }
}
