"use client"

import { format, parseISO } from "date-fns"
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useMemo } from "react"
import { chartTooltipStyle } from "@/lib/chart-theme"
import { displayRange, parameterMeta, type ParameterKey } from "@/lib/parameters"
import { useUnits } from "@/components/units-provider"
import { displayParam } from "@/lib/units"

export type MiniChartPoint = {
  tested_at: string
  value: number
}

export function ParameterMiniChart({
  parameter,
  points,
  target,
}: {
  parameter: ParameterKey
  points: MiniChartPoint[]
  target?: { min: number; max: number }
}) {
  const system = useUnits()
  const meta = parameterMeta(system)[parameter]
  const data = useMemo(
    () =>
      [...points]
        .sort((a, b) => a.tested_at.localeCompare(b.tested_at))
        .map((point) => ({
          value: displayParam(parameter, point.value, system),
          label: format(parseISO(point.tested_at), "MMM d"),
        })),
    [points, parameter, system],
  )
  const band = target ? displayRange(parameter, target, system) : undefined

  if (data.length === 0) {
    return (
      <div className="flex h-36 items-center justify-center text-xs text-muted-foreground">
        No history for {meta.label} yet.
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium">
        {meta.label}
        {meta.unit ? ` (${meta.unit})` : ""}
      </div>
      <div className="h-36 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 8, left: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} minTickGap={24} interval="preserveStartEnd" />
            <YAxis width={44} tick={{ fontSize: 10 }} domain={["auto", "auto"]} tickMargin={4} />
            <Tooltip {...chartTooltipStyle} />
            {band ? (
              <ReferenceArea y1={band.min} y2={band.max} fill="var(--chart-1)" fillOpacity={0.12} />
            ) : null}
            <Line
              type="monotone"
              dataKey="value"
              name={meta.label}
              stroke="var(--primary)"
              strokeWidth={2}
              dot={{ r: 2.5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
