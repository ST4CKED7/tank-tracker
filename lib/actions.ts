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
import { parseLivestockSex, type LivestockRow, type LivestockSex } from "@/lib/bioload"
import { parseTankIcon, parseTankIconColor } from "@/lib/tank-icons"
import { parseTankTheme } from "@/lib/tank-themes"
import { dashboardParameterKeys } from "@/lib/parameters"
import {
  defaultParameterTarget,
  normalizeStoredTemperatureTarget,
  parseParameterTargets,
  tankParameterTargets,
  targetsNearlyEqual,
  toStoredTargetRange,
} from "@/lib/parameter-targets"

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
  revalidateAppPaths("/", "/tanks", "/settings", "/livestock", "/tests", "/dosing", "/equipment", "/charts", "/cycle", "/photos")
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
    supabase.from("dose_schedules").delete().eq("tank_id", tankId),
    supabase.from("tank_photos").delete().eq("tank_id", tankId),
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
    .select("id, water_type, parameter_targets")
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

  const { data: livestockRows } = await supabase
    .from("livestock")
    .select("*, species:species_catalog(*)")
    .eq("tank_id", tankId)
    .eq("user_id", userId)

  const livestock = (livestockRows ?? [])
    .map((row) => {
      const species = Array.isArray(row.species) ? row.species[0] : row.species
      return species ? ({ ...row, species } as LivestockRow) : null
    })
    .filter((row): row is LivestockRow => row !== null)

  const existing = tankParameterTargets(tank)
  const dashboardKeys = new Set(dashboardParameterKeys(waterType))
  const next: Record<string, { min: number; max: number }> = {}

  // Keep custom overrides for parameters not on this form (e.g. reef-only keys on mixed data).
  for (const [key, range] of Object.entries(existing)) {
    if (!dashboardKeys.has(key as ParameterKey)) next[key] = range
  }

  for (const key of dashboardParameterKeys(waterType)) {
    const minRaw = formData.get(`${key}_min`)
    const maxRaw = formData.get(`${key}_max`)
    if (minRaw == null || maxRaw == null || String(minRaw) === "" || String(maxRaw) === "") continue
    const minDisplay = Number(minRaw)
    const maxDisplay = Number(maxRaw)
    if (!Number.isFinite(minDisplay) || !Number.isFinite(maxDisplay)) continue
    const submittedRaw = toStoredTargetRange(key, minDisplay, maxDisplay, prefs)
    const submitted =
      key === "temperature" ? normalizeStoredTemperatureTarget(submittedRaw) : submittedRaw
    const fallback = defaultParameterTarget({
      key,
      tank,
      livestock,
      prefs,
    })
    // Only store true overrides — unchanged fields stay livestock/typical.
    if (!fallback || !targetsNearlyEqual(submitted, fallback)) {
      next[key] = submitted
    }
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
  const imageUrl = await resolveSpeciesImageUrl({ commonName, scientificName, kind })
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
  revalidateAppPaths("/dosing", "/")
}

export async function upsertDoseSchedule(formData: FormData) {
  const { supabase, userId } = await requireUser()
  const id = String(formData.get("id") || "")
  const payload = {
    user_id: userId,
    tank_id: String(formData.get("tank_id")),
    product: String(formData.get("product")),
    amount: Number(formData.get("amount")),
    unit: String(formData.get("unit") || "ml"),
    target_parameter: String(formData.get("target_parameter") || "") || null,
    every_days: Math.max(1, Number(formData.get("every_days") || 1)),
    last_dosed_at: String(formData.get("last_dosed_at") || "") || null,
    starts_at: String(formData.get("starts_at") || "") || null,
    notes: String(formData.get("notes") || "") || null,
  }
  if (id) {
    const { error } = await supabase.from("dose_schedules").update(payload).eq("id", id)
    if (error) throw error
  } else {
    const { error } = await supabase.from("dose_schedules").insert(payload)
    if (error) throw error
  }
  revalidateAppPaths("/", "/dosing")
}

export async function completeDoseSchedule(formData: FormData) {
  const { supabase, userId } = await requireUser()
  const id = String(formData.get("id") || "")
  if (!id) return

  const { data: schedule } = await supabase
    .from("dose_schedules")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle()
  if (!schedule) return

  const today = new Date().toISOString().slice(0, 10)
  const [{ error: logError }, { error: updateError }] = await Promise.all([
    supabase.from("dose_logs").insert({
      user_id: userId,
      tank_id: schedule.tank_id,
      product: schedule.product,
      amount: Number(schedule.amount),
      unit: schedule.unit,
      target_parameter: schedule.target_parameter,
      dosed_at: new Date().toISOString(),
    }),
    supabase.from("dose_schedules").update({ last_dosed_at: today }).eq("id", id),
  ])
  if (logError) throw logError
  if (updateError) throw updateError
  revalidateAppPaths("/", "/dosing")
}

