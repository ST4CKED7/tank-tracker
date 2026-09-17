import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { bioloadSummary, type LivestockRow, type Tank } from "@/lib/bioload"
import { assessCleanupCrew } from "@/lib/cleanup-crew"
import { cn } from "@/lib/utils"
import { ArrowRight, Fish, Shell } from "lucide-react"

/** Compact Home summaries that deep-link to the full Livestock panels. */
export function HomeStockingSummaries({
  tank,
  livestock,
  nitrateWarning,
}: {
  tank: Tank
  livestock: LivestockRow[]
  nitrateWarning?: boolean
}) {
  const load = bioloadSummary(tank, livestock)
  const crew = assessCleanupCrew(tank, livestock)

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Link
        href="/livestock"
        className="group rounded-2xl border border-primary/15 bg-card/80 p-4 shadow-sm transition-colors hover:border-primary/30 hover:bg-card"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <Fish className="size-4 text-primary" />
            Bioload
          </div>
          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>
        <Progress value={Math.min(100, load.percent)} className="mt-3 h-2" />
        <p className="mt-2 text-sm">
          <span
            className={cn(
              "font-medium",
              load.level === "over" && "text-destructive",
              load.level === "high" && "text-amber-600 dark:text-amber-400",
            )}
          >
            {Math.round(load.percent)}%
          </span>
          <span className="text-muted-foreground">
            {" "}
            · {load.used.toFixed(1)} / {load.capacity.toFixed(1)} pts
          </span>
        </p>
        <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
          {tank.water_type === "freshwater"
            ? "Rough stocking score: fish length × species factor + invert points, divided by display+sump volume (adjusted for tank type)."
            : "Rough stocking score: fish length × species factor, invert points, and coral size, divided by display+sump volume (adjusted for tank type)."}
        </p>
        {nitrateWarning ? (
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">Nitrate still climbing after changes</p>
        ) : null}
      </Link>

      <Link
        href="/livestock"
        className={cn(
          "group rounded-2xl border bg-card/80 p-4 shadow-sm transition-colors hover:bg-card",
          crew.status === "missing" && "border-amber-500/40",
          crew.status === "light" && "border-amber-500/25",
          crew.status === "ok" && "border-primary/15 hover:border-primary/30",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <Shell className="size-4 text-primary" />
            Cleanup crew
          </div>
          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>
        <p className="mt-3 text-sm font-medium">{crew.summary}</p>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{crew.detail}</p>
      </Link>
    </div>
  )
}
