import { Suspense } from "react"
import { DosingPanel } from "@/components/dosing-panel"
import { PageHero } from "@/components/page-hero"
import { TankForm } from "@/components/tank-form"
import { systemGallons } from "@/lib/bioload"
import { getDashboardData } from "@/lib/queries"
import { isFreshwater } from "@/lib/parameters"
import { getDoseSuggestions } from "@/lib/test-advice"
import { unitPrefsFromTank } from "@/lib/units"

export default async function DosingPage() {
  const data = await getDashboardData({
    livestock: "lean",
    tests: 24,
    waterChanges: false,
    doses: 100,
    equipment: false,
    catalog: false,
  })
  if (!data.tank) return <TankForm tank={null} />
  const fw = isFreshwater(data.tank.water_type)
  const prefs = unitPrefsFromTank(data.tank)
  const suggestions = getDoseSuggestions({
    tank: data.tank,
    latest: data.latest,
    livestock: data.livestock,
    prefs,
  })

  return (
    <div className="space-y-4">
      <PageHero
        kicker="Supplements"
        title="Dosing"
        description={
          fw
            ? "Suggestions use your latest tests and tank volume — then confirm on the bottle and log what you add."
            : "Suggestions use your latest tests and tank volume for buffers and calcium — confirm on the bottle, then log."
        }
      />
      <Suspense fallback={null}>
        <DosingPanel
          tankId={data.tank.id}
          doses={data.doses}
          freshwater={fw}
          systemGallons={systemGallons(data.tank)}
          suggestions={suggestions}
        />
      </Suspense>
    </div>
  )
}
