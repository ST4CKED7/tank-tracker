import { BioloadGauge } from "@/components/bioload-gauge"
import { CleanupCrewPanel } from "@/components/cleanup-crew-panel"
import { LivestockManager } from "@/components/livestock-manager"
import { PageHero } from "@/components/page-hero"
import { TankForm } from "@/components/tank-form"
import { nitrateRisingDespiteChanges } from "@/lib/bioload"
import { intersectRanges } from "@/lib/compatibility"
import { dashboardParameterKeys, displayRange, isFreshwater, parameterMeta } from "@/lib/parameters"
import { getDashboardData } from "@/lib/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { unitPrefsFromTank } from "@/lib/units"

export default async function LivestockPage() {
  const data = await getDashboardData({
    livestock: true,
    tests: 80,
    waterChanges: 40,
    doses: false,
    equipment: false,
    catalog: true,
  })
  if (!data.tank) return <TankForm tank={null} />
  const ranges = intersectRanges(data.livestock)
  const prefs = unitPrefsFromTank(data.tank)
  const waterType = data.tank.water_type === "freshwater" ? "freshwater" : "saltwater"
  const fw = isFreshwater(waterType)
  const meta = parameterMeta(prefs, waterType)
  const nitrateWarning = nitrateRisingDespiteChanges(
    data.tests.filter((t) => t.parameter === "nitrate").map((t) => ({ testedAt: t.tested_at, value: Number(t.value) })),
    data.waterChanges.map((c) => ({ changedAt: c.changed_at })),
  )
  return (
    <div className="space-y-6">
      <PageHero
        kicker="Stocking"
        title={fw ? "Freshwater livestock" : "Livestock"}
        description={
          fw
            ? "Suggestions use tank size, temperament tags, parameter overlap, bioload headroom, and cleanup-crew gaps."
            : "Suggestions are rule-based: tank size, reef-safety, aggression tags, parameter overlap, bioload, and cleanup crew."
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <BioloadGauge tank={data.tank} livestock={data.livestock} nitrateWarning={nitrateWarning} />
        <CleanupCrewPanel
          tank={data.tank}
          livestock={data.livestock}
          catalog={data.catalog}
          latest={data.latest}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Combined recommended ranges</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {dashboardParameterKeys(waterType).map((key) => {
            const range = ranges[key]
            if (!range) return null
            const shown = displayRange(key, range, prefs)
            return (
              <div key={key} className="rounded-xl border border-primary/10 bg-background/40 px-3 py-2 text-sm">
                <span className="font-medium">{meta[key].label}</span> {shown.min}–{shown.max} {meta[key].unit}
              </div>
            )
          })}
        </CardContent>
      </Card>
      <LivestockManager tank={data.tank} livestock={data.livestock} catalog={data.catalog} latest={data.latest} />
    </div>
  )
}
