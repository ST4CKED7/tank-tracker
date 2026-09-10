"use client"

import { setActiveTank } from "@/lib/actions"
import type { Tank } from "@/lib/bioload"
import { formatVolume } from "@/lib/units"
import { useUnits } from "@/components/units-provider"

export function TankSwitcher({
  tanks,
  activeTankId,
}: {
  tanks: Pick<Tank, "id" | "name" | "gallons" | "water_type">[]
  activeTankId: string | null
}) {
  const prefs = useUnits()
  if (tanks.length === 0) return null

  return (
    <form action={setActiveTank} className="min-w-0 w-full">
      <label className="sr-only" htmlFor="active-tank">
        Active tank
      </label>
      <select
        key={activeTankId ?? "none"}
        id="active-tank"
        name="tank_id"
        defaultValue={activeTankId ?? tanks[0]?.id}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="h-10 w-full min-w-0 max-w-full truncate rounded-full border border-primary/20 bg-background px-3 text-sm shadow-sm sm:h-8 sm:max-w-[16rem]"
      >
        {tanks.map((tank) => (
          <option key={tank.id} value={tank.id}>
            {tank.name} · {formatVolume(Number(tank.gallons), prefs)}
            {tank.water_type === "freshwater" ? " · FW" : " · SW"}
          </option>
        ))}
      </select>
    </form>
  )
}
