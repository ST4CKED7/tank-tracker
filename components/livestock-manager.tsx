"use client"

import { addCustomSpecies, addLivestock, removeLivestock, updateLivestock } from "@/lib/actions"
import {
  CORAL_SIZE_LABELS,
  LIVESTOCK_SEX_LABELS,
  type CoralSize,
  type LivestockRow,
  type LivestockSex,
  type Species,
  type Tank,
} from "@/lib/bioload"
import { compatibilityCheck } from "@/lib/compatibility"
import type { ParameterKey } from "@/lib/parameters"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import { SubmitButton } from "@/components/submit-button"
import { withActionToast } from "@/components/form-success-toast"
import { CompatibilityWarnings, guardCompatSubmit } from "@/components/compatibility-warnings"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useEffect, useMemo, useState } from "react"
import { useUnits } from "@/components/units-provider"
import { displayLength, formatLength, formatTempRange, formatVolume, lengthLabel, volumeLabel, type UnitPrefs } from "@/lib/units"
import { Badge } from "@/components/ui/badge"
import { SpeciesImage } from "@/components/species-image"
import { cn } from "@/lib/utils"
import { staggerStyle } from "@/lib/motion"
import { ChevronDown, Fish } from "lucide-react"
import { LivestockAsk } from "@/components/livestock-ask"
import { SexSelect } from "@/components/livestock-sex-select"

type KindFilter = "all" | "fish" | "coral" | "invert" | "plant"

const KIND_ORDER: KindFilter[] = ["fish", "coral", "invert", "plant"]

function tankPanelStorageKey(tankId: string) {
  return `tt:livestock-in-tank-expanded:${tankId}`
}

function readTankPanelExpanded(tankId: string): boolean {
  if (typeof window === "undefined") return true
  try {
    const raw = localStorage.getItem(tankPanelStorageKey(tankId))
    if (raw === "0") return false
    if (raw === "1") return true
  } catch {
    /* ignore */
  }
  return true
}

function writeTankPanelExpanded(tankId: string, expanded: boolean) {
  try {
    localStorage.setItem(tankPanelStorageKey(tankId), expanded ? "1" : "0")
  } catch {
    /* ignore */
  }
}

function kindBadgeClass(kind: string) {
  if (kind === "fish") return "border-teal-500/40 bg-teal-500/15 text-teal-800 dark:text-teal-200"
  if (kind === "coral") return "border-orange-400/40 bg-orange-400/15 text-orange-800 dark:text-orange-200"
  if (kind === "plant") return "border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
  return "border-violet-500/40 bg-violet-500/15 text-violet-800 dark:text-violet-200"
}

function sexBadgeClass(sex: LivestockSex) {
  if (sex === "male") return "border-sky-500/40 bg-sky-500/15 text-sky-900 dark:text-sky-100"
  if (sex === "female") return "border-rose-400/40 bg-rose-400/15 text-rose-900 dark:text-rose-100"
  if (sex === "mixed") return "border-amber-500/40 bg-amber-500/15 text-amber-950 dark:text-amber-100"
  return "border-muted-foreground/30 bg-muted/40 text-muted-foreground"
}

function speciesTempLine(species: Species, prefs: UnitPrefs) {
  return formatTempRange(species.temp_min, species.temp_max, prefs)
}

