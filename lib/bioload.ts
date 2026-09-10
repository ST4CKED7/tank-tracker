import type { Tables } from "@/lib/database.types"
import { tankProfile } from "@/lib/tank-profiles"

export type Tank = Tables<"tanks">
export type Species = Tables<"species_catalog">
export type LivestockRow = Tables<"livestock"> & { species: Species }
export type CoralSize = NonNullable<Tables<"livestock">["coral_size"]>
export type LivestockSex = Tables<"livestock">["sex"]

export const LIVESTOCK_SEX_LABELS: Record<LivestockSex, string> = {
  male: "Male",
  female: "Female",
  unknown: "Unknown",
  mixed: "Mixed",
}

export function parseLivestockSex(value: unknown): LivestockSex {
  const raw = String(value || "")
  if (raw === "male" || raw === "female" || raw === "mixed" || raw === "unknown") return raw
  return "unknown"
}

/** Soft bioload points for coral footprint / nutrient demand. */
export const CORAL_SIZE_POINTS: Record<CoralSize, number> = {
  frag: 0.5,
  small: 1.5,
  colony: 3.5,
}

export const CORAL_SIZE_LABELS: Record<CoralSize, string> = {
  frag: "Frag",
  small: "Small colony",
  colony: "Colony",
}

export function livestockPoints(
  species: Species,
  quantity: number,
  options?: {
    coralSize?: CoralSize | null
    currentLengthInches?: number | null
  },
) {
  if (species.kind === "coral") {
    const size = options?.coralSize ?? "frag"
    return CORAL_SIZE_POINTS[size] * quantity
  }
  if (species.kind === "plant") return 0
  if (species.kind === "invert") return Number(species.invert_points) * quantity
  const length =
    options?.currentLengthInches != null && Number(options.currentLengthInches) > 0
      ? Number(options.currentLengthInches)
      : Number(species.adult_length_inches ?? 0)
  const factor = Number(species.bioload_factor ?? 1)
  return length * factor * quantity
}

export function itemBioloadPoints(item: LivestockRow) {
  return livestockPoints(item.species, item.quantity, {
    coralSize: item.coral_size,
    currentLengthInches: item.current_length_inches,
  })
}

export function systemGallons(tank: Tank) {
  const display = Number(tank.gallons) || 0
  const sump = tank.has_sump ? Number(tank.sump_gallons) || 0 : 0
  return display + sump
}

export function tankCapacity(tank: Tank) {
  const gallons = systemGallons(tank)
  return gallons * tankProfile(tank.tank_type).bioloadFactor
}

export function bioloadSummary(tank: Tank, livestock: LivestockRow[]) {
  const used = livestock.reduce((sum, item) => sum + itemBioloadPoints(item), 0)
  const capacity = tankCapacity(tank)
  const percent = capacity > 0 ? (used / capacity) * 100 : 0
  const coralCount = livestock
    .filter((item) => item.species.kind === "coral")
    .reduce((sum, item) => sum + item.quantity, 0)

  let level: "ok" | "watch" | "high" | "over" = "ok"
  if (percent >= 100) level = "over"
  else if (percent >= 90) level = "high"
  else if (percent >= 70) level = "watch"

  return { used, capacity, percent, level, coralCount }
}

export function nitrateRisingDespiteChanges(
  nitrates: { testedAt: string; value: number }[],
  waterChanges: { changedAt: string }[],
) {
  if (nitrates.length < 3) return false
  const recent = [...nitrates]
    .sort((a, b) => a.testedAt.localeCompare(b.testedAt))
    .slice(-4)
  const rising = recent.every((point, i) => i === 0 || point.value >= recent[i - 1].value - 0.5) &&
    recent[recent.length - 1].value > recent[0].value + 2
  const lastChange = waterChanges
    .map((change) => change.changedAt)
    .sort()
    .at(-1)
  if (!lastChange) return rising
  const lastChangeMs = new Date(lastChange).getTime()
  const windowStart = lastChangeMs - 1000 * 60 * 60 * 24 * 21
  const hadChangeInWindow = waterChanges.some((change) => {
    const t = new Date(change.changedAt).getTime()
    return t >= windowStart
  })
  return rising && hadChangeInWindow
}
