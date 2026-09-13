"use client"

import { format, formatDistanceToNowStrict } from "date-fns"
import type { Reminder } from "@/lib/reminders"
import type { TestAdvice } from "@/lib/test-advice"

export type NotificationItem = {
  id: string
  title: string
  detail: string
  href: string
  tone: "urgent" | "soon" | "watch"
  meta: string
  kind: "water_change" | "test" | "equipment" | "chemistry"
}

export function buildNotificationItems(
  reminders: Reminder[],
  advice: TestAdvice[] = [],
): NotificationItem[] {
  const fromReminders: NotificationItem[] = reminders
    .filter((item) => item.overdue || item.soon)
    .map((item) => ({
      id: `rem-${item.id}`,
      title: item.title,
      detail: item.detail,
      href: item.href,
      tone: item.overdue ? "urgent" : "soon",
      meta: item.overdue
        ? "Due now"
        : `Due ${format(item.due, "MMM d")} · ${formatDistanceToNowStrict(item.due, { addSuffix: true })}`,
      kind: item.kind,
    }))

  const fromAdvice: NotificationItem[] = advice
    .filter((item) => item.severity === "urgent" || item.severity === "action" || item.severity === "watch")
    .slice(0, 4)
    .map((item) => ({
      id: `adv-${item.id}`,
      title: item.title,
      detail: item.detail,
      href: item.actions?.[0]?.href ?? "/tests",
      tone: item.severity === "watch" ? "watch" : "urgent",
      meta: item.severity === "urgent" ? "Needs attention" : item.severity === "action" ? "Action" : "Watch",
      kind: "chemistry" as const,
    }))

  return [...fromReminders, ...fromAdvice]
}
