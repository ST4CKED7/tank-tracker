"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  calculateDose,
  doseProductsFor,
  type DoseProduct,
} from "@/lib/seachem"
import { displayVolume, formatVolume, toStoredVolume, volumeLabel, type UnitPrefs } from "@/lib/units"

export type DosePrefill = {
  product: string
  amount: number
  unit: string
  target_parameter: string
}

/** @deprecated Use DosePrefill */
export type SeachemPrefill = DosePrefill

export function DoseCalculator({
  freshwater,
  systemGallons,
  prefs,
  onApply,
  initialProductId,
  initialCurrent,
  initialTarget,
}: {
  freshwater: boolean
  systemGallons: number
  prefs: UnitPrefs
  onApply: (prefill: DosePrefill) => void
  initialProductId?: string | null
  initialCurrent?: string | null
  initialTarget?: string | null
}) {
  const products = useMemo(
    () => doseProductsFor(freshwater ? "freshwater" : "saltwater"),
    [freshwater],
  )
  const brands = useMemo(() => {
    const seen: string[] = []
    for (const item of products) {
      if (!seen.includes(item.brand)) seen.push(item.brand)
    }
    return seen
  }, [products])

  const preferredId =
    initialProductId && products.some((item) => item.id === initialProductId)
      ? initialProductId
      : products[0]?.id ?? "prime"

  const [productId, setProductId] = useState(preferredId)
  const product = products.find((item) => item.id === productId) ?? products[0]
  const [current, setCurrent] = useState(initialCurrent ?? "")
  const [target, setTarget] = useState(initialTarget ?? "")
  const [volumeInput, setVolumeInput] = useState(() =>
    String(displayVolume(systemGallons, prefs, systemGallons >= 10 ? 0 : 1)),
  )

  useEffect(() => {
    setVolumeInput(String(displayVolume(systemGallons, prefs, systemGallons >= 10 ? 0 : 1)))
  }, [systemGallons, prefs])

  useEffect(() => {
    if (initialProductId && products.some((item) => item.id === initialProductId)) {
      setProductId(initialProductId)
    }
    if (initialCurrent != null && initialCurrent !== "") setCurrent(initialCurrent)
    if (initialTarget != null && initialTarget !== "") setTarget(initialTarget)
  }, [initialProductId, initialCurrent, initialTarget, products])

  useEffect(() => {
    if (!products.some((item) => item.id === productId)) {
      setProductId(products[0]?.id ?? "prime")
      setCurrent("")
      setTarget("")
    }
  }, [products, productId])

  const gallons = toStoredVolume(Number(volumeInput), prefs.volume)

  const result = useMemo(() => {
    if (!product || !(gallons > 0)) return null
    return calculateDose({
      productId: product.id,
      gallons,
      current: current === "" ? undefined : Number(current),
      target: target === "" ? undefined : Number(target),
    })
  }, [product, gallons, current, target])

  function selectProduct(next: DoseProduct) {
    setProductId(next.id)
    setCurrent("")
    setTarget("")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dose calculator</CardTitle>
        <CardDescription>
          Prefills from your tank’s system volume ({formatVolume(systemGallons, prefs)}, display
          {systemGallons > 0 ? " including sump when set" : ""}). Edit the field anytime — doses always use the volume you enter.
          Confirm against the bottle label.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="dose-volume">Tank / system volume ({volumeLabel(prefs)})</Label>
          <Input
            id="dose-volume"
            type="number"
            min={0}
            step="0.1"
            value={volumeInput}
            onChange={(event) => setVolumeInput(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Prefills from your active tank. Edit here for water-change buckets or a different system size.
          </p>
        </div>

        <div className="space-y-1">
          <Label htmlFor="dose-product">Product</Label>
          <select
            id="dose-product"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={product?.id}
            onChange={(event) => {
              const next = products.find((item) => item.id === event.target.value)
              if (next) selectProduct(next)
            }}
          >
            {brands.map((brand) => (
              <optgroup key={brand} label={brand}>
                {products
                  .filter((item) => item.brand === brand)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
          {product ? (
            <p className="text-xs text-muted-foreground">
              {product.brand} · {product.notes}
            </p>
          ) : null}
        </div>

        {product?.mode === "raise" ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="dose-current">Current ({product.raiseUnitLabel})</Label>
              <Input
                id="dose-current"
                type="number"
                step="0.1"
                value={current}
                onChange={(event) => setCurrent(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dose-target">Target ({product.raiseUnitLabel})</Label>
              <Input
                id="dose-target"
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
                  product: `${product!.brand} ${product!.name}`,
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
        ) : !(gallons > 0) ? (
          <p className="text-sm text-muted-foreground">Enter your tank volume to calculate a dose.</p>
        ) : product?.mode === "raise" ? (
          <p className="text-sm text-muted-foreground">Enter current and a higher target to calculate a dose.</p>
        ) : null}
      </CardContent>
    </Card>
  )
}

/** @deprecated Use DoseCalculator */
export const SeachemCalculator = DoseCalculator
