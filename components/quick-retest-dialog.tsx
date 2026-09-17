"use client"

import { useMemo, useState } from "react"
import { FlaskConical } from "lucide-react"
import { logTest } from "@/lib/actions"
import { parameterMeta, type ParameterKey, type WaterType } from "@/lib/parameters"
import { resolvePreferredTest, type TestGuide } from "@/lib/kits"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SubmitButton } from "@/components/submit-button"
import { withActionToast } from "@/components/form-success-toast"
import { useUnits } from "@/components/units-provider"
import { formatTimerClock, useTestTimers } from "@/components/test-timer-provider"
import { cn } from "@/lib/utils"

export function QuickRetestButton({
  parameter,
  label,
  tankId,
  waterType,
  favoriteKitIds,
  defaultKitId,
  className,
}: {
  parameter: ParameterKey
  label: string
  tankId: string
  waterType: WaterType
  favoriteKitIds?: string[] | null
  defaultKitId?: string | null
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const preferred = useMemo(
    () => resolvePreferredTest(parameter, waterType, favoriteKitIds, defaultKitId),
    [parameter, waterType, favoriteKitIds, defaultKitId],
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`Retest ${label}`}
          title={`Retest ${label}`}
          className={cn(
            "relative inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors",
            // Invisible 44px-tall hit area so wet fingers don't need to be precise.
            "after:absolute after:inset-x-0 after:-inset-y-1.5",
            "hover:bg-muted hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            className,
          )}
        >
          <FlaskConical className="size-4" aria-hidden="true" />
        </button>
      </DialogTrigger>
      <DialogContent className="gap-2 overflow-hidden p-3 sm:max-w-md">
        <DialogHeader className="gap-0.5 pr-8 text-left">
          <DialogTitle className="text-base leading-tight">Retest {label}</DialogTitle>
          <DialogDescription className="text-xs leading-snug">Using {preferred.kitLabel}</DialogDescription>
        </DialogHeader>
        <QuickRetestBody
          key={`${parameter}-${preferred.kitId}-${open ? "open" : "closed"}`}
          tankId={tankId}
          waterType={waterType}
          parameter={parameter}
          kitId={preferred.kitId}
          guide={preferred.guide}
          onSaved={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function QuickRetestBody({
  tankId,
  waterType,
  parameter,
  kitId,
  guide,
  onSaved,
}: {
  tankId: string
  waterType: WaterType
  parameter: ParameterKey
  kitId: string
  guide: TestGuide | null
  onSaved: () => void
}) {
  const system = useUnits()
  const meta = parameterMeta(system, waterType)[parameter]
  const { startTimer } = useTestTimers()
  const [drops, setDrops] = useState(guide?.parameter === "alkalinity" ? 8 : 20)
  const [value, setValue] = useState(() => {
    if (guide?.colorValues?.[0] != null) return String(guide.colorValues[0])
    if (parameter === "ph") return waterType === "freshwater" ? "7.2" : "8.2"
    return ""
  })

  const computed =
    guide?.method === "titration" && guide.titration
      ? Number((drops * guide.titration.dropUnit).toFixed(2))
      : Number(value)

  const save = withActionToast(logTest, `${meta.label} saved`, { onSuccess: onSaved })

  const hasTimers = Boolean(guide?.waitSeconds || guide?.shakeSeconds || guide?.bottleShakeSeconds)

  return (
    <div className="space-y-2">
      {guide ? (
        <div className="space-y-1.5">
          <ol className="list-decimal space-y-0.5 pl-4 text-xs leading-snug text-muted-foreground marker:text-foreground/70">
            {guide.steps.map((step) => (
              <li key={step} className="pl-0.5 text-foreground/90">
                {step}
              </li>
            ))}
          </ol>
          {guide.tips[0] ? (
            <p className="text-[11px] leading-snug text-muted-foreground">{guide.tips[0]}</p>
          ) : null}
          {hasTimers ? (
            <div className="flex flex-wrap gap-1.5">
              {guide.bottleShakeSeconds ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() =>
                    startTimer({
                      kind: "bottle_shake",
                      testName: guide.title,
                      kitLabel: guide.kitLabel,
                      durationSeconds: guide.bottleShakeSeconds!,
                    })
                  }
                >
                  Bottle shake ({formatTimerClock(guide.bottleShakeSeconds)})
                </Button>
              ) : null}
              {guide.shakeSeconds ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() =>
                    startTimer({
                      kind: "shake",
                      testName: guide.title,
                      kitLabel: guide.kitLabel,
                      durationSeconds: guide.shakeSeconds!,
                    })
                  }
                >
                  Shake ({formatTimerClock(guide.shakeSeconds)})
                </Button>
              ) : null}
              {guide.waitSeconds ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() =>
                    startTimer({
                      kind: "wait",
                      testName: guide.title,
                      kitLabel: guide.kitLabel,
                      durationSeconds: guide.waitSeconds!,
                    })
                  }
                >
                  Wait ({formatTimerClock(guide.waitSeconds)})
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-xs leading-snug text-muted-foreground">
          {parameter === "salinity"
            ? "Use your refractometer or conductivity meter. Natural seawater ≈ 35 ppt (1.026 SG)."
            : parameter === "temperature"
              ? system.temp === "C"
                ? "Read your thermometer or controller (°C)."
                : "Read your thermometer or controller (°F)."
              : parameter === "ph"
                ? "Follow your preferred kit’s pH steps, then enter the reading below."
                : `Enter the ${meta.label} value from your preferred kit or meter.`}
        </p>
      )}

      <form action={save} className="grid gap-2 rounded-lg border border-primary/10 bg-background/40 p-2.5">
        <input type="hidden" name="tank_id" value={tankId} />
        <input type="hidden" name="parameter" value={parameter} />
        <input type="hidden" name="unit" value={meta.unit} />
        <input type="hidden" name="source_kit" value={guide?.kit ?? kitId} />
        {parameter === "temperature" ? (
          <input type="hidden" name="temp_unit" value={system.temp} />
        ) : null}

        {guide?.method === "titration" && guide.titration ? (
          <div className="grid grid-cols-[1fr_auto] items-end gap-2">
            <div className="space-y-1">
              <Label htmlFor={`quick-drops-${parameter}`} className="text-xs">
                Drops
              </Label>
              <Input
                id={`quick-drops-${parameter}`}
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                className="h-8"
                value={drops}
                onChange={(event) => setDrops(Number(event.target.value) || 0)}
              />
            </div>
            <p className="pb-1.5 text-xs tabular-nums text-muted-foreground">
              = <span className="font-medium text-foreground">{computed}</span> {guide.titration.unit}
            </p>
            <input type="hidden" name="value" value={computed} />
          </div>
        ) : guide?.colorValues?.length ? (
          <div className="space-y-1">
            <Label htmlFor={`quick-value-${parameter}`} className="text-xs">
              {meta.label} ({meta.unit || "—"})
            </Label>
            {(() => {
              const colors = guide.colorValues
              const isCustom = !colors.some((color) => String(color) === value)
              return (
                <>
                  <select
                    id={`quick-value-${parameter}`}
                    name={isCustom ? undefined : "value"}
                    className="h-8 w-full rounded-md border bg-background px-2.5 text-sm"
                    value={isCustom ? "__custom" : value}
                    onChange={(event) => {
                      if (event.target.value === "__custom") {
                        setValue("")
                        return
                      }
                      setValue(event.target.value)
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
                      className="h-8"
                      value={value}
                      onChange={(event) => setValue(event.target.value)}
                      placeholder="e.g. 7.8"
                      required
                    />
                  ) : null}
                </>
              )
            })()}
          </div>
        ) : (
          <div className="space-y-1">
            <Label htmlFor={`quick-value-${parameter}`} className="text-xs">
              {meta.label} ({meta.unit || "—"})
            </Label>
            <Input
              id={`quick-value-${parameter}`}
              name="value"
              type="number"
              step="0.01"
              className="h-8"
              value={value}
              onChange={(event) => setValue(event.target.value)}
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
          </div>
        )}

        <SubmitButton className="h-9 min-h-9" pendingLabel="Saving…">
          Save reading
        </SubmitButton>
      </form>
    </div>
  )
}
