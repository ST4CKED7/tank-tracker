"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  calculateSeachemDose,
  seachemProductsFor,
  type SeachemProduct,
} from "@/lib/seachem"
import { formatVolume, type UnitPrefs } from "@/lib/units"

export type SeachemPrefill = {
  product: string
  amount: number
  unit: string
  target_parameter: string
}

export function SeachemCalculator({
  freshwater,
  systemGallons,
  prefs,
  onApply,
}: {
  freshwater: boolean
  systemGallons: number
  prefs: UnitPrefs
  onApply: (prefill: SeachemPrefill) => void
}) {
  const products = useMemo(
    () => seachemProductsFor(freshwater ? "freshwater" : "saltwater"),
    [freshwater],
  )
  const [productId, setProductId] = useState(products[0]?.id ?? "prime")
  const product = products.find((item) => item.id === productId) ?? products[0]
  const [current, setCurrent] = useState("")
  const [target, setTarget] = useState("")

  const result = useMemo(() => {
    if (!product) return null
    return calculateSeachemDose({
      productId: product.id,
      gallons: systemGallons,
      current: current === "" ? undefined : Number(current),
      target: target === "" ? undefined : Number(target),
    })
  }, [product, systemGallons, current, target])

  function selectProduct(next: SeachemProduct) {
    setProductId(next.id)
    setCurrent("")
    setTarget("")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seachem calculator</CardTitle>
        <CardDescription>
          Based on published Seachem rates for a {formatVolume(systemGallons, prefs)} system (display + sump).
          Always confirm against the bottle label.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="seachem-product">Product</Label>
          <select
            id="seachem-product"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={product?.id}
            onChange={(event) => {
              const next = products.find((item) => item.id === event.target.value)
              if (next) selectProduct(next)
            }}
          >
            {products.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          {product ? <p className="text-xs text-muted-foreground">{product.notes}</p> : null}
        </div>

        {product?.mode === "raise" ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="seachem-current">Current ({product.raiseUnitLabel})</Label>
              <Input
                id="seachem-current"
                type="number"
                step="0.1"
                value={current}
                onChange={(event) => setCurrent(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="seachem-target">Target ({product.raiseUnitLabel})</Label>
              <Input
                id="seachem-target"
                type="number"
                step="0.1"
                value={target}
                onChange={(event) => setTarget(event.target.value)}
              />
            </div>
          </div>
        ) : null}

        {result ? (
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-3 text-sm">
            <div className="text-lg font-semibold tabular-nums">
              {result.amount} {result.unit}
              {result.teaspoonsApprox != null ? (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ≈ {result.teaspoonsApprox} tsp
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-muted-foreground">{result.detail}</p>
            <Button
              type="button"
              className="mt-3 min-h-11 w-full sm:w-auto"
              onClick={() =>
                onApply({
                  product: product!.name,
                  amount: result.amount,
                  unit: result.unit,
                  target_parameter:
                    product!.targetParameter === "gh" ? "other" : product!.targetParameter,
                })
              }
            >
              Fill log form
            </Button>
          </div>
        ) : product?.mode === "raise" ? (
          <p className="text-sm text-muted-foreground">Enter current and a higher target to calculate a dose.</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
