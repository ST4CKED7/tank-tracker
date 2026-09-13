import type { LivestockRow, Tank } from "@/lib/bioload"
import { intersectRanges } from "@/lib/compatibility"
import {
  dashboardParameterKeys,
  isFreshwater,
  PARAMETER_KEYS,
  parameterMeta,
  type ParameterKey,
  type WaterType,
} from "@/lib/parameters"
import { toStoredTemp, type UnitPrefs } from "@/lib/units"

export type TargetRange = { min: number; max: number }
export type ParameterTargetMap = Partial<Record<ParameterKey, TargetRange>>
export type TargetSource = "custom" | "livestock" | "typical"

export type ResolvedTarget = TargetRange & { source: TargetSource }

export function parseParameterTargets(raw: unknown): ParameterTargetMap {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}
  const out: ParameterTargetMap = {}
  for (const key of PARAMETER_KEYS) {
    const entry = (raw as Record<string, unknown>)[key]
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue
    const min = Number((entry as { min?: unknown }).min)
    const max = Number((entry as { max?: unknown }).max)
    if (!Number.isFinite(min) || !Number.isFinite(max)) continue
    out[key] = { min, max: Math.max(min, max) }
  }
  return out
}

export function tankParameterTargets(tank: { parameter_targets?: unknown } | null | undefined): ParameterTargetMap {
  return parseParameterTargets(tank?.parameter_targets ?? null)
}

export function resolveParameterTarget(input: {
  key: ParameterKey
  tank: Tank
  livestock: LivestockRow[]
  prefs: UnitPrefs
}): ResolvedTarget | null {
  const custom = tankParameterTargets(input.tank)[input.key]
  if (custom) {
    const fallback = defaultParameterTarget(input)
    // Treat “custom that matches the default” as not overridden (heals full-form saves).
    if (!fallback || !targetsNearlyEqual(custom, fallback)) {
      return { ...custom, source: "custom" }
    }
  }
  return defaultParameterTarget(input)
}

/** Livestock / typical window — ignores any custom overrides on the tank. */
export function defaultParameterTarget(input: {
  key: ParameterKey
  tank: Pick<Tank, "water_type">
  livestock: LivestockRow[]
  prefs: UnitPrefs
}): ResolvedTarget | null {
  const waterType: WaterType = isFreshwater(input.tank.water_type) ? "freshwater" : "saltwater"
  const livestock = intersectRanges(input.livestock)[input.key]
  if (livestock) {
    return { min: livestock.min, max: livestock.max, source: "livestock" }
  }

  const established = parameterMeta(input.prefs, waterType)[input.key].establishedTarget
  if (established) return { ...established, source: "typical" }
  return null
}

export function targetsNearlyEqual(a: TargetRange, b: TargetRange, epsilon = 0.001) {
  return Math.abs(a.min - b.min) <= epsilon && Math.abs(a.max - b.max) <= epsilon
}

/** Resolved windows for dashboard / advice — custom overrides livestock / typical. */
export function resolveDashboardTargets(input: {
  tank: Tank
  livestock: LivestockRow[]
  prefs: UnitPrefs
}): Partial<Record<ParameterKey, ResolvedTarget>> {
  const waterType: WaterType = isFreshwater(input.tank.water_type) ? "freshwater" : "saltwater"
  const out: Partial<Record<ParameterKey, ResolvedTarget>> = {}
  for (const key of dashboardParameterKeys(waterType)) {
    const resolved = resolveParameterTarget({ ...input, key })
    if (resolved) out[key] = resolved
  }
  return out
}

/** Convert display min/max (user units) into storage units for a parameter. */
export function toStoredTargetRange(
  key: ParameterKey,
  minDisplay: number,
  maxDisplay: number,
  prefs: UnitPrefs,
): TargetRange {
  if (key === "temperature") {
    const min = toStoredTemp(minDisplay, prefs.temp)
    const max = toStoredTemp(maxDisplay, prefs.temp)
    return { min: Math.min(min, max), max: Math.max(min, max) }
  }
  return {
    min: Math.min(minDisplay, maxDisplay),
    max: Math.max(minDisplay, maxDisplay),
  }
}
