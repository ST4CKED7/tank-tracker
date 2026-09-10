"use client"

import { format, parseISO, subDays } from "date-fns"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { displayRange, parameterMeta, type ParameterKey } from "@/lib/parameters"
import type { RangeMap } from "@/lib/compatibility"
import type { Tables } from "@/lib/database.types"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { useUnits } from "@/components/units-provider"
import { displayParam } from "@/lib/units"

export function ParameterCharts({
  tests,
  waterChanges,
  ranges,
}: {
  tests: Tables<"test_logs">[]
  waterChanges: Tables<"water_changes">[]
  ranges: RangeMap
}) {
  const [days, setDays] = useState<30 | 90 | 0>(90)
  const cutoff = days ? subDays(new Date(), days) : null
  const keys = Array.from(new Set(tests.map((test) => test.parameter))) as ParameterKey[]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[30, 90, 0].map((value) => (
          <Button
            key={value}
            size="sm"
            className="min-h-11 sm:min-h-8"
            variant={days === value ? "default" : "outline"}
            onClick={() => setDays(value as 30 | 90 | 0)}
          >
            {value === 0 ? "All" : `${value} days`}
          </Button>
        ))}
      </div>
      <div className="grid gap-6">
        {keys.map((key) => (
          <ChartCard
            key={key}
            parameter={key}
            tests={tests.filter((test) => test.parameter === key && (!cutoff || parseISO(test.tested_at) >= cutoff))}
            waterChanges={waterChanges.filter((change) => !cutoff || parseISO(change.changed_at) >= cutoff)}
            range={ranges[key]}
          />
        ))}
        {keys.length === 0 ? <p className="text-sm text-muted-foreground">Log a test to see charts.</p> : null}
      </div>
    </div>
  )
}

function ChartCard({
  parameter,
  tests,
  waterChanges,
  range,
}: {
  parameter: ParameterKey
  tests: Tables<"test_logs">[]
  waterChanges: Tables<"water_changes">[]
  range?: { min: number; max: number }
}) {
  const system = useUnits()
  const meta = parameterMeta(system)[parameter]
  const data = useMemo(
    () =>
      [...tests]
        .sort((a, b) => a.tested_at.localeCompare(b.tested_at))
        .map((test) => ({
          t: test.tested_at,
          value: displayParam(parameter, Number(test.value), system),
          label: format(parseISO(test.tested_at), "MMM d"),
        })),
    [tests, parameter, system],
  )
  const established = meta.establishedTarget
  const rawBand = range ?? established
  const band = rawBand ? displayRange(parameter, rawBand, system) : undefined

  return (
    <div className="h-64 rounded-2xl border border-primary/10 bg-card/80 p-2 shadow-sm backdrop-blur sm:h-72 sm:p-3">
      <div className="mb-2 text-sm font-medium">
        {meta.label} {meta.unit ? `(${meta.unit})` : ""}
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.15} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={28} interval="preserveStartEnd" />
          <YAxis width={40} tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {band ? (
            <ReferenceArea y1={band.min} y2={band.max} fill="#14b8a6" fillOpacity={0.12} />
          ) : null}
          {waterChanges.map((change) => (
            <ReferenceLine
              key={change.id}
              x={format(parseISO(change.changed_at), "MMM d")}
              stroke="#fb923c"
              strokeDasharray="4 4"
            />
          ))}
          <Line type="monotone" dataKey="value" name={meta.label} stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
