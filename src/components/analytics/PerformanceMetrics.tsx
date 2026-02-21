"use client";

interface PerformanceMetricsProps {
  metrics: {
    avgLatencyMs: number;
    p95LatencyMs: number;
    avgTokensPerRequest: number;
    successRate: number;
    totalRequests: number;
  };
}

interface MetricCardProps {
  label: string;
  value: string;
  subtext?: string;
  trend?: "up" | "down" | "neutral";
  trendIsGood?: boolean;
}

function MetricCard({
  label,
  value,
  subtext,
  trend = "neutral",
  trendIsGood = true,
}: MetricCardProps) {
  const trendColor =
    trend === "neutral"
      ? "text-white/40"
      : (trend === "up" && trendIsGood) || (trend === "down" && !trendIsGood)
        ? "text-emerald-400"
        : "text-red-400";

  const trendArrow =
    trend === "up" ? "\u2191" : trend === "down" ? "\u2193" : "\u2014";

  return (
    <div className="rounded-lg border border-white/10 bg-[#16161e] p-4">
      <p className="mb-1 text-xs text-white/50">{label}</p>
      <div className="flex items-end gap-2">
        <p className="text-2xl font-bold text-white">{value}</p>
        <span className={`mb-1 text-sm font-medium ${trendColor}`}>
          {trendArrow}
        </span>
      </div>
      {subtext && <p className="mt-1 text-xs text-white/30">{subtext}</p>}
    </div>
  );
}

export default function PerformanceMetrics({
  metrics,
}: PerformanceMetricsProps) {
  const formatLatency = (ms: number) => {
    if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.round(ms)}ms`;
  };

  const formatTokens = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#12121a] p-6">
      <h3 className="mb-4 text-sm font-medium text-white/70">
        Performance Metrics
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard
          label="Avg Latency"
          value={formatLatency(metrics.avgLatencyMs)}
          subtext="Average response time"
          trend={metrics.avgLatencyMs < 2000 ? "down" : "up"}
          trendIsGood={false}
        />
        <MetricCard
          label="P95 Latency"
          value={formatLatency(metrics.p95LatencyMs)}
          subtext="95th percentile"
          trend={metrics.p95LatencyMs < 5000 ? "down" : "up"}
          trendIsGood={false}
        />
        <MetricCard
          label="Avg Tokens/Req"
          value={formatTokens(metrics.avgTokensPerRequest)}
          subtext="Per request"
          trend="neutral"
        />
        <MetricCard
          label="Success Rate"
          value={`${metrics.successRate}%`}
          subtext="Successful requests"
          trend={metrics.successRate >= 99 ? "up" : "down"}
          trendIsGood={true}
        />
        <MetricCard
          label="Total Requests"
          value={metrics.totalRequests.toLocaleString()}
          subtext="In selected period"
          trend="neutral"
        />
      </div>
    </div>
  );
}
