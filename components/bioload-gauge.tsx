import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { bioloadSummary, systemGallons, type LivestockRow, type Tank } from "@/lib/bioload"
import { tankProfile } from "@/lib/tank-profiles"
import { cn } from "@/lib/utils"
import { formatVolume, unitPrefsFromTank } from "@/lib/units"

export function BioloadGauge({
  tank,
  livestock,
  nitrateWarning,
}: {
  tank: Tank
  livestock: LivestockRow[]
  nitrateWarning?: boolean
}) {
  const summary = bioloadSummary(tank, livestock)
  const prefs = unitPrefsFromTank(tank)
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Bioload estimate</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={Math.min(100, summary.percent)} className="h-3" />
        <p className="text-sm">
          <span className={cn("font-medium", summary.level === "over" && "text-destructive", summary.level === "high" && "text-amber-600 dark:text-amber-400")}>
            {summary.used.toFixed(1)} / {summary.capacity.toFixed(1)} points
          </span>
          <span className="text-muted-foreground"> ({Math.round(summary.percent)}%)</span>
        </p>
        <p className="text-sm text-muted-foreground">
          {tank.water_type === "freshwater" ? (
            <>
              Fish length × factor and invert points vs {formatVolume(systemGallons(tank), prefs)}
              {tank.has_sump ? " (display + sump)" : ""}
              {tankProfile(tank.tank_type).bioloadFactor !== 1
                ? ` × ${tankProfile(tank.tank_type).bioloadFactor} for ${tankProfile(tank.tank_type).label.toLowerCase()}`
                : ""}
              . Update each fish’s current length as it grows.
            </>
          ) : (
            <>
              Fish length × factor, invert points, and coral size vs {formatVolume(systemGallons(tank), prefs)}
              {tank.has_sump ? " (display + sump)" : ""}
              {tankProfile(tank.tank_type).bioloadFactor !== 1
                ? ` × ${tankProfile(tank.tank_type).bioloadFactor} for ${tankProfile(tank.tank_type).label.toLowerCase()}`
                : ` (${tankProfile(tank.tank_type).label})`}
              . Update each fish’s current length as it grows. Corals counted: {summary.coralCount}.
            </>
          )}
        </p>
        {nitrateWarning ? (
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Nitrate is still climbing after recent water changes. Measured load may be higher than this estimate (overfeeding, detritus, or weak nutrient export).
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
