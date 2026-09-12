import { ParameterChartsLazy } from "@/components/parameter-charts-lazy"
import { CsvExport } from "@/components/latest-readings"
import { PageHero } from "@/components/page-hero"
import { TankForm } from "@/components/tank-form"
import { intersectRanges } from "@/lib/compatibility"
import { getDashboardData } from "@/lib/queries"

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
  return (
    <div className="space-y-4">
      <PageHero
        kicker="Trends"
        title="Charts"
        description="Target bands come from livestock overlap. Dashed orange lines are water changes."
        actions={<CsvExport tests={data.tests} />}
      />
      <ParameterChartsLazy
        tests={data.tests}
        waterChanges={data.waterChanges}
        ranges={intersectRanges(data.livestock)}
      />
    </div>
  )
}
