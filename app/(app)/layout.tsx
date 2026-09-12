import type { ReactNode } from "react"
import { AppNav } from "@/components/app-nav"
import { TankThemeSync } from "@/components/tank-theme-sync"
import { TestTimerBubbles } from "@/components/test-timer-bubbles"
import { TestTimerProvider } from "@/components/test-timer-provider"
import { UnitsProvider } from "@/components/units-provider"
import { getActiveTankContext, getTankLastTestMap } from "@/lib/queries"
import { parseTankTheme } from "@/lib/tank-themes"
import { unitPrefsFromTank } from "@/lib/units"

export default async function AppGroupLayout({ children }: { children: ReactNode }) {
  const [{ tanks, tank }, lastTestByTank] = await Promise.all([
    getActiveTankContext(),
    getTankLastTestMap(),
  ])
  const prefs = unitPrefsFromTank(tank)
  const colorTheme = parseTankTheme(tank?.color_theme)

  return (
    <UnitsProvider prefs={prefs}>
      <TestTimerProvider>
        <TankThemeSync theme={colorTheme} />
        <AppNav
          tanks={tanks.map((item) => ({
            id: item.id,
            name: item.name,
            gallons: item.gallons,
            water_type: item.water_type,
            icon: item.icon,
            icon_color: item.icon_color,
            lastTestAt: lastTestByTank[item.id] ?? null,
          }))}
          activeTankId={tank?.id ?? null}
          unitSummary={`${prefs.volume === "L" ? "L" : "gal"} · ${prefs.temp === "C" ? "°C" : "°F"}`}
        />
        <main className="tt-fade-in mx-auto w-full max-w-6xl flex-1 scroll-mt-24 px-3 py-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-4 sm:py-6 md:pb-6">
          {children}
        </main>
        <TestTimerBubbles />
      </TestTimerProvider>
    </UnitsProvider>
  )
}
