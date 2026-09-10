import { BioloadGauge } from "@/components/bioload-gauge"
import { CleanupCrewPanel } from "@/components/cleanup-crew-panel"
import { CsvExport, LatestReadings } from "@/components/latest-readings"
import { EmptyState } from "@/components/empty-state"
import { PageHero } from "@/components/page-hero"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { RemindersPanel } from "@/components/reminders-panel"
import { TankForm } from "@/components/tank-form"
import { TestAdvicePanel } from "@/components/test-advice-panel"
import { TodayStrip } from "@/components/today-strip"
import { detectAnomalies } from "@/lib/anomalies"
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
import { buildTestAdvice } from "@/lib/test-advice"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { sumpMediaLabel } from "@/lib/sump-media"
import { formatVolume, unitPrefsFromTank } from "@/lib/units"
import { displayTankType } from "@/lib/tank-profiles"
import { Fish, FlaskConical } from "lucide-react"

export default async function HomePage() {
  const data = await getDashboardData({
    livestock: true,
    tests: 80,
    waterChanges: 40,
    doses: false,
    equipment: true,
    catalog: true,
  })
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

  const testPoints = data.tests.map((test) => ({
    parameter: test.parameter,
    tested_at: test.tested_at,
    value: Number(test.value),
  }))
  const advice = buildTestAdvice({
    tank: data.tank,
    latest: data.latest,
    livestock: data.livestock,
    tests: testPoints,
    waterChanges: data.waterChanges.map((change) => ({ changed_at: change.changed_at })),
    prefs,
  })
  const outOfRange = advice.filter(
    (item) => item.severity === "urgent" || item.severity === "action" || item.severity === "watch",
  )
  const overdue = reminders.filter((item) => item.overdue)
  const anomalies = detectAnomalies(testPoints, prefs, waterType)

  const primary =
    overdue[0]?.kind === "water_change"
      ? {
          label: "Log water change",
          href: "/#reminders",
          detail: overdue[0].detail,
        }
      : outOfRange[0]
        ? {
            label: "Review chemistry",
            href: "/tests",
            detail: outOfRange[0].detail,
          }
        : anomalies[0]
          ? {
              label: "Open charts",
              href: "/charts",
              detail: anomalies[0].detail,
            }
          : Object.keys(data.latest).length === 0
            ? {
                label: "Log first test",
                href: "/tests",
                detail: "Start with ammonia, nitrite, nitrate, and pH — advice unlocks from there.",
              }
            : data.livestock.length === 0
              ? {
                  label: "Add livestock",
                  href: "/livestock",
                  detail: "Stock the tank so targets tighten to the animals you keep.",
                }
              : {
                  label: "Log a test",
                  href: "/tests",
                  detail: "Everything looks calm — a quick check keeps the trend line honest.",
                }

  return (
    <PullToRefresh>
      <div className="space-y-6">
        <PageHero
          kicker={fw ? "Freshwater dashboard" : "Reef dashboard"}
          title={data.tank.name}
          description={`${formatVolume(Number(data.tank.gallons), prefs)} · ${typeLabel}${sumpBit}`}
          actions={<CsvExport tests={data.tests} />}
        />

        <TodayStrip overdue={overdue} outOfRange={outOfRange} anomalies={anomalies} primary={primary} />

        {Object.keys(data.latest).length === 0 ? (
          <EmptyState
            icon={<FlaskConical className="size-6" />}
            title="No chemistry logged yet"
            description="A first round of tests turns this home screen into a coach — water-change timing, dosing hints, and trend alerts."
            actionHref="/tests"
            actionLabel="Log your first test"
          />
        ) : (
          <div className="tt-stagger space-y-3">
            <LatestReadings latest={data.latest} />
          </div>
        )}

        <TestAdvicePanel
          compact
          tank={data.tank}
          latest={data.latest}
          livestock={data.livestock}
          tests={testPoints}
          waterChanges={data.waterChanges.map((change) => ({ changed_at: change.changed_at }))}
        />

        {data.livestock.length === 0 ? (
          <EmptyState
            icon={<Fish className="size-6" />}
            title="Your livestock list is empty"
            description={
              fw
                ? "Add fish, plants, and cleanup crew so bioload and parameter windows match this tank."
                : "Add fish, coral, and cleanup crew so reef-safe checks and targets match what you keep."
            }
            actionHref="/livestock"
            actionLabel="Add livestock"
          />
        ) : null}

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
        <Card className="tt-fade-up">
          <CardHeader>
            <CardTitle>Recommended parameter window</CardTitle>
          </CardHeader>
          <CardContent className="tt-stagger grid gap-2 sm:grid-cols-2">
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
                    <div className="text-xs text-muted-foreground">Based on livestock targets</div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      Typical {waterTypeLabel(waterType)} default
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </PullToRefresh>
  )
}
