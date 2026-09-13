import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { bioloadSummary, type LivestockRow, type Tank } from "@/lib/bioload"
import type { ParameterKey } from "@/lib/parameters"
import { readActiveTankIdCookie, resolveActiveTank } from "@/lib/active-tank"
import { buildReminders, actionableReminders, type Reminder } from "@/lib/reminders"
import type { Tables } from "@/lib/database.types"

export type DashboardData = {
  tank: Tank | null
  tanks: Tank[]
  livestock: LivestockRow[]
  tests: Tables<"test_logs">[]
  waterChanges: Tables<"water_changes">[]
  doses: Tables<"dose_logs">[]
  doseSchedules: Tables<"dose_schedules">[]
  equipment: Tables<"equipment">[]
  catalog: Tables<"species_catalog">[]
  photos: Tables<"tank_photos">[]
  parameterReminders: Tables<"parameter_reminders">[]
  latest: Partial<Record<ParameterKey, number>>
}

export type DashboardOptions = {
  livestock?: boolean | "lean"
  /** false = skip; true = default limit; number = custom limit */
  tests?: boolean | number
  waterChanges?: boolean | number
  doses?: boolean | number
  doseSchedules?: boolean
  equipment?: boolean
  catalog?: boolean
  photos?: boolean | number
  parameterReminders?: boolean
}

