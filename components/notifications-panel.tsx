"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { format, formatDistanceToNowStrict } from "date-fns"
import type { Reminder } from "@/lib/reminders"
import type { TestAdvice } from "@/lib/test-advice"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { Bell, Droplets, FlaskConical, Wrench } from "lucide-react"

const ALERTS_PREF_KEY = "tt-browser-alerts"

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

function KindIcon({ kind }: { kind: NotificationItem["kind"] }) {
  if (kind === "equipment") return <Wrench className="size-4 shrink-0" />
  if (kind === "water_change") return <Droplets className="size-4 shrink-0" />
  return <FlaskConical className="size-4 shrink-0" />
}

function readAlertsPref(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(ALERTS_PREF_KEY) === "1"
}

export function NotificationsPanel({
  reminders,
  advice = [],
}: {
  reminders: Reminder[]
  advice?: TestAdvice[]
}) {
  const items = buildNotificationItems(reminders, advice)
  const urgentCount = items.filter((item) => item.tone === "urgent").length
  const [alertsOn, setAlertsOn] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const permission =
      typeof Notification === "undefined" ? "denied" : Notification.permission
    const pref = readAlertsPref()
    setPermissionDenied(permission === "denied")
    setAlertsOn(pref && permission === "granted")
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated || !alertsOn) return
    if (typeof window === "undefined" || Notification.permission !== "granted") return
    const overdue = reminders.filter((item) => item.overdue)
    if (overdue.length === 0) return
    const key = `tt-notified-${overdue.map((item) => item.id).join(",")}`
    if (sessionStorage.getItem(key)) return
    new Notification("Tank Tracker", {
      body: overdue.map((item) => item.title).join(", "),
    })
    sessionStorage.setItem(key, "1")
  }, [reminders, alertsOn, hydrated])

  async function setBrowserAlerts(next: boolean) {
    if (!next) {
      localStorage.setItem(ALERTS_PREF_KEY, "0")
      setAlertsOn(false)
      return
    }

    if (typeof Notification === "undefined") {
      setPermissionDenied(true)
      setAlertsOn(false)
      localStorage.setItem(ALERTS_PREF_KEY, "0")
      return
    }

    let permission = Notification.permission
    if (permission === "default") {
      permission = await Notification.requestPermission()
    }

    if (permission === "granted") {
      localStorage.setItem(ALERTS_PREF_KEY, "1")
      setAlertsOn(true)
      setPermissionDenied(false)
      return
    }

    localStorage.setItem(ALERTS_PREF_KEY, "0")
    setAlertsOn(false)
    setPermissionDenied(permission === "denied")
  }

  return (
    <Card id="notifications" className="scroll-mt-24 border-primary/20 shadow-lg shadow-primary/5">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-4 text-primary" />
            Notifications
            {items.length > 0 ? (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                {items.length}
              </span>
            ) : null}
          </CardTitle>
          <CardDescription>
            {urgentCount > 0
              ? `${urgentCount} item${urgentCount === 1 ? "" : "s"} need attention — water changes, gear service, and chemistry.`
              : items.length > 0
                ? "Coming up soon — stay ahead of water changes and gear service."
                : "Nothing due right now. We’ll flag water changes, gear service, and chemistry here."}
          </CardDescription>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <Label htmlFor="browser-alerts" className="text-sm font-normal text-muted-foreground">
              Browser alerts
            </Label>
            <Switch
              id="browser-alerts"
              checked={alertsOn}
              disabled={!hydrated || (permissionDenied && !alertsOn)}
              onCheckedChange={(checked) => {
                void setBrowserAlerts(checked)
              }}
              aria-label="Toggle browser alerts"
            />
          </div>
          {permissionDenied ? (
            <p className="max-w-[14rem] text-right text-xs text-muted-foreground">
              Blocked in browser settings — allow notifications for this site to turn alerts on.
            </p>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-900 dark:text-emerald-100">
            You’re clear — no overdue water changes, gear service, or chemistry flags.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex gap-3 rounded-xl border px-3 py-3 transition-colors hover:bg-muted/40",
                    item.tone === "urgent" && "border-destructive/30 bg-destructive/5",
                    item.tone === "soon" && "border-amber-500/25 bg-amber-500/8",
                    item.tone === "watch" && "border-primary/15 bg-background/50",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                      item.tone === "urgent" && "bg-destructive/15 text-destructive",
                      item.tone === "soon" && "bg-amber-500/15 text-amber-800 dark:text-amber-200",
                      item.tone === "watch" && "bg-primary/10 text-primary",
                    )}
                  >
                    <KindIcon kind={item.kind} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium">{item.title}</span>
                      <span className="text-xs text-muted-foreground">{item.meta}</span>
                    </span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{item.detail}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
