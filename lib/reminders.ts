import { addDays, differenceInCalendarDays, parseISO } from "date-fns"
import type { Tank } from "@/lib/bioload"
import type { Tables } from "@/lib/database.types"
import { saltMixForGallons, waterChangeVolumeGallons } from "@/lib/salt-mix"
import { formatVolume, unitPrefsFromTank } from "@/lib/units"

export type Reminder = {
  id: string
  title: string
  detail: string
  due: Date
  overdue: boolean
  kind: "water_change" | "test" | "equipment"
}

export function buildReminders(input: {
  tank: Tank
  lastWaterChange?: string | null
  lastTest?: string | null
  equipment: Tables<"equipment">[]
  now?: Date
}): Reminder[] {
  const now = input.now ?? new Date()
  const reminders: Reminder[] = []
  const prefs = unitPrefsFromTank(input.tank)
  const interval = Number(input.tank.water_change_interval_days) || 7
  const percent = Number(input.tank.water_change_percent) || 10
  const mixGallons = waterChangeVolumeGallons(Number(input.tank.gallons), percent)
  const salt = saltMixForGallons(mixGallons)
  const fw = input.tank.water_type === "freshwater"

  // No logged change yet → schedule from tank creation, not "due today".
  const lastChange = input.lastWaterChange
    ? parseISO(input.lastWaterChange)
    : parseISO(input.tank.created_at)
  const changeDue = addDays(lastChange, interval)
  reminders.push({
    id: "water-change",
    title: "Water change",
    detail: fw
      ? `${percent}% ≈ ${formatVolume(mixGallons, prefs)} of dechlorinated water`
      : `${percent}% ≈ ${formatVolume(mixGallons, prefs)} · ~${salt.cups} cups / ${salt.grams}g salt`,
    due: changeDue,
    overdue: differenceInCalendarDays(now, changeDue) >= 0,
    kind: "water_change",
  })

  const lastTest = input.lastTest ? parseISO(input.lastTest) : parseISO(input.tank.created_at)
  const testDue = addDays(lastTest, 7)
  reminders.push({
    id: "weekly-test",
    title: "Weekly water tests",
    detail: fw
      ? "Freshwater kit: pH, ammonia, nitrite, nitrate. Also log KH and temperature."
      : "Saltwater kit: pH, ammonia, nitrite, nitrate. Reef kit: calcium, alkalinity, phosphate, nitrate. Also log salinity and temperature.",
    due: testDue,
    overdue: differenceInCalendarDays(now, testDue) >= 0,
    kind: "test",
  })

  for (const item of input.equipment) {
    const last = item.last_serviced_at ? parseISO(item.last_serviced_at) : item.installed_at ? parseISO(item.installed_at) : parseISO(input.tank.created_at)
    const due = addDays(last, item.service_every_days)
    reminders.push({
      id: `eq-${item.id}`,
      title: `Service ${item.name}`,
      detail: `${item.equipment_type} · every ${item.service_every_days} days`,
      due,
      overdue: differenceInCalendarDays(now, due) >= 0,
      kind: "equipment",
    })
  }

  return reminders.sort((a, b) => a.due.getTime() - b.due.getTime())
}

export function waterChangeGallons(tank: Tank, percent = tank.water_change_percent) {
  return waterChangeVolumeGallons(Number(tank.gallons), Number(percent))
}
