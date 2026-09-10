import { EmptyState } from "@/components/empty-state"
import { TemperatureLogCard } from "@/components/temperature-log-card"
import { TestAdvicePanel } from "@/components/test-advice-panel"
import { TestLogger } from "@/components/test-logger"
import { PageHero } from "@/components/page-hero"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { getDashboardData } from "@/lib/queries"
import { TankForm } from "@/components/tank-form"
import { isFreshwater } from "@/lib/parameters"
import { FlaskConical } from "lucide-react"

export default async function TestsPage() {
  const data = await getDashboardData({
    livestock: true,
    tests: 60,
    waterChanges: 30,
    doses: false,
    equipment: false,
    catalog: false,
  })
  if (!data.tank) return <TankForm tank={null} />
  const fw = isFreshwater(data.tank.water_type)
  const hasTests = Object.keys(data.latest).length > 0
  return (
    <PullToRefresh>
      <div className="space-y-4">
        <PageHero
          kicker="Water chemistry"
          title="Log a test"
          description={
            fw
              ? "API, Seachem, strips, Hanna checkers, KH kits, and probes — pick a method and set your default. Temperature has its own quick log below."
              : "API, Salifert, Red Sea, Nyos, Hanna checkers, strips, and instruments — pick what you use and set a default. Temperature has its own quick log below."
          }
        />
        <TemperatureLogCard
          tankId={data.tank.id}
          lastValueF={data.latest.temperature ?? null}
          lastAt={
            data.tests.find((test) => test.parameter === "temperature")?.tested_at ?? null
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
          waterType={data.tank.water_type === "freshwater" ? "freshwater" : "saltwater"}
          defaultKitId={data.tank.default_test_kit}
        />
      </div>
    </PullToRefresh>
  )
}
