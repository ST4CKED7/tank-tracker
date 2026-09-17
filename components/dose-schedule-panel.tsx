"use client"

import { completeDoseSchedule, deleteDoseSchedule, upsertDoseSchedule } from "@/lib/actions"
import type { Tables } from "@/lib/database.types"
import { SubmitButton } from "@/components/submit-button"
import { withActionToast } from "@/components/form-success-toast"
import { EmptyState } from "@/components/empty-state"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addDays, format, parseISO } from "date-fns"
import { CalendarClock } from "lucide-react"
import { cn } from "@/lib/utils"

export function DoseSchedulePanel({
  tankId,
  schedules,
  freshwater = false,
}: {
  tankId: string
  schedules: Tables<"dose_schedules">[]
  freshwater?: boolean
}) {
  return (
    <div id="schedules" className="scroll-mt-24 grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Schedule a dose</CardTitle>
          <CardDescription>
            Recurring products (Prime, two-part, ferts) show up in Today when due. Logging completes today’s dose and
            advances the schedule.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={withActionToast(upsertDoseSchedule, "Schedule saved")} className="space-y-3">
            <input type="hidden" name="tank_id" value={tankId} />
            <div className="space-y-1">
              <Label htmlFor="schedule_product">Product</Label>
              <Input
                id="schedule_product"
                name="product"
                required
                placeholder={freshwater ? "Prime, Easy Green…" : "Alk part, calcium, mag…"}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="schedule_amount">Amount</Label>
                <Input id="schedule_amount" name="amount" type="number" step="0.01" required defaultValue={1} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="schedule_unit">Unit</Label>
                <Input id="schedule_unit" name="unit" defaultValue="ml" />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="schedule_every">Every (days)</Label>
              <Input
                id="schedule_every"
                name="every_days"
                type="number"
                inputMode="numeric"
                min={1}
                defaultValue={1}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="schedule_target">Target</Label>
              <select
                id="schedule_target"
                name="target_parameter"
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                defaultValue="other"
              >
                {freshwater ? (
                  <>
                    <option value="alkalinity">KH / alkalinity</option>
                    <option value="nitrate">Nitrate</option>
                    <option value="phosphate">Phosphate</option>
                    <option value="other">Other</option>
                  </>
                ) : (
                  <>
                    <option value="alkalinity">Alkalinity</option>
                    <option value="calcium">Calcium</option>
                    <option value="magnesium">Magnesium</option>
                    <option value="other">Other</option>
                  </>
                )}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="schedule_starts">Starts</Label>
                <Input id="schedule_starts" name="starts_at" type="date" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="schedule_last">Last dosed</Label>
                <Input id="schedule_last" name="last_dosed_at" type="date" />
              </div>
            </div>
            <SubmitButton className="min-h-11 w-full sm:w-auto">
              Save schedule
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dose schedules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {schedules.length === 0 ? (
            <EmptyState
              icon={<CalendarClock className="size-6" />}
              title="No schedules yet"
              description="Add daily or weekly products so Today reminds you before you forget."
              className="py-6 shadow-none"
            />
          ) : null}
          {schedules.map((item) => {
            const last = item.last_dosed_at ?? item.starts_at
            const due = last ? addDays(parseISO(last), item.every_days) : new Date()
            const overdue = due.getTime() <= Date.now()
            return (
              <div
                key={item.id}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-sm",
                  overdue
                    ? "border-amber-500/30 bg-amber-500/8"
                    : "border-primary/10 bg-background/40",
                )}
              >
                <div>
                  <div className="font-medium">
                    {item.product} · {item.amount} {item.unit}
                  </div>
                  <div className="text-muted-foreground">
                    Every {item.every_days} day{item.every_days === 1 ? "" : "s"}
                    {item.target_parameter ? ` · ${item.target_parameter}` : ""} · due {format(due, "MMM d")}
                  </div>
                </div>
                <div className="flex gap-2">
                  <form action={withActionToast(completeDoseSchedule, "Dose logged")}>
                    <input type="hidden" name="id" value={item.id} />
                    <SubmitButton size="sm" pendingLabel="Logging…">
                      Dosed today
                    </SubmitButton>
                  </form>
                  <form action={deleteDoseSchedule}>
                    <input type="hidden" name="id" value={item.id} />
                    <SubmitButton size="sm" variant="ghost" pendingLabel="Removing…">
                      Remove
                    </SubmitButton>
                  </form>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
