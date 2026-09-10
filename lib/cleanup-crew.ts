import type { LivestockRow, Species, Tank } from "@/lib/bioload"

export type CleanupRole = "algae" | "sand" | "scavenger"

export type CleanupAssessment = {
  count: number
  target: number
  status: "ok" | "light" | "missing"
  rolesPresent: CleanupRole[]
  rolesMissing: CleanupRole[]
  summary: string
  detail: string
}

const ROLE_LABELS: Record<CleanupRole, string> = {
  algae: "algae grazers",
  sand: "sand sifters",
  scavenger: "scavengers",
}

export function cleanupRoleLabel(role: CleanupRole) {
  return ROLE_LABELS[role]
}

/** Species that belong in a cleanup crew. */
export function isCleanupSpecies(species: Species) {
  if (species.aggression_tags?.includes("cleanup")) return true
  if (species.kind === "invert" && (species.diet === "herbivore" || species.diet === "scavenger")) return true
  if (species.kind !== "fish") return false
  const name = `${species.common_name} ${species.scientific_name ?? ""}`.toLowerCase()
  return (
    species.diet === "herbivore" &&
    /otocinclus|pleco|bristlenose|hillstream|siamese algae|lawnmower|blenny|tang|rabbitfish|foxface/.test(name)
  )
}

export function cleanupRoles(species: Species): CleanupRole[] {
  if (!isCleanupSpecies(species)) return []
  const tags = new Set(species.aggression_tags ?? [])
  const name = species.common_name.toLowerCase()
  const roles = new Set<CleanupRole>()

  if (
    tags.has("needs_sand") ||
    species.diet === "scavenger" ||
    /nassarius|trumpet|sand-sifting|sand sifting|watchman|sleeper/.test(name)
  ) {
    roles.add("sand")
  }
  if (
    species.diet === "scavenger" ||
    /hermit|crab|star|shrimp|scavenger/.test(name) ||
    (tags.has("cleanup") && species.diet === "omnivore")
  ) {
    roles.add("scavenger")
  }
  if (
    species.diet === "herbivore" ||
    /snail|otocinclus|pleco|blenny|tang|algae|nerite|trochus|turbo|astrea|cerith|amano|cherry|ramshorn|mystery/.test(
      name,
    ) ||
    tags.has("cleanup")
  ) {
    roles.add("algae")
  }
  if (roles.size === 0) roles.add("algae")
  return [...roles]
}

export function cleanupTargetCount(tank: Tank) {
  const gallons = Number(tank.gallons) || 0
  return Math.max(3, Math.ceil(gallons / 10))
}

export function assessCleanupCrew(tank: Tank, livestock: LivestockRow[]): CleanupAssessment {
  const members = livestock.filter((item) => isCleanupSpecies(item.species))
  const count = members.reduce((sum, item) => sum + item.quantity, 0)
  const target = cleanupTargetCount(tank)
  const rolesPresent = [...new Set(members.flatMap((item) => cleanupRoles(item.species)))] as CleanupRole[]

  const desiredRoles: CleanupRole[] =
    tank.water_type === "freshwater"
      ? (["algae", "scavenger"] as CleanupRole[])
      : Number(tank.gallons) >= 30
        ? (["algae", "sand", "scavenger"] as CleanupRole[])
        : (["algae", "scavenger"] as CleanupRole[])

  const rolesMissing = desiredRoles.filter((role) => !rolesPresent.includes(role))

  let status: CleanupAssessment["status"] = "ok"
  if (count === 0) status = "missing"
  else if (count < Math.ceil(target * 0.6) || rolesMissing.length >= 2) status = "light"
  else if (count < target && rolesMissing.length > 0) status = "light"

  const roleText =
    rolesPresent.length > 0
      ? `Covered: ${rolesPresent.map((r) => ROLE_LABELS[r]).join(", ")}.`
      : "No cleanup roles covered yet."

  const missingText =
    rolesMissing.length > 0 ? ` Still light on ${rolesMissing.map((r) => ROLE_LABELS[r]).join(" and ")}.` : ""

  if (status === "missing") {
    return {
      count,
      target,
      status,
      rolesPresent,
      rolesMissing,
      summary: "No cleanup crew yet",
      detail: `Aim for about ${target} cleanup animals in a ${Math.round(Number(tank.gallons))}-gal system (snails, shrimp, hermits, and algae eaters).${missingText}`,
    }
  }

  if (status === "light") {
    return {
      count,
      target,
      status,
      rolesPresent,
      rolesMissing,
      summary: `Cleanup crew is light (${count} / ~${target})`,
      detail: `${roleText}${missingText} Add a few more grazers or scavengers if algae or detritus is building up.`,
    }
  }

  return {
    count,
    target,
    status,
    rolesPresent,
    rolesMissing,
    summary: `Cleanup crew looks solid (${count} / ~${target})`,
    detail: `${roleText} Keep an eye on algae and leftover food — bump numbers if waste starts to pile up.`,
  }
}
