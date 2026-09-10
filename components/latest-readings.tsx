"use client"

import { displayRange, parameterMeta, type ParameterKey } from "@/lib/parameters"
import type { Tables } from "@/lib/database.types"
import { Button } from "@/components/ui/button"
import { useUnits } from "@/components/units-provider"
import { displayParam } from "@/lib/units"

export function CsvExport({ tests }: { tests: Tables<"test_logs">[] }) {
  const system = useUnits()
  const meta = parameterMeta(system)
  function download() {
    const header = ["tested_at", "parameter", "value", "unit", "source_kit", "notes"]
    const rows = tests.map((test) => {
      const key = test.parameter as ParameterKey
      const value = displayParam(key, Number(test.value), system)
      return [test.tested_at, test.parameter, value, meta[key]?.unit ?? test.unit, test.source_kit ?? "", JSON.stringify(test.notes ?? "")].join(",")
    })
    const blob = new Blob([[header.join(","), ...rows].join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "tank-tracker-tests.csv"
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <Button type="button" variant="outline" size="sm" onClick={download} disabled={tests.length === 0}>
      Export CSV
    </Button>
  )
}

export function LatestReadings({ latest }: { latest: Partial<Record<ParameterKey, number>> }) {
  const system = useUnits()
  const meta = parameterMeta(system)
  const keys = Object.keys(meta) as ParameterKey[]
  return (
    <div className="tt-stagger grid grid-cols-2 gap-2 md:grid-cols-3">
      {keys.map((key, index) => (
        <div
          key={key}
          style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
          className="min-w-0 rounded-2xl border border-primary/10 bg-card/80 p-2.5 shadow-sm backdrop-blur sm:p-3"
        >
          <div className="truncate text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
            {meta[key].label}
          </div>
          <div className="text-base font-semibold tabular-nums sm:text-lg">
            {latest[key] == null ? "—" : displayParam(key, latest[key]!, system)}
            <span className="ml-1 text-[10px] font-normal text-muted-foreground sm:text-xs">{meta[key].unit}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export { displayRange }
