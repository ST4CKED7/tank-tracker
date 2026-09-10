"use client"

import { useMemo, useState } from "react"
import { deleteEquipment, serviceEquipment, upsertEquipment } from "@/lib/actions"
import type { Tables } from "@/lib/database.types"
import { defaultServiceDays, EQUIPMENT_TYPE_GROUPS } from "@/lib/equipment-types"
import { SubmitButton } from "@/components/submit-button"
import { EmptyState } from "@/components/empty-state"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addDays, format, parseISO } from "date-fns"
import { Wrench } from "lucide-react"

export function EquipmentPanel({ tankId, equipment }: { tankId: string; equipment: Tables<"equipment">[] }) {
  const defaultType = EQUIPMENT_TYPE_GROUPS[0]?.types[0] ?? "other"
  const [equipmentType, setEquipmentType] = useState(defaultType)
  const serviceDefault = useMemo(() => defaultServiceDays(equipmentType), [equipmentType])

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Add equipment</CardTitle>
          <CardDescription>Track filters, pumps, lights, reactors, and anything else you service on a schedule.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={upsertEquipment} className="space-y-3">
            <input type="hidden" name="tank_id" value={tankId} />
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required placeholder="Skimmer cup, canister polish…" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="equipment_type">Type</Label>
              <select
                id="equipment_type"
                name="equipment_type"
                value={equipmentType}
                onChange={(event) => setEquipmentType(event.target.value)}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                {EQUIPMENT_TYPE_GROUPS.map((group) => (
                  <optgroup key={group.id} label={group.label}>
                    {group.types.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="service_every_days">Service every (days)</Label>
              <Input
                key={equipmentType}
                id="service_every_days"
                name="service_every_days"
                type="number"
                min={1}
                defaultValue={serviceDefault}
              />
              <p className="text-xs text-muted-foreground">Suggested for this type — change anytime.</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="installed_at">Installed</Label>
              <Input id="installed_at" name="installed_at" type="date" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="last_serviced_at">Last serviced</Label>
              <Input id="last_serviced_at" name="last_serviced_at" type="date" />
            </div>
            <SubmitButton className="min-h-11 w-full sm:w-auto" successMessage="Gear saved">
              Save
            </SubmitButton>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {equipment.length === 0 ? (
            <EmptyState
              icon={<Wrench className="size-6" />}
              title="No gear logged yet"
              description="Add filters, heaters, lights, skimmers, dosers — whatever you clean or replace on a cadence."
              className="py-6 shadow-none"
            />
          ) : null}
          {equipment.map((item) => {
            const last = item.last_serviced_at ?? item.installed_at
            const due = last ? addDays(parseISO(last), item.service_every_days) : new Date()
            return (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/10 bg-background/40 p-3 text-sm"
              >
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-muted-foreground">
                    {item.equipment_type} · due {format(due, "MMM d")}
                  </div>
                </div>
                <div className="flex gap-2">
                  <form action={serviceEquipment}>
                    <input type="hidden" name="id" value={item.id} />
                    <SubmitButton size="sm" pendingLabel="Saving…" successMessage="Marked serviced">
                      Serviced today
                    </SubmitButton>
                  </form>
                  <form action={deleteEquipment}>
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
