"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function EmptyState({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
  className,
}: {
  icon: ReactNode
  title: string
  description: string
  actionHref?: string
  actionLabel?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "tt-fade-in relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/10 via-card/80 to-card/40 px-5 py-8 text-center shadow-lg shadow-primary/5",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-10 size-40 rounded-full bg-primary/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-6 size-36 rounded-full bg-accent/20 blur-2xl" />
      <div className="relative mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-inner">
        {icon}
      </div>
      <h2 className="relative mt-4 font-heading text-xl font-semibold tracking-tight">{title}</h2>
      <p className="relative mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {actionHref && actionLabel ? (
        <Button asChild className="relative mt-5 min-h-11">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  )
}
