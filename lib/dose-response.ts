import { parameterMeta, type ParameterKey, type WaterType } from "@/lib/parameters"
import type { Tables } from "@/lib/database.types"

export type DoseResponse = {
  parameter: ParameterKey
  label: string
  dosedAt: string
  product: string
  before: number | null
  after: number | null
  delta: number | null
  status: "toward" | "away" | "flat" | "pending"
  detail: string
}

/** Test parameters we can correlate with logged doses (magnesium isn't tracked as a test). */
const CORRELATABLE: ParameterKey[] = ["alkalinity", "calcium", "nitrate", "phosphate", "ph"]

/**
 * For each recently dosed parameter, compare the reading just before the last dose
 * with the first reading after it, and say whether it moved toward the target band.
 */
export function summarizeDoseResponses(
  doses: Tables<"dose_logs">[],
  tests: Tables<"test_logs">[],
  waterType: WaterType,
): DoseResponse[] {
  const meta = parameterMeta("imperial", waterType)
  const out: DoseResponse[] = []

  for (const parameter of CORRELATABLE) {
    const paramDoses = doses
      .filter((dose) => dose.target_parameter === parameter)
      .sort((a, b) => b.dosed_at.localeCompare(a.dosed_at))
    const lastDose = paramDoses[0]
    if (!lastDose) continue

    const readings = tests
      .filter((test) => test.parameter === parameter)
      .sort((a, b) => a.tested_at.localeCompare(b.tested_at))
    if (readings.length === 0) continue

    const before =
      [...readings].reverse().find((test) => test.tested_at <= lastDose.dosed_at) ?? null
    const after = readings.find((test) => test.tested_at > lastDose.dosed_at) ?? null

    const beforeValue = before ? Number(before.value) : null
    const afterValue = after ? Number(after.value) : null
    const delta = beforeValue != null && afterValue != null ? afterValue - beforeValue : null

    const target = meta[parameter].establishedTarget
    let status: DoseResponse["status"] = "pending"
    let detail = `Dosed ${lastDose.product}. Log a fresh ${meta[parameter].label.toLowerCase()} reading to see the response.`

    if (beforeValue != null && afterValue != null && delta != null) {
      if (Math.abs(delta) < 1e-6) {
        status = "flat"
        detail = `${meta[parameter].label} held at ${afterValue} after ${lastDose.product}.`
      } else if (target) {
        const mid = (target.min + target.max) / 2
        const closer = Math.abs(afterValue - mid) < Math.abs(beforeValue - mid)
        status = closer ? "toward" : "away"
        detail = `${meta[parameter].label} ${beforeValue} → ${afterValue} (${delta > 0 ? "+" : ""}${round(delta)}) after ${lastDose.product} · ${
          closer ? "moved toward target" : "moved away from target"
        }.`
      } else {
        status = delta > 0 ? "toward" : "away"
        detail = `${meta[parameter].label} ${beforeValue} → ${afterValue} (${delta > 0 ? "+" : ""}${round(delta)}) after ${lastDose.product}.`
      }
    }

    out.push({
      parameter,
      label: meta[parameter].label,
      dosedAt: lastDose.dosed_at,
      product: lastDose.product,
      before: beforeValue,
      after: afterValue,
      delta,
      status,
      detail,
    })
  }

  return out
}

function round(value: number) {
  return Math.round(value * 100) / 100
}
