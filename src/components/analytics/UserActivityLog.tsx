"use client";

interface Activity {
  id: string;
  action: string;
  details: string;
  timestamp: Date;
  userId: string;
}

interface UserActivityLogProps {
  activities: Activity[];
}

const ACTION_BADGE_STYLES: Record<string, string> = {
  chat_message: "bg-blue-500/20 text-blue-300",
  project_created: "bg-emerald-500/20 text-emerald-300",
  file_generated: "bg-violet-500/20 text-violet-300",
  error_occurred: "bg-red-500/20 text-red-300",
  ghost_fix: "bg-amber-500/20 text-amber-300",
  model_switch: "bg-cyan-500/20 text-cyan-300",
  "code-gen": "bg-violet-500/20 text-violet-300",
  debug: "bg-orange-500/20 text-orange-300",
  refactor: "bg-teal-500/20 text-teal-300",
};

const ACTION_LABELS: Record<string, string> = {
  chat_message: "Chat",
  project_created: "Project",
  file_generated: "Code Gen",
  error_occurred: "Error",
  ghost_fix: "Ghost Fix",
  model_switch: "Model Switch",
  "code-gen": "Code Gen",
  debug: "Debug",
  refactor: "Refactor",
};

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function UserActivityLog({ activities }: UserActivityLogProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#12121a] p-6">
      <h3 className="mb-4 text-sm font-medium text-white/70">
        Recent Activity
      </h3>
      <div className="max-h-96 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {activities.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/30">
            No recent activity
          </p>
        ) : (
          <div className="space-y-1">
            {activities.map((activity) => {
              const badgeStyle =
                ACTION_BADGE_STYLES[activity.action] ??
                "bg-white/10 text-white/60";
              const label =
                ACTION_LABELS[activity.action] ?? activity.action;

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
                >
                  <span
                    className={`mt-0.5 inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${badgeStyle}`}
                  >
                    {label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-white/80">
                      {activity.details}
                    </p>
                    <p className="mt-0.5 text-xs text-white/30">
                      {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
