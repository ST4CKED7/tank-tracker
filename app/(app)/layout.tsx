import type { ReactNode } from "react"
import { AppNav } from "@/components/app-nav"
import { UnitsProvider } from "@/components/units-provider"
import { getActiveTankContext } from "@/lib/queries"
import { unitPrefsFromTank } from "@/lib/units"

export default async function AppGroupLayout({ children }: { children: ReactNode }) {
  const { tanks, tank } = await getActiveTankContext()
  const prefs = unitPrefsFromTank(tank)

  return (
    <UnitsProvider prefs={prefs}>
      <AppNav
        tanks={tanks.map((item) => ({
          id: item.id,
          name: item.name,
          gallons: item.gallons,
          water_type: item.water_type,
        }))}
        activeTankId={tank?.id ?? null}
        unitSummary={`${prefs.volume === "L" ? "L" : "gal"} · ${prefs.temp === "C" ? "°C" : "°F"}`}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 scroll-mt-24 px-3 py-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-4 sm:py-6 md:pb-6">
        {children}
      </main>
    </UnitsProvider>
  )
}
