/**
 * Health check API endpoint.
 * Returns application health status for load balancer probes.
 * No authentication required.
 */

import { NextResponse } from "next/server";
import { checkHealth } from "@/lib/monitoring/health-check";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const health = await checkHealth();

    const statusCode = health.status === "unhealthy" ? 503 : 200;

    return NextResponse.json(health, {
      status: statusCode,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        checks: [],
        uptime: 0,
        version: "unknown",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
