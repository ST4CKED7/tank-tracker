import { AttentionPanel } from "@/components/attention-panel"
import { CsvExport, LatestReadings } from "@/components/latest-readings"
import { EmptyState } from "@/components/empty-state"
import { HomeStockingSummaries } from "@/components/home-stocking-summaries"
import { PageHero } from "@/components/page-hero"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { ParameterTargetsPanel } from "@/components/parameter-targets-panel"
import { RemindersPanel } from "@/components/reminders-panel"
import { TankForm } from "@/components/tank-form"
import { detectAnomalies } from "@/lib/anomalies"
import { nitrateRisingDespiteChanges } from "@/lib/bioload"
import { isFreshwater } from "@/lib/parameters"
import { resolveDashboardTargets } from "@/lib/parameter-targets"
import { getDashboardData } from "@/lib/queries"
import { buildReminders } from "@/lib/reminders"
import { buildTestAdvice, getWaterChangeSuggestion } from "@/lib/test-advice"
import { sumpMediaLabel } from "@/lib/sump-media"
import { formatVolume, unitPrefsFromTank } from "@/lib/units"
import { displayTankType } from "@/lib/tank-profiles"
import { Fish, FlaskConical } from "lucide-react"

export default async function HomePage() {
  const data = await getDashboardData({
    livestock: true,
    tests: 40,
    waterChanges: 20,
    doses: false,
    equipment: true,
    catalog: false,
  })
  if (!data.tank) {
    return (
      <div className="space-y-4">
        <PageHero kicker="Welcome" title="Set up your tank" description="Create a tank to start logging tests and livestock." />
        <TankForm tank={null} />
      </div>
    )
  }

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
  const changeSuggestion = getWaterChangeSuggestion({
    tank: data.tank,
    latest: data.latest,
    livestock: data.livestock,
    prefs,
  })
  const targets = resolveDashboardTargets({
    tank: data.tank,
    livestock: data.livestock,
    prefs,
  })
  const outOfRange = advice.filter(
    (item) => item.severity === "urgent" || item.severity === "action" || item.severity === "watch",
  )
  const overdue = reminders.filter((item) => item.overdue)
  const anomalies = detectAnomalies(testPoints, prefs, waterType)
  const promoteWaterChange = Boolean(changeSuggestion) || overdue.some((item) => item.kind === "water_change")

  const primary =
    changeSuggestion
      ? {
          label: `Do ~${changeSuggestion.percent}% change`,
          href: "/#reminders",
          detail: changeSuggestion.summary,
        }
      : overdue[0]?.kind === "water_change"
        ? {
            label: "Log water change",
            href: "/#reminders",
            detail: overdue[0].detail,
          }
        : overdue[0]
          ? {
              label: overdue[0].kind === "equipment" ? "Open gear" : "Open tests",
              href: overdue[0].href,
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

  const waterChangePanel = (
    <RemindersPanel
      tank={data.tank}
      suggestedPercent={changeSuggestion?.percent ?? null}
      suggestionDetail={changeSuggestion?.detail ?? null}
    />
  )

  return (
    <PullToRefresh>
      <div className="space-y-5 sm:space-y-6">
        <PageHero
          kicker={fw ? "Freshwater dashboard" : "Reef dashboard"}
          title={data.tank.name}
          description={`${formatVolume(Number(data.tank.gallons), prefs)} · ${typeLabel}${sumpBit}`}
          actions={<CsvExport tests={data.tests} />}
        />

        <AttentionPanel reminders={reminders} advice={advice} primary={primary} />

        {promoteWaterChange ? waterChangePanel : null}

        {Object.keys(data.latest).length === 0 ? (
          <EmptyState
            icon={<FlaskConical className="size-6" />}
            title="No chemistry logged yet"
            description="A first round of tests turns this home screen into a coach — water-change timing, dosing hints, and trend alerts."
            actionHref="/tests"
            actionLabel="Log your first test"
          />
        ) : (
          <LatestReadings latest={data.latest} waterType={waterType} targets={targets} />
        )}

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
        ) : (
          <HomeStockingSummaries
            tank={data.tank}
            livestock={data.livestock}
            nitrateWarning={nitrateWarning}
          />
        )}

        {!promoteWaterChange ? waterChangePanel : null}

        <ParameterTargetsPanel tank={data.tank} livestock={data.livestock} />
      </div>
    </PullToRefresh>
  )
}
