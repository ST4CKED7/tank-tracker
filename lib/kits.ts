import type { WaterType } from "@/lib/parameters"
import { API_COLOR_VALUES } from "@/lib/parameters"

export type KitId =
  | "freshwater_master"
  | "saltwater_master"
  | "reef_master"
  | "seachem_multitest"
  | "api_gh_kh"
  | "salifert"
  | "red_sea"
  | "hanna"
  | "nyos"
  | "strips"
  | "instruments"
  | "other"

export type KitCategory = "liquid" | "titration" | "digital" | "strips" | "instrument"

export type TestGuide = {
  id: string
  kit: KitId
  kitLabel: string
  parameter: "ph" | "ammonia" | "nitrite" | "nitrate" | "calcium" | "alkalinity" | "phosphate"
  title: string
  method: "color" | "titration" | "entry"
  /** When set, Log Tests shows a color-card select instead of free entry. */
  colorValues?: number[]
  waitSeconds?: number
  shakeSeconds?: number
  titration?: {
    dropUnit: number
    unit: string
    startColor: string
    endColor: string
  }
  steps: string[]
  tips: string[]
}

export type KitDef = {
  id: KitId
  label: string
  shortLabel: string
  brand: string
  category: KitCategory
  tests: string[]
  waterTypes: WaterType[]
  blurb: string
}

export const KITS: KitDef[] = [
  {
    id: "freshwater_master",
    label: "API Freshwater Master Test Kit",
    shortLabel: "API Freshwater Master",
    brand: "API",
    category: "liquid",
    tests: ["ph", "ammonia", "nitrite", "nitrate"],
    waterTypes: ["freshwater"],
    blurb: "Classic liquid color cards for community tanks.",
  },
  {
    id: "api_gh_kh",
    label: "API GH & KH Test Kit",
    shortLabel: "API GH & KH",
    brand: "API",
    category: "titration",
    tests: ["alkalinity"],
    waterTypes: ["freshwater"],
    blurb: "Drop-count KH (and GH) for hardness.",
  },
  {
    id: "seachem_multitest",
    label: "Seachem MultiTest",
    shortLabel: "Seachem MultiTest",
    brand: "Seachem",
    category: "liquid",
    tests: ["ammonia", "nitrite", "nitrate", "ph", "alkalinity", "phosphate"],
    waterTypes: ["freshwater", "saltwater"],
    blurb: "Sensor cards / liquid MultiTest line — enter the card reading.",
  },
  {
    id: "saltwater_master",
    label: "API Saltwater Master Test Kit",
    shortLabel: "API Saltwater Master",
    brand: "API",
    category: "liquid",
    tests: ["ph", "ammonia", "nitrite", "nitrate"],
    waterTypes: ["saltwater"],
    blurb: "High-range pH plus nitrogen cycle liquids.",
  },
  {
    id: "reef_master",
    label: "API Reef Master Test Kit",
    shortLabel: "API Reef Master",
    brand: "API",
    category: "titration",
    tests: ["calcium", "alkalinity", "phosphate", "nitrate"],
    waterTypes: ["saltwater"],
    blurb: "Ca / Alk titrations plus phosphate and nitrate.",
  },
  {
    id: "salifert",
    label: "Salifert test kits",
    shortLabel: "Salifert",
    brand: "Salifert",
    category: "titration",
    tests: ["alkalinity", "calcium", "nitrate", "phosphate", "ph"],
    waterTypes: ["saltwater"],
    blurb: "Popular reef titration and color kits — follow your booklet math.",
  },
  {
    id: "red_sea",
    label: "Red Sea test kits",
    shortLabel: "Red Sea",
    brand: "Red Sea",
    category: "titration",
    tests: ["alkalinity", "calcium", "nitrate", "phosphate", "ph"],
    waterTypes: ["saltwater"],
    blurb: "Marine Care / Reef Foundation Pro style checklists.",
  },
  {
    id: "nyos",
    label: "Nyos / high-precision titration",
    shortLabel: "Nyos",
    brand: "Nyos",
    category: "titration",
    tests: ["alkalinity", "calcium", "nitrate"],
    waterTypes: ["saltwater"],
    blurb: "Syringe titration kits — log the final booklet result.",
  },
  {
    id: "hanna",
    label: "Hanna Checker / digital photometer",
    shortLabel: "Hanna / digital",
    brand: "Hanna",
    category: "digital",
    tests: ["alkalinity", "calcium", "phosphate", "nitrate", "ammonia"],
    waterTypes: ["freshwater", "saltwater"],
    blurb: "Enter the number from the checker display.",
  },
  {
    id: "strips",
    label: "Test strips",
    shortLabel: "Test strips",
    brand: "Generic",
    category: "strips",
    tests: ["ph", "ammonia", "nitrite", "nitrate", "alkalinity"],
    waterTypes: ["freshwater", "saltwater"],
    blurb: "Quick strip reads — coarse, but fine for a spot check.",
  },
  {
    id: "instruments",
    label: "Refractometer / thermometer / probe",
    shortLabel: "Instruments",
    brand: "Instruments",
    category: "instrument",
    tests: ["salinity", "temperature", "ph"],
    waterTypes: ["freshwater", "saltwater"],
    blurb: "Meters and probes outside a reagent kit.",
  },
  {
    id: "other",
    label: "Manual entry (any method)",
    shortLabel: "Manual entry",
    brand: "Other",
    category: "instrument",
    tests: ["any"],
    waterTypes: ["saltwater", "freshwater"],
    blurb: "Log a reading when your method is not listed.",
  },
]

