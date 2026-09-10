/**
 * Seachem dose helpers based on published product rates.
 * Always verify against the current Seachem label — formulations can change.
 */

export type SeachemMode = "volume" | "raise"

export type SeachemWater = "saltwater" | "freshwater" | "both"

export type SeachemProduct = {
  id: string
  name: string
  water: SeachemWater
  mode: SeachemMode
  targetParameter: "alkalinity" | "calcium" | "magnesium" | "gh" | "other"
  unit: "ml" | "g"
  /** For volume mode: amount of unit per US gallon. */
  perGallon?: number
  /**
   * For raise mode: amount of unit per US gallon to raise the parameter by 1 unit.
   * Alk/KH unit = dKH; Ca/Mg = ppm; GH = °dH.
   */
  perGallonPerUnit?: number
  raiseUnitLabel?: string
  notes: string
}

const L_PER_GAL = 3.785411784

/** Convert Seachem “X g per Y L raises Z” into g per gallon per 1 raise-unit. */
function gramsPerGalPerRaise(grams: number, liters: number, raiseAmount: number) {
  return grams / (liters / L_PER_GAL) / raiseAmount
}

/** Convert “X ml per Y L” into ml per gallon. */
function mlPerGal(ml: number, liters: number) {
  return ml / (liters / L_PER_GAL)
}

export const SEACHEM_PRODUCTS: SeachemProduct[] = [
  {
    id: "prime",
    name: "Prime",
    water: "both",
    mode: "volume",
    targetParameter: "other",
    unit: "ml",
    perGallon: 5 / 50, // 5 ml treats 50 US gal
    notes: "Dechlorinator / detox. Dose into new water or the tank per label.",
  },
  {
    id: "stability",
    name: "Stability",
    water: "both",
    mode: "volume",
    targetParameter: "other",
    unit: "ml",
    perGallon: mlPerGal(5, 40), // 5 ml / 40 L
    notes: "Bacteria starter. Follow new-tank schedule on the bottle for the first week.",
  },
  {
    id: "reef-buffer",
    name: "Reef Buffer",
    water: "saltwater",
    mode: "raise",
    targetParameter: "alkalinity",
    unit: "g",
    // 5 g / 80 L raises ~1 meq/L = 2.8 dKH
    perGallonPerUnit: gramsPerGalPerRaise(5, 80, 2.8),
    raiseUnitLabel: "dKH",
    notes: "Raises alkalinity and tends to push pH toward ~8.3.",
  },
  {
    id: "reef-builder",
    name: "Reef Builder",
    water: "saltwater",
    mode: "raise",
    targetParameter: "alkalinity",
    unit: "g",
    // 5 g / 150 L raises 1 meq/L = 2.8 dKH
    perGallonPerUnit: gramsPerGalPerRaise(5, 150, 2.8),
    raiseUnitLabel: "dKH",
    notes: "Raises alkalinity without a large pH swing.",
  },
  {
    id: "reef-advantage-calcium",
    name: "Reef Advantage Calcium",
    water: "saltwater",
    mode: "raise",
    targetParameter: "calcium",
    unit: "g",
    // 5 g / 80 L raises Ca ~15 mg/L
    perGallonPerUnit: gramsPerGalPerRaise(5, 80, 15),
    raiseUnitLabel: "ppm",
    notes: "Ionic calcium. Keep alkalinity in range when dosing.",
  },
  {
    id: "reef-advantage-magnesium",
    name: "Reef Advantage Magnesium",
    water: "saltwater",
    mode: "raise",
    targetParameter: "magnesium",
    unit: "g",
    // 5 g / 80 L raises Mg ~5 mg/L
    perGallonPerUnit: gramsPerGalPerRaise(5, 80, 5),
    raiseUnitLabel: "ppm",
    notes: "Raises magnesium; useful when Ca/alk won’t stay balanced.",
  },
  {
    id: "alkaline-buffer",
    name: "Alkaline Buffer",
    water: "freshwater",
    mode: "raise",
    targetParameter: "alkalinity",
    unit: "g",
    perGallonPerUnit: gramsPerGalPerRaise(5, 80, 2.8),
    raiseUnitLabel: "dKH",
    notes: "Raises KH. Dose gradually and retest.",
  },
  {
    id: "equilibrium",
    name: "Equilibrium",
    water: "freshwater",
    mode: "raise",
    targetParameter: "gh",
    unit: "g",
    // 16 g / 80 L raises GH by 3 °dH
    perGallonPerUnit: gramsPerGalPerRaise(16, 80, 3),
    raiseUnitLabel: "°dH",
    notes: "Restores GH from RO/DI. Does not add sodium.",
  },
  {
    id: "flourish",
    name: "Flourish",
    water: "freshwater",
    mode: "volume",
    targetParameter: "other",
    unit: "ml",
    perGallon: 5 / 50, // 5 ml / 200 L ≈ 50 gal
    notes: "Comprehensive trace supplement for planted tanks.",
  },
  {
    id: "flourish-excel",
    name: "Flourish Excel",
    water: "freshwater",
    mode: "volume",
    targetParameter: "other",
    unit: "ml",
    perGallon: 5 / 50,
    notes: "Daily carbon source. Use the lower maintenance rate after the first dose if following the label.",
  },
  {
    id: "flourish-iron",
    name: "Flourish Iron",
    water: "freshwater",
    mode: "volume",
    targetParameter: "other",
    unit: "ml",
    perGallon: 5 / 50,
    notes: "Iron supplement for plants showing chlorosis.",
  },
  {
    id: "flourish-potassium",
    name: "Flourish Potassium",
    water: "freshwater",
    mode: "volume",
    targetParameter: "other",
    unit: "ml",
    perGallon: 5 / 50,
    notes: "Potassium supplement for planted tanks.",
  },
]

export function seachemProductsFor(waterType: "saltwater" | "freshwater") {
  return SEACHEM_PRODUCTS.filter((product) => product.water === "both" || product.water === waterType)
}

export function getSeachemProduct(id: string) {
  return SEACHEM_PRODUCTS.find((product) => product.id === id)
}

export type SeachemDoseResult = {
  amount: number
  unit: "ml" | "g"
  teaspoonsApprox?: number
  detail: string
}

export function calculateSeachemDose(input: {
  productId: string
  gallons: number
  current?: number
  target?: number
}): SeachemDoseResult | null {
  const product = getSeachemProduct(input.productId)
  if (!product || !(input.gallons > 0)) return null

  if (product.mode === "volume") {
    const amount = round(input.gallons * (product.perGallon ?? 0), product.unit === "ml" ? 2 : 2)
    return {
      amount,
      unit: product.unit,
      teaspoonsApprox: product.unit === "g" ? round(amount / 5, 1) : undefined,
      detail: `${product.name} for ${round(input.gallons, 1)} gal system volume`,
    }
  }

  const current = Number(input.current)
  const target = Number(input.target)
  if (!Number.isFinite(current) || !Number.isFinite(target) || target <= current) {
    return null
  }
  const delta = target - current
  const amount = round(input.gallons * (product.perGallonPerUnit ?? 0) * delta, 2)
  return {
    amount,
    unit: product.unit,
    teaspoonsApprox: product.unit === "g" ? round(amount / 5, 1) : undefined,
    detail: `Raise ${product.raiseUnitLabel} from ${current} → ${target} (Δ ${round(delta, 2)})`,
  }
}

function round(value: number, digits: number) {
  const f = 10 ** digits
  return Math.round(value * f) / f
}
