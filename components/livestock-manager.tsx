"use client"

import { addCustomSpecies, addLivestock, removeLivestock, updateLivestock } from "@/lib/actions"
import {
  CORAL_SIZE_LABELS,
  type CoralSize,
  type LivestockRow,
  type Species,
  type Tank,
} from "@/lib/bioload"
import { suggestAdditions } from "@/lib/compatibility"
import type { ParameterKey } from "@/lib/parameters"
import { Button } from "@/components/ui/button"
import { SubmitButton } from "@/components/submit-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useMemo, useState } from "react"
import { useUnits } from "@/components/units-provider"
import { displayLength, formatLength, formatVolume, lengthLabel, volumeLabel } from "@/lib/units"
import { Badge } from "@/components/ui/badge"
import { SpeciesImage } from "@/components/species-image"
import { cn } from "@/lib/utils"

function kindBadgeClass(kind: string) {
  if (kind === "fish") return "border-teal-500/40 bg-teal-500/15 text-teal-800 dark:text-teal-200"
  if (kind === "coral") return "border-orange-400/40 bg-orange-400/15 text-orange-800 dark:text-orange-200"
  if (kind === "plant") return "border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
  return "border-violet-500/40 bg-violet-500/15 text-violet-800 dark:text-violet-200"
}

export function LivestockManager({
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
  const [query, setQuery] = useState("")
  const fw = tank.water_type === "freshwater"
  const kindOptions = fw
    ? (["all", "fish", "invert", "plant"] as const)
    : (["all", "fish", "coral", "invert"] as const)
  const [kind, setKind] = useState<"all" | "fish" | "coral" | "invert" | "plant">("all")
  const prefs = useUnits()
  const filtered = catalog.filter((species) => {
    const hay = `${species.common_name} ${species.scientific_name ?? ""} ${species.notes ?? ""}`.toLowerCase()
    return hay.includes(query.toLowerCase()) && (kind === "all" || species.kind === kind)
  })
  const suggestions = useMemo(
    () => suggestAdditions(catalog, tank, livestock, latest).slice(0, 12),
    [catalog, tank, livestock, latest],
  )

  const unitFields = (
    <>
      <input type="hidden" name="volume_unit" value={prefs.volume} />
      <input type="hidden" name="length_unit" value={prefs.length} />
      <input type="hidden" name="temp_unit" value={prefs.temp} />
    </>
  )

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>In the tank</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {livestock.length === 0 ? <p className="text-sm text-muted-foreground">No livestock yet.</p> : null}
          {livestock.map((item) => {
            const lengthInches =
              item.current_length_inches != null
                ? Number(item.current_length_inches)
                : item.species.kind === "fish"
                  ? Number(item.species.adult_length_inches ?? 0) || null
                  : null
            return (
              <div key={item.id} className="space-y-3 rounded-xl border border-primary/10 bg-background/40 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <SpeciesImage
                      src={item.species.image_url}
                      alt={item.species.common_name}
                      speciesId={item.species.id}
                      commonName={item.species.common_name}
                      scientificName={item.species.scientific_name}
                      size="md"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium">
                          {item.species.common_name}
                          {item.quantity > 1 ? ` ×${item.quantity}` : ""}
                        </div>
                        <Badge variant="outline" className={cn("capitalize", kindBadgeClass(item.species.kind))}>
                          {item.species.kind}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{item.species.scientific_name}</div>
                      {item.nickname ? <div className="text-sm">{item.nickname}</div> : null}
                      {item.species.kind === "fish" && lengthInches ? (
                        <div className="text-sm text-muted-foreground">
                          Current size {formatLength(lengthInches, prefs)}
                          {item.species.adult_length_inches != null
                            ? ` · adult ${formatLength(Number(item.species.adult_length_inches), prefs)}`
                            : null}
                        </div>
                      ) : null}
                      {item.species.kind === "coral" ? (
                        <div className="text-sm text-muted-foreground">
                          {CORAL_SIZE_LABELS[(item.coral_size as CoralSize) ?? "frag"]}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <form action={removeLivestock} className="self-end sm:self-start">
                    <input type="hidden" name="id" value={item.id} />
                    <SubmitButton variant="ghost" size="sm" className="min-h-11 sm:min-h-8" pendingLabel="…">
                      Remove
                    </SubmitButton>
                  </form>
                </div>

                {(item.species.kind === "fish" || item.species.kind === "coral") ? (
                  <form action={updateLivestock} className="flex flex-wrap items-end gap-2 border-t border-primary/10 pt-3">
                    <input type="hidden" name="id" value={item.id} />
                    {unitFields}
                    {item.species.kind === "fish" ? (
                      <div className="space-y-1">
                        <Label htmlFor={`len-${item.id}`}>Length ({lengthLabel(prefs)})</Label>
                        <Input
                          id={`len-${item.id}`}
                          name="current_length"
                          type="number"
                          step="0.1"
                          min={0}
                          className="w-28"
                          defaultValue={
                            lengthInches != null ? displayLength(lengthInches, prefs) : undefined
                          }
                          placeholder={
                            item.species.adult_length_inches != null
                              ? String(displayLength(Number(item.species.adult_length_inches), prefs))
                              : undefined
                          }
                        />
                      </div>
                    ) : null}
                    {item.species.kind === "coral" ? (
                      <div className="space-y-1">
                        <Label htmlFor={`cs-${item.id}`}>Size</Label>
                        <select
                          id={`cs-${item.id}`}
                          name="coral_size"
                          defaultValue={(item.coral_size as CoralSize) ?? "frag"}
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
                    <div className="space-y-1">
                      <Label htmlFor={`qty-edit-${item.id}`}>Qty</Label>
                      <Input
                        id={`qty-edit-${item.id}`}
                        name="quantity"
                        type="number"
                        min={1}
                        defaultValue={item.quantity}
                        className="w-20"
                      />
                    </div>
                    <SubmitButton size="sm" variant="secondary" pendingLabel="Updating…">
                      Update
                    </SubmitButton>
                  </form>
                ) : null}
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suggested additions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {suggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing currently passes tank size, compatibility, parameters, and bioload headroom.</p>
          ) : null}
          {suggestions.map((item) => (
            <form key={item.species.id} action={addLivestock} className="rounded-xl border border-primary/10 bg-background/40 p-3">
              <input type="hidden" name="tank_id" value={tank.id} />
              <input type="hidden" name="species_id" value={item.species.id} />
              {unitFields}
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-3">
                  <SpeciesImage
                    src={item.species.image_url}
                    alt={item.species.common_name}
                    speciesId={item.species.id}
                    commonName={item.species.common_name}
                    scientificName={item.species.scientific_name}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <div className="font-medium">{item.species.common_name}</div>
                    <p className="text-sm text-muted-foreground">{item.reasons[0]}</p>
                    {item.projectedBioloadPercent != null ? (
                      <p className="text-xs text-muted-foreground">Would put bioload at {Math.round(item.projectedBioloadPercent)}%</p>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {item.species.kind === "coral" ? (
                    <select name="coral_size" defaultValue="frag" className="h-8 rounded-md border bg-background px-2 text-xs">
                      {(Object.keys(CORAL_SIZE_LABELS) as CoralSize[]).map((size) => (
                        <option key={size} value={size}>
                          {CORAL_SIZE_LABELS[size]}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  {item.species.kind === "fish" ? (
                    <Input
                      name="current_length"
                      type="number"
                      step="0.1"
                      min={0}
                      className="w-24"
                      placeholder={`${lengthLabel(prefs)}`}
                      defaultValue={
                        item.species.adult_length_inches != null
                          ? displayLength(Number(item.species.adult_length_inches), prefs)
                          : undefined
                      }
                    />
                  ) : null}
                  <SubmitButton size="sm" pendingLabel="Adding…">
                    Add
                  </SubmitButton>
                </div>
              </div>
            </form>
          ))}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Catalog</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder={fw ? "Search neon tetra, anubias, shrimp…" : "Search green clown goby, wrasse, LPS…"}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full max-w-md"
            />
            {kindOptions.map((option) => (
              <Button key={option} type="button" size="sm" variant={kind === option ? "default" : "outline"} onClick={() => setKind(option)}>
                {option}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {filtered.length === 0
              ? `No matches in ${catalog.length} species. Try another name, or add a custom species below.`
              : `Showing ${filtered.length} of ${catalog.length}`}
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {filtered.map((species) => (
              <form
                key={species.id}
                action={addLivestock}
                className={cn(
                  "rounded-xl border border-primary/10 bg-card/70 p-3 text-sm shadow-sm border-l-4",
                  species.kind === "fish" && "border-l-teal-500",
                  species.kind === "coral" && "border-l-orange-400",
                  species.kind === "invert" && "border-l-violet-500",
                  species.kind === "plant" && "border-l-emerald-500",
                )}
              >
                <input type="hidden" name="tank_id" value={tank.id} />
                <input type="hidden" name="species_id" value={species.id} />
                {unitFields}
                <div className="flex items-start gap-3">
                  <SpeciesImage
                    src={species.image_url}
                    alt={species.common_name}
                    speciesId={species.id}
                    commonName={species.common_name}
                    scientificName={species.scientific_name}
                    size="md"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{species.common_name}</div>
                      <Badge variant="outline" className={cn("capitalize", kindBadgeClass(species.kind))}>{species.kind}</Badge>
                    </div>
                    <div className="text-muted-foreground">{species.scientific_name}</div>
                    <p className="mt-1">{species.notes}</p>
                    <p className="mt-1 text-muted-foreground">
                      Min {species.min_tank_gallons != null ? formatVolume(Number(species.min_tank_gallons), prefs) : "—"}
                      {fw ? null : ` · reef-safe ${species.reef_safe}`}
                      {species.kind === "fish" && species.adult_length_inches != null
                        ? ` · adult ${formatLength(Number(species.adult_length_inches), prefs)}`
                        : null}
                      {species.kind === "plant" && species.lighting ? ` · light ${species.lighting}` : null}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-end gap-2">
                  <div>
                    <Label htmlFor={`qty-${species.id}`}>Qty</Label>
                    <Input id={`qty-${species.id}`} name="quantity" type="number" min={1} defaultValue={1} className="w-20" />
                  </div>
                  {species.kind === "fish" ? (
                    <div>
                      <Label htmlFor={`flen-${species.id}`}>Size ({lengthLabel(prefs)})</Label>
                      <Input
                        id={`flen-${species.id}`}
                        name="current_length"
                        type="number"
                        step="0.1"
                        min={0}
                        className="w-28"
                        defaultValue={
                          species.adult_length_inches != null
                            ? displayLength(Number(species.adult_length_inches), prefs)
                            : undefined
                        }
                      />
                    </div>
                  ) : null}
                  {species.kind === "coral" ? (
                    <div>
                      <Label htmlFor={`size-${species.id}`}>Size</Label>
                      <select
                        id={`size-${species.id}`}
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
                  <SubmitButton size="sm" pendingLabel="Adding…">
                    Add
                  </SubmitButton>
                </div>
              </form>
            ))}
          </div>
          <details className="rounded-lg border p-4">
            <summary className="cursor-pointer font-medium">Add a custom species</summary>
            <form action={addCustomSpecies} className="mt-4 grid gap-3 sm:grid-cols-2">
              {unitFields}
              <input type="hidden" name="water_type" value={fw ? "freshwater" : "saltwater"} />
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="common_name">Common name</Label>
                <Input id="common_name" name="common_name" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="scientific_name">Scientific name</Label>
                <Input id="scientific_name" name="scientific_name" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="kind">Kind</Label>
                <select id="kind" name="kind" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="fish">Fish</option>
                  {fw ? null : <option value="coral">Coral</option>}
                  <option value="invert">Invert</option>
                  {fw ? <option value="plant">Plant</option> : null}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="min_volume">Min volume ({volumeLabel(prefs)})</Label>
                <Input id="min_volume" name="min_volume" type="number" defaultValue={prefs.volume === "L" ? 75 : 20} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="adult_length">Adult length ({lengthLabel(prefs)})</Label>
                <Input id="adult_length" name="adult_length" type="number" step="0.1" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bioload_factor">Bioload factor</Label>
                <Input id="bioload_factor" name="bioload_factor" type="number" step="0.1" defaultValue={1} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="invert_points">Invert points</Label>
                <Input id="invert_points" name="invert_points" type="number" step="0.1" defaultValue={0} />
              </div>
              {fw ? null : (
                <div className="space-y-1">
                  <Label htmlFor="reef_safe">Reef safe</Label>
                  <select id="reef_safe" name="reef_safe" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                    <option value="yes">Yes</option>
                    <option value="caution">Caution</option>
                    <option value="no">No</option>
                  </select>
                </div>
              )}
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" />
              </div>
              <SubmitButton className="min-h-11" pendingLabel="Saving…">
                Save species
              </SubmitButton>
            </form>
          </details>
        </CardContent>
      </Card>
    </div>
  )
}
