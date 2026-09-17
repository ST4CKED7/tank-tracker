"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { addDays, parseISO } from "date-fns"
import { ArrowDownRight, ArrowUpRight, ChartLine, Minus } from "lucide-react"
import { useState } from "react"
import { displayRange, dashboardParameterKeys, parameterMeta, type ParameterKey, type WaterType } from "@/lib/parameters"
import type { Tables } from "@/lib/database.types"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { QuickRetestButton } from "@/components/quick-retest-dialog"
import { useUnits } from "@/components/units-provider"
import { displayParam, type UnitPrefs } from "@/lib/units"
import { cn } from "@/lib/utils"
import type { MiniChartPoint } from "@/components/parameter-mini-chart"

const ParameterMiniChart = dynamic(
  () => import("@/components/parameter-mini-chart").then((mod) => mod.ParameterMiniChart),
  {
    ssr: false,
    loading: () => <div className="h-36 animate-pulse rounded-lg bg-muted/40" />,
  },
)

function compactAge(iso: string, now = Date.now()) {
  const ms = Math.max(0, now - parseISO(iso).getTime())
  const mins = Math.floor(ms / 60_000)
  if (mins < 60) return `${Math.max(1, mins)}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 48) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 14) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 9) return `${weeks}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

function formatDelta(parameter: ParameterKey, delta: number) {
  const abs = Math.abs(delta)
  if (abs < 1e-9) return "0"
  let decimals = 0
  if (parameter === "phosphate" || parameter === "ph") decimals = 2
  else if (parameter === "salinity" || parameter === "temperature" || parameter === "alkalinity") decimals = 1
  else if (abs < 1) decimals = 2
  else if (abs < 10) decimals = 1
  return `${delta > 0 ? "+" : "−"}${abs.toFixed(decimals)}`
}

function readingDelta(
  parameter: ParameterKey,
  points: MiniChartPoint[],
  prefs: UnitPrefs,
): number | null {
  if (points.length < 2) return null
  const sorted = [...points].sort((a, b) => a.tested_at.localeCompare(b.tested_at))
  const newest = sorted[sorted.length - 1]!
  const previous = sorted[sorted.length - 2]!
  return displayParam(parameter, newest.value, prefs) - displayParam(parameter, previous.value, prefs)
}

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

function ReadingChartButton({
  parameter,
  label,
  points,
  target,
}: {
  parameter: ParameterKey
  label: string
  points: MiniChartPoint[]
  target?: { min: number; max: number }
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Show ${label} chart`}
          className={cn(
            "relative inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors",
            // Invisible 44px-tall hit area so wet fingers don't need to be precise.
            "after:absolute after:inset-x-0 after:-inset-y-1.5",
            "hover:bg-muted hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            open && "bg-muted text-foreground",
          )}
        >
          <ChartLine className="size-4" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" side="bottom" className="w-[min(18rem,calc(100vw-2rem))]">
        <ParameterMiniChart parameter={parameter} points={points} target={target} />
        <div className="mt-2 border-t border-border/60 pt-2">
          <Link
            href="/charts"
            className="text-xs font-medium text-primary underline-offset-2 hover:underline"
            onClick={() => setOpen(false)}
          >
            Open full charts
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function LatestReadings({
  latest,
  waterType = "saltwater",
  targets,
  tests = [],
  reminders = [],
  tankId,
  favoriteKitIds = null,
  defaultKitId = null,
}: {
  latest: Partial<Record<ParameterKey, number>>
  waterType?: WaterType
  targets?: Partial<Record<ParameterKey, { min: number; max: number }>>
  tests?: Array<Pick<Tables<"test_logs">, "parameter" | "tested_at" | "value">>
  reminders?: Array<Pick<Tables<"parameter_reminders">, "parameter" | "every_days">>
  tankId: string
  favoriteKitIds?: string[] | null
  defaultKitId?: string | null
}) {
  const system = useUnits()
  const meta = parameterMeta(system, waterType)
  const keys = dashboardParameterKeys(waterType)
  const reminderByParameter = new Map(reminders.map((item) => [item.parameter, item.every_days]))

  const historyByParameter = tests.reduce(
    (acc, test) => {
      const key = test.parameter as ParameterKey
      const list = acc[key] ?? []
      list.push({ tested_at: test.tested_at, value: Number(test.value) })
      acc[key] = list
      return acc
    },
    {} as Partial<Record<ParameterKey, MiniChartPoint[]>>,
  )

  return (
    <div className="tt-stagger grid grid-cols-2 gap-2 md:grid-cols-3">
      {keys.map((key, index) => {
        const value = latest[key]
        const target = targets?.[key]
        const hasReading = value != null && target != null
        const outOfRange = hasReading && (value < target.min || value > target.max)
        const inRange = hasReading && !outOfRange
        const points = historyByParameter[key] ?? []
        const sorted = [...points].sort((a, b) => a.tested_at.localeCompare(b.tested_at))
        const newestAt = sorted[sorted.length - 1]?.tested_at
        const delta = readingDelta(key, points, system)
        const everyDays = reminderByParameter.get(key)
        const overdue =
          everyDays != null &&
          newestAt != null &&
          Date.now() >= addDays(parseISO(newestAt), everyDays).getTime()
        const DeltaIcon =
          delta == null || Math.abs(delta) < 1e-9 ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight

        return (
          <div
            key={key}
            style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
            className={cn(
              "relative min-w-0 rounded-2xl border bg-card/80 p-2.5 shadow-sm backdrop-blur sm:p-3",
              outOfRange && "border-destructive/35 bg-destructive/5",
              inRange && "border-emerald-500/40 bg-emerald-500/8",
              !outOfRange && !inRange && "border-primary/10",
            )}
          >
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0 truncate text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
                {meta[key].label}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <QuickRetestButton
                  parameter={key}
                  label={meta[key].label}
                  tankId={tankId}
                  waterType={waterType}
                  favoriteKitIds={favoriteKitIds}
                  defaultKitId={defaultKitId}
                />
                <ReadingChartButton
                  parameter={key}
                  label={meta[key].label}
                  points={points}
                  target={target}
                />
              </div>
            </div>
            <div
              className={cn(
                "text-base font-semibold tabular-nums sm:text-lg",
                inRange && "text-emerald-700 dark:text-emerald-300",
              )}
            >
              {value == null ? "—" : displayParam(key, value, system)}
              <span className="ml-1 text-[10px] font-normal text-muted-foreground sm:text-xs">{meta[key].unit}</span>
            </div>
            {value != null && (delta != null || newestAt) ? (
              <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] sm:text-xs">
                {delta != null ? (
                  <span
                    className="inline-flex items-center gap-0.5 tabular-nums text-muted-foreground"
                    title="Change since previous reading"
                  >
                    <DeltaIcon className="size-3" aria-hidden="true" />
                    {formatDelta(key, delta)}
                  </span>
                ) : null}
                {delta != null && newestAt ? <span className="text-muted-foreground/50">·</span> : null}
                {newestAt ? (
                  <span
                    className={cn(
                      "tabular-nums",
                      overdue ? "font-medium text-amber-700 dark:text-amber-300" : "text-muted-foreground",
                    )}
                    title={
                      overdue
                        ? `Past your ${everyDays}-day test reminder`
                        : everyDays != null
                          ? `Test reminder every ${everyDays} day${everyDays === 1 ? "" : "s"}`
                          : "Last logged"
                    }
                  >
                    {compactAge(newestAt)}
                  </span>
                ) : null}
              </div>
            ) : null}
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
