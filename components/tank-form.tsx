"use client"

import { upsertTank } from "@/lib/actions"
import type { Tank } from "@/lib/bioload"
import { SubmitButton } from "@/components/submit-button"
import { TankIconGlyph, TANK_ICON_IDS, TANK_ICON_LABELS, parseTankIcon } from "@/components/tank-icon"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SUMP_MEDIA_OPTIONS, type SumpMediaId } from "@/lib/sump-media"
import { defaultTankType, profilesForWater } from "@/lib/tank-profiles"
import { defaultTimeZone, timeZoneGroups } from "@/lib/timezones"
import { displayVolume, unitPrefsFromTank, volumeLabel, type VolumeUnit } from "@/lib/units"
import { useUnits } from "@/components/units-provider"
import { cn } from "@/lib/utils"
import { useMemo, useState } from "react"

function initialSumpMedia(tank: Tank | null): SumpMediaId[] {
  if (!tank?.sump_media?.length) return []
  const allowed = new Set(SUMP_MEDIA_OPTIONS.map((o) => o.id))
  return tank.sump_media.filter((id): id is SumpMediaId => allowed.has(id as SumpMediaId))
}

export function TankForm({
  tank,
  mode = "auto",
  bare = false,
  formAction,
}: {
  tank: Tank | null
  mode?: "auto" | "create" | "edit"
  /** Skip Card chrome (e.g. inside a dialog). */
  bare?: boolean
  formAction?: (formData: FormData) => void | Promise<void>
}) {
  const activePrefs = useUnits()
  const prefs = tank ? unitPrefsFromTank(tank) : activePrefs
  const [volumeUnit, setVolumeUnit] = useState<VolumeUnit>(prefs.volume)
  const [waterType, setWaterType] = useState<"saltwater" | "freshwater">(
    tank?.water_type === "freshwater" ? "freshwater" : "saltwater",
  )
  const [hasSump, setHasSump] = useState(Boolean(tank?.has_sump))
  const [sumpMedia, setSumpMedia] = useState<SumpMediaId[]>(() => initialSumpMedia(tank))
  const [icon, setIcon] = useState(() => parseTankIcon(tank?.icon))
  const volumeDefault = tank ? displayVolume(Number(tank.gallons), volumeUnit) : volumeUnit === "L" ? 150 : 40
  const sumpVolumeDefault = tank?.has_sump
    ? displayVolume(Number(tank.sump_gallons), volumeUnit)
    : volumeUnit === "L"
      ? 40
      : 10
  const timezoneDefault = tank?.timezone || defaultTimeZone()
  const timezoneOptions = useMemo(() => {
    const groups = timeZoneGroups()
    if (timezoneDefault && !groups.some((g) => g.zones.includes(timezoneDefault))) {
      return [{ region: "Current", zones: [timezoneDefault] }, ...groups]
    }
    return groups
  }, [timezoneDefault])
  const isCreate = mode === "create" || (mode === "auto" && !tank)
  const title = isCreate ? (mode === "create" ? "Add a tank" : "Set up your tank") : "Tank settings"
  const description = isCreate
    ? "Each tank keeps its own livestock, tests, dosing, and gear. Switch tanks from the header."
    : "Changes apply to the active tank only. Display units are under Settings → Display units."

  function toggleMedia(id: SumpMediaId) {
    setSumpMedia((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  const fields = (
    <form action={formAction ?? upsertTank} className="grid gap-3 sm:grid-cols-2">
      {tank ? <input type="hidden" name="id" value={tank.id} /> : null}
      <input type="hidden" name="volume_unit" value={volumeUnit} />
      <input type="hidden" name="water_type" value={waterType} />
      <input type="hidden" name="has_sump" value={hasSump ? "true" : "false"} />
      <input type="hidden" name="icon" value={icon} />
      {sumpMedia.map((id) => (
        <input key={id} type="hidden" name="sump_media" value={id} />
      ))}
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={tank?.name ?? "Display tank"} required />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label>Icon</Label>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
          {TANK_ICON_IDS.map((id) => {
            const selected = icon === id
            return (
              <button
                key={id}
                type="button"
                title={TANK_ICON_LABELS[id]}
                aria-label={TANK_ICON_LABELS[id]}
                aria-pressed={selected}
                onClick={() => setIcon(id)}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-xl border transition-colors",
                  selected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
                )}
              >
                <TankIconGlyph icon={id} className="size-4" />
              </button>
            )
          })}
        </div>
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label>Water</Label>
        <div className="flex gap-2">
          {(["saltwater", "freshwater"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setWaterType(option)}
              className={`min-h-11 rounded-full px-3 py-1.5 text-sm capitalize transition-colors sm:min-h-0 ${waterType === option ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/80 text-muted-foreground hover:text-foreground"}`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label>Volume unit for this form</Label>
        <div className="flex gap-2">
          {(
            [
              { value: "gal" as const, label: "US gallons" },
              { value: "L" as const, label: "Liters" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setVolumeUnit(option.value)}
              className={`min-h-11 rounded-full px-3 py-1.5 text-sm transition-colors sm:min-h-0 ${volumeUnit === option.value ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/80 text-muted-foreground hover:text-foreground"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="volume">Display volume ({volumeLabel(volumeUnit)})</Label>
        <Input key={volumeUnit} id="volume" name="volume" type="number" step="0.1" defaultValue={volumeDefault} required />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="tank_type">Profile</Label>
        <select
          key={waterType}
          id="tank_type"
          name="tank_type"
          defaultValue={
            tank?.water_type === waterType
              ? tank.tank_type === "fowlr" && waterType === "freshwater"
                ? "community"
                : tank.tank_type
              : defaultTankType(waterType)
          }
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
        >
          {profilesForWater(waterType).map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Sets bioload headroom
          {waterType === "saltwater" ? " and reef-safe livestock checks" : ""}.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-primary/10 bg-muted/20 p-3 sm:col-span-2">
        <div className="space-y-1">
          <Label>Sump</Label>
          <div className="flex gap-2">
            {(
              [
                { value: false, label: "No sump" },
                { value: true, label: "Has sump" },
              ] as const
            ).map((option) => (
              <button
                key={String(option.value)}
                type="button"
                onClick={() => setHasSump(option.value)}
                className={`min-h-11 rounded-full px-3 py-1.5 text-sm transition-colors sm:min-h-0 ${hasSump === option.value ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/80 text-muted-foreground hover:text-foreground"}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Sump volume is added to bioload capacity. Water-change % still uses display volume.
          </p>
        </div>
        {hasSump ? (
          <>
            <div className="space-y-1">
              <Label htmlFor="sump_volume">Sump volume ({volumeLabel(volumeUnit)})</Label>
              <Input
                key={`sump-${volumeUnit}`}
                id="sump_volume"
                name="sump_volume"
                type="number"
                step="0.1"
                min="0"
                defaultValue={sumpVolumeDefault}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Media in sump</Label>
              <div className="flex flex-wrap gap-2">
                {SUMP_MEDIA_OPTIONS.map((option) => {
                  const selected = sumpMedia.includes(option.id)
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleMedia(option.id)}
                      className={`min-h-11 rounded-full px-3 py-1.5 text-sm transition-colors sm:min-h-0 ${selected ? "bg-primary text-primary-foreground shadow-sm" : "bg-background text-muted-foreground ring-1 ring-border hover:text-foreground"}`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        ) : null}
      </div>

      <div className="space-y-1">
        <Label htmlFor="water_change_percent">Water change %</Label>
        <Input
          id="water_change_percent"
          name="water_change_percent"
          type="number"
          step="0.1"
          defaultValue={tank?.water_change_percent ?? 10}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="water_change_interval_days">Every (days)</Label>
        <Input
          id="water_change_interval_days"
          name="water_change_interval_days"
          type="number"
          defaultValue={tank?.water_change_interval_days ?? 7}
        />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="timezone">Timezone</Label>
        <select
          id="timezone"
          name="timezone"
          defaultValue={timezoneDefault}
          className="h-9 w-full rounded-md border bg-background px-3 text-sm"
        >
          {timezoneOptions.map((group) => (
            <optgroup key={group.region} label={group.region}>
              {group.zones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone.replace(/_/g, " ")}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <SubmitButton className="min-h-11 sm:min-h-8" successMessage={isCreate ? "Tank created" : "Tank saved"}>
        {isCreate ? "Create tank" : "Save tank"}
      </SubmitButton>
    </form>
  )

  if (bare) return fields

  return (
    <Card className="shadow-lg shadow-primary/5">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{fields}</CardContent>
    </Card>
  )
}
