import { systemGallons, type LivestockRow, type Tank } from "@/lib/bioload"
import {
  isFreshwater,
  parameterMeta,
  type ParameterKey,
  type WaterType,
} from "@/lib/parameters"
import { resolveParameterTarget } from "@/lib/parameter-targets"
import { calculateDose, getDoseProduct } from "@/lib/seachem"
import { displayParam, formatVolume, type UnitPrefs } from "@/lib/units"

export type DoseSuggestion = {
  id: string
  productId: string
  brand: string
  productName: string
  parameter: ParameterKey | "magnesium" | "other"
  current: number | null
  target: number | null
  raiseBy: number | null
  amount: number
  unit: "ml" | "g"
  teaspoonsApprox?: number
  gallons: number
  severity: "urgent" | "action" | "watch" | "info"
  summary: string
  detail: string
  /** Query string for /dosing prefill */
  href: string
}

function resolveBand(
  key: ParameterKey,
  tank: Tank,
  livestock: LivestockRow[],
  prefs: UnitPrefs,
): { min: number; max: number } | null {
  const resolved = resolveParameterTarget({ key, tank, livestock, prefs })
  if (!resolved) return null
  return { min: resolved.min, max: resolved.max }
}

function aimInBand(band: { min: number; max: number }, current: number) {
  // Aim toward the lower-middle of the band — safer than jumping to the top.
  const soft = band.min + (band.max - band.min) * 0.35
  return Math.max(current, Math.min(band.max, soft))
}

function formatReading(
  key: ParameterKey,
  value: number,
  prefs: UnitPrefs,
  waterType: WaterType,
) {
  const meta = parameterMeta(prefs, waterType)[key]
  const shown = displayParam(key, value, prefs)
  return meta.unit ? `${shown} ${meta.unit}` : String(shown)
}

function doseHref(input: {
  productId: string
  current?: number | null
  target?: number | null
}) {
  const params = new URLSearchParams({ productId: input.productId })
  if (input.current != null && Number.isFinite(input.current)) {
    params.set("current", String(input.current))
  }
  if (input.target != null && Number.isFinite(input.target)) {
    params.set("target", String(input.target))
  }
  return `/dosing?${params.toString()}`
}

function buildRaiseSuggestion(input: {
  id: string
  productId: string
  parameter: ParameterKey
  current: number
  fullTarget: number
  maxRaise: number
  gallons: number
  prefs: UnitPrefs
  waterType: WaterType
  severity: DoseSuggestion["severity"]
  extraNote?: string
}): DoseSuggestion | null {
  const product = getDoseProduct(input.productId)
  if (!product || product.mode !== "raise") return null

  const deficit = input.fullTarget - input.current
  if (deficit <= 0.05) return null

  const raiseBy = Math.min(deficit, input.maxRaise)
  const stepTarget = Number((input.current + raiseBy).toFixed(2))
  const result = calculateDose({
    productId: input.productId,
    gallons: input.gallons,
    current: input.current,
    target: stepTarget,
  })
  if (!result || !(result.amount > 0)) return null

  const split =
    deficit > input.maxRaise + 0.05
      ? ` Full gap is about ${deficit.toFixed(1)} ${product.raiseUnitLabel}; dose this step, retest in a few hours, then continue.`
      : ""

  const tsp =
    result.teaspoonsApprox != null ? ` (~${result.teaspoonsApprox} tsp)` : ""

  return {
    id: input.id,
    productId: product.id,
    brand: product.brand,
    productName: `${product.brand} ${product.name}`,
    parameter: input.parameter,
    current: input.current,
    target: stepTarget,
    raiseBy,
    amount: result.amount,
    unit: result.unit,
    teaspoonsApprox: result.teaspoonsApprox,
    gallons: input.gallons,
    severity: input.severity,
    summary: `${result.amount} ${result.unit}${tsp} ${product.name}`,
    detail: [
      `${parameterMeta(input.prefs, input.waterType)[input.parameter].label} is ${formatReading(input.parameter, input.current, input.prefs, input.waterType)}.`,
      `Dose about ${result.amount} ${result.unit}${tsp} of ${product.brand} ${product.name} into ${formatVolume(input.gallons, input.prefs)} to raise ~${raiseBy} ${product.raiseUnitLabel} (toward ${stepTarget}).`,
      product.notes,
      split,
      input.extraNote ?? "",
      "Confirm against your bottle label before dosing.",
    ]
      .filter(Boolean)
      .join(" "),
    href: doseHref({
      productId: product.id,
      current: input.current,
      target: stepTarget,
    }),
  }
}

function buildVolumeSuggestion(input: {
  id: string
  productId: string
  parameter: ParameterKey | "other"
  gallons: number
  prefs: UnitPrefs
  severity: DoseSuggestion["severity"]
  reason: string
}): DoseSuggestion | null {
  const product = getDoseProduct(input.productId)
  if (!product || product.mode !== "volume") return null
  const result = calculateDose({ productId: product.id, gallons: input.gallons })
  if (!result || !(result.amount > 0)) return null

  return {
    id: input.id,
    productId: product.id,
    brand: product.brand,
    productName: `${product.brand} ${product.name}`,
    parameter: input.parameter,
    current: null,
    target: null,
    raiseBy: null,
    amount: result.amount,
    unit: result.unit,
    teaspoonsApprox: result.teaspoonsApprox,
    gallons: input.gallons,
    severity: input.severity,
    summary: `${result.amount} ${result.unit} ${product.name}`,
    detail: `${input.reason} About ${result.amount} ${result.unit} of ${product.brand} ${product.name} for ${formatVolume(input.gallons, input.prefs)}. ${product.notes} Confirm against the bottle label.`,
    href: doseHref({ productId: product.id }),
  }
}