export async function deleteDoseSchedule(formData: FormData) {
  const { supabase } = await requireUser()
  const { error } = await supabase.from("dose_schedules").delete().eq("id", String(formData.get("id")))
  if (error) throw error
  revalidateAppPaths("/", "/dosing")
}

export async function uploadTankPhoto(formData: FormData) {
  const { supabase, userId } = await requireUser()
  const tankId = String(formData.get("tank_id") || "")
  const caption = String(formData.get("caption") || "").trim() || null
  const takenAtRaw = String(formData.get("taken_at") || "")
  const raw = formData.get("photo")
  if (!tankId || !(raw instanceof Blob) || raw.size === 0) {
    return { ok: false as const, error: "Choose a photo first." }
  }
  if (raw.size > 7_500_000) {
    return { ok: false as const, error: "Photo is too large. Try again — we’ll compress camera shots automatically." }
  }

  const { data: owned } = await supabase.from("tanks").select("id").eq("id", tankId).eq("user_id", userId).maybeSingle()
  if (!owned) {
    return { ok: false as const, error: "Tank not found." }
  }

  const originalName = raw instanceof File && raw.name ? raw.name : "tank-photo.jpg"
  const mime = raw.type || "image/jpeg"
  const ext =
    mime === "image/png"
      ? "png"
      : mime === "image/webp"
        ? "webp"
        : (originalName.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg"
  const path = `${userId}/${tankId}/${crypto.randomUUID()}.${ext === "jpeg" ? "jpg" : ext}`

  const { error: uploadError } = await supabase.storage.from("tank-photos").upload(path, raw, {
    contentType: mime,
    upsert: false,
  })
  if (uploadError) {
    return { ok: false as const, error: uploadError.message || "Upload failed." }
  }

  const { data: publicData } = supabase.storage.from("tank-photos").getPublicUrl(path)
  const taken_at = takenAtRaw ? new Date(takenAtRaw).toISOString() : new Date().toISOString()

  const { error } = await supabase.from("tank_photos").insert({
    user_id: userId,
    tank_id: tankId,
    storage_path: path,
    public_url: publicData.publicUrl,
    caption,
    taken_at,
  })
  if (error) {
    await supabase.storage.from("tank-photos").remove([path])
    return { ok: false as const, error: error.message || "Could not save photo." }
  }

  revalidateAppPaths("/photos", "/")
  return { ok: true as const }
}

function tankIconStoragePath(userId: string, tankId: string) {
  return `${userId}/${tankId}/icon.jpg`
}

async function writeTankIconPhoto(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  tankId: string,
  blob: Blob,
) {
  const path = tankIconStoragePath(userId, tankId)
  const mime = blob.type || "image/jpeg"
  const { error: uploadError } = await supabase.storage.from("tank-photos").upload(path, blob, {
    contentType: mime,
    upsert: true,
  })
  if (uploadError) return { ok: false as const, error: uploadError.message || "Upload failed." }

  const { data: publicData } = supabase.storage.from("tank-photos").getPublicUrl(path)
  // Cache-bust so the switcher updates after replacing the same storage path.
  const publicUrl = `${publicData.publicUrl}?v=${Date.now()}`
  const { error } = await supabase
    .from("tanks")
    .update({ icon_photo_url: publicUrl })
    .eq("id", tankId)
    .eq("user_id", userId)
  if (error) return { ok: false as const, error: error.message || "Could not save icon." }

  revalidateTankShell()
  return { ok: true as const, url: publicUrl }
}

export async function setTankIconPhoto(formData: FormData) {
  const { supabase, userId } = await requireUser()
  const tankId = String(formData.get("tank_id") || "")
  const raw = formData.get("photo")
  if (!tankId || !(raw instanceof Blob) || raw.size === 0) {
    return { ok: false as const, error: "Choose a photo first." }
  }
  if (raw.size > 7_500_000) {
    return { ok: false as const, error: "Photo is too large. Try a smaller shot." }
  }

  const { data: owned } = await supabase.from("tanks").select("id").eq("id", tankId).eq("user_id", userId).maybeSingle()
  if (!owned) return { ok: false as const, error: "Tank not found." }

  return writeTankIconPhoto(supabase, userId, tankId, raw)
}

export async function setTankIconFromPhoto(formData: FormData) {
  const { supabase, userId } = await requireUser()
  const tankId = String(formData.get("tank_id") || "")
  const photoId = String(formData.get("photo_id") || "")
  if (!tankId || !photoId) return { ok: false as const, error: "Missing photo." }

  const { data: photo } = await supabase
    .from("tank_photos")
    .select("id, storage_path, tank_id")
    .eq("id", photoId)
    .eq("user_id", userId)
    .maybeSingle()
  if (!photo || photo.tank_id !== tankId) {
    return { ok: false as const, error: "Photo not found." }
  }

  const { data: file, error: downloadError } = await supabase.storage.from("tank-photos").download(photo.storage_path)
  if (downloadError || !file) {
    return { ok: false as const, error: downloadError?.message || "Could not read photo." }
  }

  return writeTankIconPhoto(supabase, userId, tankId, file)
}

export async function clearTankIconPhoto(formData: FormData) {
  const { supabase, userId } = await requireUser()
  const tankId = String(formData.get("tank_id") || "")
  if (!tankId) return { ok: false as const, error: "Tank not found." }

  const { data: owned } = await supabase.from("tanks").select("id").eq("id", tankId).eq("user_id", userId).maybeSingle()
  if (!owned) return { ok: false as const, error: "Tank not found." }

  await supabase.storage.from("tank-photos").remove([tankIconStoragePath(userId, tankId)])
  const { error } = await supabase
    .from("tanks")
    .update({ icon_photo_url: null })
    .eq("id", tankId)
    .eq("user_id", userId)
  if (error) return { ok: false as const, error: error.message || "Could not clear icon." }

  revalidateTankShell()
  return { ok: true as const }
}

export async function deleteTankPhoto(formData: FormData) {
  const { supabase, userId } = await requireUser()
  const id = String(formData.get("id") || "")
  if (!id) return

  const { data: photo } = await supabase
    .from("tank_photos")
    .select("id, storage_path")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle()
  if (!photo) return

  await supabase.storage.from("tank-photos").remove([photo.storage_path])
  const { error } = await supabase.from("tank_photos").delete().eq("id", id)
  if (error) throw error

  // If this photo was used as the tank icon URL (legacy / non-copied), clear it.
  await supabase
    .from("tanks")
    .update({ icon_photo_url: null })
    .eq("user_id", userId)
    .like("icon_photo_url", `%${photo.storage_path}%`)

  revalidateAppPaths("/photos", "/")
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

/** Inline-edit a photo caption from the timeline. */
export async function updateTankPhotoCaption(formData: FormData) {
  const { supabase, userId } = await requireUser()
  const id = String(formData.get("id") || "")
  const caption = String(formData.get("caption") || "").trim() || null
  if (!id) return { ok: false as const, error: "Missing photo." }
  const { error } = await supabase
    .from("tank_photos")
    .update({ caption })
    .eq("id", id)
    .eq("user_id", userId)
  if (error) return { ok: false as const, error: error.message || "Could not save caption." }
  revalidateAppPaths("/photos", "/")
  return { ok: true as const }
}

/** Turn on / adjust a per-parameter test reminder (e.g. test alkalinity every 3 days). */
export async function upsertParameterReminder(formData: FormData) {
  const { supabase, userId } = await requireUser()
  const tankId = String(formData.get("tank_id") || "")
  const parameter = String(formData.get("parameter") || "")
  const everyDays = Math.max(1, Number(formData.get("every_days") || 7))
  if (!tankId || !parameter) return
  const { error } = await supabase
    .from("parameter_reminders")
    .upsert(
      { user_id: userId, tank_id: tankId, parameter, every_days: everyDays },
      { onConflict: "tank_id,parameter" },
    )
  if (error) throw error
  revalidateAppPaths("/", "/tests")
}

/** Turn off a per-parameter test reminder. */
export async function deleteParameterReminder(formData: FormData) {
  const { supabase, userId } = await requireUser()
  const tankId = String(formData.get("tank_id") || "")
  const parameter = String(formData.get("parameter") || "")
  if (!tankId || !parameter) return
  const { error } = await supabase
    .from("parameter_reminders")
    .delete()
    .eq("user_id", userId)
    .eq("tank_id", tankId)
    .eq("parameter", parameter)
  if (error) throw error
  revalidateAppPaths("/", "/tests")
}

/** Create (or rotate) a read-only public share link for a tank. */
export async function enableTankShare(formData: FormData) {
  const { supabase, userId } = await requireUser()
  const tankId = String(formData.get("tank_id") || "")
  if (!tankId) return

  const { data: owned } = await supabase
    .from("tanks")
    .select("id")
    .eq("id", tankId)
    .eq("user_id", userId)
    .maybeSingle()
  if (!owned) return

  const token = crypto.randomUUID().replace(/-/g, "")
  const { error } = await supabase
    .from("tank_shares")
    .upsert(
      { tank_id: tankId, user_id: userId, token },
      { onConflict: "tank_id" },
    )
  if (error) throw error

  revalidateAppPaths("/settings")
}

/** Turn off public sharing for a tank (invalidates the existing link). */
export async function disableTankShare(formData: FormData) {
  const { supabase, userId } = await requireUser()
  const tankId = String(formData.get("tank_id") || "")
  if (!tankId) return
  const { error } = await supabase
    .from("tank_shares")
    .delete()
    .eq("user_id", userId)
    .eq("tank_id", tankId)
  if (error) throw error
  revalidateAppPaths("/settings")
}
