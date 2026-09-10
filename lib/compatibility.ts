import type { ParameterKey } from "@/lib/parameters"
import type { LivestockRow, Species, Tank } from "@/lib/bioload"
import { bioloadSummary, livestockPoints, tankCapacity } from "@/lib/bioload"
import { assessCleanupCrew, cleanupRoleLabel, cleanupRoles, isCleanupSpecies } from "@/lib/cleanup-crew"

export type RangeMap = Partial<
  Record<ParameterKey, { min: number; max: number; sources: string[] }>
>

const RANGE_FIELDS: {
  key: ParameterKey
  min: keyof Species
  max: keyof Species
}[] = [
  { key: "temperature", min: "temp_min", max: "temp_max" },
  { key: "salinity", min: "salinity_min", max: "salinity_max" },
  { key: "ph", min: "ph_min", max: "ph_max" },
  { key: "alkalinity", min: "alk_min", max: "alk_max" },
  { key: "calcium", min: "ca_min", max: "ca_max" },
  { key: "nitrate", min: "no3_min", max: "no3_max" },
  { key: "phosphate", min: "po4_min", max: "po4_max" },
]

export function intersectRanges(livestock: LivestockRow[]): RangeMap {
  const ranges: RangeMap = {}
  for (const item of livestock) {
    const species = item.species
    for (const field of RANGE_FIELDS) {
      const min = species[field.min]
      const max = species[field.max]
      if (typeof min !== "number" || typeof max !== "number") continue
      const existing = ranges[field.key]
      if (!existing) {
        ranges[field.key] = {
          min,
          max,
          sources: [species.common_name],
        }
      } else {
        existing.min = Math.max(existing.min, min)
        existing.max = Math.min(existing.max, max)
        existing.sources.push(species.common_name)
      }
    }
  }
  return ranges
}

export type Suggestion = {
  species: Species
  ok: boolean
  reasons: string[]
  projectedBioloadPercent?: number
}

function tagsOf(livestock: LivestockRow[]) {
  return new Set(livestock.flatMap((item) => item.species.aggression_tags ?? []))
}

function kindsOf(livestock: LivestockRow[]) {
  return new Set(livestock.map((item) => item.species.kind))
}

export function evaluateSpecies(
  candidate: Species,
  tank: Tank,
  livestock: LivestockRow[],
  currentParams: Partial<Record<ParameterKey, number>>,
): Suggestion {
  const reasons: string[] = []
  const already = livestock.some((item) => item.species_id === candidate.id)
  if (already) {
    return { species: candidate, ok: false, reasons: ["Already in this tank"] }
  }

  if (candidate.min_tank_gallons && Number(tank.gallons) < candidate.min_tank_gallons) {
    reasons.push(`Needs a larger tank (min ${candidate.min_tank_gallons} gal / ${Math.round(Number(candidate.min_tank_gallons) * 3.785)} L)`)
  }

  if (tank.water_type !== "freshwater") {
    if (tank.tank_type === "mixed_reef" && candidate.reef_safe === "no") {
      reasons.push("Not reef-safe for a mixed reef")
    } else if (tank.tank_type === "mixed_reef" && candidate.reef_safe === "caution") {
      reasons.push("Reef-safe with caution — may nip corals or bother inverts")
    }
  }

  if (candidate.water_type && tank.water_type && candidate.water_type !== tank.water_type) {
    reasons.push(`This species is for ${candidate.water_type} tanks`)
  }

  const tankTags = tagsOf(livestock)
  const candTags = new Set(candidate.aggression_tags ?? [])
  const kinds = kindsOf(livestock)

  if (tank.water_type !== "freshwater") {
    if (candTags.has("nips_corals") && kinds.has("coral")) {
      reasons.push("Known to nip corals already in the tank")
    }
    if (tankTags.has("nips_corals") && candidate.kind === "coral") {
      reasons.push("A current fish is a coral nipper")
    }
  }
  if (candTags.has("eats_inverts") && kinds.has("invert")) {
    reasons.push("May eat shrimp, crabs, or snails you already keep")
  }
  if (tankTags.has("eats_inverts") && candidate.kind === "invert") {
    reasons.push("A current fish may eat this invert")
  }
  if (candTags.has("not_with_shrimp") && livestock.some((i) => i.species.aggression_tags.includes("shrimp"))) {
    reasons.push("Poor mix with shrimp already in the tank")
  }
  if (candTags.has("shrimp") && livestock.some((i) => i.species.aggression_tags.includes("not_with_shrimp"))) {
    reasons.push("A current fish is hard on shrimp")
  }
  if (candidate.temperament === "aggressive" && livestock.some((i) => i.species.temperament === "peaceful" && i.species.kind === "fish")) {
    reasons.push("Aggressive with peaceful fish already stocked")
  }

  const ranges = intersectRanges(livestock)
  for (const field of RANGE_FIELDS) {
    const candMin = candidate[field.min]
    const candMax = candidate[field.max]
    const window = ranges[field.key]
    if (typeof candMin !== "number" || typeof candMax !== "number" || !window) continue
    if (candMax < window.min || candMin > window.max) {
      reasons.push(`${field.key} range does not overlap the tank’s combined window`)
    }
  }

  for (const field of RANGE_FIELDS) {
    const current = currentParams[field.key]
    const candMin = candidate[field.min]
    const candMax = candidate[field.max]
    if (current == null || typeof candMin !== "number" || typeof candMax !== "number") continue
    if (current < candMin || current > candMax) {
      reasons.push(`Latest ${field.key} reading (${current}) is outside this species’ range`)
    }
  }

  let projectedBioloadPercent: number | undefined
  const extra =
    candidate.kind === "coral"
      ? livestockPoints(candidate, 1, { coralSize: "frag" })
      : livestockPoints(candidate, 1)
  const current = bioloadSummary(tank, livestock)
  const nextPercent = ((current.used + extra) / tankCapacity(tank)) * 100
  projectedBioloadPercent = nextPercent
  if (nextPercent >= 100) {
    reasons.push(`Would put estimated bioload at ${Math.round(nextPercent)}% of capacity`)
  }

  const hardFails = reasons.filter(
    (reason) =>
      !reason.startsWith("Reef-safe with caution") &&
      !reason.includes("outside this species"),
  )
  const ok = hardFails.length === 0
  if (ok) reasons.unshift("Fits tank size, compatibility rules, and remaining bioload headroom")

  return { species: candidate, ok, reasons, projectedBioloadPercent }
}

