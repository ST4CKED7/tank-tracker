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
  livestock?: boolean | "lean"
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

/** Latest test timestamp per tank — for the switcher tray. */
export const getTankLastTestMap = cache(async () => {
  const { supabase, userId } = await getAuthedUserId()
  const tanks = await getUserTanks()
  if (tanks.length === 0) return {} as Record<string, string>

  // One tiny newest-row query per tank beats scanning hundreds of logs on every layout render.
  const rows = await Promise.all(
    tanks.map(async (tank) => {
      const { data } = await supabase
        .from("test_logs")
        .select("tested_at")
        .eq("user_id", userId)
        .eq("tank_id", tank.id)
        .order("tested_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      return [tank.id, data?.tested_at ?? null] as const
    }),
  )

  const map: Record<string, string> = {}
  for (const [tankId, testedAt] of rows) {
    if (testedAt) map[tankId] = testedAt
  }
  return map
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
  const livestockMode = livestock === "lean" ? "lean" : livestock ? "full" : "off"
  const livestockSelect =
    livestockMode === "lean"
      ? "id, tank_id, species_id, quantity, size_cm, coral_size, sex, nickname, notes, added_on, species:species_catalog(id, common_name, temp_min, temp_max, salinity_min, salinity_max, ph_min, ph_max, alk_min, alk_max, ca_min, ca_max, no3_min, no3_max, po4_min, po4_max)"
      : "*, species:species_catalog(*)"

  const [livestockRes, testsRes, changesRes, dosesRes, equipmentRes, catalogRes] = await Promise.all([
    livestockMode !== "off"
      ? supabase
          .from("livestock")
          .select(livestockSelect)
          .eq("tank_id", tank.id)
          .order("added_on", { ascending: false })
      : Promise.resolve({ data: [] as unknown[] }),
    testsLimit > 0
      ? supabase
          .from("test_logs")
          .select(
            testsLimit <= 40
              ? "id, parameter, value, unit, tested_at, source_kit, notes"
              : "*",
          )
          .eq("tank_id", tank.id)
          .order("tested_at", { ascending: false })
          .limit(testsLimit)
      : Promise.resolve({ data: [] as Tables<"test_logs">[] }),
    changesLimit > 0
      ? supabase
          .from("water_changes")
          .select(changesLimit <= 20 ? "id, changed_at, percent, gallons" : "*")
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
