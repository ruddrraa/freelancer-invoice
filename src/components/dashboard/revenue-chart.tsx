"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = {
  _id: string;
  revenue: number;
};

export function RevenueChart({ data }: { data: Point[] }) {
  const points = data.map((d) => ({ month: d._id.slice(5), revenue: d.revenue }));
  const maxRevenue = Math.max(1, ...points.map((p) => p.revenue));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#737373" }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 12, fill: "#737373" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${Math.round((value / maxRevenue) * 10)}K`}
          />
          <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
          <Bar dataKey="revenue" radius={[10, 10, 10, 10]} barSize={26}>
            {points.map((entry, index) => (
              <Cell
                key={`bar-${entry.month}`}
                fill={index === 2 ? "#8f8f95" : "#151515"}
                opacity={index === 2 ? 0.95 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
