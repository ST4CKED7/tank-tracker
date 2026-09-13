"use client"

import { useTransition } from "react"
import { BellRing, BellOff } from "lucide-react"
import { toast } from "sonner"
import { deleteParameterReminder, upsertParameterReminder } from "@/lib/actions"
import { softHaptic } from "@/components/form-success-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { dashboardParameterKeys, parameterMeta, type ParameterKey, type WaterType } from "@/lib/parameters"
import type { Tables } from "@/lib/database.types"
import { cn } from "@/lib/utils"

const INTERVAL_OPTIONS = [1, 2, 3, 7, 14, 30]

export function ParameterRemindersPanel({
  tankId,
  waterType,
  reminders,
}: {
  tankId: string
  waterType: WaterType
  reminders: Tables<"parameter_reminders">[]
}) {
  const [pending, startTransition] = useTransition()
  const meta = parameterMeta("imperial", waterType)
  const keys = dashboardParameterKeys(waterType)
  const byParam = new Map(reminders.map((r) => [r.parameter, r]))

  function enable(parameter: ParameterKey, everyDays: number) {
    const fd = new FormData()
    fd.set("tank_id", tankId)
    fd.set("parameter", parameter)
    fd.set("every_days", String(everyDays))
    softHaptic()
    startTransition(async () => {
      try {
        await upsertParameterReminder(fd)
      } catch {
        toast.error("Could not save reminder.")
      }
    })
  }

  function disable(parameter: ParameterKey) {
    const fd = new FormData()
    fd.set("tank_id", tankId)
    fd.set("parameter", parameter)
    startTransition(async () => {
      try {
        await deleteParameterReminder(fd)
      } catch {
        toast.error("Could not remove reminder.")
      }
    })
  }

  return (
    <Card id="reminders">
      <CardHeader>
        <CardTitle>Test reminders</CardTitle>
        <CardDescription>
          Turn on a reminder for any parameter and pick how often. Due and overdue tests show up on your home
          screen. Setting any reminder here replaces the generic weekly-test nudge.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {keys.map((key) => {
          const existing = byParam.get(key)
          const on = Boolean(existing)
          return (
            <div
              key={key}
              className={cn(
                "flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3",
                on ? "border-primary/30 bg-primary/5" : "border-primary/10 bg-background/40",
              )}
            >
              <div className="flex items-center gap-2 font-medium">
                {on ? <BellRing className="size-4 text-primary" /> : <BellOff className="size-4 text-muted-foreground" />}
                {meta[key].label}
              </div>
              <div className="flex items-center gap-2">
                {on ? (
                  <>
                    <label className="text-sm text-muted-foreground" htmlFor={`int-${key}`}>
                      Every
                    </label>
                    <select
                      id={`int-${key}`}
                      value={existing?.every_days ?? 7}
                      disabled={pending}
                      onChange={(event) => enable(key, Number(event.target.value))}
                      className="h-9 rounded-md border bg-background px-2 text-sm"
                    >
                      {INTERVAL_OPTIONS.map((days) => (
                        <option key={days} value={days}>
                          {days} day{days === 1 ? "" : "s"}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => disable(key)}
                    >
                      Turn off
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => enable(key, 7)}
                  >
                    Remind me
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
