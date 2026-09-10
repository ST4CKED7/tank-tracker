import { cn } from "@/lib/utils"

export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse space-y-4", className)} aria-hidden>
      <div className="h-28 rounded-3xl bg-muted/70" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-40 rounded-2xl bg-muted/60" />
        <div className="h-40 rounded-2xl bg-muted/60" />
      </div>
      <div className="h-56 rounded-2xl bg-muted/50" />
    </div>
  )
}
