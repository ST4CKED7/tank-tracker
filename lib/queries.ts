import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { LivestockRow, Tank } from "@/lib/bioload"
import type { ParameterKey } from "@/lib/parameters"
import { readActiveTankIdCookie, resolveActiveTank } from "@/lib/active-tank"
import type { Tables } from "@/lib/database.types"

export type DashboardData = {
  tank: Tank | null
  tanks: Tank[]
  livestock: LivestockRow[]
  tests: Tables<"test_logs">[]
  waterChanges: Tables<"water_changes">[]
  doses: Tables<"dose_logs">[]
  equipment: Tables<"equipment">[]
  catalog: Tables<"species_catalog">[]
  latest: Partial<Record<ParameterKey, number>>
}

export type DashboardOptions = {
  livestock?: boolean
  /** false = skip; true = default limit; number = custom limit */
  tests?: boolean | number
  waterChanges?: boolean | number
  doses?: boolean | number
  equipment?: boolean
  catalog?: boolean
}

const EMPTY: Omit<DashboardData, "tank" | "tanks"> = {
  livestock: [],
  tests: [],
  waterChanges: [],
  doses: [],
  equipment: [],
  catalog: [],
  latest: {},
}

/** Dedupes auth lookups across layout + page in one request. */
export const getAuthedUserId = cache(async () => {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims?.sub) redirect("/login")
  return { supabase, userId: data.claims.sub as string }
})

export const getUserTanks = cache(async () => {
  const { supabase, userId } = await getAuthedUserId()
  const { data } = await supabase
    .from("tanks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
  return (data ?? []) as Tank[]
})

export const getActiveTankContext = cache(async () => {
  const tanks = await getUserTanks()
  const preferredId = await readActiveTankIdCookie()
  const tank = resolveActiveTank(tanks, preferredId)
  return { tanks, tank }
})

function limitOf(value: boolean | number | undefined, fallback: number) {
  if (value === false || value == null) return 0
  if (value === true) return fallback
  return value
}

function mapLivestock(rows: unknown[]): LivestockRow[] {
  return rows
    .map((row) => {
      const record = row as LivestockRow & { species: LivestockRow["species"] | LivestockRow["species"][] }
      const species = Array.isArray(record.species) ? record.species[0] : record.species
      return species ? { ...record, species } : null
    })
    .filter((row): row is LivestockRow => row !== null)
}

function latestFromTests(tests: Tables<"test_logs">[]) {
  const latest: Partial<Record<ParameterKey, number>> = {}
  for (const test of tests) {
    const key = test.parameter as ParameterKey
    if (latest[key] == null) latest[key] = Number(test.value)
  }
  return latest
}

/**
 * Load only the slices each page needs. Auth/tank context is React-cached per request.
 */
export async function getDashboardData(options: DashboardOptions = {}): Promise<DashboardData> {
  const {
    livestock = true,
    tests = 400,
    waterChanges = 100,
    doses = 100,
    equipment = true,
    catalog = true,
  } = options

  const { supabase } = await getAuthedUserId()
  const { tanks, tank } = await getActiveTankContext()
  if (!tank) {
    return { tank: null, tanks, ...EMPTY }
  }

  const testsLimit = limitOf(tests, 400)
  const changesLimit = limitOf(waterChanges, 100)
  const dosesLimit = limitOf(doses, 100)

  const [livestockRes, testsRes, changesRes, dosesRes, equipmentRes, catalogRes] = await Promise.all([
    livestock
      ? supabase
          .from("livestock")
          .select("*, species:species_catalog(*)")
          .eq("tank_id", tank.id)
          .order("added_on", { ascending: false })
      : Promise.resolve({ data: [] as unknown[] }),
    testsLimit > 0
      ? supabase
          .from("test_logs")
          .select("*")
          .eq("tank_id", tank.id)
          .order("tested_at", { ascending: false })
          .limit(testsLimit)
      : Promise.resolve({ data: [] as Tables<"test_logs">[] }),
    changesLimit > 0
      ? supabase
          .from("water_changes")
          .select("*")
          .eq("tank_id", tank.id)
          .order("changed_at", { ascending: false })
          .limit(changesLimit)
      : Promise.resolve({ data: [] as Tables<"water_changes">[] }),
    dosesLimit > 0
      ? supabase
          .from("dose_logs")
          .select("*")
          .eq("tank_id", tank.id)
          .order("dosed_at", { ascending: false })
          .limit(dosesLimit)
      : Promise.resolve({ data: [] as Tables<"dose_logs">[] }),
    equipment
      ? supabase.from("equipment").select("*").eq("tank_id", tank.id).order("name")
      : Promise.resolve({ data: [] as Tables<"equipment">[] }),
    catalog
      ? supabase
          .from("species_catalog")
          .select("*")
          .eq("water_type", tank.water_type ?? "saltwater")
          .order("common_name")
      : Promise.resolve({ data: [] as Tables<"species_catalog">[] }),
  ])

  const testRows = (testsRes.data ?? []) as Tables<"test_logs">[]

  return {
    tank,
    tanks,
    livestock: mapLivestock((livestockRes.data ?? []) as unknown[]),
    tests: testRows,
    waterChanges: (changesRes.data ?? []) as Tables<"water_changes">[],
    doses: (dosesRes.data ?? []) as Tables<"dose_logs">[],
    equipment: (equipmentRes.data ?? []) as Tables<"equipment">[],
    catalog: (catalogRes.data ?? []) as Tables<"species_catalog">[],
    latest: latestFromTests(testRows),
  }
}
