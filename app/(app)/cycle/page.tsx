import { CycleChartLazy } from "@/components/cycle-chart-lazy"
import { PageHero } from "@/components/page-hero"
import { TankForm } from "@/components/tank-form"
import { getDashboardData } from "@/lib/queries"

export default async function CyclePage() {
  const data = await getDashboardData({
    livestock: false,
    tests: 200,
    waterChanges: false,
    doses: false,
    equipment: false,
    catalog: false,
  })
  if (!data.tank) return <TankForm tank={null} />
  const latestA = data.latest.ammonia
  const latestNi = data.latest.nitrite
  const latestNa = data.latest.nitrate
  const cycled = latestA === 0 && latestNi === 0 && (latestNa ?? 0) > 0
  return (
    <div className="space-y-4">
      <PageHero
        kicker="Cycling"
        title="Nitrogen cycle"
        description="Watch ammonia and nitrite fall to 0 while nitrate appears. A cycled tank stays at 0 / 0 with some nitrate."
      />
      <p
        className={`rounded-2xl border px-4 py-3 text-sm ${cycled ? "border-primary/30 bg-primary/10" : "border-amber-500/30 bg-amber-500/10"}`}
      >
        {cycled
          ? "Looks cycled from the latest readings."
          : "Not cycled yet, or you still need ammonia and nitrite logs at 0."}
      </p>
      <CycleChartLazy tests={data.tests} />
    </div>
  )
}