const EMPTY: Omit<DashboardData, "tank" | "tanks"> = {
  livestock: [],
  tests: [],
  waterChanges: [],
  doses: [],
  doseSchedules: [],
  equipment: [],
  catalog: [],
  photos: [],
  parameterReminders: [],
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

/** Latest test timestamp per tank — for the switcher tray. One round-trip via RPC. */
export const getTankLastTestMap = cache(async () => {
  const { supabase } = await getAuthedUserId()
  const { data, error } = await supabase.rpc("latest_test_per_tank")
  if (error || !data) return {} as Record<string, string>

  const map: Record<string, string> = {}
  for (const row of data as { tank_id: string; tested_at: string | null }[]) {
    if (row.tested_at) map[row.tank_id] = row.tested_at
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
    doseSchedules = false,
    equipment = true,
    catalog = true,
    photos = false,
    parameterReminders = false,
  } = options

  const { supabase } = await getAuthedUserId()
  const { tanks, tank } = await getActiveTankContext()
  if (!tank) {
    return { tank: null, tanks, ...EMPTY }
  }

  const testsLimit = limitOf(tests, 400)
  const changesLimit = limitOf(waterChanges, 100)
  const dosesLimit = limitOf(doses, 100)
  const photosLimit = limitOf(photos, 40)
  const livestockMode = livestock === "lean" ? "lean" : livestock ? "full" : "off"
  const livestockSelect =
    livestockMode === "lean"
      ? "id, tank_id, species_id, quantity, size_cm, coral_size, sex, nickname, notes, added_on, species:species_catalog(id, common_name, temp_min, temp_max, salinity_min, salinity_max, ph_min, ph_max, alk_min, alk_max, ca_min, ca_max, no3_min, no3_max, po4_min, po4_max)"
      : "*, species:species_catalog(*)"

  const [
    livestockRes,
    testsRes,
    changesRes,
    dosesRes,
    schedulesRes,
    equipmentRes,
    catalogRes,
    photosRes,
    paramRemindersRes,
  ] = await Promise.all([
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
    doseSchedules
      ? supabase.from("dose_schedules").select("*").eq("tank_id", tank.id).order("product")
      : Promise.resolve({ data: [] as Tables<"dose_schedules">[] }),
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
    photosLimit > 0
      ? supabase
          .from("tank_photos")
          .select("*")
          .eq("tank_id", tank.id)
          .order("taken_at", { ascending: false })
          .limit(photosLimit)
      : Promise.resolve({ data: [] as Tables<"tank_photos">[] }),
    parameterReminders
      ? supabase.from("parameter_reminders").select("*").eq("tank_id", tank.id).order("parameter")
      : Promise.resolve({ data: [] as Tables<"parameter_reminders">[] }),
  ])

  const testRows = (testsRes.data ?? []) as Tables<"test_logs">[]

  return {
    tank,
    tanks,
    livestock: mapLivestock((livestockRes.data ?? []) as unknown[]),
    tests: testRows,
    waterChanges: (changesRes.data ?? []) as Tables<"water_changes">[],
    doses: (dosesRes.data ?? []) as Tables<"dose_logs">[],
    doseSchedules: (schedulesRes.data ?? []) as Tables<"dose_schedules">[],
    equipment: (equipmentRes.data ?? []) as Tables<"equipment">[],
    catalog: (catalogRes.data ?? []) as Tables<"species_catalog">[],
    photos: (photosRes.data ?? []) as Tables<"tank_photos">[],
    parameterReminders: (paramRemindersRes.data ?? []) as Tables<"parameter_reminders">[],
    latest: latestFromTests(testRows),
  }
}

export type TankOverview = {
  tank: Tank
  bioload: ReturnType<typeof bioloadSummary>
  lastTest: string | null
  reminders: Reminder[]
  actionable: Reminder[]
}

function groupByTank<T extends { tank_id: string }>(rows: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const row of rows) {
    const list = map.get(row.tank_id)
    if (list) list.push(row)
    else map.set(row.tank_id, [row])
  }
  return map
}

/**
 * Lightweight cross-tank rollup for the multi-tank dashboard.
 * Batches one query per table (scoped to the user's tanks) instead of per-tank fan-out.
 */
export async function getMultiTankOverview(): Promise<TankOverview[]> {
  const { supabase } = await getAuthedUserId()
  const tanks = await getUserTanks()
  if (tanks.length === 0) return []
  const tankIds = tanks.map((tank) => tank.id)

  const [lastTestMap, livestockRes, changesRes, equipmentRes, schedulesRes, remindersRes] = await Promise.all([
    getTankLastTestMap(),
    supabase.from("livestock").select("*, species:species_catalog(*)").in("tank_id", tankIds),
    supabase
      .from("water_changes")
      .select("tank_id, changed_at")
      .in("tank_id", tankIds)
      .order("changed_at", { ascending: false }),
    supabase.from("equipment").select("*").in("tank_id", tankIds),
    supabase.from("dose_schedules").select("*").in("tank_id", tankIds),
    supabase.from("parameter_reminders").select("*").in("tank_id", tankIds),
  ])

  const livestockByTank = groupByTank(mapLivestock((livestockRes.data ?? []) as unknown[]))
  const equipmentByTank = groupByTank((equipmentRes.data ?? []) as Tables<"equipment">[])
  const schedulesByTank = groupByTank((schedulesRes.data ?? []) as Tables<"dose_schedules">[])
  const remindersByTank = groupByTank((remindersRes.data ?? []) as Tables<"parameter_reminders">[])

  const lastChangeByTank = new Map<string, string>()
  for (const row of (changesRes.data ?? []) as { tank_id: string; changed_at: string }[]) {
    if (!lastChangeByTank.has(row.tank_id)) lastChangeByTank.set(row.tank_id, row.changed_at)
  }

  return tanks.map((tank) => {
    const livestock = livestockByTank.get(tank.id) ?? []
    const lastTest = lastTestMap[tank.id] ?? null
    const reminders = buildReminders({
      tank,
      lastWaterChange: lastChangeByTank.get(tank.id) ?? null,
      lastTest,
      equipment: equipmentByTank.get(tank.id) ?? [],
      doseSchedules: schedulesByTank.get(tank.id) ?? [],
      parameterReminders: remindersByTank.get(tank.id) ?? [],
    })
    return {
      tank,
      bioload: bioloadSummary(tank, livestock),
      lastTest,
      reminders,
      actionable: actionableReminders(reminders),
    }
  })
}
