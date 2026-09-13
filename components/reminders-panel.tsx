"use client"

import { useEffect, useMemo, useState } from "react"
import { logWaterChange } from "@/lib/actions"
import { waterChangeGallons } from "@/lib/reminders"
import { saltMixForGallons } from "@/lib/salt-mix"
import type { Tank } from "@/lib/bioload"
import { SubmitButton } from "@/components/submit-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUnits } from "@/components/units-provider"
import { displayVolume, formatVolume, volumeLabel } from "@/lib/units"

export function RemindersPanel({
  tank,
  suggestedPercent = null,
  suggestionDetail = null,
}: {
  tank: Tank
  suggestedPercent?: number | null
  suggestionDetail?: string | null
}) {
  const system = useUnits()
  const fw = tank.water_type === "freshwater"
  const defaultPercent = Number(tank.water_change_percent) || 15
  const [percent, setPercent] = useState(suggestedPercent ?? defaultPercent)
  const mixGallons = useMemo(() => waterChangeGallons(tank, percent), [tank, percent])
  const salt = useMemo(() => saltMixForGallons(mixGallons), [mixGallons])
  const mixedDisplay = displayVolume(mixGallons, system)
  const [volume, setVolume] = useState(String(mixedDisplay))

  useEffect(() => {
    if (suggestedPercent != null && suggestedPercent > 0) {
      setPercent(suggestedPercent)
    }
  }, [suggestedPercent])

  useEffect(() => {
    setVolume(String(mixedDisplay))
  }, [mixedDisplay])

  return (
    <Card id="reminders" className="scroll-mt-24">
      <CardHeader>
        <CardTitle>Water change</CardTitle>
        <CardDescription>
          {suggestedPercent
            ? `Chemistry suggests ~${suggestedPercent}% — adjust if you prefer a gentler change.`
            : "Set the %, see mix volume, then log when you’re done."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestionDetail ? (
          <p className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-3 text-sm text-amber-950 dark:text-amber-50">
            {suggestionDetail}
          </p>
        ) : null}

        <form action={logWaterChange} className="space-y-3 rounded-xl border border-primary/15 bg-primary/5 p-3">
          <input type="hidden" name="tank_id" value={tank.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="percent">Change %</Label>
              <Input
                id="percent"
                name="percent"
                type="number"
                step="0.1"
                min={0}
                value={percent}
                onChange={(e) => setPercent(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="volume">Mixed ({volumeLabel(system)})</Label>
              <Input
                id="volume"
                name="volume"
                type="number"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
              />
            </div>
          </div>
          <div className="rounded-lg bg-background/60 px-3 py-2 text-sm">
            <div>
              Mix about <span className="font-semibold">{formatVolume(mixGallons, system)}</span>
            </div>
            {fw ? (
              <div className="text-muted-foreground">Dechlorinated / conditioned water</div>
            ) : (
              <div className="text-muted-foreground">
                Salt ≈ <span className="font-medium text-foreground">{salt.cups} cups</span>
                {" · "}
                {salt.grams}g ({salt.ounces} oz)
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {fw
              ? "Match temperature to the tank. Condition tap water before adding."
              : "Based on ~½ cup salt mix per US gallon (~35 g/L). Brands differ — verify salinity with a refractometer."}
          </p>
          <SubmitButton className="w-full min-h-11" pendingLabel="Logging…" successMessage="Water change logged">
            Log water change
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  )
}
