/**
 * Admin Audit Log API Endpoint
 *
 * GET /api/admin/audit-log
 *
 * Returns paginated audit log entries. Requires authenticated admin user.
 *
 * Query parameters:
 * - page (number, default: 1) - Page number
 * - limit (number, default: 50, max: 100) - Items per page
 * - userId (string, optional) - Filter by user ID
 * - action (string, optional) - Filter by action type
 * - from (string, optional) - ISO date string, filter entries from this date
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { eq, desc, and, gte, type SQL } from "drizzle-orm";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required." },
        { status: 401 }
      );
    }

    // Check for admin role
    const user = session.user as { id?: string; role?: string; email?: string };
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden", message: "Admin access required." },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;

    const page = Math.max(
      DEFAULT_PAGE,
      parseInt(searchParams.get("page") ?? String(DEFAULT_PAGE), 10) || DEFAULT_PAGE
    );
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
    );
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");
    const from = searchParams.get("from");

    // Build filter conditions
    const conditions: SQL[] = [];

    if (userId) {
      conditions.push(eq(auditLogs.userId, userId));
    }

    if (action) {
      conditions.push(eq(auditLogs.action, action));
    }

    if (from) {
      const fromDate = new Date(from);
      if (!isNaN(fromDate.getTime())) {
        conditions.push(gte(auditLogs.createdAt, fromDate));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Calculate offset
    const offset = (page - 1) * limit;

    // Fetch audit logs with pagination
    const [logs, countResult] = await Promise.all([
      db
        .select()
        .from(auditLogs)
        .where(whereClause)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({
          count: auditLogs.id,
        })
        .from(auditLogs)
        .where(whereClause)
        .then((rows) => rows.length),
    ]);

    // Parse metadata JSON strings back to objects
    const parsedLogs = logs.map((log) => ({
      ...log,
      metadata: log.metadata ? tryParseJson(log.metadata) : null,
    }));

    const totalPages = Math.ceil(countResult / limit);

    return NextResponse.json({
      data: parsedLogs,
      pagination: {
        page,
        limit,
        total: countResult,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    });
  } catch (error) {
    console.error("[admin/audit-log] Error fetching audit logs:", error);

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to fetch audit logs.",
      },
      { status: 500 }
    );
  }
}

/**
 * Safely parse a JSON string, returning the original value if parsing fails.
 */
function tryParseJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
