import { db } from "@/lib/db";
import { analyticsEvents } from "@/lib/db/schema";

export interface AnalyticsEvent {
  userId: string;
  projectId?: string;
  eventType:
    | "chat_message"
    | "project_created"
    | "file_generated"
    | "error_occurred"
    | "ghost_fix"
    | "model_switch"
    | string;
  metadata?: Record<string, unknown>;
}

export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  await db.insert(analyticsEvents).values({
    userId: event.userId,
    projectId: event.projectId ?? null,
    eventType: event.eventType,
    metadata: event.metadata ? JSON.stringify(event.metadata) : null,
    createdAt: new Date(),
  });
}

export async function trackEvents(events: AnalyticsEvent[]): Promise<void> {
  if (events.length === 0) return;

  const rows = events.map((event) => ({
    userId: event.userId,
    projectId: event.projectId ?? null,
    eventType: event.eventType,
    metadata: event.metadata ? JSON.stringify(event.metadata) : null,
    createdAt: new Date(),
  }));

  const BATCH_SIZE = 100;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await db.insert(analyticsEvents).values(batch);
  }
}
