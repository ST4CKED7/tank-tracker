import { ParameterChartsLazy } from "@/components/parameter-charts-lazy"
import { CsvExport } from "@/components/latest-readings"
import { PageHero } from "@/components/page-hero"
import { TankForm } from "@/components/tank-form"
import type { RangeMap } from "@/lib/compatibility"
import { resolveDashboardTargets } from "@/lib/parameter-targets"
import { getDashboardData } from "@/lib/queries"
import { unitPrefsFromTank } from "@/lib/units"

export default async function ChartsPage() {
  const data = await getDashboardData({
    livestock: "lean",
    tests: 200,
    waterChanges: 60,
    doses: false,
    equipment: false,
    catalog: false,
  })
  if (!data.tank) return <TankForm tank={null} />
  const prefs = unitPrefsFromTank(data.tank)
  const resolved = resolveDashboardTargets({
    tank: data.tank,
    livestock: data.livestock,
    prefs,
  })
  const ranges: RangeMap = {}
  for (const [key, value] of Object.entries(resolved)) {
    if (!value) continue
    ranges[key as keyof RangeMap] = {
      min: value.min,
      max: value.max,
      sources: [
        value.source === "custom"
          ? "Your targets"
          : value.source === "livestock"
            ? "Livestock"
            : "Typical",
      ],
    }
  }
  return (
    <div className="space-y-4">
      <PageHero
        kicker="Trends"
        title="Charts"
        description="Target bands use your custom targets when set, otherwise livestock overlap or typical defaults. Dashed orange lines are water changes."
        actions={<CsvExport tests={data.tests} />}
      />
      <ParameterChartsLazy
        tests={data.tests}
        waterChanges={data.waterChanges}
        ranges={ranges}
      />
    </div>
  )
}
