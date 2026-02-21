"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

interface UsageChartProps {
  data: { date: string; messages: number; tokens: number }[];
}

export default function UsageChart({ data }: UsageChartProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#12121a] p-6">
      <h3 className="mb-4 text-sm font-medium text-white/70">
        Usage Over Time
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
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
              yAxisId="messages"
              tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
              width={45}
            />
            <YAxis
              yAxisId="tokens"
              orientation="right"
              tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
              width={60}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
              }
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
            />
            <Legend
              wrapperStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}
            />
            <Line
              yAxisId="messages"
              type="monotone"
              dataKey="messages"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#8b5cf6" }}
              name="Messages"
            />
            <Line
              yAxisId="tokens"
              type="monotone"
              dataKey="tokens"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#3b82f6" }}
              name="Tokens"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
