"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { RevenuePoint } from "@/types/employer";

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
          <defs>
            <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2451B8" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#2451B8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="spending-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F5A623" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#F5A623" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "currentColor" }} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "currentColor" }}
            tickFormatter={(v) => `₹${v / 1000}k`}
            width={44}
          />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }}
          />
          <Area type="monotone" dataKey="revenue" stroke="#2451B8" strokeWidth={2} fill="url(#revenue-fill)" name="Revenue" />
          <Area type="monotone" dataKey="spending" stroke="#F5A623" strokeWidth={2} fill="url(#spending-fill)" name="Spending" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
