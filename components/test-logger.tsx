"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { logTest, setDefaultTestKit } from "@/lib/actions"
import { parameterMeta, type ParameterKey, type WaterType } from "@/lib/parameters"
import {
  KIT_CATEGORY_LABEL,
  KIT_DISCLAIMER,
  defaultKitFor,
  kitsFor,
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
import { Check, Star } from "lucide-react"
import { cn } from "@/lib/utils"

function useCountdown(seconds: number | undefined, active: boolean) {
  const [left, setLeft] = useState(seconds ?? 0)
  useEffect(() => {
    if (!active || !seconds) return
    setLeft(seconds)
    const id = window.setInterval(() => {
      setLeft((value) => (value <= 1 ? 0 : value - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [active, seconds])
  return left
}

const MANUAL_KITS: KitId[] = ["other", "instruments"]

const CATEGORY_ORDER: KitCategory[] = ["liquid", "titration", "digital", "strips", "instrument"]

export function TestLogger({
  tankId,
  waterType = "saltwater",
  defaultKitId = null,
}: {
  tankId: string
  waterType?: WaterType
  defaultKitId?: string | null
}) {
  const availableKits = useMemo(() => kitsFor(waterType), [waterType])
  const resolvedDefault = defaultKitFor(waterType, defaultKitId)
  const [kit, setKit] = useState<KitId>(resolvedDefault)
  const [savedDefault, setSavedDefault] = useState<KitId>(resolvedDefault)
  const [guideId, setGuideId] = useState("")
  const [drops, setDrops] = useState(20)
  const [value, setValue] = useState(waterType === "freshwater" ? "7.2" : "8.2")
  const [timerOn, setTimerOn] = useState(false)
  const [pendingDefault, startDefault] = useTransition()

  useEffect(() => {
    const next = defaultKitFor(waterType, defaultKitId)
    setKit(next)
    setSavedDefault(next)
  }, [waterType, defaultKitId])

  const guides = useMemo(() => TEST_GUIDES.filter((guide) => guide.kit === kit), [kit])
  const guide = TEST_GUIDES.find((item) => item.id === guideId) ?? guides[0]
  const waitLeft = useCountdown(guide?.waitSeconds, timerOn)
  const shakeLeft = useCountdown(guide?.shakeSeconds, timerOn)
  const isManual = MANUAL_KITS.includes(kit)

  useEffect(() => {
    const first = guides[0]
    if (first) {
      setGuideId(first.id)
      if (first.method === "titration") setDrops(first.parameter === "alkalinity" ? 8 : 20)
      if (first.colorValues?.[0] != null) setValue(String(first.colorValues[0]))
      else if (first.method !== "titration") setValue(waterType === "freshwater" ? "7.2" : "8.2")
    }
    setTimerOn(false)
  }, [kit, guides, waterType])

  const computed =
    guide?.method === "titration" && guide.titration
      ? Number((drops * guide.titration.dropUnit).toFixed(2))
      : Number(value)

  const grouped = useMemo(() => {
    const map = new Map<KitCategory, typeof availableKits>()
    for (const category of CATEGORY_ORDER) map.set(category, [])
    for (const item of availableKits) {
      map.get(item.category)?.push(item)
    }
    return CATEGORY_ORDER.map((category) => ({
      category,
      label: KIT_CATEGORY_LABEL[category],
      items: map.get(category) ?? [],
    })).filter((group) => group.items.length > 0)
  }, [availableKits])

  function saveDefault(nextKit: KitId) {
    const fd = new FormData()
    fd.set("tank_id", tankId)
    fd.set("kit", nextKit)
    startDefault(async () => {
      await setDefaultTestKit(fd)
      setSavedDefault(nextKit)
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Choose a kit or method</CardTitle>
          <CardDescription>{KIT_DISCLAIMER}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {grouped.map((group) => (
            <div key={group.category} className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {group.label}
              </div>
              <div className="space-y-2">
                {group.items.map((item) => {
                  const selected = kit === item.id
                  const isDefault = savedDefault === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setKit(item.id)}
                      className={cn(
                        "min-h-11 w-full rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                        selected ? "border-primary bg-primary/10 shadow-sm" : "hover:bg-muted/60",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium leading-snug">{item.shortLabel}</div>
                        {isDefault ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-primary ring-1 ring-primary/20">
                            <Star className="size-2.5 fill-current" />
                            Default
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{item.blurb}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground/90">{item.tests.join(" · ")}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="secondary"
            className="min-h-11 w-full"
            disabled={pendingDefault || savedDefault === kit}
            onClick={() => saveDefault(kit)}
          >
            {savedDefault === kit ? (
              <>
                <Check className="size-4" />
                Default kit
              </>
            ) : (
              <>
                <Star className="size-4" />
                {pendingDefault ? "Saving…" : "Set as my default"}
              </>
            )}
          </Button>
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
                    setTimerOn(false)
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
              <GuideSteps guide={guide} waitLeft={waitLeft} shakeLeft={shakeLeft} timerOn={timerOn} setTimerOn={setTimerOn} />
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

function GuideSteps({
  guide,
  waitLeft,
  shakeLeft,
  timerOn,
  setTimerOn,
}: {
  guide: TestGuide
  waitLeft: number
  shakeLeft: number
  timerOn: boolean
  setTimerOn: (v: boolean) => void
}) {
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
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Button type="button" variant="outline" size="sm" onClick={() => setTimerOn(true)}>
            Start timers
          </Button>
          {guide.shakeSeconds ? (
            <span className={shakeLeft === 0 && timerOn ? "font-medium text-primary" : ""}>
              Shake: {timerOn ? `${shakeLeft}s` : `${guide.shakeSeconds}s`}
            </span>
          ) : null}
          {guide.waitSeconds ? (
            <span className={waitLeft === 0 && timerOn ? "font-medium text-primary" : ""}>
              Wait: {timerOn ? `${waitLeft}s` : `${guide.waitSeconds}s`}
            </span>
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
            <select
              id="value"
              name="value"
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            >
              {colors.map((color) => (
                <option key={color} value={String(color)}>
                  {color}
                </option>
              ))}
            </select>
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
