"use client"

import { addLivestock } from "@/lib/actions"
import {
  CORAL_SIZE_LABELS,
  LIVESTOCK_SEX_LABELS,
  type CoralSize,
  type LivestockRow,
  type LivestockSex,
  type Species,
  type Tank,
} from "@/lib/bioload"
import { assessCleanupCrew } from "@/lib/cleanup-crew"
import { suggestCleanupCrew } from "@/lib/compatibility"
import type { ParameterKey } from "@/lib/parameters"
import { SpeciesImage } from "@/components/species-image"
import { SubmitButton } from "@/components/submit-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUnits } from "@/components/units-provider"
import { displayLength, lengthLabel } from "@/lib/units"
import { cn } from "@/lib/utils"
import { useMemo } from "react"

function SexSelect({
  id,
  defaultValue = "unknown",
}: {
  id: string
  defaultValue?: LivestockSex
}) {
  return (
    <select
      id={id}
      name="sex"
      defaultValue={defaultValue}
      className="h-8 rounded-md border bg-background px-2 text-sm"
    >
      {(Object.keys(LIVESTOCK_SEX_LABELS) as LivestockSex[]).map((sex) => (
        <option key={sex} value={sex}>
          {LIVESTOCK_SEX_LABELS[sex]}
        </option>
      ))}
    </select>
  )
}

export function CleanupCrewPanel({
  tank,
  livestock,
  catalog,
  latest,
}: {
  tank: Tank
  livestock: LivestockRow[]
  catalog: Species[]
  latest: Partial<Record<ParameterKey, number>>
}) {
  const prefs = useUnits()
  const assessment = useMemo(() => assessCleanupCrew(tank, livestock), [tank, livestock])
  const picks = useMemo(
    () => suggestCleanupCrew(catalog, tank, livestock, latest, 6),
    [catalog, tank, livestock, latest],
  )

  return (
    <Card
      className={cn(
        assessment.status === "missing" && "border-amber-500/40",
        assessment.status === "light" && "border-amber-500/25",
      )}
    >
      <CardHeader>
        <CardTitle>Cleanup crew</CardTitle>
        <CardDescription>{assessment.summary}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{assessment.detail}</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-muted px-2.5 py-1">
            {assessment.count} of ~{assessment.target} animals
          </span>
          {assessment.rolesPresent.map((role) => (
            <span key={role} className="rounded-full bg-emerald-500/15 px-2.5 py-1 capitalize text-emerald-800 dark:text-emerald-200">
              {role}
            </span>
          ))}
          {assessment.rolesMissing.map((role) => (
            <span key={role} className="rounded-full bg-amber-500/15 px-2.5 py-1 capitalize text-amber-800 dark:text-amber-200">
              needs {role}
            </span>
          ))}
        </div>

        {assessment.status !== "ok" && picks.length > 0 ? (
          <div className="space-y-2">
            <div className="text-sm font-medium">Suggested cleanup additions</div>
            {picks.map((item) => (
              <form
                key={item.species.id}
                action={addLivestock}
                className="space-y-3 rounded-xl border border-primary/10 bg-background/40 p-3"
              >
                <input type="hidden" name="tank_id" value={tank.id} />
                <input type="hidden" name="species_id" value={item.species.id} />
                <input type="hidden" name="volume_unit" value={prefs.volume} />
                <input type="hidden" name="length_unit" value={prefs.length} />
                <input type="hidden" name="temp_unit" value={prefs.temp} />
                <div className="flex min-w-0 items-center gap-3">
                  <SpeciesImage
                    src={item.species.image_url}
                    alt={item.species.common_name}
                    speciesId={item.species.id}
                    commonName={item.species.common_name}
                    scientificName={item.species.scientific_name}
                    kind={item.species.kind}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{item.species.common_name}</div>
                    <p className="truncate text-xs text-muted-foreground">{item.reasons[0]}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <div>
                    <Label htmlFor={`cuc-qty-${item.species.id}`}>Qty</Label>
                    <Input
                      id={`cuc-qty-${item.species.id}`}
                      name="quantity"
                      type="number"
                      min={1}
                      defaultValue={1}
                      className="w-20"
                    />
                  </div>
                  {item.species.kind === "fish" || item.species.kind === "invert" ? (
                    <div>
                      <Label htmlFor={`cuc-sex-${item.species.id}`}>Sex</Label>
                      <SexSelect id={`cuc-sex-${item.species.id}`} defaultValue="unknown" />
                    </div>
                  ) : null}
                  {item.species.kind === "fish" ? (
                    <div>
                      <Label htmlFor={`cuc-len-${item.species.id}`}>Size ({lengthLabel(prefs)})</Label>
                      <Input
                        id={`cuc-len-${item.species.id}`}
                        name="current_length"
                        type="number"
                        step="0.1"
                        min={0}
                        className="w-28"
                        defaultValue={
                          item.species.adult_length_inches != null
                            ? displayLength(Number(item.species.adult_length_inches), prefs)
                            : undefined
                        }
                      />
                    </div>
                  ) : null}
                  {item.species.kind === "coral" ? (
                    <div>
                      <Label htmlFor={`cuc-coral-${item.species.id}`}>Size</Label>
                      <select
                        id={`cuc-coral-${item.species.id}`}
                        name="coral_size"
                        defaultValue="frag"
                        className="h-8 rounded-md border bg-background px-2 text-sm"
                      >
                        {(Object.keys(CORAL_SIZE_LABELS) as CoralSize[]).map((size) => (
                          <option key={size} value={size}>
                            {CORAL_SIZE_LABELS[size]}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                  <SubmitButton size="sm" variant="secondary" pendingLabel="Adding…" successMessage="Added to tank">
                    Add
                  </SubmitButton>
                </div>
              </form>
            ))}
          </div>
        ) : null}

        {assessment.status !== "ok" && picks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No compatible cleanup species fit right now — check tank size, aggression tags, and bioload headroom in the
            catalog.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
