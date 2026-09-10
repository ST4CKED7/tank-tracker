"use client"

import dynamic from "next/dynamic"
import type { ComponentProps } from "react"

const CycleChart = dynamic(
  () => import("@/components/cycle-chart").then((mod) => mod.CycleChart),
  { ssr: false, loading: () => <div className="h-72 animate-pulse rounded-2xl bg-muted/60" /> },
)

export function CycleChartLazy(props: ComponentProps<typeof CycleChart>) {
  return <CycleChart {...props} />
}
