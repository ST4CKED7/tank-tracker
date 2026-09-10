export type EquipmentTypeGroup = {
  id: string
  label: string
  types: string[]
}

/** Catalog of gear types for the Equipment page — free-form strings stored on equipment.equipment_type. */
export const EQUIPMENT_TYPE_GROUPS: EquipmentTypeGroup[] = [
  {
    id: "filtration",
    label: "Filtration",
    types: [
      "canister filter",
      "HOB filter",
      "sponge filter",
      "internal filter",
      "sump",
      "filter socks",
      "filter floss / pad",
      "mechanical cartridge",
      "UV sterilizer",
      "diatom filter",
      "undergravel filter",
    ],
  },
  {
    id: "media",
    label: "Media & reactors",
    types: [
      "carbon",
      "GFO / phosphate media",
      "Purigen / polish media",
      "bio media",
      "algae scrubber / turf scrubber",
      "biopellet reactor",
      "carbon reactor",
      "GFO reactor",
      "media reactor",
      "refugium",
      "chaeto / macroalgae",
    ],
  },
  {
    id: "circulation",
    label: "Pumps & flow",
    types: [
      "return pump",
      "powerhead",
      "wavemaker",
      "circulation pump",
      "closed loop",
      "gyre / stream pump",
      "air pump",
      "air stone / diffuser",
      "CO₂ diffuser / reactor",
      "CO₂ regulator / solenoid",
    ],
  },
  {
    id: "skimmer",
    label: "Protein skimming",
    types: ["protein skimmer", "skimmer cup / collection", "ozone / ozone reactor"],
  },
  {
    id: "climate",
    label: "Heating & cooling",
    types: [
      "heater",
      "heater controller",
      "chiller",
      "cooling fan",
      "temperature controller",
      "thermostat",
    ],
  },
  {
    id: "lighting",
    label: "Lighting",
    types: [
      "LED light",
      "T5 / fluorescent",
      "metal halide",
      "clip-on light",
      "moonlight / actinic",
      "light timer / controller",
      "pendant light",
      "grow light (plants)",
    ],
  },
  {
    id: "auto",
    label: "ATO, dosing & top-off",
    types: [
      "ATO / auto top-off",
      "ATO reservoir",
      "dosing pump",
      "doser (alk / Ca / Mg)",
      "fertilizer doser",
      "calcium reactor",
      "kalkwasser stirrer",
      "RO/DI unit",
      "RO/DI reservoir",
      "water change system",
    ],
  },
  {
    id: "monitoring",
    label: "Controllers & probes",
    types: [
      "aquarium controller",
      "pH probe",
      "ORP probe",
      "salinity / conductivity probe",
      "temp probe / sensor",
      "leak detector",
      "optical level sensor",
      "float switch",
      "power bar / smart plug",
      "battery backup / UPS",
      "wifi camera",
    ],
  },
  {
    id: "freshwater",
    label: "Freshwater & planted",
    types: [
      "substrate heater cable",
      "plant substrate / aquasoil",
      "filter intake sponge",
      "prefilter sponge",
      "surface skimmer (FW)",
      "overflow box",
      "hang-on refugium",
      "breeding box / net",
      "aquarium lid / glass top",
    ],
  },
  {
    id: "saltwater",
    label: "Saltwater & reef",
    types: [
      "overflow / drain",
      "gate valve",
      "check valve",
      "ball valve",
      "plumbing / PVC",
      "manifold",
      "bubble trap",
      "foam fractionator media",
      "live rock / dry rock",
      "sand bed / substrate",
      "frag rack",
      "coral quarantine system",
      "QT / hospital tank gear",
      "magnet cleaner (glass)",
      "magnetic probe holder",
    ],
  },
  {
    id: "maintenance",
    label: "Maintenance tools",
    types: [
      "algae scraper / blade",
      "magnetic glass cleaner",
      "gravel vacuum / siphon",
      "python / water changer",
      "bucket / mixing station",
      "refractor / hydrometer",
      "thermometer",
      "timer (mechanical)",
      "net",
      "turkey baster / pipette",
      "feed ring / feeding station",
      "auto feeder",
    ],
  },
  {
    id: "other",
    label: "Other",
    types: ["other", "decoration / hardscape", "stand / canopy", "backup gear"],
  },
]

/** Flat unique list (preserves first occurrence order). */
export const EQUIPMENT_TYPES = EQUIPMENT_TYPE_GROUPS.flatMap((group) => group.types)

/** Suggested service interval (days) when adding a type — soft defaults only. */
export function defaultServiceDays(type: string): number {
  const t = type.toLowerCase()
  if (t.includes("sock") || t.includes("floss") || t.includes("skimmer cup")) return 7
  if (t.includes("carbon") || t.includes("gfo") || t.includes("purigen") || t.includes("polish")) return 30
  if (t.includes("probe") || t.includes("sensor")) return 90
  if (t.includes("ro/di") || t.includes("heater") || t.includes("light")) return 180
  if (t.includes("pump") || t.includes("powerhead") || t.includes("wavemaker") || t.includes("gyre")) return 90
  if (t.includes("skimmer")) return 14
  if (t.includes("filter") || t.includes("sponge") || t.includes("media")) return 14
  if (t.includes("ato") || t.includes("doser") || t.includes("dosing")) return 30
  return 30
}
