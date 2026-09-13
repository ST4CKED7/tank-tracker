import Link from "next/link"
import type { LivestockRow, Tank } from "@/lib/bioload"
import type { ParameterKey } from "@/lib/parameters"
import { buildTestAdvice, type AdviceSeverity } from "@/lib/test-advice"
import { unitPrefsFromTank } from "@/lib/units"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { adviceSeverityToTone, severityRowClass } from "@/lib/severity-ui"
import { staggerStyle } from "@/lib/motion"
import { AlertTriangle, CheckCircle2, Info, Leaf, Waves, Wrench } from "lucide-react"

function sourceLabel(source?: "livestock" | "typical" | "trend" | "custom", freshwater?: boolean) {
  if (source === "custom") return "Your custom target"
  if (source === "livestock") return "Based on livestock targets"
  if (source === "typical") return freshwater ? "Typical freshwater default" : "Typical reef default"
  if (source === "trend") return "From recent trend"
  return null
}

function SeverityIcon({ severity }: { severity: AdviceSeverity }) {
  if (severity === "ok") return <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
  if (severity === "urgent" || severity === "action") {
    return <AlertTriangle className="size-4 text-destructive" />
  }
  if (severity === "info") return <Info className="size-4 text-primary" />
  return <Wrench className="size-4 text-muted-foreground" />
}

export function TestAdvicePanel({
  tank,
  latest,
  livestock,
  tests,
  waterChanges,
  compact = false,
}: {
  tank: Tank
  latest: Partial<Record<ParameterKey, number>>
  livestock: LivestockRow[]
  tests: { parameter: string; tested_at: string; value: number }[]
  waterChanges: { changed_at: string }[]
  compact?: boolean
}) {
  const prefs = unitPrefsFromTank(tank)
  const freshwater = tank.water_type === "freshwater"
  let advice = buildTestAdvice({
    tank,
    latest,
    livestock,
    tests,
    waterChanges,
    prefs,
  })

  if (compact) {
    advice = advice.filter((item) => item.severity === "urgent" || item.severity === "action" || item.severity === "watch")
    if (advice.length === 0) return null
  }

  return (
    <Card className="tt-fade-up">
      <CardHeader>
        <CardTitle>{compact ? "Suggested next steps" : "After your readings"}</CardTitle>
        <CardDescription>
          {compact
            ? "Targets prefer livestock overlap, then typical defaults."
            : "Suggestions update when you save a test — water changes, dosing, or cycle checks."}
        </CardDescription>
      </CardHeader>
      <CardContent className="tt-stagger space-y-3">
        {advice.map((item, index) => {
          const source = sourceLabel(item.source, freshwater)
          return (
            <div
              key={item.id}
              style={staggerStyle(index)}
              className={`space-y-2 rounded-xl border px-3 py-3 ${severityRowClass(adviceSeverityToTone(item.severity))}`}
            >
              <div className="flex items-start gap-2">
                <SeverityIcon severity={item.severity} />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="font-medium leading-snug">{item.title}</div>
                  {source ? (
                    <div className="inline-flex items-center gap-1 rounded-full bg-background/70 px-2 py-0.5 text-[11px] text-muted-foreground ring-1 ring-border/60">
                      {item.source === "livestock" ? (
                        <Leaf className="size-3" />
                      ) : (
                        <Waves className="size-3" />
                      )}
                      {source}
                    </div>
                  ) : null}
                  <p className="text-sm text-muted-foreground">{item.detail}</p>
                  {item.actions.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {item.actions.map((action) => (
                        <Button
                          key={action.href + action.label}
                          asChild
                          size="sm"
                          variant="secondary"
                          className="min-h-10"
                        >
                          <Link href={action.href}>{action.label}</Link>
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