const KIT_IDS = new Set(KITS.map((kit) => kit.id))

export function isKitId(value: unknown): value is KitId {
  return typeof value === "string" && KIT_IDS.has(value as KitId)
}

export function parseKitId(value: unknown, fallback: KitId = "other"): KitId {
  return isKitId(value) ? value : fallback
}

export function kitById(id: KitId) {
  return KITS.find((kit) => kit.id === id)
}

export function kitsFor(waterType: WaterType) {
  return KITS.filter((kit) => kit.waterTypes.includes(waterType)).map((kit) => {
    if (kit.id === "instruments" && waterType === "freshwater") {
      return { ...kit, tests: ["temperature", "ph"], blurb: "Thermometer, pH probe, or digital meter." }
    }
    if (kit.id === "other" && waterType === "freshwater") {
      return { ...kit, tests: ["temperature", "alkalinity", "ph", "nitrate"], blurb: "Any kit, strip, or meter not listed." }
    }
    if (kit.id === "other") {
      return { ...kit, tests: ["salinity", "temperature", "any"], blurb: "Any kit, strip, or meter not listed." }
    }
    if (kit.id === "seachem_multitest" && waterType === "freshwater") {
      return { ...kit, tests: ["ammonia", "nitrite", "nitrate", "ph", "alkalinity"] }
    }
    if (kit.id === "hanna" && waterType === "freshwater") {
      return { ...kit, tests: ["ammonia", "nitrate", "phosphate", "alkalinity"] }
    }
    if (kit.id === "strips" && waterType === "saltwater") {
      return { ...kit, tests: ["ph", "nitrite", "nitrate", "alkalinity"] }
    }
    return kit
  })
}

export function defaultKitFor(waterType: WaterType, preferred?: string | null): KitId {
  const available = kitsFor(waterType)
  if (preferred && available.some((kit) => kit.id === preferred)) return preferred as KitId
  return available[0]?.id ?? "other"
}

function apiColors(parameter: "ph" | "ammonia" | "nitrite" | "nitrate" | "phosphate"): number[] | undefined {
  return API_COLOR_VALUES[parameter]
}

