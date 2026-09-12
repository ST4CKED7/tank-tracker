"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { clearActiveTankIdCookie, writeActiveTankIdCookie } from "@/lib/active-tank"
import { createClient } from "@/lib/supabase/server"
import type { ParameterKey } from "@/lib/parameters"
import { toStoredLength, toStoredTemp, toStoredVolume, legacyUnitSystem, parseLengthUnit, parseTempUnit, parseVolumeUnit, unitPrefsFromTank, type UnitPrefs } from "@/lib/units"
import { resolveSpeciesImageUrl } from "@/lib/species-image"
import { parseSumpMedia } from "@/lib/sump-media"
import { parseTankType } from "@/lib/tank-profiles"
import { defaultTimeZone, listTimeZones } from "@/lib/timezones"
import { isKitId, normalizeFavoriteKits, toggleFavoriteKitList, DEFAULT_FAVORITE_KIT } from "@/lib/kits"
import { parseLivestockSex, type LivestockSex } from "@/lib/bioload"
import { parseTankIcon, parseTankIconColor } from "@/lib/tank-icons"
import { parseTankTheme } from "@/lib/tank-themes"
import { dashboardParameterKeys } from "@/lib/parameters"
import { parseParameterTargets, toStoredTargetRange } from "@/lib/parameter-targets"

async function tankPrefs(supabase: Awaited<ReturnType<typeof createClient>>, tankId: string): Promise<UnitPrefs> {
  const { data } = await supabase
    .from("tanks")
    .select("volume_unit, temp_unit, length_unit, unit_system")
    .eq("id", tankId)
    .maybeSingle()
  return unitPrefsFromTank(data)
}

async function requireUser() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims?.sub) redirect("/login")
  return { supabase, userId: data.claims.sub as string }
}

function revalidateAppPaths(...paths: string[]) {
  for (const path of paths) revalidatePath(path)
}

/** Tank identity / prefs changed — refresh shell consumers. */
function revalidateTankShell() {
  revalidateAppPaths("/", "/settings", "/livestock", "/tests", "/dosing", "/equipment", "/charts", "/cycle")
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  await clearActiveTankIdCookie()
  redirect("/login")
}

export async function setActiveTank(formData: FormData) {
  const { supabase, userId } = await requireUser()
  const tankId = String(formData.get("tank_id") || "")
  if (!tankId) return
  const { data } = await supabase.from("tanks").select("id").eq("id", tankId).eq("user_id", userId).maybeSingle()
  if (!data) return
  await writeActiveTankIdCookie(data.id)
  revalidateTankShell()
}

export async function deleteTank(formData: FormData) {
  const { supabase, userId } = await requireUser()
  const tankId = String(formData.get("tank_id") || "")
  if (!tankId) return

  const { data: owned } = await supabase.from("tanks").select("id").eq("id", tankId).eq("user_id", userId).maybeSingle()
  if (!owned) return

  // Child rows may not cascade depending on schema — clear tank-scoped data first.
  await Promise.all([
    supabase.from("livestock").delete().eq("tank_id", tankId),
    supabase.from("test_logs").delete().eq("tank_id", tankId),
    supabase.from("water_changes").delete().eq("tank_id", tankId),
    supabase.from("dose_logs").delete().eq("tank_id", tankId),
    supabase.from("equipment").delete().eq("tank_id", tankId),
  ])

  const { error } = await supabase.from("tanks").delete().eq("id", tankId).eq("user_id", userId)
  if (error) throw error

  const { data: remaining } = await supabase
    .from("tanks")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
  if (remaining?.[0]?.id) await writeActiveTankIdCookie(remaining[0].id)
  else await clearActiveTankIdCookie()

  revalidateTankShell()
  redirect("/settings")
}

