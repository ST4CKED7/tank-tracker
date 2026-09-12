"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { logTest, toggleFavoriteTestKit } from "@/lib/actions"
import { parameterMeta, type ParameterKey, type WaterType } from "@/lib/parameters"
import {
  KIT_CATEGORY_LABEL,
  KIT_DISCLAIMER,
  defaultKitFor,
  isKitId,
  kitsFor,
  normalizeFavoriteKits,
  DEFAULT_FAVORITE_KIT,
  type KitCategory,
  type KitId,
  type TestGuide,
  TEST_GUIDES,
} from "@/lib/kits"
import { Button } from "@/components/ui/button"
import { SubmitButton } from "@/components/submit-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useUnits } from "@/components/units-provider"
import { formatTimerClock, useTestTimers } from "@/components/test-timer-provider"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

const MANUAL_KITS: KitId[] = ["other", "instruments"]

const CATEGORY_ORDER: KitCategory[] = ["liquid", "titration", "digital", "strips", "instrument"]

type KitItem = ReturnType<typeof kitsFor>[number]

function kitStorageKey(tankId: string) {
  return `tt-selected-kit:${tankId}`
}

function guideStorageKey(tankId: string) {
  return `tt-selected-guide:${tankId}`
}

function readStoredKit(tankId: string, waterType: WaterType): KitId | null {
  if (typeof window === "undefined") return null
  const raw = sessionStorage.getItem(kitStorageKey(tankId))
  if (!isKitId(raw)) return null
  return kitsFor(waterType).some((item) => item.id === raw) ? raw : null
}

