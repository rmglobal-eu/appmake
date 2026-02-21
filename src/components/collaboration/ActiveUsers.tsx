"use client";

import { useEffect, useRef, useState } from "react";
import { Users } from "lucide-react";

interface ActiveUser {
  userId: string;
  name: string;
  avatar: string;
  lastActive: number;
  cursor?: {
    filePath: string;
    line: number;
    column: number;
  };
}

interface ActiveUsersProps {
  projectId: string;
}

const MAX_VISIBLE = 5;

export default function ActiveUsers({ projectId }: ActiveUsersProps) {
  const [users, setUsers] = useState<ActiveUser[]>([]);
  const [hoveredUser, setHoveredUser] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const url = `/api/collaboration/presence?projectId=${encodeURIComponent(projectId)}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener("presence", (event) => {
      try {
        const data: ActiveUser[] = JSON.parse(event.data);
        setUsers(data);
      } catch {
        // Ignore malformed messages
      }
    });

    eventSource.onerror = () => {
      // EventSource will auto-reconnect on most errors.
      // If the connection is fully dead, close and stop.
      if (eventSource.readyState === EventSource.CLOSED) {
        eventSource.close();
      }
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [projectId]);

  if (users.length === 0) {
    return null;
  }

  const visibleUsers = users.slice(0, MAX_VISIBLE);
  const overflowCount = Math.max(0, users.length - MAX_VISIBLE);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center -space-x-2">
        {visibleUsers.map((user) => (
          <div
            key={user.userId}
            className="relative"
            onMouseEnter={() => setHoveredUser(user.userId)}
            onMouseLeave={() => setHoveredUser(null)}
          >
            {/* Avatar */}
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-7 w-7 rounded-full border-2 border-zinc-900 object-cover ring-2 ring-zinc-800 transition-transform hover:z-10 hover:scale-110"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-zinc-900 bg-zinc-700 text-xs font-medium text-zinc-200 ring-2 ring-zinc-800 transition-transform hover:z-10 hover:scale-110">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Online indicator dot */}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-zinc-900 bg-emerald-400" />

            {/* Tooltip */}
            {hoveredUser === user.userId && (
              <div className="absolute -bottom-9 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-200 shadow-lg ring-1 ring-zinc-700">
                {user.name}
                {user.cursor && (
                  <span className="ml-1 text-zinc-400">
                    {user.cursor.filePath}:{user.cursor.line}
                  </span>
                )}
                {/* Tooltip arrow */}
                <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-zinc-800 ring-1 ring-zinc-700" style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
              </div>
            )}
          </div>
        ))}

        {/* Overflow indicator */}
        {overflowCount > 0 && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-zinc-900 bg-zinc-600 text-xs font-medium text-zinc-200 ring-2 ring-zinc-800">
            +{overflowCount}
          </div>
        )}
      </div>

      {/* User count label */}
      <div className="flex items-center gap-1 text-xs text-zinc-400">
        <Users className="h-3.5 w-3.5" />
        <span>{users.length}</span>
      </div>
    </div>
  );
}