export const TEST_GUIDES: TestGuide[] = [
  // ——— API Freshwater Master ———
  {
    id: "fw-ph",
    kit: "freshwater_master",
    kitLabel: "API Freshwater Master",
    parameter: "ph",
    title: "pH",
    method: "color",
    colorValues: apiColors("ph"),
    steps: [
      "Rinse a clean test tube with tank water, then fill to the 5 ml line.",
      "Hold the pH bottle fully vertical and add 3 drops (follow your booklet if it differs).",
      "Cap the tube. Invert several times to mix.",
      "Compare the color to the pH card in good light.",
      "Rinse the tube with clean water when you are done.",
    ],
    tips: [
      "Most community freshwater tanks sit near 6.8–7.8. Soft-water fish prefer lower; African cichlids higher.",
      "Never pour used test solution back into the aquarium.",
    ],
  },
  {
    id: "fw-ammonia",
    kit: "freshwater_master",
    kitLabel: "API Freshwater Master",
    parameter: "ammonia",
    title: "Ammonia",
    method: "color",
    colorValues: apiColors("ammonia"),
    waitSeconds: 300,
    steps: [
      "Rinse a clean test tube with tank water, then fill to the 5 ml line.",
      "Hold bottle #1 vertical and add 8 drops.",
      "Hold bottle #2 vertical and add 8 drops.",
      "Cap and shake hard for 5 seconds.",
      "Wait 5 minutes for color to develop, then match the ammonia color card.",
      "Rinse the tube with clean water.",
    ],
    tips: [
      "In a cycled tank ammonia should stay at 0 ppm. Any detectable amount is a problem.",
      "Bottle #2 is corrosive. Keep reagents away from skin, eyes, and children.",
    ],
  },
  {
    id: "fw-nitrite",
    kit: "freshwater_master",
    kitLabel: "API Freshwater Master",
    parameter: "nitrite",
    title: "Nitrite",
    method: "color",
    colorValues: apiColors("nitrite"),
    waitSeconds: 300,
    steps: [
      "Rinse a clean test tube with tank water, then fill to the 5 ml line.",
      "Hold the nitrite bottle vertical and add 5 drops.",
      "Cap and shake for 5 seconds.",
      "Wait 5 minutes, then match the nitrite color card.",
      "Rinse the tube with clean water.",
    ],
    tips: ["Established tanks should read 0 ppm nitrite."],
  },
  {
    id: "fw-nitrate",
    kit: "freshwater_master",
    kitLabel: "API Freshwater Master",
    parameter: "nitrate",
    title: "Nitrate",
    method: "color",
    colorValues: apiColors("nitrate"),
    waitSeconds: 300,
    shakeSeconds: 60,
    steps: [
      "Rinse a clean test tube with tank water, then fill to the 5 ml line.",
      "Hold nitrate bottle #1 vertical and add 10 drops. Cap and invert to mix.",
      "Shake nitrate bottle #2 hard for at least 30 seconds.",
      "Add 10 drops from bottle #2, holding it vertical.",
      "Cap and shake the tube hard for 1 full minute.",
      "Wait 5 minutes, then match the nitrate color card.",
      "Rinse the tube with clean water.",
    ],
    tips: [
      "Community tanks often aim under ~40 ppm. Planted tanks may run lower.",
      "Skipping the bottle or tube shake is the usual reason this test reads low.",
    ],
  },

  // ——— API GH & KH ———
  {
    id: "api-kh",
    kit: "api_gh_kh",
    kitLabel: "API GH & KH",
    parameter: "alkalinity",
    title: "KH (carbonate hardness)",
    method: "titration",
    titration: {
      dropUnit: 1,
      unit: "dKH",
      startColor: "blue",
      endColor: "yellow",
    },
    steps: [
      "Rinse the tube with tank water and fill to the 5 ml line.",
      "Add KH reagent one drop at a time, holding the bottle vertical. Count every drop.",
      "Cap and invert after each drop until the sample turns from blue to yellow.",
      "Each drop equals about 1 dKH (≈17.9 ppm CaCO₃).",
      "Rinse the tube when finished.",
    ],
    tips: [
      "If the first drop turns yellow, KH is about 1 dKH or less.",
      "GH uses the other bottle — log GH in notes if you track it separately.",
    ],
  },

  // ——— Seachem MultiTest ———
  {
    id: "sea-ammonia",
    kit: "seachem_multitest",
    kitLabel: "Seachem MultiTest",
    parameter: "ammonia",
    title: "Ammonia",
    method: "entry",
    waitSeconds: 300,
    steps: [
      "Fill the vial with sample water per the MultiTest booklet.",
      "Add the ammonia reagents (or use the sensor card) exactly as printed.",
      "Wait the full development time before reading.",
      "Match the sensor / color reference and enter that value.",
    ],
    tips: ["Seachem Free & Total Ammonia reads both free NH₃ and total ammonia — note which you logged."],
  },
  {
    id: "sea-nitrite",
    kit: "seachem_multitest",
    kitLabel: "Seachem MultiTest",
    parameter: "nitrite",
    title: "Nitrite",
    method: "entry",
    waitSeconds: 300,
    steps: [
      "Fill the vial to the sample line.",
      "Add nitrite reagents per the booklet.",
      "Wait for full color development, then match the card.",
      "Enter the ppm reading.",
    ],
    tips: ["Cycled tanks should read 0 ppm nitrite."],
  },
  {
    id: "sea-nitrate",
    kit: "seachem_multitest",
    kitLabel: "Seachem MultiTest",
    parameter: "nitrate",
    title: "Nitrate",
    method: "entry",
    waitSeconds: 300,
    steps: [
      "Fill the vial and add nitrate reagents per MultiTest instructions.",
      "Shake / wait exactly as the booklet says — timing matters.",
      "Read the card and enter nitrate as NO₃ (ppm).",
    ],
    tips: ["Confirm whether your card is NO₃ or nitrate-nitrogen and convert if needed."],
  },
  {
    id: "sea-ph",
    kit: "seachem_multitest",
    kitLabel: "Seachem MultiTest",
    parameter: "ph",
    title: "pH",
    method: "entry",
    steps: [
      "Use the MultiTest pH sensor or liquid reagents for your range.",
      "Compare to the reference chart in natural light.",
      "Enter the pH value.",
    ],
    tips: ["Wide-range and high-range cards cover different spans — pick the card that matches your tank."],
  },
  {
    id: "sea-alk",
    kit: "seachem_multitest",
    kitLabel: "Seachem MultiTest",
    parameter: "alkalinity",
    title: "Alkalinity / KH",
    method: "entry",
    steps: [
      "Run the MultiTest Alkalinity procedure from the booklet.",
      "Convert to dKH if your kit reports meq/L (1 meq/L ≈ 2.8 dKH).",
      "Enter the result in dKH.",
    ],
    tips: ["Stability matters more than chasing a single KH number."],
  },
  {
    id: "sea-po4",
    kit: "seachem_multitest",
    kitLabel: "Seachem MultiTest",
    parameter: "phosphate",
    title: "Phosphate",
    method: "entry",
    waitSeconds: 180,
    steps: [
      "Fill the vial and add phosphate reagents per the booklet.",
      "Wait the full development time.",
      "Match the card and enter ppm PO₄.",
    ],
    tips: ["Low reef phosphates are hard to resolve on hobby cards — consider a Hanna checker if you chase ultra-low PO₄."],
  },

  // ——— API Saltwater Master ———
  {
    id: "sw-ph",
    kit: "saltwater_master",
    kitLabel: "API Saltwater Master",
    parameter: "ph",
    title: "High-range pH",
    method: "color",
    colorValues: apiColors("ph"),
    steps: [
      "Rinse a clean test tube with tank water, then fill to the 5 ml line.",
      "Hold the high-range pH bottle fully vertical and add 5 drops.",
      "Cap the tube. Invert several times to mix. Do not cover the open tube with a finger.",
      "Compare the color to the high-range pH card in good light, against the white area of the card.",
      "Rinse the tube with clean water when you are done.",
    ],
    tips: [
      "This kit reads about 7.4–8.8. Established saltwater tanks usually sit near 8.1–8.4.",
      "Never pour used test solution back into the aquarium.",
    ],
  },
  {
    id: "sw-ammonia",
    kit: "saltwater_master",
    kitLabel: "API Saltwater Master",
    parameter: "ammonia",
    title: "Ammonia",
    method: "color",
    colorValues: apiColors("ammonia"),
    waitSeconds: 300,
    steps: [
      "Rinse a clean test tube with tank water, then fill to the 5 ml line.",
      "Hold bottle #1 vertical and add 8 drops.",
      "Hold bottle #2 vertical and add 8 drops.",
      "Cap and shake hard for 5 seconds.",
      "Wait 5 minutes for color to develop, then match the ammonia color card.",
      "Rinse the tube with clean water.",
    ],
    tips: [
      "In a cycled tank ammonia should stay at 0 ppm. Any detectable amount is a problem.",
      "Bottle #2 is corrosive. Keep reagents away from skin, eyes, and children.",
    ],
  },
  {
    id: "sw-nitrite",
    kit: "saltwater_master",
    kitLabel: "API Saltwater Master",
    parameter: "nitrite",
    title: "Nitrite",
    method: "color",
    colorValues: apiColors("nitrite"),
    waitSeconds: 300,
    steps: [
      "Rinse a clean test tube with tank water, then fill to the 5 ml line.",
      "Hold the nitrite bottle vertical and add 5 drops.",
      "Cap and shake for 5 seconds.",
      "Wait 5 minutes, then match the nitrite color card.",
      "Rinse the tube with clean water.",
    ],
    tips: [
      "This kit reports total nitrite (NO2−), not nitrite-nitrogen. Established tanks should read 0 ppm.",
    ],
  },
  {
    id: "sw-nitrate",
    kit: "saltwater_master",
    kitLabel: "API Saltwater Master",
    parameter: "nitrate",
    title: "Nitrate",
    method: "color",
    colorValues: apiColors("nitrate"),
    waitSeconds: 300,
    shakeSeconds: 60,
    steps: [
      "Rinse a clean test tube with tank water, then fill to the 5 ml line.",
      "Hold nitrate bottle #1 vertical and add 10 drops. Cap and invert to mix.",
      "Shake nitrate bottle #2 hard for at least 30 seconds. This step is required for an accurate reading.",
      "Add 10 drops from bottle #2, holding it vertical.",
      "Cap and shake the tube hard for 1 full minute.",
      "Wait 5 minutes, then match the nitrate color card.",
      "Rinse the tube with clean water.",
    ],
    tips: [
      "Skipping the 30-second bottle shake or the 1-minute tube shake is the usual reason this test reads low.",
      "This kit reports total nitrate (NO3−), not nitrate-nitrogen.",
    ],
  },

  // ——— API Reef Master ———
  {
    id: "reef-calcium",
    kit: "reef_master",
    kitLabel: "API Reef Master",
    parameter: "calcium",
    title: "Calcium (titration)",
    method: "titration",
    titration: {
      dropUnit: 20,
      unit: "ppm",
      startColor: "pink",
      endColor: "blue",
    },
    steps: [
      "Rinse a clean test tube with tank water, then fill to the 5 ml line.",
      "Add 10 drops of calcium solution #1. Cap and shake for about 10 seconds.",
      "Shake calcium solution #2 for about 10 seconds.",
      "Add solution #2 one drop at a time, holding the bottle vertical. Cap and swirl between drops.",
      "Count every drop until the sample turns from pink through purple to a clear blue endpoint.",
      "Calcium ppm = drops of solution #2 × 20. If the first drop is already blue, calcium is 20 ppm or less.",
      "Rinse the tube with clean water.",
    ],
    tips: [
      "Slow down once the sample turns purple — the last 1–2 drops reach the blue endpoint.",
      "Reef tanks usually target about 380–450 ppm calcium.",
    ],
  },
  {
    id: "reef-alk",
    kit: "reef_master",
    kitLabel: "API Reef Master",
    parameter: "alkalinity",
    title: "Carbonate hardness / alkalinity (titration)",
    method: "titration",
    titration: {
      dropUnit: 1,
      unit: "dKH",
      startColor: "blue",
      endColor: "yellow",
    },
    steps: [
      "Rinse a clean test tube with tank water, then fill to the 5 ml line.",
      "Add KH reagent one drop at a time, holding the bottle fully vertical. Count every drop.",
      "After each drop, cap and invert several times. Do not cover the open tube with a finger.",
      "The sample usually starts pale blue. Keep adding until it turns bright yellow.",
      "Each drop equals 1 dKH (about 17.9 ppm alkalinity).",
      "If color is hard to see, look down through the tube over a white background.",
      "Rinse the tube with clean water.",
    ],
    tips: [
      "If the first drop turns yellow, alkalinity is 1 dKH or less.",
      "Most mixed reefs run about 7.5–11 dKH. Stability matters more than chasing a single number.",
    ],
  },
  {
    id: "reef-phosphate",
    kit: "reef_master",
    kitLabel: "API Reef Master",
    parameter: "phosphate",
    title: "Phosphate",
    method: "color",
    colorValues: apiColors("phosphate"),
    waitSeconds: 180,
    steps: [
      "Rinse a clean test tube with tank water, then fill to the 5 ml line.",
      "Hold phosphate bottle #1 vertical and add 6 drops. Cap and shake hard for 5 seconds.",
      "Hold bottle #2 vertical and add 6 drops. This reagent is thick — squeeze firmly.",
      "Cap and shake hard for 5 seconds.",
      "Wait 3 minutes, then match the phosphate color card in good light against the white area.",
      "Rinse the tube with clean water.",
    ],
    tips: [
      "Hobby liquid kits are coarse at reef levels. Treat anything above 0 as a reason to watch algae and coral growth.",
    ],
  },
  {
    id: "reef-nitrate",
    kit: "reef_master",
    kitLabel: "API Reef Master",
    parameter: "nitrate",
    title: "Nitrate",
    method: "color",
    colorValues: apiColors("nitrate"),
    waitSeconds: 300,
    shakeSeconds: 60,
    steps: [
      "Rinse a clean test tube with tank water, then fill to the 5 ml line.",
      "Hold nitrate bottle #1 vertical and add 10 drops. Cap and invert to mix.",
      "Shake nitrate bottle #2 hard for at least 30 seconds.",
      "Add 10 drops from bottle #2, holding it vertical.",
      "Cap and shake the tube hard for 1 full minute.",
      "Wait 5 minutes, then match the nitrate color card.",
      "Rinse the tube with clean water.",
    ],
    tips: [
      "This is the same nitrate method as the Saltwater Master Kit. You do not need to run both unless you are comparing bottles.",
    ],
  },

  // ——— Salifert ———
  {
    id: "sal-alk",
    kit: "salifert",
    kitLabel: "Salifert",
    parameter: "alkalinity",
    title: "KH / alkalinity",
    method: "titration",
    titration: {
      dropUnit: 0.28,
      unit: "dKH",
      startColor: "blue",
      endColor: "yellow/pink",
    },
    steps: [
      "Fill the syringe / vial to the sample volume printed in the Salifert KH booklet (often 4 ml).",
      "Add the indicator, then add titrant drop by drop while swirling.",
      "Stop at the color change endpoint described in your booklet.",
      "Use the kit’s drop factor (commonly ~0.28 dKH per drop for the standard 4 ml procedure) or the table in the booklet.",
    ],
    tips: [
      "Booklet factors differ by kit revision — trust the printed table if it disagrees with the drop counter here.",
      "1 meq/L ≈ 2.8 dKH if you need to convert.",
    ],
  },
  {
    id: "sal-ca",
    kit: "salifert",
    kitLabel: "Salifert",
    parameter: "calcium",
    title: "Calcium",
    method: "entry",
    steps: [
      "Follow the Salifert Calcium titration exactly (sample size, reagents, endpoint).",
      "Calculate ppm from the booklet table or formula.",
      "Enter the final calcium ppm.",
    ],
    tips: ["Go slowly near the endpoint — one drop can overshoot pink → blue."],
  },
  {
    id: "sal-no3",
    kit: "salifert",
    kitLabel: "Salifert",
    parameter: "nitrate",
    title: "Nitrate",
    method: "entry",
    waitSeconds: 180,
    steps: [
      "Run the Salifert Nitrate color procedure from the booklet.",
      "Wait the full development time before comparing the chart.",
      "Enter nitrate as ppm NO₃.",
    ],
    tips: ["Low-range and standard charts exist — use the range that matches your expected level."],
  },
  {
    id: "sal-po4",
    kit: "salifert",
    kitLabel: "Salifert",
    parameter: "phosphate",
    title: "Phosphate",
    method: "entry",
    waitSeconds: 180,
    steps: [
      "Follow the Salifert Phosphate booklet steps.",
      "Read the chart after the wait time.",
      "Enter ppm PO₄.",
    ],
    tips: ["Ultra-low reef phosphate is easier on a Hanna ULR checker than on a color chart."],
  },
  {
    id: "sal-ph",
    kit: "salifert",
    kitLabel: "Salifert",
    parameter: "ph",
    title: "pH",
    method: "entry",
    steps: [
      "Use the Salifert pH kit (or a calibrated probe) per instructions.",
      "Enter the pH reading.",
    ],
    tips: ["Reef pH often sits ~8.1–8.4; note time of day if you track swings."],
  },

  // ——— Red Sea ———
  {
    id: "rs-alk",
    kit: "red_sea",
    kitLabel: "Red Sea",
    parameter: "alkalinity",
    title: "Alkalinity (Foundation / Pro)",
    method: "entry",
    steps: [
      "Fill the titration vial to the sample mark in the Red Sea booklet.",
      "Add indicator, then titrate to the endpoint color.",
      "Convert with the kit table (dKH or meq/L) and enter dKH here.",
    ],
    tips: ["Pro kits often use a syringe — record the dispensed volume, then convert."],
  },
  {
    id: "rs-ca",
    kit: "red_sea",
    kitLabel: "Red Sea",
    parameter: "calcium",
    title: "Calcium",
    method: "entry",
    steps: [
      "Run the Red Sea Calcium titration from the booklet.",
      "Calculate ppm calcium and enter it.",
    ],
    tips: ["Keep Ca and Alk moving together when you dose."],
  },
  {
    id: "rs-no3",
    kit: "red_sea",
    kitLabel: "Red Sea",
    parameter: "nitrate",
    title: "Nitrate (Marine Care / Pro)",
    method: "entry",
    waitSeconds: 420,
    steps: [
      "Follow the Red Sea nitrate colorimetric steps (Pro kits may use a comparator).",
      "Wait the full development time.",
      "Enter ppm NO₃.",
    ],
    tips: ["Low-range Pro kits resolve reef levels better than master liquid kits."],
  },
  {
    id: "rs-po4",
    kit: "red_sea",
    kitLabel: "Red Sea",
    parameter: "phosphate",
    title: "Phosphate",
    method: "entry",
    waitSeconds: 180,
    steps: [
      "Run the Red Sea phosphate test per the booklet.",
      "Enter ppm PO₄ from the comparator or chart.",
    ],
    tips: [],
  },
  {
    id: "rs-ph",
    kit: "red_sea",
    kitLabel: "Red Sea",
    parameter: "ph",
    title: "pH",
    method: "entry",
    steps: [
      "Use the Marine Care pH test or a probe.",
      "Enter the pH value.",
    ],
    tips: [],
  },

  // ——— Nyos ———
  {
    id: "nyos-alk",
    kit: "nyos",
    kitLabel: "Nyos",
    parameter: "alkalinity",
    title: "Alkalinity",
    method: "entry",
    steps: [
      "Use the Nyos syringe titration volume printed for your kit.",
      "Titrate to the endpoint, then calculate dKH from the booklet.",
      "Enter dKH.",
    ],
    tips: ["These kits are precise — rinse glassware and avoid air bubbles in the syringe."],
  },
  {
    id: "nyos-ca",
    kit: "nyos",
    kitLabel: "Nyos",
    parameter: "calcium",
    title: "Calcium",
    method: "entry",
    steps: [
      "Follow the Nyos Calcium titration procedure.",
      "Enter the calculated ppm.",
    ],
    tips: [],
  },
  {
    id: "nyos-no3",
    kit: "nyos",
    kitLabel: "Nyos",
    parameter: "nitrate",
    title: "Nitrate",
    method: "entry",
    waitSeconds: 480,
    steps: [
      "Run the Nyos nitrate procedure (often longer development).",
      "Enter ppm NO₃.",
    ],
    tips: [],
  },

  // ——— Hanna / digital ———
  {
    id: "hanna-alk",
    kit: "hanna",
    kitLabel: "Hanna / digital",
    parameter: "alkalinity",
    title: "Alkalinity checker",
    method: "entry",
    steps: [
      "Zero / calibrate the checker with the vial of tank water as directed.",
      "Add the reagent packet, invert gently the required times.",
      "Insert the vial and read the display.",
      "Convert to dKH if the checker reports ppm CaCO₃ (÷ 17.86 ≈ dKH).",
    ],
    tips: ["Wipe the vial clear of fingerprints before reading."],
  },
  {
    id: "hanna-ca",
    kit: "hanna",
    kitLabel: "Hanna / digital",
    parameter: "calcium",
    title: "Calcium checker",
    method: "entry",
    steps: [
      "Follow the Hanna Calcium checker packet instructions.",
      "Enter ppm calcium from the display.",
    ],
    tips: [],
  },
  {
    id: "hanna-po4",
    kit: "hanna",
    kitLabel: "Hanna / digital",
    parameter: "phosphate",
    title: "Phosphate checker (LR / ULR)",
    method: "entry",
    steps: [
      "Use the LR or ULR phosphate checker matching your expected range.",
      "Enter ppm PO₄ from the display.",
    ],
    tips: ["ULR is preferred for nutrient-poor reefs."],
  },
  {
    id: "hanna-no3",
    kit: "hanna",
    kitLabel: "Hanna / digital",
    parameter: "nitrate",
    title: "Nitrate checker",
    method: "entry",
    steps: [
      "Run the Hanna nitrate procedure for your model.",
      "Confirm whether the display is NO₃ or nitrogen and convert if needed.",
      "Enter ppm NO₃.",
    ],
    tips: ["NO₃-N × 4.43 ≈ NO₃."],
  },
  {
    id: "hanna-ammonia",
    kit: "hanna",
    kitLabel: "Hanna / digital",
    parameter: "ammonia",
    title: "Ammonia checker",
    method: "entry",
    steps: [
      "Follow the ammonia checker packet steps.",
      "Enter ppm total ammonia from the display.",
    ],
    tips: ["Freshwater cycling and quarantine tanks benefit most from digital ammonia."],
  },

  // ——— Strips ———
  {
    id: "strip-ph",
    kit: "strips",
    kitLabel: "Test strips",
    parameter: "ph",
    title: "pH strip",
    method: "entry",
    steps: [
      "Dip the strip for the time on the bottle (often 1–2 seconds).",
      "Hold level — do not shake excess water violently.",
      "Compare to the bottle chart within the printed window.",
      "Enter pH.",
    ],
    tips: ["Strips are coarser than liquids or probes — great for a quick check, not fine tuning."],
  },
  {
    id: "strip-ammonia",
    kit: "strips",
    kitLabel: "Test strips",
    parameter: "ammonia",
    title: "Ammonia strip",
    method: "entry",
    steps: [
      "Dip and wait per the bottle instructions.",
      "Match the ammonia pad to the chart.",
      "Enter ppm.",
    ],
    tips: [],
  },
  {
    id: "strip-nitrite",
    kit: "strips",
    kitLabel: "Test strips",
    parameter: "nitrite",
    title: "Nitrite strip",
    method: "entry",
    steps: [
      "Dip, wait, and match the nitrite pad.",
      "Enter ppm.",
    ],
    tips: [],
  },
  {
    id: "strip-nitrate",
    kit: "strips",
    kitLabel: "Test strips",
    parameter: "nitrate",
    title: "Nitrate strip",
    method: "entry",
    steps: [
      "Dip, wait, and match the nitrate pad.",
      "Enter ppm NO₃.",
    ],
    tips: [],
  },
  {
    id: "strip-kh",
    kit: "strips",
    kitLabel: "Test strips",
    parameter: "alkalinity",
    title: "KH / alkalinity strip",
    method: "entry",
    steps: [
      "Match the KH / alkalinity pad to the chart.",
      "Enter dKH (convert from ppm CaCO₃ if the bottle uses that scale).",
    ],
    tips: ["ppm CaCO₃ ÷ 17.86 ≈ dKH."],
  },
]

export function guidesForKit(kitId: KitId) {
  return TEST_GUIDES.filter((guide) => guide.kit === kitId)
}

export const KIT_DISCLAIMER =
  "Checklists mirror common hobby procedures for these kits and methods. Always follow your printed booklet or meter manual if anything differs, and never return used reagent to the tank."

export const KIT_CATEGORY_LABEL: Record<KitCategory, string> = {
  liquid: "Liquid color kits",
  titration: "Titration kits",
  digital: "Digital checkers",
  strips: "Test strips",
  instrument: "Meters & manual",
}