export async function upsertTank(formData: FormData) {
  const { supabase, userId } = await requireUser()
  const id = String(formData.get("id") || "")
  const waterType = String(formData.get("water_type") || "saltwater") === "freshwater" ? "freshwater" : "saltwater"
  const tankType = parseTankType(formData.get("tank_type"), waterType)
  const hasSump = String(formData.get("has_sump") || "") === "true"
  const sumpGallonsRaw = Number(formData.get("sump_volume") || 0)
  const sumpMedia = hasSump ? parseSumpMedia(formData.getAll("sump_media")) : []
  const rawTimezone = String(formData.get("timezone") || defaultTimeZone())
  const known = listTimeZones()
  const timezone =
    known.includes(rawTimezone) || rawTimezone === "UTC" || /^[A-Za-z_]+(?:\/[A-Za-z0-9_+\-]+)+$/.test(rawTimezone)
      ? rawTimezone
      : defaultTimeZone()

  let prefs = unitPrefsFromTank(null)
  if (id) {
    const { data: existing } = await supabase
      .from("tanks")
      .select("volume_unit, temp_unit, length_unit, unit_system")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle()
    prefs = unitPrefsFromTank(existing)
  }
  // Allow create/edit forms to override volume unit for the volume fields only.
  if (formData.has("volume_unit")) prefs = { ...prefs, volume: parseVolumeUnit(formData.get("volume_unit")) }

  const payload = {
    user_id: userId,
    name: String(formData.get("name") || "Display tank"),
    gallons: toStoredVolume(Number(formData.get("volume")), prefs.volume),
    water_type: waterType as "saltwater" | "freshwater",
    tank_type: tankType,
    has_sump: hasSump,
    sump_gallons: hasSump ? toStoredVolume(Number.isFinite(sumpGallonsRaw) ? sumpGallonsRaw : 0, prefs.volume) : 0,
    sump_media: sumpMedia,
    water_change_percent: Number(formData.get("water_change_percent") || 10),
    water_change_interval_days: Number(formData.get("water_change_interval_days") || 7),
    timezone,
    volume_unit: prefs.volume,
    temp_unit: prefs.temp,
    length_unit: prefs.length,
    unit_system: legacyUnitSystem(prefs),
    icon: parseTankIcon(formData.get("icon")),
    icon_color: parseTankIconColor(formData.get("icon_color")),
    color_theme: parseTankTheme(formData.get("color_theme")),
  }
  if (id) {
    const { error } = await supabase.from("tanks").update(payload).eq("id", id).eq("user_id", userId)
    if (error) throw error
    await writeActiveTankIdCookie(id)
  } else {
    const { data, error } = await supabase.from("tanks").insert(payload).select("id").single()
    if (error) throw error
    if (data?.id) await writeActiveTankIdCookie(data.id)
  }
  revalidateTankShell()
}

export async function toggleFavoriteTestKit(formData: FormData) {
  const { supabase, userId } = await requireUser()
  const tankId = String(formData.get("tank_id") || "")
  const kit = String(formData.get("kit") || "")
  const waterType = String(formData.get("water_type") || "saltwater") === "freshwater" ? "freshwater" : "saltwater"
  if (!tankId || !isKitId(kit)) return

  const { data: tank } = await supabase
    .from("tanks")
    .select("favorite_test_kits, default_test_kit")
    .eq("id", tankId)
    .eq("user_id", userId)
    .maybeSingle()
  if (!tank) return

  const current = normalizeFavoriteKits(
    tank.favorite_test_kits != null
      ? tank.favorite_test_kits
      : [tank.default_test_kit, DEFAULT_FAVORITE_KIT],
    waterType,
  )
  const next = toggleFavoriteKitList(current, kit, waterType)

  const { error } = await supabase
    .from("tanks")
    .update({
      favorite_test_kits: next,
      default_test_kit: next[0] ?? null,
    })
    .eq("id", tankId)
    .eq("user_id", userId)
  if (error) throw error
  revalidatePath("/tests")
  revalidateTankShell()
}

/** @deprecated Prefer toggleFavoriteTestKit */
export async function setDefaultTestKit(formData: FormData) {
  return toggleFavoriteTestKit(formData)
}

