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
    <div className="flex flex-col gap-3 rounded-3xl border border-primary/15 bg-card/70 p-4 shadow-lg shadow-primary/10 backdrop-blur sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:p-5">
      <div className="min-w-0 flex-1 space-y-1">
        {kicker ? (
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">{kicker}</p>
        ) : null}
        <h1 className="font-heading text-2xl font-semibold tracking-tight break-words sm:text-3xl">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground break-words sm:text-base">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="w-full shrink-0 sm:w-auto">{actions}</div> : null}
    </div>
  )
}
