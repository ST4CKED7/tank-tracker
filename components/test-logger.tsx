"use client"

import { useEffect, useMemo, useState } from "react"
import { logTest } from "@/lib/actions"
import { API_COLOR_VALUES, parameterMeta, type ParameterKey, type WaterType } from "@/lib/parameters"
import { KIT_DISCLAIMER, kitsFor, TEST_GUIDES, type KitId, type TestGuide } from "@/lib/kits"
import { Button } from "@/components/ui/button"
import { SubmitButton } from "@/components/submit-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useUnits } from "@/components/units-provider"

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

export function TestLogger({ tankId, waterType = "saltwater" }: { tankId: string; waterType?: WaterType }) {
  const availableKits = useMemo(() => kitsFor(waterType), [waterType])
  const defaultKit = availableKits[0]?.id ?? "other"
  const [kit, setKit] = useState<KitId>(defaultKit)
  const [guideId, setGuideId] = useState("")
  const [drops, setDrops] = useState(20)
  const [value, setValue] = useState(waterType === "freshwater" ? "7.2" : "8.2")
  const [timerOn, setTimerOn] = useState(false)

  useEffect(() => {
    setKit(defaultKit)
  }, [defaultKit])

  const guides = useMemo(
    () => TEST_GUIDES.filter((guide) => guide.kit === kit),
    [kit],
  )
  const guide = TEST_GUIDES.find((item) => item.id === guideId) ?? guides[0]
  const waitLeft = useCountdown(guide?.waitSeconds, timerOn)
  const shakeLeft = useCountdown(guide?.shakeSeconds, timerOn)

  useEffect(() => {
    if (guides[0]) setGuideId(guides[0].id)
    setTimerOn(false)
  }, [kit, guides])

  const computed =
    guide?.method === "titration" && guide.titration
      ? drops * guide.titration.dropUnit
      : Number(value)

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Choose a kit</CardTitle>
          <CardDescription>{KIT_DISCLAIMER}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {availableKits.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setKit(item.id)}
              className={`min-h-11 w-full rounded-xl border px-3 py-2 text-left text-sm transition-colors ${kit === item.id ? "border-primary bg-primary/10 shadow-sm" : "hover:bg-muted/60"}`}
            >
              <div className="font-medium">{item.label}</div>
              <div className="text-muted-foreground">{item.tests.join(" · ")}</div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{guide?.title ?? "Other tests"}</CardTitle>
          <CardDescription>{guide?.kitLabel ?? "Manual entry"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {kit !== "other" ? (
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
                  }}
                >
                  {item.title}
                </Button>
              ))}
            </div>
          ) : null}

          {kit === "other" ? (
            <OtherParams tankId={tankId} waterType={waterType} />
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
          ) : null}
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
            <span className={shakeLeft === 0 && timerOn ? "text-primary font-medium" : ""}>
              Shake: {timerOn ? `${shakeLeft}s` : `${guide.shakeSeconds}s`}
            </span>
          ) : null}
          {guide.waitSeconds ? (
            <span className={waitLeft === 0 && timerOn ? "text-primary font-medium" : ""}>
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
  const colors = API_COLOR_VALUES[guide.parameter]

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
            value={drops}
            onChange={(e) => setDrops(Number(e.target.value) || 0)}
          />
          <p className="text-sm text-muted-foreground">
            Result: <span className="font-medium text-foreground">{computed}</span> {guide.titration.unit}
            {" "}({guide.titration.startColor} → {guide.titration.endColor})
          </p>
          <input type="hidden" name="value" value={computed} />
        </div>
      ) : (
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="value">{meta.label} ({meta.unit || "—"})</Label>
          {colors ? (
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
            <Input id="value" name="value" type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} required />
          )}
        </div>
      )}
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" placeholder="Optional" />
      </div>
      <SubmitButton className="min-h-11" pendingLabel="Saving…">
        Save reading
      </SubmitButton>
    </form>
  )
}

function OtherParams({ tankId, waterType }: { tankId: string; waterType: WaterType }) {
  const system = useUnits()
  const keys: ParameterKey[] =
    waterType === "freshwater" ? ["temperature", "alkalinity"] : ["salinity", "temperature"]
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {keys.map((parameter) => {
        const meta = parameterMeta(system, waterType)[parameter]
        return (
          <form key={parameter} action={logTest} className="space-y-3 rounded-xl border border-primary/10 bg-background/40 p-4">
            <input type="hidden" name="tank_id" value={tankId} />
            <input type="hidden" name="parameter" value={parameter} />
            <input type="hidden" name="unit" value={meta.unit} />
            <input type="hidden" name="source_kit" value="other" />
            <Label htmlFor={parameter}>{meta.label} ({meta.unit})</Label>
            <Input
              id={parameter}
              name="value"
              type="number"
              step="0.01"
              required
              placeholder={
                parameter === "salinity"
                  ? "35"
                  : parameter === "alkalinity"
                    ? "5"
                    : system.temp === "C"
                      ? "26"
                      : "78"
              }
            />
            <p className="text-xs text-muted-foreground">
              {parameter === "salinity"
                ? "Use a refractometer. Natural seawater is about 35 ppt (1.026 SG)."
                : parameter === "alkalinity"
                  ? "KH / carbonate hardness — many community tanks sit around 3–8 dKH."
                  : waterType === "freshwater"
                    ? system.temp === "C"
                      ? "Most tropical community tanks do best around 24–28°C."
                      : "Most tropical community tanks do best around 72–82°F."
                    : system.temp === "C"
                      ? "Most reefs do best around 24–27°C."
                      : "Most reefs do best around 76–80°F."}
            </p>
            <SubmitButton className="min-h-11" pendingLabel="Saving…">
              Save {meta.label}
            </SubmitButton>
          </form>
        )
      })}
    </div>
  )
}
