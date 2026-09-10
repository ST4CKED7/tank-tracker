import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { LivestockRow, Tank } from "@/lib/bioload"
import type { ParameterKey } from "@/lib/parameters"
import { readActiveTankIdCookie, resolveActiveTank } from "@/lib/active-tank"

export async function getAuthedUserId() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims?.sub) redirect("/login")
  return { supabase, userId: data.claims.sub as string }
}

export async function getUserTanks() {
  const { supabase } = await getAuthedUserId()
  const { data } = await supabase.from("tanks").select("*").order("created_at", { ascending: true })
  return (data ?? []) as Tank[]
}

export async function getActiveTankContext() {
  const tanks = await getUserTanks()
  const preferredId = await readActiveTankIdCookie()
  const tank = resolveActiveTank(tanks, preferredId)
  return { tanks, tank }
}

export async function getDashboardData() {
  const { supabase } = await getAuthedUserId()
  const { tanks, tank } = await getActiveTankContext()
  if (!tank) {
    return {
      tank: null,
      tanks,
      livestock: [] as LivestockRow[],
      tests: [],
      waterChanges: [],
      doses: [],
      equipment: [],
      catalog: [],
      latest: {} as Partial<Record<ParameterKey, number>>,
    }
  }

  const [livestockRes, testsRes, changesRes, dosesRes, equipmentRes, catalogRes] = await Promise.all([
    supabase
      .from("livestock")
      .select("*, species:species_catalog(*)")
      .eq("tank_id", tank.id)
      .order("added_on", { ascending: false }),
    supabase.from("test_logs").select("*").eq("tank_id", tank.id).order("tested_at", { ascending: false }).limit(400),
    supabase
      .from("water_changes")
      .select("*")
      .eq("tank_id", tank.id)
      .order("changed_at", { ascending: false })
      .limit(100),
    supabase.from("dose_logs").select("*").eq("tank_id", tank.id).order("dosed_at", { ascending: false }).limit(100),
    supabase.from("equipment").select("*").eq("tank_id", tank.id).order("name"),
    supabase
      .from("species_catalog")
      .select("*")
      .eq("water_type", tank.water_type ?? "saltwater")
      .order("common_name"),
  ])

  const livestock = (livestockRes.data ?? [])
    .map((row) => {
      const record = row as unknown as LivestockRow & { species: LivestockRow["species"] | LivestockRow["species"][] }
      const species = Array.isArray(record.species) ? record.species[0] : record.species
      return species ? { ...record, species } : null
    })
    .filter((row): row is LivestockRow => row !== null)
  const tests = testsRes.data ?? []
  const latest: Partial<Record<ParameterKey, number>> = {}
  for (const test of tests) {
    const key = test.parameter as ParameterKey
    if (latest[key] == null) latest[key] = Number(test.value)
  }

  return {
    tank,
    tanks,
    livestock,
    tests,
    waterChanges: changesRes.data ?? [],
    doses: dosesRes.data ?? [],
    equipment: equipmentRes.data ?? [],
    catalog: catalogRes.data ?? [],
    latest,
  }
}
