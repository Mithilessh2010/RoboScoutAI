"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function TeamTrendChart({ data }: { data: { season: string; opr: number; averageScore: number; matches: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <XAxis dataKey="season" stroke="#94a3b8" />
        <YAxis stroke="#94a3b8" />
        <Tooltip contentStyle={{ background: "#020617", border: "1px solid rgba(255,255,255,.12)", color: "#e2e8f0" }} />
        <Line type="monotone" dataKey="opr" stroke="#67e8f9" strokeWidth={2} />
        <Line type="monotone" dataKey="averageScore" stroke="#c084fc" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