/**
 * Suggest products + amounts from latest chemistry vs livestock / typical targets.
 */
export function suggestDoses(input: {
  tank: Tank
  latest: Partial<Record<ParameterKey, number>>
  livestock: LivestockRow[]
  prefs: UnitPrefs
}): DoseSuggestion[] {
  const waterType: WaterType = isFreshwater(input.tank.water_type) ? "freshwater" : "saltwater"
  const fw = waterType === "freshwater"
  const gallons = systemGallons(input.tank)
  if (!(gallons > 0)) return []

  const out: DoseSuggestion[] = []

  const ammonia = input.latest.ammonia
  const nitrite = input.latest.nitrite
  if ((ammonia != null && ammonia > 0) || (nitrite != null && nitrite > 0)) {
    const prime = buildVolumeSuggestion({
      id: "dose-prime",
      productId: "prime",
      parameter: ammonia != null && ammonia > 0 ? "ammonia" : "nitrite",
      gallons,
      prefs: input.prefs,
      severity: (ammonia ?? 0) >= 0.5 || (nitrite ?? 0) >= 0.5 ? "urgent" : "action",
      reason:
        "Ammonia/nitrite is present — Prime can detoxify while you water-change and retest.",
    })
    if (prime) out.push(prime)

    const stability = buildVolumeSuggestion({
      id: "dose-stability",
      productId: "stability",
      parameter: "other",
      gallons,
      prefs: input.prefs,
      severity: "info",
      reason: "A bacteria starter can support the cycle alongside water changes.",
    })
    if (stability) out.push(stability)
  }

  const alk = input.latest.alkalinity
  const alkBand = resolveBand("alkalinity", input.tank, input.livestock, input.prefs)
  if (alk != null && alkBand && alk < alkBand.min) {
    const fullTarget = aimInBand(alkBand, alk)
    const suggestion = buildRaiseSuggestion({
      id: "dose-alk",
      productId: fw ? "alkaline-buffer" : "reef-builder",
      parameter: "alkalinity",
      current: alk,
      fullTarget,
      maxRaise: fw ? 1 : 1.5,
      gallons,
      prefs: input.prefs,
      waterType,
      severity: alkBand.min - alk >= 1.5 ? "action" : "watch",
      extraNote: fw
        ? "Raise KH slowly — large swings stress fish and plants."
        : "Keep calcium in step if you run two-part; don’t chase alk alone.",
    })
    if (suggestion) out.push(suggestion)
  }

  if (!fw) {
    const calcium = input.latest.calcium
    const caBand = resolveBand("calcium", input.tank, input.livestock, input.prefs)
    if (calcium != null && caBand && calcium < caBand.min) {
      const fullTarget = aimInBand(caBand, calcium)
      const suggestion = buildRaiseSuggestion({
        id: "dose-calcium",
        productId: "reef-advantage-calcium",
        parameter: "calcium",
        current: calcium,
        fullTarget,
        maxRaise: 30,
        gallons,
        prefs: input.prefs,
        waterType,
        severity: caBand.min - calcium >= 40 ? "action" : "watch",
        extraNote: "Retest alkalinity after calcium doses — they often move together.",
      })
      if (suggestion) out.push(suggestion)
    }
  }

  // Low pH with low/unknown KH — nudge buffer when alk also low (already covered) or FW soft water.
  const ph = input.latest.ph
  const phBand = resolveBand("ph", input.tank, input.livestock, input.prefs)
  if (
    fw &&
    ph != null &&
    phBand &&
    ph < phBand.min &&
    !out.some((item) => item.id === "dose-alk")
  ) {
    const alkNow = alk ?? phBand.min
    if (alk == null || alk < (alkBand?.min ?? 4)) {
      const suggestion = buildRaiseSuggestion({
        id: "dose-ph-buffer",
        productId: "alkaline-buffer",
        parameter: "alkalinity",
        current: typeof alkNow === "number" ? alkNow : 3,
        fullTarget: alkBand ? aimInBand(alkBand, typeof alkNow === "number" ? alkNow : 3) : 4,
        maxRaise: 1,
        gallons,
        prefs: input.prefs,
        waterType,
        severity: "watch",
        extraNote: `pH is low (${formatReading("ph", ph, input.prefs, waterType)}). Raising KH usually stabilizes pH better than chasing pH alone.`,
      })
      if (suggestion) out.push(suggestion)
    }
  }

  const rank = (s: DoseSuggestion["severity"]) =>
    s === "urgent" ? 0 : s === "action" ? 1 : s === "watch" ? 2 : 3

  return out.sort((a, b) => rank(a.severity) - rank(b.severity))
}
