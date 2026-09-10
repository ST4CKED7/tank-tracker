import Link from "next/link"
import type { Reminder } from "@/lib/reminders"
import type { Anomaly } from "@/lib/anomalies"
import type { TestAdvice } from "@/lib/test-advice"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowRight, Droplets, FlaskConical, Sparkles, TrendingDown } from "lucide-react"
import { staggerStyle } from "@/lib/motion"

export function TodayStrip({
  overdue,
  outOfRange,
  anomalies,
  primary,
}: {
  overdue: Reminder[]
  outOfRange: TestAdvice[]
  anomalies: Anomaly[]
  primary: { label: string; href: string; detail: string }
}) {
  const chips = [
    ...overdue.slice(0, 2).map((item) => ({
      id: `rem-${item.id}`,
      label: item.title,
      tone: "overdue" as const,
      href: "/#reminders",
    })),
    ...outOfRange.slice(0, 2).map((item) => ({
      id: `adv-${item.id}`,
      label: item.title,
      tone: item.severity === "urgent" || item.severity === "action" ? ("action" as const) : ("watch" as const),
      href: "/tests",
    })),
    ...anomalies.slice(0, 2).map((item) => ({
      id: item.id,
      label: item.title,
      tone: item.severity === "action" ? ("action" as const) : ("watch" as const),
      href: item.href,
    })),
  ].slice(0, 4)

  return (
    <section className="tt-fade-up overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/12 via-card/90 to-card/50 p-4 shadow-lg shadow-primary/10 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            <Sparkles className="size-3.5" />
            Today
          </div>
          <p className="text-sm text-muted-foreground">{primary.detail}</p>
        </div>
        <Button asChild className="min-h-11 shrink-0">
          <Link href={primary.href}>
            {primary.label}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      {chips.length > 0 ? (
        <ul className="tt-stagger mt-4 grid gap-2 sm:grid-cols-2">
          {chips.map((chip, index) => (
            <li key={chip.id} style={staggerStyle(index)}>
              <Link
                href={chip.href}
                className={cn(
                  "flex min-h-12 items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm transition-colors",
                  chip.tone === "overdue" && "border-sky-500/25 bg-sky-500/10 text-sky-950 dark:text-sky-100",
                  chip.tone === "action" && "border-teal-600/25 bg-teal-500/10 text-teal-950 dark:text-teal-50",
                  chip.tone === "watch" && "border-primary/15 bg-background/60 text-foreground",
                )}
              >
                {chip.tone === "overdue" ? (
                  <Droplets className="size-4 shrink-0 opacity-80" />
                ) : chip.href === "/charts" ? (
                  <TrendingDown className="size-4 shrink-0 opacity-80" />
                ) : (
                  <FlaskConical className="size-4 shrink-0 opacity-80" />
                )}
                <span className="min-w-0 flex-1 truncate font-medium">{chip.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-900 dark:text-emerald-100">
          You’re clear for now — keep the usual test rhythm and enjoy the tank.
        </p>
      )}
    </section>
  )
}
