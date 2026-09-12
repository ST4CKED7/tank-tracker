"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { logDose } from "@/lib/actions"
import type { Tables } from "@/lib/database.types"
import type { DoseSuggestion } from "@/lib/dose-suggest"
import { SubmitButton } from "@/components/submit-button"
import { EmptyState } from "@/components/empty-state"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { DoseCalculator, type DosePrefill } from "@/components/seachem-calculator"
import { useUnits } from "@/components/units-provider"
import { format, parseISO } from "date-fns"
import { Droplets } from "lucide-react"
import { staggerStyle } from "@/lib/motion"
import { cn } from "@/lib/utils"

export function DosingPanel({
  tankId,
  doses,
  freshwater = false,
  systemGallons,
  suggestions = [],
}: {
  tankId: string
  doses: Tables<"dose_logs">[]
  freshwater?: boolean
  systemGallons: number
  suggestions?: DoseSuggestion[]
}) {
  const prefs = useUnits()
  const searchParams = useSearchParams()
  const initialProductId = searchParams.get("productId")
  const initialCurrent = searchParams.get("current")
  const initialTarget = searchParams.get("target")

  const [product, setProduct] = useState("")
  const [amount, setAmount] = useState("")
  const [unit, setUnit] = useState("ml")
  const [target, setTarget] = useState(freshwater ? "alkalinity" : "alkalinity")

  const activeSuggestion = useMemo(() => {
    if (!initialProductId) return suggestions[0] ?? null
    return suggestions.find((item) => item.productId === initialProductId) ?? suggestions[0] ?? null
  }, [suggestions, initialProductId])

  function applyPrefill(prefill: DosePrefill) {
    setProduct(prefill.product)
    setAmount(String(prefill.amount))
    setUnit(prefill.unit)
    setTarget(prefill.target_parameter)
  }

  return (
    <div className="space-y-6">
      {suggestions.length > 0 ? (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Suggested from your readings</CardTitle>
            <CardDescription>
              Based on latest tests and tank volume. Confirm the bottle label before you dose.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {suggestions.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "rounded-xl border px-3 py-3",
                  item.severity === "urgent" && "border-destructive/30 bg-destructive/5",
                  item.severity === "action" && "border-sky-600/25 bg-sky-500/8",
                  (item.severity === "watch" || item.severity === "info") &&
                    "border-primary/15 bg-background/50",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <div className="font-medium">{item.productName}</div>
                    <p className="text-sm text-muted-foreground">{item.detail}</p>
                  </div>
                  <Button asChild size="sm" className="min-h-10 shrink-0">
                    <Link href={item.href}>
                      {item.amount} {item.unit}
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <DoseCalculator
        freshwater={freshwater}
        systemGallons={systemGallons}
        prefs={prefs}
        onApply={applyPrefill}
        initialProductId={initialProductId ?? activeSuggestion?.productId}
        initialCurrent={initialCurrent ?? (activeSuggestion?.current != null ? String(activeSuggestion.current) : null)}
        initialTarget={initialTarget ?? (activeSuggestion?.target != null ? String(activeSuggestion.target) : null)}
      />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Log a dose</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={logDose} className="space-y-3">
              <input type="hidden" name="tank_id" value={tankId} />
              <div className="space-y-1">
                <Label htmlFor="product">Product</Label>
                <Input
                  id="product"
                  name="product"
                  required
                  value={product}
                  onChange={(event) => setProduct(event.target.value)}
                  placeholder={freshwater ? "Fertilizer, KH buffer, medication…" : "Two-part alk, calcium, mag…"}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    name="unit"
                    value={unit}
                    onChange={(event) => setUnit(event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="target_parameter">Target</Label>
                <select
                  id="target_parameter"
                  name="target_parameter"
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  value={target}
                  onChange={(event) => setTarget(event.target.value)}
                >
                  {freshwater ? (
                    <>
                      <option value="alkalinity">KH / alkalinity</option>
                      <option value="nitrate">Nitrate</option>
                      <option value="phosphate">Phosphate</option>
                      <option value="other">Other</option>
                    </>
                  ) : (
                    <>
                      <option value="alkalinity">Alkalinity</option>
                      <option value="calcium">Calcium</option>
                      <option value="magnesium">Magnesium</option>
                      <option value="other">Other</option>
                    </>
                  )}
                </select>
              </div>
              <SubmitButton className="min-h-11 w-full sm:w-auto" pendingLabel="Saving…" successMessage="Dose saved">
                Save dose
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent className="tt-stagger space-y-2">
            {doses.length === 0 ? (
              <EmptyState
                icon={<Droplets className="size-6" />}
                title="No doses logged yet"
                description="Save a calculated (or other) dose after you treat the water — history builds a quiet trail next to your test charts."
                className="py-6 shadow-none"
              />
            ) : null}
            {doses.map((dose, index) => (
              <div
                key={dose.id}
                style={staggerStyle(index)}
                className="rounded-xl border border-primary/10 bg-background/40 px-3 py-2 text-sm"
              >
                <div className="font-medium">
                  {dose.product} · {dose.amount} {dose.unit}
                </div>
                <div className="text-muted-foreground">
                  {dose.target_parameter} · {format(parseISO(dose.dosed_at), "MMM d, h:mm a")}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
