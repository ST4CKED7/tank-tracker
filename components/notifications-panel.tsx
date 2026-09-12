"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { format, formatDistanceToNowStrict } from "date-fns"
import type { Reminder } from "@/lib/reminders"
import type { TestAdvice } from "@/lib/test-advice"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { Bell, Droplets, FlaskConical, Wrench } from "lucide-react"

const ALERTS_PREF_KEY = "tt-browser-alerts"
const IGNORED_KEY = "tt-ignored-notifications"

export type NotificationItem = {
  id: string
  title: string
  detail: string
  href: string
  tone: "urgent" | "soon" | "watch"
  meta: string
  kind: "water_change" | "test" | "equipment" | "chemistry"
}

type IgnoredEntry = { fingerprint: string; at: number }
type IgnoredMap = Record<string, IgnoredEntry>

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

function itemFingerprint(item: NotificationItem) {
  return `${item.tone}|${item.meta}|${item.title}|${item.detail.slice(0, 120)}`
}

function readIgnoredMap(): IgnoredMap {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(IGNORED_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as IgnoredMap
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

function writeIgnoredMap(map: IgnoredMap) {
  try {
    localStorage.setItem(IGNORED_KEY, JSON.stringify(map))
  } catch {
    /* ignore */
  }
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
  const allItems = useMemo(() => buildNotificationItems(reminders, advice), [reminders, advice])
  const [ignored, setIgnored] = useState<IgnoredMap>({})
  const [hydrated, setHydrated] = useState(false)
  const [alertsOn, setAlertsOn] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)

  useEffect(() => {
    const permission =
      typeof Notification === "undefined" ? "denied" : Notification.permission
    const pref = readAlertsPref()
    setPermissionDenied(permission === "denied")
    setAlertsOn(pref && permission === "granted")
    setIgnored(readIgnoredMap())
    setHydrated(true)
  }, [])

  const items = useMemo(() => {
    if (!hydrated) return allItems
    return allItems.filter((item) => {
      const entry = ignored[item.id]
      if (!entry) return true
      return entry.fingerprint !== itemFingerprint(item)
    })
  }, [allItems, ignored, hydrated])

  const urgentCount = items.filter((item) => item.tone === "urgent").length
  const ignoredCount = allItems.length - items.length

  useEffect(() => {
    if (!hydrated || !alertsOn) return
    if (typeof window === "undefined" || Notification.permission !== "granted") return
    const overdue = reminders.filter((item) => {
      if (!item.overdue) return false
      const id = `rem-${item.id}`
      const entry = ignored[id]
      if (!entry) return true
      const match = allItems.find((row) => row.id === id)
      return !match || entry.fingerprint !== itemFingerprint(match)
    })
    if (overdue.length === 0) return
    const key = `tt-notified-${overdue.map((item) => item.id).join(",")}`
    if (sessionStorage.getItem(key)) return
    new Notification("Tank Tracker", {
      body: overdue.map((item) => item.title).join(", "),
    })
    sessionStorage.setItem(key, "1")
  }, [reminders, alertsOn, hydrated, ignored, allItems])

  function ignoreItem(item: NotificationItem) {
    const next = {
      ...ignored,
      [item.id]: { fingerprint: itemFingerprint(item), at: Date.now() },
    }
    setIgnored(next)
    writeIgnoredMap(next)
  }

  function clearIgnored() {
    setIgnored({})
    writeIgnoredMap({})
  }

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
                : ignoredCount > 0
                  ? "You’re clear for now — ignored suggestions stay hidden until something changes."
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
          {ignoredCount > 0 ? (
            <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearIgnored}>
              Restore ignored ({ignoredCount})
            </Button>
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
              <li
                key={item.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl border px-3 py-3",
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
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs text-muted-foreground">{item.meta}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                </div>
                <div className="flex w-[5.75rem] shrink-0 flex-col gap-1.5">
                  <Button asChild size="sm" className="h-9 w-full px-2">
                    <Link href={item.href}>Open</Link>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 w-full px-2 text-muted-foreground"
                    onClick={() => ignoreItem(item)}
                  >
                    Ignore
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
