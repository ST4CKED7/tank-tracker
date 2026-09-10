import { BioloadGauge } from "@/components/bioload-gauge"
import { CleanupCrewPanel } from "@/components/cleanup-crew-panel"
import { CsvExport, LatestReadings } from "@/components/latest-readings"
import { PageHero } from "@/components/page-hero"
import { RemindersPanel } from "@/components/reminders-panel"
import { TankForm } from "@/components/tank-form"
import { TestAdvicePanel } from "@/components/test-advice-panel"
import { nitrateRisingDespiteChanges } from "@/lib/bioload"
import { intersectRanges } from "@/lib/compatibility"
import {
  dashboardParameterKeys,
  displayRange,
  isFreshwater,
  parameterMeta,
  waterTypeLabel,
} from "@/lib/parameters"
import { getDashboardData } from "@/lib/queries"
import { buildReminders } from "@/lib/reminders"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { sumpMediaLabel } from "@/lib/sump-media"
import { formatVolume, unitPrefsFromTank } from "@/lib/units"
import { displayTankType } from "@/lib/tank-profiles"

export default async function HomePage() {
  const data = await getDashboardData()
  if (!data.tank) {
    return (
      <div className="space-y-4">
        <PageHero kicker="Welcome" title="Set up your tank" description="Create a tank to start logging tests and livestock." />
        <TankForm tank={null} />
      </div>
    )
  }

  const ranges = intersectRanges(data.livestock)
  const reminders = buildReminders({
    tank: data.tank,
    lastWaterChange: data.waterChanges[0]?.changed_at,
    lastTest: data.tests[0]?.tested_at,
    equipment: data.equipment,
  })
  const nitrateWarning = nitrateRisingDespiteChanges(
    data.tests.filter((t) => t.parameter === "nitrate").map((t) => ({ testedAt: t.tested_at, value: Number(t.value) })),
    data.waterChanges.map((c) => ({ changedAt: c.changed_at })),
  )

  const prefs = unitPrefsFromTank(data.tank)
  const waterType = data.tank.water_type === "freshwater" ? "freshwater" : "saltwater"
  const fw = isFreshwater(waterType)
  const meta = parameterMeta(prefs, waterType)
  const typeLabel = displayTankType(data.tank)
  const mediaLabels = (data.tank.sump_media ?? []).map(sumpMediaLabel)
  const mediaBit =
    mediaLabels.length === 0
      ? ""
      : mediaLabels.length <= 3
        ? ` · ${mediaLabels.join(", ")}`
        : ` · ${mediaLabels.slice(0, 2).join(", ")} +${mediaLabels.length - 2} more`
  const sumpBit = data.tank.has_sump
    ? ` · sump ${formatVolume(Number(data.tank.sump_gallons), prefs)}${mediaBit}`
    : ""

  return (
    <div className="space-y-6">
      <PageHero
        kicker={fw ? "Freshwater dashboard" : "Reef dashboard"}
        title={data.tank.name}
        description={`${formatVolume(Number(data.tank.gallons), prefs)} · ${typeLabel}${sumpBit}`}
        actions={<CsvExport tests={data.tests} />}
      />
      <LatestReadings latest={data.latest} />
      <TestAdvicePanel
        compact
        tank={data.tank}
        latest={data.latest}
        livestock={data.livestock}
        tests={data.tests.map((test) => ({
          parameter: test.parameter,
          tested_at: test.tested_at,
          value: Number(test.value),
        }))}
        waterChanges={data.waterChanges.map((change) => ({ changed_at: change.changed_at }))}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <BioloadGauge tank={data.tank} livestock={data.livestock} nitrateWarning={nitrateWarning} />
        <div id="reminders">
          <RemindersPanel tank={data.tank} reminders={reminders} />
        </div>
      </div>
      <CleanupCrewPanel
        tank={data.tank}
        livestock={data.livestock}
        catalog={data.catalog}
        latest={data.latest}
      />
      <Card>
        <CardHeader>
          <CardTitle>Recommended parameter window</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {dashboardParameterKeys(waterType).map((key) => {
            const range = ranges[key] ?? meta[key].establishedTarget
            if (!range) return null
            const shown = displayRange(key, range, prefs)
            return (
              <div key={key} className="rounded-xl border border-primary/10 bg-background/40 px-3 py-2 text-sm">
                <span className="font-medium">{meta[key].label}</span>
                <span className="text-muted-foreground">
                  {" "}
                  {shown.min}–{shown.max} {meta[key].unit}
                </span>
                {ranges[key] ? (
                  <div className="text-xs text-muted-foreground">From livestock overlap</div>
                ) : (
                  <div className="text-xs text-muted-foreground">Typical {waterTypeLabel(waterType)} target</div>
                )}
              </div>
            )
          })}
          {data.livestock.length === 0 ? (
            <p className="text-sm text-muted-foreground sm:col-span-2">
              Add {fw ? "fish, plants, and inverts" : "fish and coral"} to tighten these ranges to the animals you actually keep.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
