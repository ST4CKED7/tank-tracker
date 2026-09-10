import { displayParam, type UnitPrefs, type UnitSystem } from "@/lib/units"

export type WaterType = "saltwater" | "freshwater"

export const PARAMETER_KEYS = [
  "ph",
  "ammonia",
  "nitrite",
  "nitrate",
  "calcium",
  "alkalinity",
  "phosphate",
  "salinity",
  "temperature",
] as const

export type ParameterKey = (typeof PARAMETER_KEYS)[number]

export type ParameterMeta = {
  label: string
  unit: string
  establishedTarget?: { min: number; max: number }
}

const SALTWATER_META: Record<ParameterKey, ParameterMeta> = {
  ph: { label: "pH", unit: "", establishedTarget: { min: 8.1, max: 8.4 } },
  ammonia: { label: "Ammonia", unit: "ppm", establishedTarget: { min: 0, max: 0 } },
  nitrite: { label: "Nitrite", unit: "ppm", establishedTarget: { min: 0, max: 0 } },
  nitrate: { label: "Nitrate", unit: "ppm", establishedTarget: { min: 0, max: 20 } },
  calcium: { label: "Calcium", unit: "ppm", establishedTarget: { min: 380, max: 450 } },
  alkalinity: { label: "Alkalinity", unit: "dKH", establishedTarget: { min: 7, max: 11 } },
  phosphate: { label: "Phosphate", unit: "ppm", establishedTarget: { min: 0, max: 0.1 } },
  salinity: { label: "Salinity", unit: "ppt", establishedTarget: { min: 34, max: 36 } },
  temperature: { label: "Temperature", unit: "°F", establishedTarget: { min: 75, max: 82 } },
}

/** Freshwater community defaults. Alkalinity here is KH (dKH). */
const FRESHWATER_META: Record<ParameterKey, ParameterMeta> = {
  ph: { label: "pH", unit: "", establishedTarget: { min: 6.8, max: 7.8 } },
  ammonia: { label: "Ammonia", unit: "ppm", establishedTarget: { min: 0, max: 0 } },
  nitrite: { label: "Nitrite", unit: "ppm", establishedTarget: { min: 0, max: 0 } },
  nitrate: { label: "Nitrate", unit: "ppm", establishedTarget: { min: 0, max: 40 } },
  calcium: { label: "Calcium", unit: "ppm" },
  alkalinity: { label: "KH (carbonate hardness)", unit: "dKH", establishedTarget: { min: 3, max: 8 } },
  phosphate: { label: "Phosphate", unit: "ppm" },
  salinity: { label: "Salinity", unit: "ppt" },
  temperature: { label: "Temperature", unit: "°F", establishedTarget: { min: 72, max: 82 } },
}

/** @deprecated Prefer parameterMeta(system, waterType) */
export const PARAMETER_META = SALTWATER_META

export const API_COLOR_VALUES: Partial<Record<ParameterKey, number[]>> = {
  ph: [6.0, 6.4, 6.8, 7.0, 7.2, 7.6, 8.0, 8.4, 8.8],
  ammonia: [0, 0.25, 0.5, 1.0, 2.0, 4.0, 8.0],
  nitrite: [0, 0.25, 0.5, 1.0, 2.0, 5.0],
  nitrate: [0, 5, 10, 20, 40, 80, 160],
  phosphate: [0, 0.25, 0.5, 1.0, 2.0, 5.0, 10],
}

/** Parameters shown on dashboards / charts for a given water type. */
export function dashboardParameterKeys(waterType: WaterType = "saltwater"): ParameterKey[] {
  if (waterType === "freshwater") {
    return ["ph", "ammonia", "nitrite", "nitrate", "alkalinity", "temperature"]
  }
  return [...PARAMETER_KEYS]
}

export function pptToSg(ppt: number) {
  return Number((1 + ppt * 0.000845).toFixed(4))
}

export function sgToPpt(sg: number) {
  return Number(((sg - 1) / 0.000845).toFixed(1))
}

export function isFreshwater(waterType: WaterType | string | null | undefined) {
  return waterType === "freshwater"
}

export function parameterMeta(prefs: UnitPrefs | UnitSystem, waterType: WaterType = "saltwater") {
  const base = waterType === "freshwater" ? FRESHWATER_META : SALTWATER_META
  const celsius =
    typeof prefs === "string" ? prefs === "metric" : prefs.temp === "C"
  const tempTarget =
    waterType === "freshwater"
      ? celsius
        ? { min: 22, max: 28 }
        : { min: 72, max: 82 }
      : celsius
        ? { min: 24, max: 28 }
        : { min: 75, max: 82 }

  return {
    ...base,
    temperature: {
      label: "Temperature",
      unit: celsius ? "°C" : "°F",
      establishedTarget: tempTarget,
    },
  } as Record<ParameterKey, ParameterMeta>
}

export function displayRange(
  key: ParameterKey,
  range: { min: number; max: number },
  prefs: UnitPrefs | UnitSystem,
) {
  return {
    min: displayParam(key, range.min, prefs),
    max: displayParam(key, range.max, prefs),
  }
}

export function waterTypeLabel(waterType: WaterType | string | null | undefined) {
  return waterType === "freshwater" ? "freshwater" : "saltwater"
}