export async function updateUnitPrefs(formData: FormData) {
  const { supabase, userId } = await requireUser()
  const tankId = String(formData.get("tank_id") || "")
  if (!tankId) return
  const prefs: UnitPrefs = {
    volume: parseVolumeUnit(formData.get("volume_unit")),
    temp: parseTempUnit(formData.get("temp_unit")),
    length: parseLengthUnit(formData.get("length_unit")),
  }
  const { error } = await supabase
    .from("tanks")
    .update({
      volume_unit: prefs.volume,
      temp_unit: prefs.temp,
      length_unit: prefs.length,
      unit_system: legacyUnitSystem(prefs),
    })
    .eq("id", tankId)
    .eq("user_id", userId)
  if (error) throw error
  revalidateTankShell()
}

export async function updateParameterTargets(formData: FormData) {
  const { supabase, userId } = await requireUser()
  const tankId = String(formData.get("tank_id") || "")
  if (!tankId) return

  const prefs = await tankPrefs(supabase, tankId)
  const { data: tank } = await supabase
    .from("tanks")
    .select("water_type")
    .eq("id", tankId)
    .eq("user_id", userId)
    .maybeSingle()
  if (!tank) return

  const waterType = tank.water_type === "freshwater" ? "freshwater" : "saltwater"
  const reset = String(formData.get("reset") || "") === "1"

  if (reset) {
    const { error } = await supabase
      .from("tanks")
      .update({ parameter_targets: {} })
      .eq("id", tankId)
      .eq("user_id", userId)
    if (error) throw error
    revalidateAppPaths("/", "/tests", "/charts", "/dosing")
    return
  }

  const next: Record<string, { min: number; max: number }> = {}
  for (const key of dashboardParameterKeys(waterType)) {
    const minRaw = formData.get(`${key}_min`)
    const maxRaw = formData.get(`${key}_max`)
    if (minRaw == null || maxRaw == null || String(minRaw) === "" || String(maxRaw) === "") continue
    const minDisplay = Number(minRaw)
    const maxDisplay = Number(maxRaw)
    if (!Number.isFinite(minDisplay) || !Number.isFinite(maxDisplay)) continue
    next[key] = toStoredTargetRange(key, minDisplay, maxDisplay, prefs)
  }

  const { error } = await supabase
    .from("tanks")
    .update({ parameter_targets: parseParameterTargets(next) })
    .eq("id", tankId)
    .eq("user_id", userId)
  if (error) throw error
  revalidateAppPaths("/", "/tests", "/charts", "/dosing")
}

export async function logTest(formData: FormData) {
  const { supabase, userId } = await requireUser()
  const tankId = String(formData.get("tank_id"))
  const parameter = String(formData.get("parameter")) as ParameterKey
  let value = Number(formData.get("value"))
  let unit = String(formData.get("unit") || "")
  if (parameter === "temperature") {
    const rawTempUnit = String(formData.get("temp_unit") || "")
    const tempUnit =
      rawTempUnit === "C" || rawTempUnit === "F"
        ? rawTempUnit
        : (await tankPrefs(supabase, tankId)).temp
    value = toStoredTemp(value, tempUnit)
    unit = "°F"
  }
  const { error } = await supabase.from("test_logs").insert({
    user_id: userId,
    tank_id: tankId,
    parameter,
    value,
    unit,
    source_kit: String(formData.get("source_kit") || "other"),
    notes: String(formData.get("notes") || "") || null,
    tested_at: String(formData.get("tested_at") || new Date().toISOString()),
  })
  if (error) throw error
  // Only refresh pages that show readings immediately — avoid a multi-route cascade on every save.
  revalidatePath("/tests")
  revalidatePath("/")
}

export async function logWaterChange(formData: FormData) {
  const { supabase, userId } = await requireUser()
  const tankId = String(formData.get("tank_id"))
  const prefs = await tankPrefs(supabase, tankId)
  const { error } = await supabase.from("water_changes").insert({
    user_id: userId,
    tank_id: tankId,
    percent: Number(formData.get("percent")),
    gallons: toStoredVolume(Number(formData.get("volume")), prefs.volume),
    notes: String(formData.get("notes") || "") || null,
    changed_at: String(formData.get("changed_at") || new Date().toISOString()),
  })
  if (error) throw error
  revalidateAppPaths("/", "/tests", "/charts")
}

