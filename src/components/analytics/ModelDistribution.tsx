"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ModelDistributionProps {
  data: { model: string; count: number; percentage: number }[];
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

export default function ModelDistribution({ data }: ModelDistributionProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#12121a] p-6">
      <h3 className="mb-4 text-sm font-medium text-white/70">
        Model Distribution
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="count"
              nameKey="model"
              stroke="none"
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={MODEL_COLORS[index % MODEL_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a22",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                color: "#fff",
                fontSize: 13,
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={((value: any, name: any) => [
                `${value} requests`,
                String(name ?? ""),
              ]) as any}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string) => (
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 space-y-2">
        {data.map((item, i) => (
          <div key={item.model} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: MODEL_COLORS[i % MODEL_COLORS.length],
                }}
              />
              <span className="text-xs text-white/60">{item.model}</span>
            </div>
            <span className="text-xs font-medium text-white/80">
              {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
