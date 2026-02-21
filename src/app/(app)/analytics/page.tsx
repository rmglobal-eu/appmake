"use client";

import { useState, useEffect, useCallback } from "react";
import UsageChart from "@/components/analytics/UsageChart";
import ErrorRateChart from "@/components/analytics/ErrorRateChart";
import ModelDistribution from "@/components/analytics/ModelDistribution";
import CostBreakdown from "@/components/analytics/CostBreakdown";
import PerformanceMetrics from "@/components/analytics/PerformanceMetrics";
import UserActivityLog from "@/components/analytics/UserActivityLog";

type Period = "7d" | "30d" | "90d";

interface AnalyticsData {
  usage: { date: string; messages: number; tokens: number }[];
  errors: { date: string; errors: number; total: number; rate: number }[];
  models: { model: string; count: number; percentage: number }[];
  costs: { date: string; [model: string]: number | string }[];
  costModels: string[];
  performance: {
    avgLatencyMs: number;
    p95LatencyMs: number;
    avgTokensPerRequest: number;
    successRate: number;
    totalRequests: number;
  };
  activity: {
    id: string;
    action: string;
    details: string;
    timestamp: Date;
    userId: string;
  }[];
}

const PERIOD_OPTIONS: { label: string; value: Period }[] = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics?period=${period}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async (
    format: "csv" | "json",
    type: "usage" | "errors" | "costs"
  ) => {
    const url = `/api/analytics/export?format=${format}&period=${period}&type=${type}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#0a0a10] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="mt-1 text-sm text-white/40">
              Monitor your usage, performance, and costs
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Date range selector */}
            <div className="inline-flex rounded-lg border border-white/10 bg-[#12121a] p-1">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPeriod(opt.value)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    period === opt.value
                      ? "bg-white/10 text-white"
                      : "text-white/40 hover:text-white/60"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {/* Export dropdown */}
            <div className="relative group">
              <button className="rounded-lg border border-white/10 bg-[#12121a] px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:text-white">
                Export
              </button>
              <div className="absolute right-0 top-full z-10 mt-1 hidden w-40 rounded-lg border border-white/10 bg-[#1a1a22] py-1 shadow-xl group-hover:block">
                <button
                  onClick={() => handleExport("csv", "usage")}
                  className="block w-full px-3 py-1.5 text-left text-xs text-white/60 hover:bg-white/5 hover:text-white"
                >
                  Usage (CSV)
                </button>
                <button
                  onClick={() => handleExport("csv", "errors")}
                  className="block w-full px-3 py-1.5 text-left text-xs text-white/60 hover:bg-white/5 hover:text-white"
                >
                  Errors (CSV)
                </button>
                <button
                  onClick={() => handleExport("csv", "costs")}
                  className="block w-full px-3 py-1.5 text-left text-xs text-white/60 hover:bg-white/5 hover:text-white"
                >
                  Costs (CSV)
                </button>
                <button
                  onClick={() => handleExport("json", "usage")}
                  className="block w-full px-3 py-1.5 text-left text-xs text-white/60 hover:bg-white/5 hover:text-white"
                >
                  Usage (JSON)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={fetchData}
              className="mt-3 rounded-lg bg-red-500/10 px-4 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
            >
              Retry
            </button>
          </div>
        )}

        {/* Dashboard content */}
        {data && !loading && (
          <div className="space-y-6">
            {/* Performance metrics - full width */}
            <PerformanceMetrics metrics={data.performance} />

            {/* Charts grid - 2 columns on desktop */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <UsageChart data={data.usage} />
              <ErrorRateChart data={data.errors} />
              <CostBreakdown data={data.costs} models={data.costModels} />
              <ModelDistribution data={data.models} />
            </div>

            {/* Activity log - full width */}
            <UserActivityLog activities={data.activity} />
          </div>
        )}
      </div>
    </div>
  );
}
