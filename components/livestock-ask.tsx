"use client"

import { useMemo, useState } from "react"
import { Search, X } from "lucide-react"
import { addLivestock } from "@/lib/actions"
import {
  CORAL_SIZE_LABELS,
  type CoralSize,
  type LivestockRow,
  type Species,
  type Tank,
} from "@/lib/bioload"
import {
  askLivestock,
  suggestAskPrompts,
} from "@/lib/livestock-ask"
import type { ParameterKey } from "@/lib/parameters"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SubmitButton } from "@/components/submit-button"
import { SpeciesImage } from "@/components/species-image"
import { useUnits } from "@/components/units-provider"
import { displayLength, formatTempRange, lengthLabel, type UnitPrefs } from "@/lib/units"
import { SexSelect } from "@/components/livestock-sex-select"

function speciesTempLine(species: Species, prefs: UnitPrefs) {
  return formatTempRange(species.temp_min, species.temp_max, prefs)
}

export function LivestockAsk({
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
  const fw = tank.water_type === "freshwater"
  const examples = useMemo(() => suggestAskPrompts(tank, livestock, 6), [tank, livestock])
  const [ask, setAsk] = useState("")
  const prefs = useUnits()

  const answer = useMemo(() => {
    if (!ask.trim()) return null
    return askLivestock(ask, catalog, tank, livestock, latest, 8)
  }, [ask, catalog, tank, livestock, latest])

  const unitFields = (
    <>
      <input type="hidden" name="volume_unit" value={prefs.volume} />
      <input type="hidden" name="length_unit" value={prefs.length} />
      <input type="hidden" name="temp_unit" value={prefs.temp} />
    </>
  )

  const placeholder = examples[0] ?? (fw ? "Ask what to add next…" : "Ask what to add next…")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ask your tank</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Type a stocking question in plain language. Suggested questions below update from this tank’s
          stock, cleanup gaps, size, and bioload headroom.
        </p>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={ask}
            onChange={(event) => setAsk(event.target.value)}
            placeholder={placeholder}
            className={ask.trim() ? "h-11 pr-10 pl-9" : "h-11 pl-9"}
            aria-label="Ask what to add to this tank"
          />
          {ask.trim() ? (
            <button
              type="button"
              onClick={() => setAsk("")}
              className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear question"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {examples.map((example) => (
            <Button
              key={example}
              type="button"
              size="sm"
              variant={ask === example ? "secondary" : "outline"}
              className="h-8 max-w-full text-xs whitespace-normal"
              onClick={() => setAsk(example)}
            >
              {example}
            </Button>
          ))}
        </div>

        {answer ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">{answer.intent.summary}</p>
              {answer.note ? <p className="mt-1 text-xs text-primary/90">{answer.note}</p> : null}
              {answer.results.length === 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Nothing in the catalog currently passes compatibility and bioload for that ask. Try a
                  broader question, or free up bioload first.
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">
                  Showing {answer.results.length} ranked compatible pick
                  {answer.results.length === 1 ? "" : "s"}.
                </p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
            {answer.results.map((item) => (
              <form
                key={`ask-${item.species.id}`}
                action={addLivestock}
                className="rounded-xl border border-primary/10 bg-background/40 p-3"
              >
                <input type="hidden" name="tank_id" value={tank.id} />
                <input type="hidden" name="species_id" value={item.species.id} />
                {unitFields}
                <div className="flex min-w-0 items-start gap-3">
                  <SpeciesImage
                    src={item.species.image_url}
                    alt={item.species.common_name}
                    speciesId={item.species.id}
                    commonName={item.species.common_name}
                    scientificName={item.species.scientific_name}
                    kind={item.species.kind}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{item.species.common_name}</div>
                    {item.species.scientific_name ? (
                      <p className="text-xs text-muted-foreground italic">{item.species.scientific_name}</p>
                    ) : null}
                    <p className="text-sm text-muted-foreground">{item.reasons[0]}</p>
                    {item.reasons[1] ? (
                      <p className="text-xs text-muted-foreground">{item.reasons[1]}</p>
                    ) : null}
                    {speciesTempLine(item.species, prefs) ? (
                      <p className="text-xs text-muted-foreground">
                        Recommended temp {speciesTempLine(item.species, prefs)}
                      </p>
                    ) : null}
                    {item.projectedBioloadPercent != null ? (
                      <p className="text-xs text-muted-foreground">
                        Would put bioload at {Math.round(item.projectedBioloadPercent)}%
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <div>
                    <Label htmlFor={`ask-name-${item.species.id}`}>
                      {item.species.kind === "fish" ? "Fish name" : "Name"}
                    </Label>
                    <Input
                      id={`ask-name-${item.species.id}`}
                      name="nickname"
                      placeholder="Optional"
                      className="w-36"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`ask-qty-${item.species.id}`}>Qty</Label>
                    <Input
                      id={`ask-qty-${item.species.id}`}
                      name="quantity"
                      type="number"
                      min={1}
                      defaultValue={1}
                      className="w-20"
                    />
                  </div>
                  {item.species.kind === "fish" || item.species.kind === "invert" ? (
                    <div>
                      <Label htmlFor={`ask-sex-${item.species.id}`}>Sex</Label>
                      <SexSelect id={`ask-sex-${item.species.id}`} defaultValue="unknown" />
                    </div>
                  ) : null}
                  {item.species.kind === "fish" ? (
                    <div>
                      <Label htmlFor={`ask-len-${item.species.id}`}>Size ({lengthLabel(prefs)})</Label>
                      <Input
                        id={`ask-len-${item.species.id}`}
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
                      <Label htmlFor={`ask-coral-${item.species.id}`}>Size</Label>
                      <select
                        id={`ask-coral-${item.species.id}`}
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
                  <SubmitButton size="sm" pendingLabel="Adding…" successMessage="Added to tank">
                    Add
                  </SubmitButton>
                </div>
              </form>
            ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
