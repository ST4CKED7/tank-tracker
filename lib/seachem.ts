/**
 * Dose helpers based on published product rates.
 * Always verify against the current bottle label — formulations can change.
 */

export type DoseMode = "volume" | "raise"

export type DoseWater = "saltwater" | "freshwater" | "both"

export type DoseProduct = {
  id: string
  brand: string
  name: string
  water: DoseWater
  mode: DoseMode
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

/** @deprecated Use DoseProduct */
export type SeachemProduct = DoseProduct
/** @deprecated Use DoseMode */
export type SeachemMode = DoseMode
/** @deprecated Use DoseWater */
export type SeachemWater = DoseWater

const L_PER_GAL = 3.785411784

/** Convert “X g per Y L raises Z” into g per gallon per 1 raise-unit. */
function gramsPerGalPerRaise(grams: number, liters: number, raiseAmount: number) {
  return grams / (liters / L_PER_GAL) / raiseAmount
}

/** Convert “X ml per Y L” into ml per gallon. */
function mlPerGal(ml: number, liters: number) {
  return ml / (liters / L_PER_GAL)
}

/** Convert “X ml per Y US gallons” into ml per gallon. */
function mlPerUsGal(ml: number, gallons: number) {
  return ml / gallons
}

export const DOSE_PRODUCTS: DoseProduct[] = [
  // ——— Seachem ———
  {
    id: "prime",
    brand: "Seachem",
    name: "Prime",
    water: "both",
    mode: "volume",
    targetParameter: "other",
    unit: "ml",
    perGallon: mlPerUsGal(5, 50),
    notes: "Dechlorinator / detox. Dose into new water or the tank per label.",
  },
  {
    id: "stability",
    brand: "Seachem",
    name: "Stability",
    water: "both",
    mode: "volume",
    targetParameter: "other",
    unit: "ml",
    perGallon: mlPerGal(5, 40),
    notes: "Bacteria starter. Follow new-tank schedule on the bottle for the first week.",
  },
  {
    id: "reef-buffer",
    brand: "Seachem",
    name: "Reef Buffer",
    water: "saltwater",
    mode: "raise",
    targetParameter: "alkalinity",
    unit: "g",
    perGallonPerUnit: gramsPerGalPerRaise(5, 80, 2.8),
    raiseUnitLabel: "dKH",
    notes: "Raises alkalinity and tends to push pH toward ~8.3.",
  },
  {
    id: "reef-builder",
    brand: "Seachem",
    name: "Reef Builder",
    water: "saltwater",
    mode: "raise",
    targetParameter: "alkalinity",
    unit: "g",
    perGallonPerUnit: gramsPerGalPerRaise(5, 150, 2.8),
    raiseUnitLabel: "dKH",
    notes: "Raises alkalinity without a large pH swing.",
  },
  {
    id: "reef-advantage-calcium",
    brand: "Seachem",
    name: "Reef Advantage Calcium",
    water: "saltwater",
    mode: "raise",
    targetParameter: "calcium",
    unit: "g",
    perGallonPerUnit: gramsPerGalPerRaise(5, 80, 15),
    raiseUnitLabel: "ppm",
    notes: "Ionic calcium. Keep alkalinity in range when dosing.",
  },
  {
    id: "reef-advantage-magnesium",
    brand: "Seachem",
    name: "Reef Advantage Magnesium",
    water: "saltwater",
    mode: "raise",
    targetParameter: "magnesium",
    unit: "g",
    perGallonPerUnit: gramsPerGalPerRaise(5, 80, 5),
    raiseUnitLabel: "ppm",
    notes: "Raises magnesium; useful when Ca/alk won’t stay balanced.",
  },
  {
    id: "alkaline-buffer",
    brand: "Seachem",
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
    brand: "Seachem",
    name: "Equilibrium",
    water: "freshwater",
    mode: "raise",
    targetParameter: "gh",
    unit: "g",
    perGallonPerUnit: gramsPerGalPerRaise(16, 80, 3),
    raiseUnitLabel: "°dH",
    notes: "Restores GH from RO/DI. Does not add sodium.",
  },
  {
    id: "flourish",
    brand: "Seachem",
    name: "Flourish",
    water: "freshwater",
    mode: "volume",
    targetParameter: "other",
    unit: "ml",
    perGallon: mlPerUsGal(5, 50),
    notes: "Comprehensive trace supplement for planted tanks.",
  },
  {
    id: "flourish-excel",
    brand: "Seachem",
    name: "Flourish Excel",
    water: "freshwater",
    mode: "volume",
    targetParameter: "other",
    unit: "ml",
    perGallon: mlPerUsGal(5, 50),
    notes: "Daily carbon source. Use the lower maintenance rate after the first dose if following the label.",
  },
  {
    id: "flourish-iron",
    brand: "Seachem",
    name: "Flourish Iron",
    water: "freshwater",
    mode: "volume",
    targetParameter: "other",
    unit: "ml",
    perGallon: mlPerUsGal(5, 50),
    notes: "Iron supplement for plants showing chlorosis.",
  },
  {
    id: "flourish-potassium",
    brand: "Seachem",
    name: "Flourish Potassium",
    water: "freshwater",
    mode: "volume",
    targetParameter: "other",
    unit: "ml",
    perGallon: mlPerUsGal(5, 50),
    notes: "Potassium supplement for planted tanks.",
  },

  // ——— API ———
  {
    id: "api-stress-coat",
    brand: "API",
    name: "Stress Coat",
    water: "both",
    mode: "volume",
    targetParameter: "other",
    unit: "ml",
    perGallon: mlPerUsGal(5, 10),
    notes: "Water conditioner with aloe. Standard dose is 5 ml per 10 US gal.",
  },
  {
    id: "api-leaf-zone",
    brand: "API",
    name: "Leaf Zone",
    water: "freshwater",
    mode: "volume",
    targetParameter: "other",
    unit: "ml",
    perGallon: mlPerUsGal(5, 10),
    notes: "Iron + potassium for planted tanks. Typical weekly dose 5 ml / 10 gal.",
  },
  {
    id: "api-co2-booster",
    brand: "API",
    name: "CO2 Booster",
    water: "freshwater",
    mode: "volume",
    targetParameter: "other",
    unit: "ml",
    perGallon: mlPerUsGal(5, 10),
    notes: "Liquid carbon alternative. Follow label for daily vs weekly schedule.",
  },
  {
    id: "api-aquarium-salt",
    brand: "API",
    name: "Aquarium Salt",
    water: "freshwater",
    mode: "volume",
    targetParameter: "other",
    unit: "g",
    // 1 tbsp ≈ 18 g treats ~5 gal for general tonic (label varies)
    perGallon: 18 / 5,
    notes: "Therapeutic salt — not for planted tanks with sensitive plants/inverts. Confirm label use.",
  },
  {
    id: "api-marine-buffer",
    brand: "API",
    name: "Marine Buffer",
    water: "saltwater",
    mode: "raise",
    targetParameter: "alkalinity",
    unit: "g",
    // Approx: ~1 tsp (≈5 g) / 10 gal raises pH/alk toward marine range — treat as mild dKH raise
    perGallonPerUnit: 5 / 10 / 1,
    raiseUnitLabel: "dKH",
    notes: "Buffers toward marine pH. Raise slowly and retest; rates vary by starting chemistry.",
  },
  {
    id: "api-reef-calcium",
    brand: "API",
    name: "Reef Calcium",
    water: "saltwater",
    mode: "volume",
    targetParameter: "calcium",
    unit: "ml",
    perGallon: mlPerUsGal(5, 10),
    notes: "Liquid ionic calcium. Dose per label and watch alkalinity.",
  },

  // ——— Fritz ———
  {
    id: "fritz-complete",
    brand: "Fritz",
    name: "Complete",
    water: "both",
    mode: "volume",
    targetParameter: "other",
    unit: "ml",
    perGallon: mlPerUsGal(5, 50),
    notes: "Full-spectrum water conditioner. Label: 5 ml treats 50 US gal.",
  },
  {
    id: "fritz-accclerator",
    brand: "Fritz",
    name: "Zyme / ACCCelerator",
    water: "both",
    mode: "volume",
    targetParameter: "other",
    unit: "ml",
    perGallon: mlPerUsGal(5, 10),
    notes: "Nitrifying bacteria. Use new-tank or maintenance rate on the bottle.",
  },
  {
    id: "fritz-rpm-calcium",
    brand: "Fritz",
    name: "RPM Calcium",
    water: "saltwater",
    mode: "raise",
    targetParameter: "calcium",
    unit: "ml",
    // ~1 ml / gal raises Ca ~10 ppm (typical two-part style — verify bottle)
    perGallonPerUnit: 1 / 10,
    raiseUnitLabel: "ppm",
    notes: "Part of Fritz RPM two/three-part. Confirm exact raise rate on your bottle.",
  },
  {
    id: "fritz-rpm-alkalinity",
    brand: "Fritz",
    name: "RPM Alkalinity",
    water: "saltwater",
    mode: "raise",
    targetParameter: "alkalinity",
    unit: "ml",
    perGallonPerUnit: 1 / 1,
    raiseUnitLabel: "dKH",
    notes: "RPM alk part. Confirm ml-per-gal-per-dKH on the label before large corrections.",
  },
  {
    id: "fritz-rpm-magnesium",
    brand: "Fritz",
    name: "RPM Magnesium",
    water: "saltwater",
    mode: "raise",
    targetParameter: "magnesium",
    unit: "ml",
    perGallonPerUnit: 1 / 10,
    raiseUnitLabel: "ppm",
    notes: "RPM magnesium. Dose slowly; large Mg swings stress coral.",
  },

  // ——— Red Sea ———
  {
    id: "redsea-foundation-a",
    brand: "Red Sea",
    name: "Reef Foundation A (Ca)",
    water: "saltwater",
    mode: "raise",
    targetParameter: "calcium",
    unit: "ml",
    // 1 ml / 100 L raises Ca ~2 ppm
    perGallonPerUnit: mlPerGal(1, 100) / 2,
    raiseUnitLabel: "ppm",
    notes: "Calcium component. Pair with Foundation B/C for balanced reef dosing.",
  },
  {
    id: "redsea-foundation-b",
    brand: "Red Sea",
    name: "Reef Foundation B (Alk)",
    water: "saltwater",
    mode: "raise",
    targetParameter: "alkalinity",
    unit: "ml",
    // 1 ml / 100 L raises ~0.12 dKH
    perGallonPerUnit: mlPerGal(1, 100) / 0.12,
    raiseUnitLabel: "dKH",
    notes: "Alkalinity component. Raise gradually and retest.",
  },
  {
    id: "redsea-foundation-c",
    brand: "Red Sea",
    name: "Reef Foundation C (Mg)",
    water: "saltwater",
    mode: "raise",
    targetParameter: "magnesium",
    unit: "ml",
    // 1 ml / 100 L raises Mg ~1 ppm
    perGallonPerUnit: mlPerGal(1, 100) / 1,
    raiseUnitLabel: "ppm",
    notes: "Magnesium component for the Foundation program.",
  },
  {
    id: "redsea-nopox",
    brand: "Red Sea",
    name: "NO3:PO4-X (NOPOX)",
    water: "saltwater",
    mode: "volume",
    targetParameter: "other",
    unit: "ml",
    // Maintenance often ~1–2 ml / 100 L / day — use conservative 1 ml / 100 L
    perGallon: mlPerGal(1, 100),
    notes: "Carbon source for nutrient control. Start low; watch nitrates and skimmer.",
  },

  // ——— Brightwell ———
  {
    id: "brightwell-reef-code-a",
    brand: "Brightwell",
    name: "Reef Code A",
    water: "saltwater",
    mode: "raise",
    targetParameter: "calcium",
    unit: "ml",
    // Label family: ~5 ml / 20 L raises Ca ~10 ppm (approx)
    perGallonPerUnit: mlPerGal(5, 20) / 10,
    raiseUnitLabel: "ppm",
    notes: "Two-part calcium side. Match Code B volume for balanced dosing.",
  },
  {
    id: "brightwell-reef-code-b",
    brand: "Brightwell",
    name: "Reef Code B",
    water: "saltwater",
    mode: "raise",
    targetParameter: "alkalinity",
    unit: "ml",
    // ~5 ml / 20 L raises ~1.4 dKH (approx)
    perGallonPerUnit: mlPerGal(5, 20) / 1.4,
    raiseUnitLabel: "dKH",
    notes: "Two-part alkalinity side. Confirm raise rate on your bottle.",
  },
  {
    id: "brightwell-magnesion",
    brand: "Brightwell",
    name: "Magnesion",
    water: "saltwater",
    mode: "raise",
    targetParameter: "magnesium",
    unit: "ml",
    perGallonPerUnit: mlPerGal(5, 20) / 10,
    raiseUnitLabel: "ppm",
    notes: "Liquid magnesium. Dose over several days for large corrections.",
  },
  {
    id: "brightwell-alkalin83",
    brand: "Brightwell",
    name: "Alkalin8.3",
    water: "saltwater",
    mode: "raise",
    targetParameter: "alkalinity",
    unit: "ml",
    perGallonPerUnit: mlPerGal(5, 40) / 1,
    raiseUnitLabel: "dKH",
    notes: "Liquid alkalinity buffer aimed near pH 8.3.",
  },
  {
    id: "brightwell-florin-multi",
    brand: "Brightwell",
    name: "FlorinMulti",
    water: "freshwater",
    mode: "volume",
    targetParameter: "other",
    unit: "ml",
    perGallon: mlPerGal(5, 200),
    notes: "Comprehensive planted fertilizer. Adjust with plant mass and lighting.",
  },
  {
    id: "brightwell-florin-k",
    brand: "Brightwell",
    name: "Florin-K",
    water: "freshwater",
    mode: "volume",
    targetParameter: "other",
    unit: "ml",
    perGallon: mlPerGal(5, 200),
    notes: "Potassium for planted aquariums.",
  },

  // ——— Tropic Marin ———
  {
    id: "tropic-marin-all-for-reef",
    brand: "Tropic Marin",
    name: "All-For-Reef",
    water: "saltwater",
    mode: "volume",
    targetParameter: "other",
    unit: "ml",
    // Common start: 2.5 ml / 100 L / day
    perGallon: mlPerGal(2.5, 100),
    notes: "All-in-one Ca/alk/trace. Start low and raise until demand is met.",
  },
  {
    id: "tropic-marin-bio-calcium",
    brand: "Tropic Marin",
    name: "Bio-Calcium",
    water: "saltwater",
    mode: "raise",
    targetParameter: "calcium",
    unit: "g",
    perGallonPerUnit: gramsPerGalPerRaise(10, 100, 18),
    raiseUnitLabel: "ppm",
    notes: "Powder calcium method. Follow Tropic Marin instructions for mixing.",
  },

  // ——— Aquaforest ———
  {
    id: "aquaforest-component-1",
    brand: "Aquaforest",
    name: "Component 1+ (Ca)",
    water: "saltwater",
    mode: "raise",
    targetParameter: "calcium",
    unit: "ml",
    // Balling-style: 10 ml / 100 L ≈ +9 ppm Ca (approx AF guidance)
    perGallonPerUnit: mlPerGal(10, 100) / 9,
    raiseUnitLabel: "ppm",
    notes: "Balling component. Dose equal volumes of 1+/2+/3+ for balance.",
  },
  {
    id: "aquaforest-component-2",
    brand: "Aquaforest",
    name: "Component 2+ (Alk)",
    water: "saltwater",
    mode: "raise",
    targetParameter: "alkalinity",
    unit: "ml",
    // 10 ml / 100 L ≈ +1.4 dKH (approx)
    perGallonPerUnit: mlPerGal(10, 100) / 1.4,
    raiseUnitLabel: "dKH",
    notes: "Alkalinity Balling component.",
  },
  {
    id: "aquaforest-component-3",
    brand: "Aquaforest",
    name: "Component 3+ (Mg/trace)",
    water: "saltwater",
    mode: "volume",
    targetParameter: "magnesium",
    unit: "ml",
    perGallon: mlPerGal(10, 100),
    notes: "Match Component 1+/2+ volume. Provides Mg and trace elements.",
  },

  // ——— Aquarium Co-Op / NilocG ———
  {
    id: "aco-easy-green",
    brand: "Aquarium Co-Op",
    name: "Easy Green",
    water: "freshwater",
    mode: "volume",
    targetParameter: "other",
    unit: "ml",
    // 1 pump ≈ 1 ml per 10 gal
    perGallon: mlPerUsGal(1, 10),
    notes: "All-in-one planted fertilizer. 1 pump per 10 gal is the usual starting point.",
  },
  {
    id: "aco-easy-iron",
    brand: "Aquarium Co-Op",
    name: "Easy Iron",
    water: "freshwater",
    mode: "volume",
    targetParameter: "other",
    unit: "ml",
    perGallon: mlPerUsGal(1, 10),
    notes: "Iron supplement. Dose when new growth looks pale.",
  },
  {
    id: "aco-easy-potassium",
    brand: "Aquarium Co-Op",
    name: "Easy Potassium",
    water: "freshwater",
    mode: "volume",
    targetParameter: "other",
    unit: "ml",
    perGallon: mlPerUsGal(1, 10),
    notes: "Potassium for planted tanks.",
  },
  {
    id: "nilocg-thrive",
    brand: "NilocG",
    name: "Thrive",
    water: "freshwater",
    mode: "volume",
    targetParameter: "other",
    unit: "ml",
    perGallon: mlPerUsGal(1, 10),
    notes: "All-in-one EI-style fert. 1 pump / 10 gal is a common start.",
  },
  {
    id: "nilocg-thrive-plus",
    brand: "NilocG",
    name: "Thrive+",
    water: "freshwater",
    mode: "volume",
    targetParameter: "other",
    unit: "ml",
    perGallon: mlPerUsGal(1, 10),
    notes: "Higher nutrient version for demanding planted tanks.",
  },

  // ——— Tropica ———
  {
    id: "tropica-specialised",
    brand: "Tropica",
    name: "Specialised Nutrition",
    water: "freshwater",
    mode: "volume",
    targetParameter: "other",
    unit: "ml",
    // 6 ml / 50 L weekly-ish (label schedule)
    perGallon: mlPerGal(6, 50),
    notes: "For tanks with CO₂ and high light. Follow Tropica’s weekly schedule.",
  },
  {
    id: "tropica-premium",
    brand: "Tropica",
    name: "Premium Nutrition",
    water: "freshwater",
    mode: "volume",
    targetParameter: "other",
    unit: "ml",
    perGallon: mlPerGal(5, 50),
    notes: "Lower-nutrient formula for low-tech planted tanks.",
  },

  // ——— Easy Life ———
  {
    id: "easylife-profito",
    brand: "Easy Life",
    name: "Profito",
    water: "freshwater",
    mode: "volume",
    targetParameter: "other",
    unit: "ml",
    perGallon: mlPerGal(10, 100),
    notes: "Comprehensive plant fertilizer. Weekly dose per label.",
  },
  {
    id: "easylife-easycarbo",
    brand: "Easy Life",
    name: "EasyCarbo",
    water: "freshwater",
    mode: "volume",
    targetParameter: "other",
    unit: "ml",
    perGallon: mlPerGal(1, 50),
    notes: "Liquid carbon. Daily dose; do not overdose.",
  },

  // ——— Tetra / Aqueon ———
  {
    id: "tetra-aquasafe",
    brand: "Tetra",
    name: "AquaSafe",
    water: "both",
    mode: "volume",
    targetParameter: "other",
    unit: "ml",
    perGallon: mlPerUsGal(5, 10),
    notes: "Water conditioner. Typical 5 ml per 10 US gal — confirm bottle.",
  },
  {
    id: "aqueon-water-conditioner",
    brand: "Aqueon",
    name: "Water Conditioner",
    water: "both",
    mode: "volume",
    targetParameter: "other",
    unit: "ml",
    perGallon: mlPerUsGal(5, 10),
    notes: "Dechlorinator / conditioner. Match the dose printed on your bottle.",
  },
]

/** @deprecated Use DOSE_PRODUCTS */
export const SEACHEM_PRODUCTS = DOSE_PRODUCTS

export function doseProductsFor(waterType: "saltwater" | "freshwater") {
  return DOSE_PRODUCTS.filter((product) => product.water === "both" || product.water === waterType)
}

/** @deprecated Use doseProductsFor */
export function seachemProductsFor(waterType: "saltwater" | "freshwater") {
  return doseProductsFor(waterType)
}

export function getDoseProduct(id: string) {
  return DOSE_PRODUCTS.find((product) => product.id === id)
}

/** @deprecated Use getDoseProduct */
export function getSeachemProduct(id: string) {
  return getDoseProduct(id)
}

export type DoseResult = {
  amount: number
  unit: "ml" | "g"
  teaspoonsApprox?: number
  detail: string
}

/** @deprecated Use DoseResult */
export type SeachemDoseResult = DoseResult

export function calculateDose(input: {
  productId: string
  gallons: number
  current?: number
  target?: number
}): DoseResult | null {
  const product = getDoseProduct(input.productId)
  if (!product || !(input.gallons > 0)) return null

  if (product.mode === "volume") {
    const amount = round(input.gallons * (product.perGallon ?? 0), 2)
    return {
      amount,
      unit: product.unit,
      teaspoonsApprox: product.unit === "g" ? round(amount / 5, 1) : undefined,
      detail: `${product.brand} ${product.name} for ${round(input.gallons, 1)} gal`,
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
    detail: `Raise ${product.raiseUnitLabel} from ${current} → ${target} (Δ ${round(delta, 2)}) · ${round(input.gallons, 1)} gal`,
  }
}

/** @deprecated Use calculateDose */
export function calculateSeachemDose(input: {
  productId: string
  gallons: number
  current?: number
  target?: number
}) {
  return calculateDose(input)
}

function round(value: number, digits: number) {
  const f = 10 ** digits
  return Math.round(value * f) / f
}
