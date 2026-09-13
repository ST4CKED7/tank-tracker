import type { ReactNode } from "react"

export function PageHero({
  kicker,
  title,
  description,
  actions,
}: {
  kicker?: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-primary/15 bg-card/70 p-3 shadow-md shadow-primary/8 backdrop-blur sm:gap-3 sm:rounded-3xl sm:p-5 sm:shadow-lg sm:shadow-primary/10 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
        {kicker ? (
          <p className="hidden text-xs font-semibold uppercase tracking-[0.22em] text-primary sm:block">{kicker}</p>
        ) : null}
        <h1 className="font-heading text-xl font-semibold tracking-tight break-words sm:text-3xl">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-xs text-muted-foreground break-words sm:text-base">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="w-full shrink-0 sm:w-auto">{actions}</div> : null}
    </div>
  )
}
