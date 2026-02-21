"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface ErrorRateChartProps {
  data: { date: string; errors: number; total: number; rate: number }[];
}

export default function ErrorRateChart({ data }: ErrorRateChartProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#12121a] p-6">
      <h3 className="mb-4 text-sm font-medium text-white/70">
        Error Rate Over Time
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
          >
            <defs>
              <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              width={40}
              tickFormatter={(v: number) => `${v}%`}
              domain={[0, "auto"]}
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
              formatter={((value: any, name: any) => {
                if (name === "rate") return [`${value}%`, "Error Rate"];
                return [value, name === "errors" ? "Errors" : "Total"];
              }) as any}
            />
            <Area
              type="monotone"
              dataKey="rate"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#errorGradient)"
              name="rate"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
