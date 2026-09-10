import type { Database } from "@/lib/database.types"
import type { WaterType } from "@/lib/parameters"

export type TankType = Database["public"]["Enums"]["tank_type"]

export type TankProfile = {
  id: TankType
  label: string
  waterType: WaterType
  /** Multiplier applied to system gallons for bioload capacity. */
  bioloadFactor: number
  /** Enforce reef-safe livestock checks. */
  reefSafeRequired: boolean
  description: string
}

export const TANK_PROFILES: TankProfile[] = [
  {
    id: "fowlr",
    label: "FOWLR",
    waterType: "saltwater",
    bioloadFactor: 1,
    reefSafeRequired: false,
    description: "Fish-only with live rock — no coral bioload pressure.",
  },
  {
    id: "mixed_reef",
    label: "Mixed reef",
    waterType: "saltwater",
    bioloadFactor: 0.75,
    reefSafeRequired: true,
    description: "Fish + mixed corals; leave headroom for coral demand.",
  },
  {
    id: "sps_reef",
    label: "SPS-dominant",
    waterType: "saltwater",
    bioloadFactor: 0.55,
    reefSafeRequired: true,
    description: "Strict stocking for sensitive SPS systems.",
  },
  {
    id: "lps_reef",
    label: "LPS / large polyp",
    waterType: "saltwater",
    bioloadFactor: 0.7,
    reefSafeRequired: true,
    description: "LPS-focused reef with moderate fish load.",
  },
  {
    id: "softie_reef",
    label: "Soft coral",
    waterType: "saltwater",
    bioloadFactor: 0.85,
    reefSafeRequired: true,
    description: "Softies and mushrooms; a bit more fish headroom.",
  },
  {
    id: "nano_reef",
    label: "Nano reef",
    waterType: "saltwater",
    bioloadFactor: 0.65,
    reefSafeRequired: true,
    description: "Small systems — stock lightly.",
  },
  {
    id: "community",
    label: "Community",
    waterType: "freshwater",
    bioloadFactor: 1,
    reefSafeRequired: false,
    description: "Typical community tropical tank.",
  },
  {
    id: "planted",
    label: "Planted",
    waterType: "freshwater",
    bioloadFactor: 1,
    reefSafeRequired: false,
    description: "Planted community — plants help nutrient export.",
  },
  {
    id: "aquascape",
    label: "Aquascape",
    waterType: "freshwater",
    bioloadFactor: 0.9,
    reefSafeRequired: false,
    description: "Hardscape-forward scape; keep livestock light.",
  },
  {
    id: "african_cichlid",
    label: "African cichlid",
    waterType: "freshwater",
    bioloadFactor: 0.85,
    reefSafeRequired: false,
    description: "Mbuna / peacock style — aggressive, denser rockwork.",
  },
  {
    id: "discus",
    label: "Discus / soft water",
    waterType: "freshwater",
    bioloadFactor: 0.65,
    reefSafeRequired: false,
    description: "Warm soft-water specialists; leave room for water quality.",
  },
  {
    id: "shrimp",
    label: "Shrimp / nano",
    waterType: "freshwater",
    bioloadFactor: 1.25,
    reefSafeRequired: false,
    description: "Low-bioload shrimp and nano fish.",
  },
  {
    id: "goldfish",
    label: "Goldfish",
    waterType: "freshwater",
    bioloadFactor: 0.4,
    reefSafeRequired: false,
    description: "Coldwater goldfish — high waste, stock lightly.",
  },
]

const BY_ID = Object.fromEntries(TANK_PROFILES.map((profile) => [profile.id, profile])) as Record<
  TankType,
  TankProfile
>

export function tankProfile(id: TankType | string | null | undefined): TankProfile {
  if (id && id in BY_ID) return BY_ID[id as TankType]
  return BY_ID.mixed_reef
}

export function profilesForWater(waterType: WaterType) {
  return TANK_PROFILES.filter((profile) => profile.waterType === waterType)
}

export function defaultTankType(waterType: WaterType): TankType {
  return waterType === "freshwater" ? "community" : "mixed_reef"
}

export function parseTankType(raw: FormDataEntryValue | string | null | undefined, waterType: WaterType): TankType {
  const value = String(raw || "")
  const match = profilesForWater(waterType).find((profile) => profile.id === value)
  return match?.id ?? defaultTankType(waterType)
}

export function tankTypeLabel(id: TankType | string | null | undefined) {
  return tankProfile(id).label
}

/** Map legacy FW tanks stored as fowlr before freshwater profiles existed. */
export function displayTankType(tank: { water_type?: string | null; tank_type?: string | null }) {
  if (tank.water_type === "freshwater" && (tank.tank_type === "fowlr" || !tank.tank_type)) {
    return "Community"
  }
  return tankTypeLabel(tank.tank_type)
}