export function suggestAdditions(
  catalog: Species[],
  tank: Tank,
  livestock: LivestockRow[],
  currentParams: Partial<Record<ParameterKey, number>>,
) {
  const cuc = assessCleanupCrew(tank, livestock)
  const prioritizeCleanup = cuc.status !== "ok"

  return catalog
    .map((species) => {
      const suggestion = evaluateSpecies(species, tank, livestock, currentParams)
      if (suggestion.ok && prioritizeCleanup && isCleanupSpecies(species)) {
        suggestion.reasons = [
          "Helps fill out your cleanup crew",
          ...suggestion.reasons.filter((reason) => !reason.startsWith("Fits tank size")),
        ]
      }
      return suggestion
    })
    .filter((item) => item.ok)
    .sort((a, b) => {
      if (prioritizeCleanup) {
        const aCuc = isCleanupSpecies(a.species) ? 0 : 1
        const bCuc = isCleanupSpecies(b.species) ? 0 : 1
        if (aCuc !== bCuc) return aCuc - bCuc
      }
      return a.species.common_name.localeCompare(b.species.common_name)
    })
}

export function suggestCleanupCrew(
  catalog: Species[],
  tank: Tank,
  livestock: LivestockRow[],
  currentParams: Partial<Record<ParameterKey, number>>,
  limit = 8,
): Suggestion[] {
  const assessment = assessCleanupCrew(tank, livestock)
  const missing = new Set(assessment.rolesMissing)

  return catalog
    .filter(isCleanupSpecies)
    .map((species) => {
      const suggestion = evaluateSpecies(species, tank, livestock, currentParams)
      const roles = cleanupRoles(species)
      const fillsGap = roles.some((role) => missing.has(role))
      if (suggestion.ok && (assessment.status !== "ok" || fillsGap)) {
        suggestion.reasons = [
          fillsGap
            ? `Helps cover missing ${roles
                .filter((role) => missing.has(role))
                .map(cleanupRoleLabel)
                .join(" / ")}`
            : "Good cleanup-crew addition for this tank size",
          ...suggestion.reasons.filter((reason) => !reason.startsWith("Fits tank size")),
        ]
      }
      return { suggestion, fillsGap }
    })
    .filter((item) => item.suggestion.ok)
    .sort((a, b) => {
      if (a.fillsGap !== b.fillsGap) return a.fillsGap ? -1 : 1
      return a.suggestion.species.common_name.localeCompare(b.suggestion.species.common_name)
    })
    .slice(0, limit)
    .map((item) => item.suggestion)
}
