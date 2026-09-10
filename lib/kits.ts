import type { WaterType } from "@/lib/parameters"

export type KitId = "freshwater_master" | "saltwater_master" | "reef_master" | "other"

export type TestGuide = {
  id: string
  kit: KitId
  kitLabel: string
  parameter: "ph" | "ammonia" | "nitrite" | "nitrate" | "calcium" | "alkalinity" | "phosphate"
  title: string
  method: "color" | "titration"
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

export const KITS: { id: KitId; label: string; tests: string[]; waterTypes: WaterType[] }[] = [
  {
    id: "freshwater_master",
    label: "API Freshwater Master Test Kit",
    tests: ["ph", "ammonia", "nitrite", "nitrate"],
    waterTypes: ["freshwater"],
  },
  {
    id: "saltwater_master",
    label: "API Saltwater Master Test Kit",
    tests: ["ph", "ammonia", "nitrite", "nitrate"],
    waterTypes: ["saltwater"],
  },
  {
    id: "reef_master",
    label: "API Reef Master Test Kit",
    tests: ["calcium", "alkalinity", "phosphate", "nitrate"],
    waterTypes: ["saltwater"],
  },
  {
    id: "other",
    label: "Other / thermometer / KH kit",
    tests: ["salinity", "temperature", "alkalinity"],
    waterTypes: ["saltwater", "freshwater"],
  },
]

export function kitsFor(waterType: WaterType) {
  return KITS.filter((kit) => kit.waterTypes.includes(waterType)).map((kit) => {
    if (kit.id === "other" && waterType === "freshwater") {
      return { ...kit, label: "Other / thermometer / KH kit", tests: ["temperature", "alkalinity"] }
    }
    if (kit.id === "other") {
      return { ...kit, label: "Other / refractometer / thermometer", tests: ["salinity", "temperature"] }
    }
    return kit
  })
}

export const TEST_GUIDES: TestGuide[] = [
  {
    id: "fw-ph",
    kit: "freshwater_master",
    kitLabel: "Freshwater Master Kit",
    parameter: "ph",
    title: "pH",
    method: "color",
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
    kitLabel: "Freshwater Master Kit",
    parameter: "ammonia",
    title: "Ammonia",
    method: "color",
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
    kitLabel: "Freshwater Master Kit",
    parameter: "nitrite",
    title: "Nitrite",
    method: "color",
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
    kitLabel: "Freshwater Master Kit",
    parameter: "nitrate",
    title: "Nitrate",
    method: "color",
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
  {
    id: "sw-ph",
    kit: "saltwater_master",
    kitLabel: "Saltwater Master Kit",
    parameter: "ph",
    title: "High-range pH",
    method: "color",
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
    kitLabel: "Saltwater Master Kit",
    parameter: "ammonia",
    title: "Ammonia",
    method: "color",
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
    kitLabel: "Saltwater Master Kit",
    parameter: "nitrite",
    title: "Nitrite",
    method: "color",
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
    kitLabel: "Saltwater Master Kit",
    parameter: "nitrate",
    title: "Nitrate",
    method: "color",
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
  {
    id: "reef-calcium",
    kit: "reef_master",
    kitLabel: "Reef Master Kit",
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
    kitLabel: "Reef Master Kit",
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
    kitLabel: "Reef Master Kit",
    parameter: "phosphate",
    title: "Phosphate",
    method: "color",
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
    kitLabel: "Reef Master Kit",
    parameter: "nitrate",
    title: "Nitrate",
    method: "color",
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
]

export function guidesForKit(kitId: KitId) {
  return TEST_GUIDES.filter((guide) => guide.kit === kitId)
}

export const KIT_DISCLAIMER =
  "These are original checklists for the tests those kits perform. Follow your printed booklet if anything differs, and never return used reagent to the tank."
