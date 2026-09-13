import { setActiveTank } from "@/lib/actions"
import { CreateTankSheet } from "@/components/create-tank-sheet"
import { DeleteTankButton } from "@/components/delete-tank-button"
import { InstallAppCard } from "@/components/install-app-card"
import { PageHero } from "@/components/page-hero"
import { TankForm } from "@/components/tank-form"
import { TankIconBadge } from "@/components/tank-icon"
import { UnitPrefsForm } from "@/components/unit-prefs-form"
import { SubmitButton } from "@/components/submit-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getActiveTankContext } from "@/lib/queries"
import { formatVolume, unitPrefsFromTank } from "@/lib/units"
import { cn } from "@/lib/utils"

export default async function SettingsPage() {
  const { tanks, tank } = await getActiveTankContext()
  const prefs = unitPrefsFromTank(tank)
  const data = { tanks, tank }

  return (
    <div className="space-y-6">
      <PageHero
        kicker="Setup"
        title="Settings"
        description="Manage tanks, color themes (with light/dark), and hybrid display units."
      />

      <InstallAppCard />

      {data.tank ? (
        <div id="units">
          <UnitPrefsForm key={`${data.tank.id}-${prefs.volume}-${prefs.temp}-${prefs.length}`} tank={data.tank} />
        </div>
      ) : null}

      {data.tanks.length > 0 ? (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
            <div className="space-y-1.5">
              <CardTitle>Your tanks</CardTitle>
              <CardDescription>Select one to make it active across Home, tests, livestock, and the rest.</CardDescription>
            </div>
            <CreateTankSheet />
          </CardHeader>
          <CardContent className="space-y-2">
            {data.tanks.map((item) => {
              const active = item.id === data.tank?.id
              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2.5",
                    active ? "border-primary/40 bg-primary/5" : "border-border bg-background/40",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <TankIconBadge
                      icon={item.icon}
                      color={item.icon_color}
                      photoUrl={item.icon_photo_url}
                      waterType={item.water_type}
                    />
                    <div className="min-w-0">
                      <div className="font-medium">
                        {item.name}
                        {active ? <span className="ml-2 text-xs font-normal text-primary">Active</span> : null}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatVolume(Number(item.gallons), prefs)} ·{" "}
                        {item.water_type === "freshwater" ? "freshwater" : "saltwater"}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!active ? (
                      <form action={setActiveTank}>
                        <input type="hidden" name="tank_id" value={item.id} />
                        <SubmitButton size="sm" variant="secondary" pendingLabel="Switching…">
                          Switch to this tank
                        </SubmitButton>
                      </form>
                    ) : null}
                    <DeleteTankButton tankId={item.id} tankName={item.name} />
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
      ) : (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight">Create your first tank</h2>
          <TankForm key="create" tank={null} mode="create" />
        </div>
      )}
    </div>
  )
}
