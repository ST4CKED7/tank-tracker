"use client"

import dynamic from "next/dynamic"
import type { ComponentProps } from "react"
import { PageSkeleton } from "@/components/page-skeleton"

const ParameterCharts = dynamic(
  () => import("@/components/parameter-charts").then((mod) => mod.ParameterCharts),
  { ssr: false, loading: () => <PageSkeleton className="pt-2" /> },
)

export function ParameterChartsLazy(props: ComponentProps<typeof ParameterCharts>) {
  return <ParameterCharts {...props} />
}
