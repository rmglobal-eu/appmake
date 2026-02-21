"use client";

interface UsageMeterProps {
  used: number;
  limit: number;
  label: string;
  resetAt?: Date;
}

export default function UsageMeter({
  used,
  limit,
  label,
  resetAt,
}: UsageMeterProps) {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);

  const getColor = () => {
    if (isUnlimited) return "text-green-400";
    if (percentage >= 80) return "text-red-400";
    if (percentage >= 50) return "text-yellow-400";
    return "text-green-400";
  };

  const getBarColor = () => {
    if (isUnlimited) return "bg-green-500";
    if (percentage >= 80) return "bg-red-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getBarBgGlow = () => {
    if (isUnlimited) return "shadow-green-500/20";
    if (percentage >= 80) return "shadow-red-500/20";
    if (percentage >= 50) return "shadow-yellow-500/20";
    return "shadow-green-500/20";
  };

  const formatResetTime = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `Resets in ${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `Resets in ${minutes}m`;
    }
    return "Resets soon";
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-zinc-300">{label}</span>
        <span className={`text-sm font-semibold ${getColor()}`}>
          {isUnlimited ? (
            <span className="text-green-400">Unlimited</span>
          ) : (
            <>
              {used.toLocaleString()}{" "}
              <span className="text-zinc-500">/ {limit.toLocaleString()}</span>
            </>
          )}
        </span>
      </div>

      {/* Progress bar */}
      {!isUnlimited && (
        <div className="relative w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out ${getBarColor()} shadow-lg ${getBarBgGlow()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-zinc-600">
          {isUnlimited
            ? "No limits on your current plan"
            : `${percentage.toFixed(0)}% used`}
        </span>
        {resetAt && !isUnlimited && (
          <span className="text-xs text-zinc-600">
            {formatResetTime(resetAt)}
          </span>
        )}
      </div>
    </div>
  );
}
