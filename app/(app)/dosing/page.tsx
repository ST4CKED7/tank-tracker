import { DosingPanel } from "@/components/dosing-panel"
import { PageHero } from "@/components/page-hero"
import { TankForm } from "@/components/tank-form"
import { getDashboardData } from "@/lib/queries"
import { isFreshwater } from "@/lib/parameters"

export default async function DosingPage() {
  const data = await getDashboardData()
  if (!data.tank) return <TankForm tank={null} />
  const fw = isFreshwater(data.tank.water_type)
  return (
    <div className="space-y-4">
      <PageHero
        kicker="Supplements"
        title="Dosing"
        description={
          fw
            ? "Log fertilizers, GH/KH buffers, medications, or anything else you add."
            : "Log two-part, calcium, mag, or anything else you add."
        }
      />
      <DosingPanel tankId={data.tank.id} doses={data.doses} freshwater={fw} />
    </div>
  )
}
