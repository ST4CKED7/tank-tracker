import { EquipmentPanel } from "@/components/equipment-panel"
import { PageHero } from "@/components/page-hero"
import { TankForm } from "@/components/tank-form"
import { getDashboardData } from "@/lib/queries"

export default async function EquipmentPage() {
  const data = await getDashboardData({
    livestock: false,
    tests: false,
    waterChanges: false,
    doses: false,
    equipment: true,
    catalog: false,
  })
  if (!data.tank) return <TankForm tank={null} />
  return (
    <div className="space-y-4">
      <PageHero
        kicker="Maintenance"
        title="Equipment"
        description="Filters, pumps, lights, reactors, dosers, probes — log what you run and when it needs service."
      />
      <EquipmentPanel tankId={data.tank.id} equipment={data.equipment} />
    </div>
  )
}
