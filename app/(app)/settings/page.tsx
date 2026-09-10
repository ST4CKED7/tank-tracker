import { setActiveTank } from "@/lib/actions"
import { DeleteTankButton } from "@/components/delete-tank-button"
import { InstallAppCard } from "@/components/install-app-card"
import { PageHero } from "@/components/page-hero"
import { TankForm } from "@/components/tank-form"
import { UnitPrefsForm } from "@/components/unit-prefs-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getDashboardData } from "@/lib/queries"
import { formatVolume, unitPrefsFromTank } from "@/lib/units"
import { cn } from "@/lib/utils"

export default async function SettingsPage() {
  const data = await getDashboardData()
  const prefs = unitPrefsFromTank(data.tank)

  return (
    <div className="space-y-6">
      <PageHero
        kicker="Setup"
        title="Settings"
        description="Manage tanks and choose hybrid display units — gallons with Celsius, liters with inches, whatever you prefer."
      />

      <InstallAppCard />

      {data.tank ? (
        <div id="units">
          <UnitPrefsForm key={`${data.tank.id}-${prefs.volume}-${prefs.temp}-${prefs.length}`} tank={data.tank} />
        </div>
      ) : null}

      {data.tanks.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Your tanks</CardTitle>
            <CardDescription>Select one to make it active across Home, tests, livestock, and the rest.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.tanks.map((tank) => {
              const active = tank.id === data.tank?.id
              return (
                <div
                  key={tank.id}
                  className={cn(
                    "flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2.5",
                    active ? "border-primary/40 bg-primary/5" : "border-border bg-background/40",
                  )}
                >
                  <div className="min-w-0">
                    <div className="font-medium">
                      {tank.name}
                      {active ? <span className="ml-2 text-xs font-normal text-primary">Active</span> : null}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatVolume(Number(tank.gallons), prefs)} ·{" "}
                      {tank.water_type === "freshwater" ? "freshwater" : "saltwater"}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!active ? (
                      <form action={setActiveTank}>
                        <input type="hidden" name="tank_id" value={tank.id} />
                        <Button type="submit" size="sm" variant="secondary">
                          Switch to this tank
                        </Button>
                      </form>
                    ) : null}
                    <DeleteTankButton tankId={tank.id} tankName={tank.name} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      ) : null}

      {data.tank ? (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight">Edit active tank</h2>
          <TankForm key={data.tank.id} tank={data.tank} mode="edit" />
        </div>
      ) : null}

      <div className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight">{data.tank ? "Add another tank" : "Create your first tank"}</h2>
        <TankForm key="create" tank={null} mode="create" />
      </div>
    </div>
  )
}
