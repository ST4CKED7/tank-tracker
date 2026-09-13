"use client"

import { useMemo, useState, useTransition } from "react"
import type { Tank } from "@/lib/bioload"
import { updateParameterTargets } from "@/lib/actions"
import {
  displayRange,
  isFreshwater,
  parameterMeta,
  waterTypeLabel,
  type ParameterKey,
} from "@/lib/parameters"
import {
  resolveDashboardTargets,
  type ResolvedTarget,
  type TargetSource,
} from "@/lib/parameter-targets"
import { unitPrefsFromTank } from "@/lib/units"
import type { LivestockRow } from "@/lib/bioload"
import { Button } from "@/components/ui/button"
import { SubmitButton } from "@/components/submit-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function sourceCopy(source: TargetSource, freshwater: boolean) {
  if (source === "custom") return "Your custom target"
  if (source === "livestock") return "Based on livestock targets"
  return `Typical ${freshwater ? "freshwater" : waterTypeLabel("saltwater")} default`
}

export function ParameterTargetsPanel({
  tank,
  livestock,
}: {
  tank: Tank
  livestock: LivestockRow[]
}) {
  const prefs = unitPrefsFromTank(tank)
  const freshwater = isFreshwater(tank.water_type)
  const waterType = freshwater ? "freshwater" : "saltwater"
  const meta = parameterMeta(prefs, waterType)
  const resolved = useMemo(
    () => resolveDashboardTargets({ tank, livestock, prefs }),
    [tank, livestock, prefs],
  )
  const hasCustom = (Object.entries(resolved) as [ParameterKey, ResolvedTarget][]).some(
    ([, range]) => range.source === "custom",
  )
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()

  const entries = Object.entries(resolved) as [ParameterKey, ResolvedTarget][]

  return (
    <Card id="targets" className="tt-fade-up scroll-mt-24">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Recommended parameter window</CardTitle>
          <CardDescription>
            {editing
              ? "Edit the min–max range you want advice and suggestions to use. Values save in your display units."
              : hasCustom
                ? "Custom overrides are marked below. Everything else still uses livestock or typical defaults."
                : "Defaults come from livestock overlap when available, otherwise typical targets for this water type. See Livestock for the raw species intersection."}
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasCustom && !editing ? (
            <form
              action={(formData) => {
                startTransition(async () => {
                  await updateParameterTargets(formData)
                })
              }}
            >
              <input type="hidden" name="tank_id" value={tank.id} />
              <input type="hidden" name="reset" value="1" />
              <SubmitButton variant="outline" size="sm" pendingLabel="Resetting…">
                Reset to defaults
              </SubmitButton>
            </form>
          ) : null}
          <Button
            type="button"
            variant={editing ? "secondary" : "outline"}
            size="sm"
            disabled={pending}
            onClick={() => setEditing((value) => !value)}
          >
            {editing ? "Cancel" : "Edit targets"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <form
            className="space-y-4"
            action={(formData) => {
              startTransition(async () => {
                await updateParameterTargets(formData)
                setEditing(false)
              })
            }}
          >
            <input type="hidden" name="tank_id" value={tank.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              {entries.map(([key, range]) => {
                const shown = displayRange(key, range, prefs)
                return (
                  <div key={key} className="space-y-2 rounded-xl border border-primary/10 bg-background/40 p-3">
                    <Label className="font-medium">
                      {meta[key].label}
                      {meta[key].unit ? ` (${meta[key].unit})` : ""}
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor={`${key}_min`} className="text-xs text-muted-foreground">
                          Min
                        </Label>
                        <Input
                          id={`${key}_min`}
                          name={`${key}_min`}
                          type="number"
                          step="0.01"
                          defaultValue={shown.min}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`${key}_max`} className="text-xs text-muted-foreground">
                          Max
                        </Label>
                        <Input
                          id={`${key}_max`}
                          name={`${key}_max`}
                          type="number"
                          step="0.01"
                          defaultValue={shown.max}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <SubmitButton className="min-h-11" pendingLabel="Saving…">
              Save targets
            </SubmitButton>
          </form>
        ) : (
          <div className="tt-stagger grid gap-2 sm:grid-cols-2">
            {entries.map(([key, range]) => {
              const shown = displayRange(key, range, prefs)
              return (
                <div key={key} className="rounded-xl border border-primary/10 bg-background/40 px-3 py-2 text-sm">
                  <span className="font-medium">{meta[key].label}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    {shown.min}–{shown.max} {meta[key].unit}
                  </span>
                  <div className="text-xs text-muted-foreground">{sourceCopy(range.source, freshwater)}</div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
