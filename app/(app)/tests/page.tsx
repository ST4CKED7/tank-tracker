import { TestAdvicePanel } from "@/components/test-advice-panel"
import { TestLogger } from "@/components/test-logger"
import { PageHero } from "@/components/page-hero"
import { getDashboardData } from "@/lib/queries"
import { TankForm } from "@/components/tank-form"
import { isFreshwater } from "@/lib/parameters"

export default async function TestsPage() {
  const data = await getDashboardData()
  if (!data.tank) return <TankForm tank={null} />
  const fw = isFreshwater(data.tank.water_type)
  return (
    <div className="space-y-4">
      <PageHero
        kicker="Water chemistry"
        title="Log a test"
        description={
          fw
            ? "Guided checklists for the Freshwater Master Test Kit and KH / thermometer."
            : "Guided checklists for the Saltwater Master Kit and Reef Master Kit."
        }
      />
      <TestAdvicePanel
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
      <TestLogger tankId={data.tank.id} waterType={data.tank.water_type === "freshwater" ? "freshwater" : "saltwater"} />
    </div>
  )
}
