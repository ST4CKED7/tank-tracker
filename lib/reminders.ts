import { addDays, differenceInCalendarDays, parseISO } from "date-fns"
import type { Tank } from "@/lib/bioload"
import type { Tables } from "@/lib/database.types"
import { parameterMeta, type ParameterKey } from "@/lib/parameters"
import { saltMixForGallons, waterChangeVolumeGallons } from "@/lib/salt-mix"
import { formatVolume, unitPrefsFromTank } from "@/lib/units"

export type ReminderKind = "water_change" | "test" | "equipment" | "dose"

export type Reminder = {
  id: string
  title: string
  detail: string
  due: Date
  overdue: boolean
  /** Due today or within the next N days (and not overdue). */
  soon: boolean
  kind: ReminderKind
  href: string
}

const SOON_DAYS = 2

export function buildReminders(input: {
  tank: Tank
  lastWaterChange?: string | null
  lastTest?: string | null
  equipment: Tables<"equipment">[]
  doseSchedules?: Tables<"dose_schedules">[]
  /** Per-parameter reminders configured by the user. */
  parameterReminders?: Tables<"parameter_reminders">[]
  /** Latest tested_at per parameter, used to schedule per-parameter reminders. */
  lastTestByParameter?: Partial<Record<string, string>>
  now?: Date
}): Reminder[] {
  const now = input.now ?? new Date()
  const reminders: Reminder[] = []
  const prefs = unitPrefsFromTank(input.tank)
  const paramReminders = input.parameterReminders ?? []
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
  reminders.push(makeReminder({
    id: "water-change",
    title: "Water change",
    detail: fw
      ? `${percent}% ≈ ${formatVolume(mixGallons, prefs)} of dechlorinated water`
      : `${percent}% ≈ ${formatVolume(mixGallons, prefs)} · ~${salt.cups} cups / ${salt.grams}g salt`,
    due: changeDue,
    now,
    kind: "water_change",
    href: "/#reminders",
  }))

  // Skip the catch-all weekly reminder once the user sets specific per-parameter reminders.
  if (paramReminders.length === 0) {
    const lastTest = input.lastTest ? parseISO(input.lastTest) : parseISO(input.tank.created_at)
    const testDue = addDays(lastTest, 7)
    reminders.push(makeReminder({
      id: "weekly-test",
      title: "Weekly water tests",
      detail: fw
        ? "Freshwater kit: pH, ammonia, nitrite, nitrate. Also log KH and temperature."
        : "Saltwater kit: pH, ammonia, nitrite, nitrate. Reef kit: calcium, alkalinity, phosphate, nitrate. Also log salinity and temperature.",
      due: testDue,
      now,
      kind: "test",
      href: "/tests",
    }))
  } else {
    const meta = parameterMeta(prefs, fw ? "freshwater" : "saltwater")
    for (const reminder of paramReminders) {
      const lastAt = input.lastTestByParameter?.[reminder.parameter]
      const from = lastAt ? parseISO(lastAt) : parseISO(input.tank.created_at)
      const due = addDays(from, reminder.every_days)
      const label = meta[reminder.parameter as ParameterKey]?.label ?? reminder.parameter
      reminders.push(makeReminder({
        id: `param-${reminder.parameter}`,
        title: `Test ${label}`,
        detail: `Every ${reminder.every_days} day${reminder.every_days === 1 ? "" : "s"}${
          lastAt ? "" : " · no reading logged yet"
        }`,
        due,
        now,
        kind: "test",
        href: "/tests",
      }))
    }
  }

  for (const item of input.equipment) {
    const last = item.last_serviced_at
      ? parseISO(item.last_serviced_at)
      : item.installed_at
        ? parseISO(item.installed_at)
        : parseISO(input.tank.created_at)
    const due = addDays(last, item.service_every_days)
    reminders.push(makeReminder({
      id: `eq-${item.id}`,
      title: `Service ${item.name}`,
      detail: `${item.equipment_type} · every ${item.service_every_days} days`,
      due,
      now,
      kind: "equipment",
      href: "/equipment",
    }))
  }

  for (const item of input.doseSchedules ?? []) {
    const last = item.last_dosed_at
      ? parseISO(item.last_dosed_at)
      : item.starts_at
        ? parseISO(item.starts_at)
        : parseISO(input.tank.created_at)
    const due = addDays(last, item.every_days)
    const targetBit = item.target_parameter ? ` · ${item.target_parameter}` : ""
    reminders.push(makeReminder({
      id: `dose-${item.id}`,
      title: `Dose ${item.product}`,
      detail: `${item.amount} ${item.unit}${targetBit} · every ${item.every_days} day${item.every_days === 1 ? "" : "s"}`,
      due,
      now,
      kind: "dose",
      href: "/dosing#schedules",
    }))
  }

  return reminders.sort((a, b) => {
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1
    if (a.soon !== b.soon) return a.soon ? -1 : 1
    return a.due.getTime() - b.due.getTime()
  })
}

function makeReminder(input: {
  id: string
  title: string
  detail: string
  due: Date
  now: Date
  kind: ReminderKind
  href: string
}): Reminder {
  const daysUntil = differenceInCalendarDays(input.due, input.now)
  const overdue = daysUntil <= 0
  const soon = !overdue && daysUntil <= SOON_DAYS
  return {
    id: input.id,
    title: input.title,
    detail: input.detail,
    due: input.due,
    overdue,
    soon,
    kind: input.kind,
    href: input.href,
  }
}

export function waterChangeGallons(tank: Tank, percent = tank.water_change_percent) {
  return waterChangeVolumeGallons(Number(tank.gallons), Number(percent))
}

export function actionableReminders(reminders: Reminder[]) {
  return reminders.filter((item) => item.overdue || item.soon)
}
