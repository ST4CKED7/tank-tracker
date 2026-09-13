"use client"

import { useId, useState, type FormEvent } from "react"
import { AlertTriangle, ShieldAlert } from "lucide-react"
import type { CompatibilityReport } from "@/lib/compatibility"
import { cn } from "@/lib/utils"

/** Banner + optional “add anyway” confirm for catalog add forms. */
export function CompatibilityWarnings({
  report,
  className,
}: {
  report: CompatibilityReport
  className?: string
}) {
  const blocked = report.severity === "block"
  const confirmId = useId()
  const [confirmed, setConfirmed] = useState(false)

  if (report.severity === "ok" || report.warnings.length === 0) return null

  return (
    <div className={cn("space-y-2", className)}>
      <div
        role="status"
        className={cn(
          "rounded-xl border px-3 py-2 text-xs",
          blocked
            ? "border-destructive/40 bg-destructive/10 text-destructive"
            : "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100",
        )}
      >
        <div className="mb-1 flex items-center gap-1.5 font-medium">
          {blocked ? <ShieldAlert className="size-3.5 shrink-0" /> : <AlertTriangle className="size-3.5 shrink-0" />}
          {blocked ? "Compatibility problems" : "Compatibility cautions"}
        </div>
        <ul className="list-disc space-y-0.5 pl-4">
          {report.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
        {report.projectedBioloadPercent != null && report.projectedBioloadPercent >= 85 ? (
          <p className="mt-1.5 opacity-90">
            Projected bioload ≈ {Math.round(report.projectedBioloadPercent)}%
          </p>
        ) : null}
      </div>

      {blocked ? (
        <label htmlFor={confirmId} className="flex cursor-pointer items-start gap-2 text-xs text-muted-foreground">
          <input
            id={confirmId}
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            className="mt-0.5 size-4 rounded border"
            data-compat-confirm=""
          />
          <span>I understand the risks and want to add this anyway.</span>
        </label>
      ) : null}
    </div>
  )
}

/** Prevent submit until the confirm checkbox is checked when severity is block. */
export function guardCompatSubmit(severity: CompatibilityReport["severity"], event: FormEvent<HTMLFormElement>) {
  if (severity !== "block") return
  const box = event.currentTarget.querySelector<HTMLInputElement>("input[data-compat-confirm]")
  if (!box?.checked) {
    event.preventDefault()
    box?.focus()
  }
}
