import { EquipmentPanel } from "@/components/equipment-panel"
import { PageHero } from "@/components/page-hero"
import { TankForm } from "@/components/tank-form"
import { getDashboardData } from "@/lib/queries"

export default async function EquipmentPage() {
  const data = await getDashboardData()
  if (!data.tank) return <TankForm tank={null} />
  return (
    <div className="space-y-4">
      <PageHero kicker="Maintenance" title="Equipment" description="Track skimmers, media, lights, and service dates." />
      <EquipmentPanel tankId={data.tank.id} equipment={data.equipment} />
    </div>
  )
}
