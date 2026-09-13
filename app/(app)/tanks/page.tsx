import { formatDistanceToNow, parseISO } from "date-fns"
import { AlertTriangle, CheckCircle2, Clock, Fish } from "lucide-react"
import Link from "next/link"
import { EmptyState } from "@/components/empty-state"
import { PageHero } from "@/components/page-hero"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { SetActiveTankButton } from "@/components/set-active-tank-button"
import { TankIconBadge } from "@/components/tank-icon"
import { Card, CardContent } from "@/components/ui/card"
import { getActiveTankContext, getMultiTankOverview } from "@/lib/queries"
import { displayTankType } from "@/lib/tank-profiles"
import { formatVolume, unitPrefsFromTank } from "@/lib/units"
import { cn } from "@/lib/utils"

const BIOLOAD_STYLES: Record<string, { bar: string; text: string }> = {
  ok: { bar: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300" },
  watch: { bar: "bg-amber-500", text: "text-amber-700 dark:text-amber-300" },
  high: { bar: "bg-orange-500", text: "text-orange-700 dark:text-orange-300" },
  over: { bar: "bg-rose-500", text: "text-rose-700 dark:text-rose-300" },
}

export default async function TanksOverviewPage() {
  const [overviews, { tank: activeTank }] = await Promise.all([
    getMultiTankOverview(),
    getActiveTankContext(),
  ])

  return (
    <PullToRefresh>
      <div className="space-y-5">
        <PageHero
          kicker="All tanks"
          title="Tank overview"
          description="Health at a glance across every tank — bioload, last test, and what needs attention."
        />

        {overviews.length === 0 ? (
          <EmptyState
            icon={<Fish className="size-6" />}
            title="No tanks yet"
            description="Create your first tank to start tracking chemistry, livestock, and reminders."
            actionHref="/"
            actionLabel="Set up a tank"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {overviews.map(({ tank, bioload, lastTest, actionable }) => {
              const prefs = unitPrefsFromTank(tank)
              const style = BIOLOAD_STYLES[bioload.level] ?? BIOLOAD_STYLES.ok
              const overdue = actionable.filter((item) => item.overdue)
              const soon = actionable.filter((item) => item.soon)
              const isActive = activeTank?.id === tank.id
              return (
                <Card key={tank.id} className={cn(isActive && "ring-2 ring-primary/40")}>
                  <CardContent className="space-y-4 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <TankIconBadge
                          icon={tank.icon}
                          color={tank.icon_color}
                          photoUrl={tank.icon_photo_url}
                          waterType={tank.water_type}
                          className="size-11"
                          iconClassName="size-5"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-semibold">{tank.name}</span>
                            {isActive ? (
                              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                                Active
                              </span>
                            ) : null}
                          </div>
                          <div className="truncate text-sm text-muted-foreground">
                            {formatVolume(Number(tank.gallons), prefs)} · {displayTankType(tank)}
                          </div>
                        </div>
                      </div>
                      <SetActiveTankButton tankId={tank.id} isActive={isActive} />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Bioload</span>
                        <span className={cn("font-medium tabular-nums", style.text)}>
                          {Math.round(bioload.percent)}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn("h-full rounded-full transition-all", style.bar)}
                          style={{ width: `${Math.min(100, Math.round(bioload.percent))}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="size-3.5" />
                        {lastTest
                          ? `Tested ${formatDistanceToNow(parseISO(lastTest), { addSuffix: true })}`
                          : "No tests logged"}
                      </span>
                      {overdue.length > 0 ? (
                        <span className="flex items-center gap-1.5 font-medium text-rose-600 dark:text-rose-400">
                          <AlertTriangle className="size-3.5" />
                          {overdue.length} overdue
                        </span>
                      ) : soon.length > 0 ? (
                        <span className="flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
                          <Clock className="size-3.5" />
                          {soon.length} due soon
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="size-3.5" />
                          All caught up
                        </span>
                      )}
                    </div>

                    {actionable.length > 0 ? (
                      <p className="truncate text-xs text-muted-foreground">
                        Next: {actionable[0].title} — {actionable[0].detail}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          <Link href="/" className="underline underline-offset-2">
            Back to dashboard
          </Link>
        </p>
      </div>
    </PullToRefresh>
  )
}
