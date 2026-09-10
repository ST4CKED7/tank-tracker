"use client"

import { deleteEquipment, serviceEquipment, upsertEquipment } from "@/lib/actions"
import type { Tables } from "@/lib/database.types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addDays, format, parseISO } from "date-fns"

const TYPES = ["skimmer", "carbon", "gfo", "filter socks", "lights", "heater", "return pump", "other"]

export function EquipmentPanel({ tankId, equipment }: { tankId: string; equipment: Tables<"equipment">[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Add equipment</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={upsertEquipment} className="space-y-3">
            <input type="hidden" name="tank_id" value={tankId} />
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required placeholder="Skimmer cup" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="equipment_type">Type</Label>
              <select id="equipment_type" name="equipment_type" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                {TYPES.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="service_every_days">Service every (days)</Label>
              <Input id="service_every_days" name="service_every_days" type="number" defaultValue={14} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="installed_at">Installed</Label>
              <Input id="installed_at" name="installed_at" type="date" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="last_serviced_at">Last serviced</Label>
              <Input id="last_serviced_at" name="last_serviced_at" type="date" />
            </div>
            <Button type="submit">Save</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {equipment.length === 0 ? <p className="text-sm text-muted-foreground">No equipment yet.</p> : null}
          {equipment.map((item) => {
            const last = item.last_serviced_at ?? item.installed_at
            const due = last ? addDays(parseISO(last), item.service_every_days) : new Date()
            return (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/10 bg-background/40 p-3 text-sm">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-muted-foreground">
                    {item.equipment_type} · due {format(due, "MMM d")}
                  </div>
                </div>
                <div className="flex gap-2">
                  <form action={serviceEquipment}>
                    <input type="hidden" name="id" value={item.id} />
                    <Button type="submit" size="sm">Serviced today</Button>
                  </form>
                  <form action={deleteEquipment}>
                    <input type="hidden" name="id" value={item.id} />
                    <Button type="submit" size="sm" variant="ghost">Remove</Button>
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
