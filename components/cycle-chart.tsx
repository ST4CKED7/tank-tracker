"use client"

import { format, parseISO } from "date-fns"
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { Tables } from "@/lib/database.types"

export function CycleChart({ tests }: { tests: Tables<"test_logs">[] }) {
  const byDay = new Map<string, { label: string; ammonia?: number; nitrite?: number; nitrate?: number }>()
  for (const test of [...tests].sort((a, b) => a.tested_at.localeCompare(b.tested_at))) {
    if (!["ammonia", "nitrite", "nitrate"].includes(test.parameter)) continue
    const label = format(parseISO(test.tested_at), "MMM d")
    const row = byDay.get(label) ?? { label }
    row[test.parameter as "ammonia" | "nitrite" | "nitrate"] = Number(test.value)
    byDay.set(label, row)
  }
  const data = Array.from(byDay.values())
  return (
    <div className="h-72 rounded-2xl border border-primary/10 bg-card/80 p-2 shadow-sm backdrop-blur sm:h-80 sm:p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.15} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={28} interval="preserveStartEnd" />
          <YAxis width={40} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="ammonia" stroke="#f59e0b" strokeWidth={2} />
          <Line type="monotone" dataKey="nitrite" stroke="#f43f5e" strokeWidth={2} />
          <Line type="monotone" dataKey="nitrate" stroke="#14b8a6" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
