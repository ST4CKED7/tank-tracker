"use client"

import { LIVESTOCK_SEX_LABELS, type LivestockSex } from "@/lib/bioload"
import { cn } from "@/lib/utils"

export function SexSelect({
  id,
  defaultValue = "unknown",
  className,
}: {
  id?: string
  defaultValue?: LivestockSex
  className?: string
}) {
  return (
    <select
      id={id}
      name="sex"
      defaultValue={defaultValue}
      className={cn("h-8 rounded-md border bg-background px-2 text-sm", className)}
    >
      {(Object.keys(LIVESTOCK_SEX_LABELS) as LivestockSex[]).map((sex) => (
        <option key={sex} value={sex}>
          {LIVESTOCK_SEX_LABELS[sex]}
        </option>
      ))}
    </select>
  )
}