export async function cacheSpeciesImage(speciesId: string, imageUrl: string) {
  const { supabase } = await requireUser()
  await supabase.rpc("set_species_image", { p_id: speciesId, p_url: imageUrl })
}

function prefsFromForm(formData: FormData): UnitPrefs {
  return {
    volume: parseVolumeUnit(formData.get("volume_unit")),
    temp: parseTempUnit(formData.get("temp_unit")),
    length: parseLengthUnit(formData.get("length_unit")),
  }
}

export async function addLivestock(formData: FormData) {
  const { supabase, userId } = await requireUser()
  const rawSize = String(formData.get("coral_size") || "")
  const coralSize =
    rawSize === "frag" || rawSize === "small" || rawSize === "colony" ? rawSize : null
  const prefs = prefsFromForm(formData)
  const lengthRaw = formData.get("current_length")
  const currentLength =
    lengthRaw != null && String(lengthRaw) !== ""
      ? toStoredLength(Number(lengthRaw), prefs.length)
      : null
  const { error } = await supabase.from("livestock").insert({
    user_id: userId,
    tank_id: String(formData.get("tank_id")),
    species_id: String(formData.get("species_id")),
    nickname: String(formData.get("nickname") || "") || null,
    quantity: Number(formData.get("quantity") || 1),
    coral_size: coralSize,
    current_length_inches: currentLength,
    sex: parseLivestockSex(formData.get("sex")),
    added_on: String(formData.get("added_on") || new Date().toISOString().slice(0, 10)),
  })
  if (error) throw error
  revalidateAppPaths("/", "/livestock")
}

export async function updateLivestock(formData: FormData) {
  const { supabase } = await requireUser()
  const prefs = prefsFromForm(formData)
  const rawSize = String(formData.get("coral_size") || "")
  const coralSize =
    rawSize === "frag" || rawSize === "small" || rawSize === "colony" ? rawSize : null
  const lengthRaw = formData.get("current_length")
  const payload: {
    quantity?: number
    coral_size?: "frag" | "small" | "colony" | null
    current_length_inches?: number | null
    nickname?: string | null
    sex?: LivestockSex
  } = {}
  if (formData.has("quantity")) payload.quantity = Number(formData.get("quantity") || 1)
  if (formData.has("coral_size")) payload.coral_size = coralSize
  if (formData.has("current_length")) {
    payload.current_length_inches =
      lengthRaw != null && String(lengthRaw) !== ""
        ? toStoredLength(Number(lengthRaw), prefs.length)
        : null
  }
  if (formData.has("nickname")) {
    payload.nickname = String(formData.get("nickname") || "") || null
  }
  if (formData.has("sex")) {
    payload.sex = parseLivestockSex(formData.get("sex"))
  }
  const { error } = await supabase.from("livestock").update(payload).eq("id", String(formData.get("id")))
  if (error) throw error
  revalidateAppPaths("/", "/livestock")
}

export async function removeLivestock(formData: FormData) {
  const { supabase } = await requireUser()
  const { error } = await supabase.from("livestock").delete().eq("id", String(formData.get("id")))
  if (error) throw error
  revalidateAppPaths("/", "/livestock")
}

