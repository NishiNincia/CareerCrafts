"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { PipelineStage } from "@/types/employer";

const COLORS = ["#7C9EE5", "#4A72D2", "#2451B8", "#16A34A"];

export function HiringPipeline({ stages }: { stages: PipelineStage[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={stages} layout="vertical" margin={{ left: 8, right: 24 }}>
          <XAxis type="number" hide />
          <YAxis
            dataKey="stage"
            type="category"
            width={90}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "currentColor" }}
          />
          <Tooltip
            cursor={{ fill: "rgba(36,81,184,0.06)" }}
            contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }}
          />
          <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={28}>
            {stages.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
