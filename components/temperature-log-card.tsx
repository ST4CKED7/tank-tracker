"use client"

import { logTest } from "@/lib/actions"
import { SubmitButton } from "@/components/submit-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUnits } from "@/components/units-provider"
import { displayTemp, formatTemp, tempLabel } from "@/lib/units"
import { format, parseISO } from "date-fns"
import { Thermometer } from "lucide-react"

export function TemperatureLogCard({
  tankId,
  lastValueF,
  lastAt,
}: {
  tankId: string
  lastValueF?: number | null
  lastAt?: string | null
}) {
  const prefs = useUnits()
  const unit = tempLabel(prefs)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Thermometer className="size-4 text-primary" />
          Tank temperature
        </CardTitle>
        <CardDescription>
          Log a thermometer or controller reading anytime — separate from your full water test kits.
          {lastValueF != null ? (
            <>
              {" "}
              Last: <span className="font-medium text-foreground">{formatTemp(lastValueF, prefs)}</span>
              {lastAt ? ` · ${format(parseISO(lastAt), "MMM d, h:mm a")}` : null}
            </>
          ) : (
            " No reading logged yet."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={logTest} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="tank_id" value={tankId} />
          <input type="hidden" name="parameter" value="temperature" />
          <input type="hidden" name="unit" value={unit} />
          <input type="hidden" name="source_kit" value="instruments" />
          <div className="space-y-1">
            <Label htmlFor="tank-temp-value">Temperature ({unit})</Label>
            <Input
              id="tank-temp-value"
              name="value"
              type="number"
              step="0.1"
              required
              className="w-32"
              placeholder={prefs.temp === "C" ? "26" : "78"}
              defaultValue={lastValueF != null ? String(displayTemp(lastValueF, prefs)) : undefined}
            />
          </div>
          <SubmitButton className="min-h-11" pendingLabel="Saving…" successMessage="Temperature saved">
            Log temperature
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  )
}
