"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import type { Reminder } from "@/lib/reminders"
import type { TestAdvice } from "@/lib/test-advice"
import {
  buildNotificationItems,
  type NotificationItem,
} from "@/components/notifications-panel"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { severityIconWrapClass, severityRowClass } from "@/lib/severity-ui"
import { cn } from "@/lib/utils"
import { ArrowRight, Bell, Droplets, FlaskConical, MoreHorizontal, Sparkles, Wrench } from "lucide-react"

const ALERTS_PREF_KEY = "tt-browser-alerts"
const IGNORED_KEY = "tt-ignored-notifications"

type IgnoredEntry = { fingerprint: string; at: number }
type IgnoredMap = Record<string, IgnoredEntry>

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

export function AttentionPanel({
  reminders,
  advice = [],
  primary,
}: {
  reminders: Reminder[]
  advice?: TestAdvice[]
  primary: { label: string; href: string; detail: string }
}) {
  const allItems = useMemo(() => buildNotificationItems(reminders, advice), [reminders, advice])
  const [ignored, setIgnored] = useState<IgnoredMap>({})
  const [hydrated, setHydrated] = useState(false)
  const [alertsOn, setAlertsOn] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)

  useEffect(() => {
    const permission = typeof Notification === "undefined" ? "denied" : Notification.permission
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

  const ignoredCount = allItems.length - items.length
  const urgentCount = items.filter((item) => item.tone === "urgent").length

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
    <section
      id="notifications"
      className="tt-fade-up scroll-mt-24 overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/12 via-card/90 to-card/50 p-4 shadow-lg shadow-primary/10 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            <Sparkles className="size-3.5" />
            Today
            {items.length > 0 ? (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium normal-case tracking-normal text-primary">
                {items.length}
              </span>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">{primary.detail}</p>
          {urgentCount > 0 ? (
            <p className="text-xs text-destructive">
              {urgentCount} item{urgentCount === 1 ? "" : "s"} need attention
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="icon" className="size-11" aria-label="Alert settings">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-3">
              <DropdownMenuLabel className="flex items-center gap-2 px-0">
                <Bell className="size-3.5" />
                Alerts
              </DropdownMenuLabel>
              <div className="mt-2 flex items-center justify-between gap-3">
                <Label htmlFor="browser-alerts" className="text-sm font-normal">
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
                <p className="mt-2 text-xs text-muted-foreground">
                  Blocked in browser settings — allow notifications for this site.
                </p>
              ) : null}
              {ignoredCount > 0 ? (
                <>
                  <DropdownMenuSeparator className="my-2" />
                  <Button type="button" variant="ghost" size="sm" className="h-8 w-full justify-start px-0" onClick={clearIgnored}>
                    Restore ignored ({ignoredCount})
                  </Button>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild className="min-h-11">
            <Link href={primary.href}>
              {primary.label}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-900 dark:text-emerald-100">
          You’re clear for now — keep the usual test rhythm and enjoy the tank.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className={cn("flex items-start gap-3 rounded-xl border px-3 py-3", severityRowClass(item.tone))}
            >
              <span className={severityIconWrapClass(item.tone)}>
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
    </section>
  )
}
