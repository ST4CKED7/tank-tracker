"use client"

import { updateUnitPrefs } from "@/lib/actions"
import type { Tank } from "@/lib/bioload"
import { SubmitButton } from "@/components/submit-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { unitPrefsFromTank, type LengthUnit, type TempUnit, type UnitPrefs, type VolumeUnit } from "@/lib/units"
import { useState } from "react"
import { cn } from "@/lib/utils"

function Segmented<T extends string>({
  value,
  options,
  onChange,
  name,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  name: string
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <input type="hidden" name={name} value={value} />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "min-h-11 rounded-full px-3 py-1.5 text-sm transition-colors sm:min-h-0",
            value === option.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/80 text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function UnitPrefsForm({ tank }: { tank: Tank }) {
  const initial = unitPrefsFromTank(tank)
  const [prefs, setPrefs] = useState<UnitPrefs>(initial)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Display units</CardTitle>
        <CardDescription>
          Mix and match — for example US gallons with Celsius. Applies to the active tank’s forms, charts, and labels.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={updateUnitPrefs} className="grid gap-4 md:grid-cols-3">
          <input type="hidden" name="tank_id" value={tank.id} />
          <div className="space-y-2">
            <Label>Volume</Label>
            <Segmented<VolumeUnit>
              name="volume_unit"
              value={prefs.volume}
              onChange={(volume) => setPrefs((current) => ({ ...current, volume }))}
              options={[
                { value: "gal", label: "Gallons (US)" },
                { value: "L", label: "Liters" },
              ]}
            />
          </div>
          <div className="space-y-2">
            <Label>Temperature</Label>
            <Segmented<TempUnit>
              name="temp_unit"
              value={prefs.temp}
              onChange={(temp) => setPrefs((current) => ({ ...current, temp }))}
              options={[
                { value: "F", label: "°F" },
                { value: "C", label: "°C" },
              ]}
            />
          </div>
          <div className="space-y-2">
            <Label>Length</Label>
            <Segmented<LengthUnit>
              name="length_unit"
              value={prefs.length}
              onChange={(length) => setPrefs((current) => ({ ...current, length }))}
              options={[
                { value: "in", label: "Inches" },
                { value: "cm", label: "Centimeters" },
              ]}
            />
          </div>
          <div className="md:col-span-3">
            <SubmitButton className="min-h-11 w-full sm:w-auto">Save unit preferences</SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
