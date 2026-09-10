import { DosingPanel } from "@/components/dosing-panel"
import { PageHero } from "@/components/page-hero"
import { TankForm } from "@/components/tank-form"
import { systemGallons } from "@/lib/bioload"
import { getDashboardData } from "@/lib/queries"
import { isFreshwater } from "@/lib/parameters"

export default async function DosingPage() {
  const data = await getDashboardData({
    livestock: false,
    tests: false,
    waterChanges: false,
    doses: 100,
    equipment: false,
    catalog: false,
  })
  if (!data.tank) return <TankForm tank={null} />
  const fw = isFreshwater(data.tank.water_type)
  return (
    <div className="space-y-4">
      <PageHero
        kicker="Supplements"
        title="Dosing"
        description={
          fw
            ? "Seachem calculator for Prime, buffers, Flourish — then log what you add."
            : "Seachem calculator for Reef Buffer, calcium, mag — then log what you add."
        }
      />
      <DosingPanel
        tankId={data.tank.id}
        doses={data.doses}
        freshwater={fw}
        systemGallons={systemGallons(data.tank)}
      />
    </div>
  )
}
