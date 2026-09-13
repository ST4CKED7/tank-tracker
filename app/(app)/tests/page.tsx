import { EmptyState } from "@/components/empty-state"
import { TestAdvicePanel } from "@/components/test-advice-panel"
import { TestLogger } from "@/components/test-logger"
import { ParameterRemindersPanel } from "@/components/parameter-reminders-panel"
import { PageHero } from "@/components/page-hero"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { getDashboardData } from "@/lib/queries"
import { TankForm } from "@/components/tank-form"
import { isFreshwater } from "@/lib/parameters"
import { FlaskConical } from "lucide-react"

export default async function TestsPage() {
  const data = await getDashboardData({
    livestock: "lean",
    tests: 24,
    waterChanges: 12,
    doses: false,
    equipment: false,
    catalog: false,
    parameterReminders: true,
  })
  if (!data.tank) return <TankForm tank={null} />
  const fw = isFreshwater(data.tank.water_type)
  const waterType = data.tank.water_type === "freshwater" ? "freshwater" : "saltwater"
  const hasTests = Object.keys(data.latest).length > 0
  return (
    <PullToRefresh>
      <div className="space-y-4">
        <PageHero
          kicker="Water chemistry"
          title="Log a test"
          description={
            fw
              ? "Star the kits you use most. Instruments starts starred for temperature and pH probes."
              : "Star the kits you use most. Instruments starts starred for salinity, temperature, and probes."
          }
        />
        {!hasTests ? (
          <EmptyState
            icon={<FlaskConical className="size-6" />}
            title="Build your chemistry baseline"
            description="Start with ammonia, nitrite, nitrate, and pH on whatever kit you keep on the shelf. After the first save, this page turns into a coach for water changes and dosing."
          />
        ) : (
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
        )}
        <TestLogger
          tankId={data.tank.id}
          waterType={waterType}
          favoriteKitIds={data.tank.favorite_test_kits}
          defaultKitId={data.tank.default_test_kit}
        />
        <ParameterRemindersPanel
          tankId={data.tank.id}
          waterType={waterType}
          reminders={data.parameterReminders}
        />
      </div>
    </PullToRefresh>
  )
}