function kindLabel(kind: KindFilter) {
  if (kind === "all") return "All"
  if (kind === "fish") return "Fish"
  if (kind === "coral") return "Corals"
  if (kind === "invert") return "Inverts"
  return "Plants"
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
  const [kind, setKind] = useState<KindFilter>("all")
  const [tankKind, setTankKind] = useState<KindFilter>("all")
  const [category, setCategory] = useState<string>("all")
  const [tankExpanded, setTankExpanded] = useState(true)
  const [tankPrefReady, setTankPrefReady] = useState(false)
  const prefs = useUnits()

  useEffect(() => {
    setTankExpanded(readTankPanelExpanded(tank.id))
    setTankPrefReady(true)
  }, [tank.id])

  function toggleTankExpanded() {
    setTankExpanded((prev) => {
      const next = !prev
      writeTankPanelExpanded(tank.id, next)
      return next
    })
  }

  // Categories available for the active kind, so the group picker stays relevant.
  const categoriesForKind = useMemo(() => {
    const set = new Set<string>()
    for (const species of catalog) {
      if (kind !== "all" && species.kind !== kind) continue
      if (species.category) set.add(species.category)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [catalog, kind])

  const filtered = catalog.filter((species) => {
    const hay = `${species.common_name} ${species.scientific_name ?? ""} ${species.notes ?? ""}`.toLowerCase()
    return (
      hay.includes(query.toLowerCase()) &&
      (kind === "all" || species.kind === kind) &&
      (category === "all" || species.category === category)
    )
  })

  // Group the catalog by category for easier browsing (esp. large freshwater lists).
  const grouped = useMemo(() => {
    const map = new Map<string, Species[]>()
    for (const species of filtered) {
      const key = species.category ?? "Other"
      const list = map.get(key)
      if (list) list.push(species)
      else map.set(key, [species])
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [filtered])

  function selectKind(next: KindFilter) {
    setKind(next)
    setCategory("all")
  }

  const tankCounts = useMemo(() => {
    const counts: Record<KindFilter, number> = { all: livestock.length, fish: 0, coral: 0, invert: 0, plant: 0 }
    for (const item of livestock) {
      const k = item.species.kind as Exclude<KindFilter, "all">
      if (k in counts) counts[k] += 1
    }
    return counts
  }, [livestock])

  const tankLivestock = useMemo(() => {
    const rows = tankKind === "all" ? livestock : livestock.filter((item) => item.species.kind === tankKind)
    return [...rows].sort((a, b) => {
      const ai = KIND_ORDER.indexOf(a.species.kind as KindFilter)
      const bi = KIND_ORDER.indexOf(b.species.kind as KindFilter)
      if (ai !== bi) return ai - bi
      return a.species.common_name.localeCompare(b.species.common_name)
    })
  }, [livestock, tankKind])

  const compatById = useMemo(() => {
    const map = new Map<string, ReturnType<typeof compatibilityCheck>>()
    for (const species of filtered) {
      map.set(species.id, compatibilityCheck(species, tank, livestock, latest))
    }
    return map
  }, [filtered, tank, livestock, latest])

  const unitFields = (
    <>
      <input type="hidden" name="volume_unit" value={prefs.volume} />
      <input type="hidden" name="length_unit" value={prefs.length} />
      <input type="hidden" name="temp_unit" value={prefs.temp} />
    </>
  )

  return (
    <div className="space-y-6">
      <LivestockAsk tank={tank} livestock={livestock} catalog={catalog} latest={latest} />
      <Card>
        <CardHeader
          role="button"
          tabIndex={0}
          onClick={toggleTankExpanded}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              toggleTankExpanded()
            }
          }}
          aria-expanded={tankExpanded}
          aria-controls="in-the-tank-panel"
          className="cursor-pointer gap-3 select-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex min-w-0 items-center gap-2">
              In the tank
              {livestock.length > 0 ? (
                <span className="text-sm font-normal text-muted-foreground tabular-nums">
                  ({livestock.length})
                </span>
              ) : null}
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform",
                  tankExpanded && "rotate-180",
                )}
              />
            </CardTitle>
            {tankPrefReady && !tankExpanded && livestock.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                {[
                  tankCounts.fish ? `${tankCounts.fish} fish` : null,
                  tankCounts.coral ? `${tankCounts.coral} coral` : null,
                  tankCounts.invert ? `${tankCounts.invert} invert` : null,
                  tankCounts.plant ? `${tankCounts.plant} plant` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            ) : null}
          </div>
          {tankExpanded && livestock.length > 0 ? (
            <div
              className="flex flex-wrap gap-1.5"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              {kindOptions.map((option) => (
                <Button
                  key={`tank-${option}`}
                  type="button"
                  size="sm"
                  variant={tankKind === option ? "default" : "outline"}
                  className="h-8"
                  onClick={() => setTankKind(option)}
                >
                  {kindLabel(option)}
                  <span className="ml-1.5 tabular-nums opacity-70">{tankCounts[option]}</span>
                </Button>
              ))}
            </div>
          ) : null}
        </CardHeader>
        {tankExpanded ? (
        <CardContent id="in-the-tank-panel" className="tt-stagger space-y-3">
          {livestock.length === 0 ? (
            <EmptyState
              icon={<Fish className="size-6" />}
              title={fw ? "Nothing stocked yet" : "Your reef list is empty"}
              description={
                fw
                  ? "Ask your tank above, or search the catalog for fish, plants, and cleanup crew."
                  : "Ask your tank above, or add fish, coral, and cleanup crew from the catalog."
              }
              className="py-6 shadow-none"
            />
          ) : null}
          {livestock.length > 0 && tankLivestock.length === 0 ? (
            <p className="text-sm text-muted-foreground">No {kindLabel(tankKind).toLowerCase()} in this tank yet.</p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tankLivestock.map((item, index) => {
            const lengthInches =
              item.current_length_inches != null
                ? Number(item.current_length_inches)
                : item.species.kind === "fish"
                  ? Number(item.species.adult_length_inches ?? 0) || null
                  : null
            return (
              <div
                key={item.id}
                style={staggerStyle(index)}
                className="space-y-3 rounded-xl border border-primary/10 bg-background/40 p-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <SpeciesImage
                      src={item.species.image_url}
                      alt={item.species.common_name}
                      speciesId={item.species.id}
                      commonName={item.species.common_name}
                      scientificName={item.species.scientific_name}
                      kind={item.species.kind}
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
                        {item.species.kind === "fish" || item.species.kind === "invert" ? (
                          <Badge variant="outline" className={sexBadgeClass(item.sex ?? "unknown")}>
                            {LIVESTOCK_SEX_LABELS[item.sex ?? "unknown"]}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="text-sm text-muted-foreground">{item.species.scientific_name}</div>
                      {item.nickname ? (
                        <div className="text-sm text-muted-foreground">Name: {item.nickname}</div>
                      ) : null}
                      {(() => {
                        const temp = speciesTempLine(item.species, prefs)
                        return temp ? (
                          <div className="text-sm text-muted-foreground">Recommended temp {temp}</div>
                        ) : null
                      })()}
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

                {(item.species.kind === "fish" || item.species.kind === "coral" || item.species.kind === "invert") ? (
                  <form
                    action={withActionToast(updateLivestock, "Updated")}
                    className="flex flex-wrap items-end gap-2 border-t border-primary/10 pt-3"
                  >
                    <input type="hidden" name="id" value={item.id} />
                    {unitFields}
                    <div className="space-y-1">
                      <Label htmlFor={`name-${item.id}`}>
                        {item.species.kind === "fish" ? "Fish name" : "Name"}
                      </Label>
                      <Input
                        id={`name-${item.id}`}
                        name="nickname"
                        defaultValue={item.nickname ?? ""}
                        placeholder="Optional"
                        className="w-36"
                      />
                    </div>
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
                    {item.species.kind === "fish" || item.species.kind === "invert" ? (
                      <div className="space-y-1">
                        <Label htmlFor={`sex-${item.id}`}>Sex</Label>
                        <SexSelect id={`sex-${item.id}`} defaultValue={item.sex ?? "unknown"} />
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
                        inputMode="numeric"
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
          </div>
        </CardContent>
        ) : null}
      </Card>

      <Card>
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
              <Button key={option} type="button" size="sm" variant={kind === option ? "default" : "outline"} onClick={() => selectKind(option)}>
                {option}
              </Button>
            ))}
          </div>
          {categoriesForKind.length > 1 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant={category === "all" ? "secondary" : "ghost"}
                className="h-8 rounded-full"
                onClick={() => setCategory("all")}
              >
                All groups
              </Button>
              {categoriesForKind.map((cat) => (
                <Button
                  key={cat}
                  type="button"
                  size="sm"
                  variant={category === cat ? "secondary" : "ghost"}
                  className="h-8 rounded-full"
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {filtered.length === 0
              ? `No matches in ${catalog.length} species. Try another name, or add a custom species below.`
              : `Showing ${filtered.length} of ${catalog.length}`}
          </p>
          <div className="space-y-5">
            {grouped.map(([groupName, speciesInGroup]) => (
              <div key={groupName} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{groupName}</h3>
                  <span className="text-xs text-muted-foreground">{speciesInGroup.length}</span>
                  <div className="h-px flex-1 bg-primary/10" />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {speciesInGroup.map((species) => {
                    const report = compatById.get(species.id) ?? {
                      severity: "ok" as const,
                      warnings: [],
                    }
                    return (
              <form
                key={species.id}
                action={withActionToast(addLivestock, "Added to tank")}
                onSubmit={(event) => guardCompatSubmit(report.severity, event)}
                className={cn(
                  "rounded-xl border border-primary/10 bg-card/70 p-3 text-sm shadow-sm border-l-4",
                  species.kind === "fish" && "border-l-teal-500",
                  species.kind === "coral" && "border-l-orange-400",
                  species.kind === "invert" && "border-l-violet-500",
                  species.kind === "plant" && "border-l-emerald-500",
                  report.severity === "block" && "border-destructive/30",
                  report.severity === "caution" && "border-amber-500/30",
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
                    kind={species.kind}
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
                      {speciesTempLine(species, prefs) ? ` · temp ${speciesTempLine(species, prefs)}` : null}
                      {fw ? null : ` · reef-safe ${species.reef_safe}`}
                      {species.kind === "fish" && species.adult_length_inches != null
                        ? ` · adult ${formatLength(Number(species.adult_length_inches), prefs)}`
                        : null}
                      {species.kind === "plant" && species.lighting ? ` · light ${species.lighting}` : null}
                    </p>
                  </div>
                </div>
                <CompatibilityWarnings report={report} className="mt-2" />
                <div className="mt-2 flex flex-wrap items-end gap-2">
                  <div>
                    <Label htmlFor={`name-${species.id}`}>
                      {species.kind === "fish" ? "Fish name" : "Name"}
                    </Label>
                    <Input
                      id={`name-${species.id}`}
                      name="nickname"
                      placeholder="Optional"
                      className="w-36"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`qty-${species.id}`}>Qty</Label>
                    <Input
                      id={`qty-${species.id}`}
                      name="quantity"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      defaultValue={1}
                      className="w-20"
                    />
                  </div>
                  {species.kind === "fish" || species.kind === "invert" ? (
                    <div>
                      <Label htmlFor={`sex-${species.id}`}>Sex</Label>
                      <SexSelect id={`sex-${species.id}`} defaultValue="unknown" />
                    </div>
                  ) : null}
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
                  <SubmitButton
                    size="sm"
                    variant={report.severity === "block" ? "destructive" : "default"}
                    pendingLabel="Adding…"
                  >
                    {report.severity === "block" ? "Add anyway" : "Add"}
                  </SubmitButton>
                </div>
              </form>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          <details className="rounded-lg border p-4">
            <summary className="cursor-pointer font-medium">Add a custom species</summary>
            <form
              action={withActionToast(addCustomSpecies, "Custom species saved")}
              className="mt-4 grid gap-3 sm:grid-cols-2"
            >
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
