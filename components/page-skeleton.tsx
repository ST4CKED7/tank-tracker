import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/** Soft pulse skeleton — pairs with `.tt-fade-in` content on load. */
export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("tt-fade-in space-y-4", className)} aria-hidden>
      <Skeleton className="h-28 rounded-3xl" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
      <Skeleton className="h-56 rounded-2xl" />
    </div>
  )
}

/** Stacked chart-card skeletons for the charts / cycle pages. */
export function ChartsSkeleton() {
  return (
    <div className="tt-fade-in space-y-4" aria-hidden>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-20 rounded-full" />
        <Skeleton className="h-9 w-20 rounded-full" />
        <Skeleton className="h-9 w-16 rounded-full" />
      </div>
      <Skeleton className="h-64 rounded-2xl sm:h-72" />
      <Skeleton className="h-64 rounded-2xl sm:h-72" />
    </div>
  )
}

/** Two-column card grid skeleton for list-heavy pages (livestock, dosing). */
export function ListSkeleton() {
  return (
    <div className="tt-fade-in space-y-4" aria-hidden>
      <Skeleton className="h-24 rounded-3xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  )
}
