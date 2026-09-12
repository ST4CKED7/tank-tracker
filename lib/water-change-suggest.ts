import type { LivestockRow, Tank } from "@/lib/bioload"
import {
  displayParam,
  formatVolume,
  type UnitPrefs,
} from "@/lib/units"
import {
  isFreshwater,
  parameterMeta,
  type ParameterKey,
  type WaterType,
} from "@/lib/parameters"
import { resolveParameterTarget } from "@/lib/parameter-targets"
import { waterChangeGallons } from "@/lib/reminders"
import { saltMixForGallons } from "@/lib/salt-mix"

export type WaterChangeDriver = {
  parameter: ParameterKey
  current: number
  target: number
  /** Percent needed to dilute to target with clean replacement water. */
  percentNeeded: number
}

export type WaterChangeSuggestion = {
  percent: number
  gallons: number
  severity: "urgent" | "action" | "watch"
  drivers: WaterChangeDriver[]
  primary: WaterChangeDriver
  /** Short line for cards / calculator. */
  summary: string
  /** Fuller explanation with projected reading. */
  detail: string
}

function resolveMax(
  key: ParameterKey,
  tank: Tank,
  livestock: LivestockRow[],
  prefs: UnitPrefs,
): number | null {
  return resolveParameterTarget({ key, tank, livestock, prefs })?.max ?? null
}

/** One change with near-zero replacement water: new ≈ current × (1 − percent/100). */
export function projectedAfterChange(current: number, percent: number) {
  return Number((current * (1 - percent / 100)).toFixed(2))
}

function percentToDilute(current: number, target: number): number | null {
  if (!(current > 0) || !(target >= 0) || current <= target) return null
  // Can't hit exact zero in one change — aim for a deep cut toward a tiny residual.
  const aim = target <= 0 ? Math.min(current * 0.15, 0.1) : target
  if (aim >= current) return null
  return (1 - aim / current) * 100
}

function roundPercent(raw: number, max: number) {
  const clamped = Math.min(max, Math.max(15, raw))
  return Math.ceil(clamped / 5) * 5
}

function formatReading(key: ParameterKey, value: number, prefs: UnitPrefs, waterType: WaterType) {
  const meta = parameterMeta(prefs, waterType)[key]
  const shown = displayParam(key, value, prefs)
  return meta.unit ? `${shown} ${meta.unit}` : String(shown)
}

/**
 * Suggest a water-change size from latest chemistry.
 * Uses dilution math (clean replacement water) for nutrients / toxins / high KH.
 */
export function suggestWaterChange(input: {
  tank: Tank
  latest: Partial<Record<ParameterKey, number>>
  livestock: LivestockRow[]
  prefs: UnitPrefs
}): WaterChangeSuggestion | null {
  const waterType: WaterType = isFreshwater(input.tank.water_type) ? "freshwater" : "saltwater"
  const fw = waterType === "freshwater"
  const drivers: WaterChangeDriver[] = []
  let urgent = false

  const ammonia = input.latest.ammonia
  if (ammonia != null && ammonia > 0) {
    const target = 0
    const needed = percentToDilute(ammonia, target) ?? (ammonia >= 0.5 ? 50 : 35)
    drivers.push({ parameter: "ammonia", current: ammonia, target, percentNeeded: needed })
    if (ammonia >= 0.25) urgent = true
  }

  const nitrite = input.latest.nitrite
  if (nitrite != null && nitrite > 0) {
    const target = 0
    const needed = percentToDilute(nitrite, target) ?? (nitrite >= 0.5 ? 50 : 35)
    drivers.push({ parameter: "nitrite", current: nitrite, target, percentNeeded: needed })
    if (nitrite >= 0.25) urgent = true
  }

  const nitrate = input.latest.nitrate
  const nitrateMax = resolveMax("nitrate", input.tank, input.livestock, input.prefs)
  if (nitrate != null && nitrateMax != null && nitrate > nitrateMax) {
    const needed = percentToDilute(nitrate, nitrateMax)
    if (needed != null) {
      drivers.push({
        parameter: "nitrate",
        current: nitrate,
        target: nitrateMax,
        percentNeeded: needed,
      })
    }
  }

  const phosphate = input.latest.phosphate
  const po4Max = resolveMax("phosphate", input.tank, input.livestock, input.prefs)
  if (phosphate != null && po4Max != null && phosphate > po4Max) {
    const needed = percentToDilute(phosphate, po4Max)
    if (needed != null) {
      drivers.push({
        parameter: "phosphate",
        current: phosphate,
        target: po4Max,
        percentNeeded: needed,
      })
    }
  }

  const alk = input.latest.alkalinity
  const alkMax = resolveMax("alkalinity", input.tank, input.livestock, input.prefs)
  if (alk != null && alkMax != null && alk > alkMax) {
    const needed = percentToDilute(alk, alkMax)
    if (needed != null) {
      drivers.push({
        parameter: "alkalinity",
        current: alk,
        target: alkMax,
        percentNeeded: needed,
      })
    }
  }

  if (drivers.length === 0) return null

  drivers.sort((a, b) => b.percentNeeded - a.percentNeeded)
  const primary = drivers[0]
  const maxCap = urgent ? 50 : 40
  const percent = roundPercent(primary.percentNeeded, maxCap)
  const gallons = waterChangeGallons(input.tank, percent)
  const projected = projectedAfterChange(primary.current, percent)
  const stillHigh = primary.target > 0 ? projected > primary.target : projected > 0.05

  const driverNames = drivers
    .slice(0, 3)
    .map((d) => parameterMeta(input.prefs, waterType)[d.parameter].label)
    .join(", ")

  const mixBit = fw
    ? `${formatVolume(gallons, input.prefs)} of conditioned water`
    : (() => {
        const salt = saltMixForGallons(gallons)
        return `${formatVolume(gallons, input.prefs)} (~${salt.cups} cups / ${salt.grams}g salt)`
      })()

  const summary = `~${percent}% · ${mixBit}`

  const detail = [
    `Based on ${driverNames}, a ~${percent}% change (${mixBit}) is a practical next step.`,
    `${parameterMeta(input.prefs, waterType)[primary.parameter].label} would land near ${formatReading(primary.parameter, projected, input.prefs, waterType)} after one change`,
    stillHigh
      ? "(you may need a second change or extra export to finish)."
      : "(that should put you back in range if replacement water is clean).",
    "Match temperature; for saltwater verify salinity after mixing.",
  ].join(" ")

  const severity: WaterChangeSuggestion["severity"] = urgent
    ? "urgent"
    : percent >= 30 || drivers.length > 1
      ? "action"
      : "watch"

  return {
    percent,
    gallons,
    severity,
    drivers,
    primary,
    summary,
    detail,
  }
}
