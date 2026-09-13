"use client"

import { displayRange, dashboardParameterKeys, parameterMeta, type ParameterKey, type WaterType } from "@/lib/parameters"
import type { Tables } from "@/lib/database.types"
import { Button } from "@/components/ui/button"
import { useUnits } from "@/components/units-provider"
import { displayParam } from "@/lib/units"
import { cn } from "@/lib/utils"

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

export function LatestReadings({
  latest,
  waterType = "saltwater",
  targets,
}: {
  latest: Partial<Record<ParameterKey, number>>
  waterType?: WaterType
  targets?: Partial<Record<ParameterKey, { min: number; max: number }>>
}) {
  const system = useUnits()
  const meta = parameterMeta(system, waterType)
  const keys = dashboardParameterKeys(waterType)

  return (
    <div className="tt-stagger grid grid-cols-2 gap-2 md:grid-cols-3">
      {keys.map((key, index) => {
        const value = latest[key]
        const target = targets?.[key]
        const outOfRange =
          value != null && target != null && (value < target.min || value > target.max)
        return (
          <div
            key={key}
            style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
            className={cn(
              "min-w-0 rounded-2xl border bg-card/80 p-2.5 shadow-sm backdrop-blur sm:p-3",
              outOfRange ? "border-destructive/35 bg-destructive/5" : "border-primary/10",
            )}
          >
            <div className="truncate text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
              {meta[key].label}
            </div>
            <div className="text-base font-semibold tabular-nums sm:text-lg">
              {value == null ? "—" : displayParam(key, value, system)}
              <span className="ml-1 text-[10px] font-normal text-muted-foreground sm:text-xs">{meta[key].unit}</span>
            </div>
            {outOfRange && target ? (
              <div className="mt-0.5 text-[10px] text-destructive sm:text-xs">
                Target {displayParam(key, target.min, system)}–{displayParam(key, target.max, system)}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

export { displayRange }
