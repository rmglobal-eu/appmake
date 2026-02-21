/**
 * Real-time presence system using Server-Sent Events (SSE).
 * Single-server, in-memory storage for active user presence and cursor positions.
 */

export interface CursorPosition {
  filePath: string;
  line: number;
  column: number;
}

export interface ActiveUser {
  userId: string;
  name: string;
  avatar: string;
  lastActive: number;
  cursor?: CursorPosition;
}

interface PresenceEntry {
  user: ActiveUser;
  controller: ReadableStreamDefaultController | null;
}

// In-memory presence store: projectId -> Map<userId, PresenceEntry>
const presenceStore = new Map<string, Map<string, PresenceEntry>>();

// Stale threshold: users inactive for more than 30 seconds are considered offline
const STALE_THRESHOLD_MS = 30_000;

// Heartbeat interval for SSE keep-alive
const HEARTBEAT_INTERVAL_MS = 15_000;

/**
 * Cleanup stale users from a project's presence map.
 */
function cleanupStaleUsers(projectId: string): void {
  const projectPresence = presenceStore.get(projectId);
  if (!projectPresence) return;

  const now = Date.now();
  const staleUserIds: string[] = [];

  for (const [userId, entry] of projectPresence) {
    if (now - entry.user.lastActive > STALE_THRESHOLD_MS) {
      staleUserIds.push(userId);
      // Close the SSE stream if still open
      if (entry.controller) {
        try {
          entry.controller.close();
        } catch {
          // Controller may already be closed
        }
      }
    }
  }

  for (const userId of staleUserIds) {
    projectPresence.delete(userId);
  }

  if (projectPresence.size === 0) {
    presenceStore.delete(projectId);
  }
}

/**
 * Broadcast presence update to all connected users in a project.
 */
function broadcastPresence(projectId: string): void {
  const projectPresence = presenceStore.get(projectId);
  if (!projectPresence) return;

  cleanupStaleUsers(projectId);

  const activeUsers = getActiveUsers(projectId);
  const eventData = JSON.stringify(activeUsers);
  const message = `event: presence\ndata: ${eventData}\n\n`;

  const encoder = new TextEncoder();
  const encoded = encoder.encode(message);

  for (const [, entry] of projectPresence) {
    if (entry.controller) {
      try {
        entry.controller.enqueue(encoded);
      } catch {
        // Stream may have been closed by the client
        entry.controller = null;
      }
    }
  }
}

/**
 * Create an SSE ReadableStream for real-time presence updates.
 * Each connected user gets their own stream.
 */
export function createPresenceStream(
  projectId: string,
  userId: string,
  userName: string = "Anonymous",
  userAvatar: string = ""
): ReadableStream {
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Ensure project map exists
      if (!presenceStore.has(projectId)) {
        presenceStore.set(projectId, new Map());
      }
      const projectPresence = presenceStore.get(projectId)!;

      // Register or update this user's presence
      const existing = projectPresence.get(userId);
      const user: ActiveUser = existing?.user ?? {
        userId,
        name: userName,
        avatar: userAvatar,
        lastActive: Date.now(),
      };
      user.lastActive = Date.now();

      projectPresence.set(userId, { user, controller });

      // Send initial presence state
      const activeUsers = getActiveUsers(projectId);
      const initMessage = `event: presence\ndata: ${JSON.stringify(activeUsers)}\n\n`;
      controller.enqueue(new TextEncoder().encode(initMessage));

      // Broadcast to all that a new user joined
      broadcastPresence(projectId);

      // Heartbeat to keep connection alive
      heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(": heartbeat\n\n"));
        } catch {
          // Stream closed
          if (heartbeatTimer) clearInterval(heartbeatTimer);
        }
      }, HEARTBEAT_INTERVAL_MS);
    },

    cancel() {
      // User disconnected
      if (heartbeatTimer) clearInterval(heartbeatTimer);

      const projectPresence = presenceStore.get(projectId);
      if (projectPresence) {
        projectPresence.delete(userId);
        if (projectPresence.size === 0) {
          presenceStore.delete(projectId);
        } else {
          // Broadcast that user left
          broadcastPresence(projectId);
        }
      }
    },
  });

  return stream;
}

/**
 * Update a user's presence data (cursor position, activity timestamp).
 */
export function updatePresence(
  projectId: string,
  userId: string,
  cursor?: CursorPosition
): void {
  const projectPresence = presenceStore.get(projectId);
  if (!projectPresence) return;

  const entry = projectPresence.get(userId);
  if (!entry) return;

  entry.user.lastActive = Date.now();
  if (cursor) {
    entry.user.cursor = cursor;
  }

  // Broadcast the updated presence to all users
  broadcastPresence(projectId);
}

/**
 * Get all active (non-stale) users in a project.
 */
export function getActiveUsers(projectId: string): ActiveUser[] {
  const projectPresence = presenceStore.get(projectId);
  if (!projectPresence) return [];

  const now = Date.now();
  const active: ActiveUser[] = [];

  for (const [, entry] of projectPresence) {
    if (now - entry.user.lastActive <= STALE_THRESHOLD_MS) {
      active.push({ ...entry.user });
    }
  }

  return active.sort((a, b) => b.lastActive - a.lastActive);
}

/**
 * Remove a user from presence (explicit disconnect).
 */
export function removePresence(projectId: string, userId: string): void {
  const projectPresence = presenceStore.get(projectId);
  if (!projectPresence) return;

  const entry = projectPresence.get(userId);
  if (entry?.controller) {
    try {
      entry.controller.close();
    } catch {
      // Already closed
    }
  }

  projectPresence.delete(userId);

  if (projectPresence.size === 0) {
    presenceStore.delete(projectId);
  } else {
    broadcastPresence(projectId);
  }
}

/**
 * Get the count of active users in a project.
 */
export function getActiveUserCount(projectId: string): number {
  return getActiveUsers(projectId).length;
}
