/**
 * Audit Logger
 *
 * Writes structured audit log entries to the database audit_logs table.
 * Provides a centralized, typed interface for security-relevant event logging.
 */

import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

export interface AuditEntry {
  /** The user who performed the action (null for anonymous/system actions) */
  userId?: string;
  /** The action that was performed (e.g. "project.create", "user.login", "api_key.rotate") */
  action: string;
  /** The type of resource affected (e.g. "project", "user", "api_key") */
  resource: string;
  /** The ID of the specific resource affected */
  resourceId?: string;
  /** Additional structured metadata about the event */
  metadata?: Record<string, unknown>;
  /** The IP address of the request origin */
  ip?: string;
  /** The User-Agent header from the request */
  userAgent?: string;
}

/**
 * Write an audit log entry to the database.
 *
 * This function is designed to never throw -- if the database write fails,
 * the error is logged to stderr but does not propagate to the caller.
 * This ensures audit logging never disrupts the primary request flow.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId: entry.userId ?? null,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId ?? null,
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
      ip: entry.ip ?? null,
      userAgent: entry.userAgent ?? null,
      createdAt: new Date(),
    });
  } catch (error) {
    // Audit logging must never break the primary request flow.
    // Log to stderr so it can be picked up by infrastructure monitoring.
    console.error("[audit-logger] Failed to write audit log entry:", {
      action: entry.action,
      resource: entry.resource,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Helper to extract audit-relevant request metadata from a Request object.
 */
export function extractRequestMeta(request: Request): {
  ip: string;
  userAgent: string;
} {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0].trim()
    : request.headers.get("x-real-ip") ?? "unknown";

  const userAgent = request.headers.get("user-agent") ?? "unknown";

  return { ip, userAgent };
}
