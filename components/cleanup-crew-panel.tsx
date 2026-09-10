"use client"

import { addLivestock } from "@/lib/actions"
import type { LivestockRow, Species, Tank } from "@/lib/bioload"
import { assessCleanupCrew } from "@/lib/cleanup-crew"
import { suggestCleanupCrew } from "@/lib/compatibility"
import type { ParameterKey } from "@/lib/parameters"
import { SpeciesImage } from "@/components/species-image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useUnits } from "@/components/units-provider"
import { cn } from "@/lib/utils"
import { useMemo } from "react"

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
                className="flex items-center justify-between gap-3 rounded-xl border border-primary/10 bg-background/40 p-2.5"
              >
                <input type="hidden" name="tank_id" value={tank.id} />
                <input type="hidden" name="species_id" value={item.species.id} />
                <input type="hidden" name="volume_unit" value={prefs.volume} />
                <input type="hidden" name="length_unit" value={prefs.length} />
                <input type="hidden" name="temp_unit" value={prefs.temp} />
                <input type="hidden" name="quantity" value={1} />
                <div className="flex min-w-0 items-center gap-3">
                  <SpeciesImage
                    src={item.species.image_url}
                    alt={item.species.common_name}
                    speciesId={item.species.id}
                    commonName={item.species.common_name}
                    scientificName={item.species.scientific_name}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{item.species.common_name}</div>
                    <p className="truncate text-xs text-muted-foreground">{item.reasons[0]}</p>
                  </div>
                </div>
                <Button type="submit" size="sm" variant="secondary">
                  Add
                </Button>
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