export function TestLogger({
  tankId,
  waterType = "saltwater",
  favoriteKitIds = null,
  defaultKitId = null,
}: {
  tankId: string
  waterType?: WaterType
  favoriteKitIds?: string[] | null
  /** @deprecated Prefer favoriteKitIds */
  defaultKitId?: string | null
}) {
  const availableKits = useMemo(() => kitsFor(waterType), [waterType])
  const favoritesKey = Array.isArray(favoriteKitIds)
    ? favoriteKitIds.join("\0")
    : favoriteKitIds == null
      ? ""
      : String(favoriteKitIds)
  const initialFavorites = useMemo(
    () =>
      normalizeFavoriteKits(
        favoriteKitIds != null ? favoriteKitIds : [defaultKitId, DEFAULT_FAVORITE_KIT],
        waterType,
      ),
    // favoritesKey captures list contents; avoid resetting on new array identity after each save
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [favoritesKey, defaultKitId, waterType],
  )
  const resolvedDefault = defaultKitFor(waterType, initialFavorites[0] ?? defaultKitId)
  const [kit, setKitState] = useState<KitId>(resolvedDefault)
  const [favorites, setFavorites] = useState<KitId[]>(initialFavorites)
  const [guideId, setGuideIdState] = useState("")
  const [drops, setDrops] = useState(20)
  const [value, setValue] = useState(waterType === "freshwater" ? "7.2" : "8.2")
  const [pendingFavorite, startFavorite] = useTransition()
  const lastKitForGuides = useRef<KitId | null>(null)

  function setKit(next: KitId) {
    setKitState(next)
    try {
      sessionStorage.setItem(kitStorageKey(tankId), next)
    } catch {
      /* ignore quota / private mode */
    }
  }

  function setGuideId(next: string) {
    setGuideIdState(next)
    try {
      sessionStorage.setItem(guideStorageKey(tankId), `${kit}:${next}`)
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    const stored = readStoredKit(tankId, waterType)
    if (stored) setKitState(stored)
  }, [tankId, waterType])

  useEffect(() => {
    const nextFavorites = normalizeFavoriteKits(
      favoriteKitIds != null ? favoriteKitIds : [defaultKitId, DEFAULT_FAVORITE_KIT],
      waterType,
    )
    setFavorites(nextFavorites)
    // Keep the current kit after logging (revalidate refreshes props). Only fall back
    // if the selection is no longer available for this water type.
    setKitState((current) => {
      if (kitsFor(waterType).some((item) => item.id === current)) return current
      const stored = readStoredKit(tankId, waterType)
      if (stored) return stored
      return defaultKitFor(waterType, nextFavorites[0] ?? defaultKitId)
    })
  }, [waterType, favoritesKey, defaultKitId, favoriteKitIds, tankId])

  const guides = useMemo(() => TEST_GUIDES.filter((guide) => guide.kit === kit), [kit])
  const guide = TEST_GUIDES.find((item) => item.id === guideId) ?? guides[0]
  const isManual = MANUAL_KITS.includes(kit)

  useEffect(() => {
    if (guides.length === 0) return

    const kitChanged = lastKitForGuides.current !== kit
    lastKitForGuides.current = kit

    if (!kitChanged && guides.some((item) => item.id === guideId)) return

    let nextGuide = guides[0]
    try {
      const stored = sessionStorage.getItem(guideStorageKey(tankId))
      if (stored?.startsWith(`${kit}:`)) {
        const id = stored.slice(kit.length + 1)
        nextGuide = guides.find((item) => item.id === id) ?? guides[0]
      }
    } catch {
      /* ignore */
    }

    setGuideIdState(nextGuide.id)
    if (nextGuide.method === "titration") setDrops(nextGuide.parameter === "alkalinity" ? 8 : 20)
    if (nextGuide.colorValues?.[0] != null) {
      const preferred = waterType === "freshwater" ? 7.2 : 8.2
      const match = nextGuide.colorValues.find((v) => v === preferred)
      setValue(String(match ?? nextGuide.colorValues[0]))
    } else if (nextGuide.method !== "titration") {
      setValue(waterType === "freshwater" ? "7.2" : "8.2")
    }
  }, [kit, guides, waterType, tankId, guideId])

  const computed =
    guide?.method === "titration" && guide.titration
      ? Number((drops * guide.titration.dropUnit).toFixed(2))
      : Number(value)

  const favoriteSet = useMemo(() => new Set(favorites), [favorites])

  const favoriteItems = useMemo(
    () =>
      favorites
        .map((id) => availableKits.find((item) => item.id === id))
        .filter((item): item is KitItem => Boolean(item)),
    [favorites, availableKits],
  )

  const grouped = useMemo(() => {
    const map = new Map<KitCategory, KitItem[]>()
    for (const category of CATEGORY_ORDER) map.set(category, [])
    for (const item of availableKits) {
      if (favoriteSet.has(item.id)) continue
      map.get(item.category)?.push(item)
    }
    return CATEGORY_ORDER.map((category) => ({
      category,
      label: KIT_CATEGORY_LABEL[category],
      items: map.get(category) ?? [],
    })).filter((group) => group.items.length > 0)
  }, [availableKits, favoriteSet])

  function toggleFavorite(nextKit: KitId) {
    const fd = new FormData()
    fd.set("tank_id", tankId)
    fd.set("kit", nextKit)
    fd.set("water_type", waterType)
    startFavorite(async () => {
      await toggleFavoriteTestKit(fd)
      setFavorites((current) => {
        const set = new Set(current)
        if (set.has(nextKit)) set.delete(nextKit)
        else set.add(nextKit)
        return normalizeFavoriteKits([...set], waterType)
      })
    })
  }

  function renderKitRow(item: KitItem) {
    const selected = kit === item.id
    const isFavorite = favoriteSet.has(item.id)
    return (
      <div
        key={item.id}
        className={cn(
          "flex min-h-11 w-full items-stretch gap-1 rounded-xl border transition-colors",
          selected ? "border-primary bg-primary/10 shadow-sm" : "hover:bg-muted/60",
        )}
      >
        <button
          type="button"
          onClick={() => setKit(item.id)}
          className="min-w-0 flex-1 px-3 py-2.5 text-left text-sm"
        >
          <div className="font-medium leading-snug">{item.shortLabel}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">{item.blurb}</div>
          <div className="mt-1 text-[11px] text-muted-foreground/90">{item.tests.join(" · ")}</div>
        </button>
        <button
          type="button"
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          aria-label={isFavorite ? `Unfavorite ${item.shortLabel}` : `Favorite ${item.shortLabel}`}
          aria-pressed={isFavorite}
          disabled={pendingFavorite}
          onClick={(event) => {
            event.stopPropagation()
            toggleFavorite(item.id)
          }}
          className={cn(
            "flex w-11 shrink-0 items-center justify-center rounded-r-[0.7rem] border-l border-transparent transition-colors",
            isFavorite
              ? "text-amber-500"
              : "text-muted-foreground hover:bg-background/70 hover:text-amber-500",
            pendingFavorite && "opacity-60",
          )}
        >
          <Star className={cn("size-4", isFavorite && "fill-current")} />
        </button>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Choose a kit or method</CardTitle>
          <CardDescription>
            Star the kits you use — they pin under Favorites. Instruments starts starred so salinity, temperature, and
            probes are easy to find.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {favoriteItems.length > 0 ? (
            <div className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Favorites
              </div>
              <div className="space-y-2">{favoriteItems.map(renderKitRow)}</div>
            </div>
          ) : null}

          {grouped.map((group) => (
            <div key={group.category} className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {group.label}
              </div>
              <div className="space-y-2">{group.items.map(renderKitRow)}</div>
            </div>
          ))}
          <p className="text-[11px] text-muted-foreground">{KIT_DISCLAIMER}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isManual ? "Log a reading" : (guide?.title ?? "Pick a test")}</CardTitle>
          <CardDescription>
            {isManual
              ? availableKits.find((item) => item.id === kit)?.label ?? "Manual entry"
              : (guide?.kitLabel ?? "Guided test")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isManual && guides.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {guides.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  size="sm"
                  variant={guide?.id === item.id ? "default" : "outline"}
                  onClick={() => {
                    setGuideId(item.id)
                    if (item.method === "titration") setDrops(item.parameter === "alkalinity" ? 8 : 20)
                    if (item.colorValues?.[0] != null) setValue(String(item.colorValues[0]))
                    else setValue("")
                  }}
                >
                  {item.title}
                </Button>
              ))}
            </div>
          ) : null}

          {isManual ? (
            <ManualParams tankId={tankId} waterType={waterType} kit={kit} />
          ) : guide ? (
            <>
              <GuideSteps guide={guide} />
              <LogForm
                tankId={tankId}
                guide={guide}
                drops={drops}
                setDrops={setDrops}
                value={value}
                setValue={setValue}
                computed={computed}
                waterType={waterType}
              />
            </>
          ) : (
            <ManualParams tankId={tankId} waterType={waterType} kit={kit} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function GuideSteps({ guide }: { guide: TestGuide }) {
  const { startTimer } = useTestTimers()
  const shakeLabel = `Shake · ${guide.title}`
  const waitLabel = `Wait · ${guide.title}`

  return (
    <div className="space-y-3">
      <ol className="list-decimal space-y-2 pl-5 text-sm">
        {guide.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      {guide.tips.length ? (
        <ul className="space-y-1 rounded-xl border border-primary/10 bg-primary/5 p-3 text-sm text-muted-foreground">
          {guide.tips.map((tip) => (
            <li key={tip}>• {tip}</li>
          ))}
        </ul>
      ) : null}
      {guide.waitSeconds || guide.shakeSeconds ? (
        <div className="flex flex-wrap items-center gap-2">
          {guide.shakeSeconds ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                startTimer({
                  kind: "shake",
                  label: `${guide.kitLabel} · ${shakeLabel}`,
                  durationSeconds: guide.shakeSeconds!,
                })
              }
            >
              Start shake ({formatTimerClock(guide.shakeSeconds)})
            </Button>
          ) : null}
          {guide.waitSeconds ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                startTimer({
                  kind: "wait",
                  label: `${guide.kitLabel} · ${waitLabel}`,
                  durationSeconds: guide.waitSeconds!,
                })
              }
            >
              Start wait ({formatTimerClock(guide.waitSeconds)})
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function LogForm({
  tankId,
  guide,
  drops,
  setDrops,
  value,
  setValue,
  computed,
  waterType,
}: {
  tankId: string
  guide: TestGuide
  drops: number
  setDrops: (n: number) => void
  value: string
  setValue: (s: string) => void
  computed: number
  waterType: WaterType
}) {
  const system = useUnits()
  const meta = parameterMeta(system, waterType)[guide.parameter]
  const colors = guide.colorValues

  return (
    <form action={logTest} className="grid gap-3 rounded-xl border border-primary/10 bg-background/40 p-4 sm:grid-cols-2">
      <input type="hidden" name="tank_id" value={tankId} />
      <input type="hidden" name="parameter" value={guide.parameter} />
      <input type="hidden" name="unit" value={meta.unit} />
      <input type="hidden" name="source_kit" value={guide.kit} />
      {guide.method === "titration" && guide.titration ? (
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="drops">Drops of titrant</Label>
          <Input
            id="drops"
            type="number"
            min={0}
            step={1}
            value={drops}
            onChange={(e) => setDrops(Number(e.target.value) || 0)}
          />
          <p className="text-sm text-muted-foreground">
            Result: <span className="font-medium text-foreground">{computed}</span> {guide.titration.unit}
            {" "}({guide.titration.startColor} → {guide.titration.endColor})
          </p>
          <p className="text-xs text-muted-foreground">
            Or enter the booklet result below if your drop factor differs.
          </p>
          <Label htmlFor="override" className="text-xs">
            Override value (optional)
          </Label>
          <Input
            id="override"
            name="value"
            type="number"
            step="0.01"
            placeholder={String(computed)}
            defaultValue={computed}
            key={`${guide.id}-${computed}`}
          />
        </div>
      ) : (
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="value">
            {meta.label} ({meta.unit || "—"})
          </Label>
          {colors?.length ? (
            <div className="space-y-2">
              {(() => {
                const isCustom = !colors.some((color) => String(color) === value)
                return (
                  <>
                    <select
                      id="value"
                      name={isCustom ? undefined : "value"}
                      className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                      value={isCustom ? "__custom" : value}
                      onChange={(e) => {
                        if (e.target.value === "__custom") {
                          setValue("")
                          return
                        }
                        setValue(e.target.value)
                      }}
                    >
                      {colors.map((color) => (
                        <option key={color} value={String(color)}>
                          {color}
                        </option>
                      ))}
                      <option value="__custom">Custom…</option>
                    </select>
                    {isCustom ? (
                      <Input
                        name="value"
                        type="number"
                        step="0.1"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="e.g. 7.8"
                        required
                      />
                    ) : null}
                  </>
                )
              })()}
            </div>
          ) : (
            <Input
              id="value"
              name="value"
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />
          )}
        </div>
      )}
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" placeholder="Optional — kit lot, time of day, etc." />
      </div>
      <SubmitButton className="min-h-11" pendingLabel="Saving…" successMessage="Reading saved">
        Save reading
      </SubmitButton>
    </form>
  )
}

function manualKeys(waterType: WaterType, kit: KitId): ParameterKey[] {
  if (kit === "instruments") {
    return waterType === "freshwater"
      ? ["temperature", "ph"]
      : ["salinity", "temperature", "ph"]
  }
  return waterType === "freshwater"
    ? ["ph", "ammonia", "nitrite", "nitrate", "alkalinity", "temperature"]
    : ["ph", "ammonia", "nitrite", "nitrate", "calcium", "alkalinity", "phosphate", "salinity", "temperature"]
}

function ManualParams({
  tankId,
  waterType,
  kit,
}: {
  tankId: string
  waterType: WaterType
  kit: KitId
}) {
  const system = useUnits()
  const keys = manualKeys(waterType, kit)
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {keys.map((parameter) => {
        const meta = parameterMeta(system, waterType)[parameter]
        return (
          <form key={parameter} action={logTest} className="space-y-3 rounded-xl border border-primary/10 bg-background/40 p-4">
            <input type="hidden" name="tank_id" value={tankId} />
            <input type="hidden" name="parameter" value={parameter} />
            <input type="hidden" name="unit" value={meta.unit} />
            <input type="hidden" name="source_kit" value={kit} />
            {parameter === "temperature" ? (
              <input type="hidden" name="temp_unit" value={system.temp} />
            ) : null}
            <Label htmlFor={`${kit}-${parameter}`}>
              {meta.label} ({meta.unit})
            </Label>
            <Input
              id={`${kit}-${parameter}`}
              name="value"
              type="number"
              step="0.01"
              required
              placeholder={
                parameter === "salinity"
                  ? "35"
                  : parameter === "alkalinity"
                    ? waterType === "freshwater"
                      ? "5"
                      : "8"
                    : parameter === "calcium"
                      ? "420"
                      : parameter === "temperature"
                        ? system.temp === "C"
                          ? "26"
                          : "78"
                        : undefined
              }
            />
            <p className="text-xs text-muted-foreground">
              {parameter === "salinity"
                ? "Refractometer or conductivity meter. Natural seawater ≈ 35 ppt (1.026 SG)."
                : parameter === "temperature"
                  ? system.temp === "C"
                    ? "Digital thermometer or controller readout (°C)."
                    : "Digital thermometer or controller readout (°F)."
                  : parameter === "ph" && kit === "instruments"
                    ? "Calibrated pH probe or meter."
                    : "Enter the value from your kit, strip, or meter."}
            </p>
            <SubmitButton className="min-h-11" pendingLabel="Saving…" successMessage={`${meta.label} saved`}>
              Save {meta.label}
            </SubmitButton>
          </form>
        )
      })}
    </div>
  )
}
