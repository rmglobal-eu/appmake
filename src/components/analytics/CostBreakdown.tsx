"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

interface CostBreakdownProps {
  data: { date: string; [model: string]: number | string }[];
  models: string[];
}

const MODEL_COLORS = [
  "#8b5cf6",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

export default function CostBreakdown({ data, models }: CostBreakdownProps) {
  const totalCost = useMemo(() => {
    let sum = 0;
    for (const row of data) {
      for (const model of models) {
        sum += Number(row[model] ?? 0);
      }
    }
    return sum;
  }, [data, models]);

  return (
    <div className="rounded-xl border border-white/10 bg-[#12121a] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/70">Cost Breakdown</h3>
        <div className="text-right">
          <p className="text-lg font-semibold text-white">
            ${totalCost.toFixed(2)}
          </p>
          <p className="text-xs text-white/40">Total cost</p>
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
              tickFormatter={(v: string) => {
                const d = new Date(v);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
              width={50}
              tickFormatter={(v: number) => `$${v.toFixed(2)}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a22",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                color: "#fff",
                fontSize: 13,
              }}
              labelStyle={{ color: "rgba(255,255,255,0.6)" }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={((value: any, name: any) => [
                `$${(Number(value) || 0).toFixed(4)}`,
                String(name ?? ""),
              ]) as any}
            />
            <Legend
              wrapperStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}
            />
            {models.map((model, i) => (
              <Bar
                key={model}
                dataKey={model}
                stackId="cost"
                fill={MODEL_COLORS[i % MODEL_COLORS.length]}
                radius={
                  i === models.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]
                }
                name={model}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
