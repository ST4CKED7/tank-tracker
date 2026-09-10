import { cn } from "@/lib/utils"

/** Soft pulse skeleton — pairs with `.tt-fade-in` content on load. */
export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("tt-fade-in animate-pulse space-y-4", className)} aria-hidden>
      <div className="h-28 rounded-3xl bg-gradient-to-br from-muted/80 via-muted/60 to-muted/40" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-40 rounded-2xl bg-muted/60" />
        <div className="h-40 rounded-2xl bg-muted/60" />
      </div>
      <div className="h-56 rounded-2xl bg-muted/50" />
    </div>
  )
}
