import { PageHero } from "@/components/page-hero"
import { TankForm } from "@/components/tank-form"
import { TankPhotoTimeline } from "@/components/tank-photo-timeline"
import { getDashboardData } from "@/lib/queries"
import { isFreshwater } from "@/lib/parameters"

export default async function PhotosPage() {
  const data = await getDashboardData({
    livestock: false,
    tests: false,
    waterChanges: false,
    doses: false,
    doseSchedules: false,
    equipment: false,
    catalog: false,
    photos: 100,
  })
  if (!data.tank) return <TankForm tank={null} />

  const fw = isFreshwater(data.tank.water_type)

  return (
    <div className="space-y-4">
      <PageHero
        kicker="Timeline"
        title="Tank photos"
        description={
          fw
            ? "Track aquascape, algae, and livestock changes over time. On your phone, use Take photo to open the camera."
            : "Track aquascape, coral growth, and algae changes over time. On your phone, use Take photo to open the camera."
        }
      />
      <TankPhotoTimeline tankId={data.tank.id} photos={data.photos} />
    </div>
  )
}
