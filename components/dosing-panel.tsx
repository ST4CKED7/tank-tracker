"use client"

import { logDose } from "@/lib/actions"
import type { Tables } from "@/lib/database.types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format, parseISO } from "date-fns"

export function DosingPanel({
  tankId,
  doses,
  freshwater = false,
}: {
  tankId: string
  doses: Tables<"dose_logs">[]
  freshwater?: boolean
}) {
  return (
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
                placeholder={freshwater ? "Fertilizer, KH buffer, medication…" : "Two-part alk, calcium, mag…"}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" name="amount" type="number" step="0.01" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="unit">Unit</Label>
                <Input id="unit" name="unit" defaultValue="ml" />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="target_parameter">Target</Label>
              <select id="target_parameter" name="target_parameter" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
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
            <Button type="submit">Save dose</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {doses.length === 0 ? <p className="text-sm text-muted-foreground">No doses yet.</p> : null}
          {doses.map((dose) => (
            <div key={dose.id} className="rounded-xl border border-primary/10 bg-background/40 px-3 py-2 text-sm">
              <div className="font-medium">{dose.product} · {dose.amount} {dose.unit}</div>
              <div className="text-muted-foreground">{dose.target_parameter} · {format(parseISO(dose.dosed_at), "MMM d, h:mm a")}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