export async function addCustomSpecies(formData: FormData) {
  const { supabase, userId } = await requireUser()
  const kind = String(formData.get("kind") || "fish") as "fish" | "coral" | "invert" | "plant"
  const waterType = String(formData.get("water_type") || "saltwater") === "freshwater" ? "freshwater" : "saltwater"
  const prefs = prefsFromForm(formData)
  const minVolume = Number(formData.get("min_volume") || 0)
  const adultLength = Number(formData.get("adult_length") || 0)
  const commonName = String(formData.get("common_name"))
  const scientificName = String(formData.get("scientific_name") || "") || null
  const imageUrl = await resolveSpeciesImageUrl({ commonName, scientificName })
  const fw = waterType === "freshwater"
  const resolvedKind = fw && kind === "coral" ? "fish" : !fw && kind === "plant" ? "invert" : kind
  const { error } = await supabase.from("species_catalog").insert({
    owner_id: userId,
    slug: null,
    common_name: commonName,
    scientific_name: scientificName,
    image_url: imageUrl,
    kind: resolvedKind,
    water_type: waterType,
    min_tank_gallons: minVolume ? toStoredVolume(minVolume, prefs.volume) : null,
    adult_length_inches: adultLength && resolvedKind === "fish" ? toStoredLength(adultLength, prefs.length) : null,
    bioload_factor: Number(formData.get("bioload_factor") || (resolvedKind === "fish" ? 1 : 0)),
    invert_points: Number(formData.get("invert_points") || (resolvedKind === "invert" ? 1 : 0)),
    temperament: (String(formData.get("temperament") || "peaceful") || null) as "peaceful" | "semi_aggressive" | "aggressive" | null,
    reef_safe: String(formData.get("reef_safe") || "yes") as "yes" | "caution" | "no",
    diet: String(formData.get("diet") || "") || null,
    lighting: String(formData.get("lighting") || "") || null,
    flow: String(formData.get("flow") || "") || null,
    aggression_tags: String(formData.get("aggression_tags") || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    temp_min: fw ? 72 : 75,
    temp_max: fw ? 82 : 82,
    salinity_min: fw ? null : 34,
    salinity_max: fw ? null : 36,
    ph_min: fw ? 6.5 : 8.1,
    ph_max: fw ? 7.8 : 8.4,
    alk_min: fw ? 3 : 7.5,
    alk_max: fw ? 8 : 11,
    ca_min: fw ? null : 380,
    ca_max: fw ? null : 450,
    no3_min: 0,
    no3_max: Number(formData.get("no3_max") || (fw ? 40 : 20)),
    po4_min: 0,
    po4_max: Number(formData.get("po4_max") || (fw ? 1 : 0.1)),
    notes: String(formData.get("notes") || "") || null,
  })
  if (error) throw error
  revalidateAppPaths("/livestock")
}

export async function logDose(formData: FormData) {
  const { supabase, userId } = await requireUser()
  const { error } = await supabase.from("dose_logs").insert({
    user_id: userId,
    tank_id: String(formData.get("tank_id")),
    product: String(formData.get("product")),
    amount: Number(formData.get("amount")),
    unit: String(formData.get("unit") || "ml"),
    target_parameter: String(formData.get("target_parameter") || "") || null,
    dosed_at: String(formData.get("dosed_at") || new Date().toISOString()),
  })
  if (error) throw error
  revalidateAppPaths("/dosing")
}

export async function upsertEquipment(formData: FormData) {
  const { supabase, userId } = await requireUser()
  const id = String(formData.get("id") || "")
  const payload = {
    user_id: userId,
    tank_id: String(formData.get("tank_id")),
    name: String(formData.get("name")),
    equipment_type: String(formData.get("equipment_type") || "other"),
    installed_at: String(formData.get("installed_at") || "") || null,
    service_every_days: Number(formData.get("service_every_days") || 30),
    last_serviced_at: String(formData.get("last_serviced_at") || "") || null,
    notes: String(formData.get("notes") || "") || null,
  }
  if (id) {
    const { error } = await supabase.from("equipment").update(payload).eq("id", id)
    if (error) throw error
  } else {
    const { error } = await supabase.from("equipment").insert(payload)
    if (error) throw error
  }
  revalidateAppPaths("/", "/equipment")
}

export async function serviceEquipment(formData: FormData) {
  const { supabase } = await requireUser()
  const { error } = await supabase
    .from("equipment")
    .update({ last_serviced_at: new Date().toISOString().slice(0, 10) })
    .eq("id", String(formData.get("id")))
  if (error) throw error
  revalidateAppPaths("/", "/equipment")
}

export async function deleteEquipment(formData: FormData) {
  const { supabase } = await requireUser()
  const { error } = await supabase.from("equipment").delete().eq("id", String(formData.get("id")))
  if (error) throw error
  revalidateAppPaths("/", "/equipment")
}
