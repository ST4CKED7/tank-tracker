import { cn } from "@/lib/utils"

/** Shared urgency language across Today / notifications / advice. */
export type SeverityTone = "urgent" | "soon" | "watch" | "ok" | "action"

export function severityRowClass(tone: SeverityTone) {
  return cn(
    tone === "urgent" && "border-destructive/30 bg-destructive/5",
    tone === "action" && "border-destructive/25 bg-destructive/5",
    tone === "soon" && "border-amber-500/25 bg-amber-500/8",
    tone === "watch" && "border-primary/15 bg-background/50",
    tone === "ok" && "border-emerald-500/25 bg-emerald-500/8",
  )
}

export function severityIconWrapClass(tone: SeverityTone) {
  return cn(
    "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
    tone === "urgent" && "bg-destructive/15 text-destructive",
    tone === "action" && "bg-destructive/15 text-destructive",
    tone === "soon" && "bg-amber-500/15 text-amber-800 dark:text-amber-200",
    tone === "watch" && "bg-primary/10 text-primary",
    tone === "ok" && "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
  )
}

export function severityChipClass(tone: SeverityTone) {
  return cn(
    "flex min-h-12 items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm transition-colors",
    tone === "urgent" && "border-destructive/30 bg-destructive/10 text-destructive dark:text-red-100",
    tone === "action" && "border-destructive/25 bg-destructive/10 text-destructive dark:text-red-100",
    tone === "soon" && "border-amber-500/25 bg-amber-500/10 text-amber-950 dark:text-amber-100",
    tone === "watch" && "border-primary/15 bg-background/60 text-foreground",
    tone === "ok" && "border-emerald-500/25 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
  )
}

export function adviceSeverityToTone(
  severity: "urgent" | "action" | "watch" | "ok" | "info",
): SeverityTone {
  if (severity === "urgent") return "urgent"
  if (severity === "action") return "action"
  if (severity === "ok") return "ok"
  return "watch"
}
