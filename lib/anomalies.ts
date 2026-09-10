import { differenceInHours, formatDistanceToNowStrict, parseISO } from "date-fns"
import { parameterMeta, type ParameterKey, type WaterType } from "@/lib/parameters"
import { displayParam, type UnitPrefs } from "@/lib/units"

export type Anomaly = {
  id: string
  parameter: ParameterKey
  title: string
  detail: string
  href: string
  severity: "watch" | "action"
}

type TestPoint = { parameter: string; tested_at: string; value: number }

const WATCH: Partial<
  Record<ParameterKey, { windowDays: number; delta: number; direction: "down" | "up" | "either" }>
> = {
  alkalinity: { windowDays: 3, delta: 1.0, direction: "either" },
  calcium: { windowDays: 3, delta: 20, direction: "either" },
  ph: { windowDays: 2, delta: 0.2, direction: "either" },
  nitrate: { windowDays: 5, delta: 10, direction: "up" },
  phosphate: { windowDays: 5, delta: 0.05, direction: "up" },
  salinity: { windowDays: 3, delta: 0.5, direction: "either" },
  temperature: { windowDays: 1, delta: 2, direction: "either" },
}

/**
 * Flag meaningful multi-day swings from recent logs (storage units).
 */
export function detectAnomalies(
  tests: TestPoint[],
  prefs: UnitPrefs,
  waterType: WaterType,
): Anomaly[] {
  const meta = parameterMeta(prefs, waterType)
  const byParam = new Map<ParameterKey, TestPoint[]>()
  for (const test of tests) {
    const key = test.parameter as ParameterKey
    if (!WATCH[key]) continue
    const list = byParam.get(key) ?? []
    list.push(test)
    byParam.set(key, list)
  }

  const anomalies: Anomaly[] = []
  for (const [parameter, rows] of byParam) {
    const rule = WATCH[parameter]!
    const sorted = [...rows].sort((a, b) => a.tested_at.localeCompare(b.tested_at))
    if (sorted.length < 2) continue
    const newest = sorted[sorted.length - 1]!
    const windowStart = Date.now() - rule.windowDays * 24 * 60 * 60 * 1000
    const older =
      [...sorted]
        .reverse()
        .find((row) => parseISO(row.tested_at).getTime() <= windowStart && row.tested_at !== newest.tested_at) ??
      sorted[0]
    if (!older || older.tested_at === newest.tested_at) continue

    const delta = Number(newest.value) - Number(older.value)
    const abs = Math.abs(delta)
    if (abs < rule.delta) continue
    if (rule.direction === "up" && delta <= 0) continue
    if (rule.direction === "down" && delta >= 0) continue

    const hours = Math.max(1, differenceInHours(parseISO(newest.tested_at), parseISO(older.tested_at)))
    const days = Math.max(1, Math.round(hours / 24))
    const label = meta[parameter].label
    const unit = meta[parameter].unit
    const shown = Math.abs(displayParam(parameter, abs, prefs))
    const verb = delta < 0 ? "dropped" : "rose"
    const severity: "watch" | "action" = abs >= rule.delta * 1.5 ? "action" : "watch"

    anomalies.push({
      id: `anomaly-${parameter}`,
      parameter,
      severity,
      title: `${label} ${verb} ${shown}${unit ? ` ${unit}` : ""} in ${days} day${days === 1 ? "" : "s"}`,
      detail: "Worth a retest or a glance at dosing / water changes.",
      href: "/charts",
    })
  }

  return anomalies.slice(0, 4)
}

export function formatLastTestAge(iso: string | null | undefined) {
  if (!iso) return "No tests yet"
  try {
    return `Tested ${formatDistanceToNowStrict(parseISO(iso), { addSuffix: true })}`
  } catch {
    return "No tests yet"
  }
}
