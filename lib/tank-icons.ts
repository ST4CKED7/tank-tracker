/** Stable keys stored on tanks.icon — shown in the picker */
export const TANK_ICON_PICKER_IDS = [
  "waves",
  "fish",
  "fish-symbol",
  "fishing-hook",
  "shrimp",
  "snail",
  "turtle",
  "worm",
  "shell",
  "egg",
  "droplets",
  "droplet",
  "bubbles",
  "cloud-rain",
  "leaf",
  "flower",
  "sun",
  "anchor",
  "sailboat",
  "ship",
  "ship-wheel",
  "life-buoy",
  "flask",
  "sparkles",
] as const

/** Older keys still rendered if already saved on a tank */
export const TANK_ICON_LEGACY_IDS = [
  "gem",
  "mountain",
  "trees",
  "orbit",
  "hexagon",
  "boxes",
  "wind",
  "zap",
  "heart",
  "anvil",
] as const

export const TANK_ICON_IDS = [...TANK_ICON_PICKER_IDS, ...TANK_ICON_LEGACY_IDS] as const

export type TankIconId = (typeof TANK_ICON_IDS)[number]

export const TANK_ICON_LABELS: Record<TankIconId, string> = {
  waves: "Waves",
  fish: "Fish",
  "fish-symbol": "Fish mark",
  "fishing-hook": "Hook",
  shrimp: "Shrimp",
  snail: "Snail",
  turtle: "Turtle",
  worm: "Worm",
  shell: "Shell",
  egg: "Egg",
  droplets: "Droplets",
  droplet: "Droplet",
  bubbles: "Bubbles",
  "cloud-rain": "Rain",
  leaf: "Leaf",
  flower: "Flower",
  sun: "Sun",
  anchor: "Anchor",
  sailboat: "Sailboat",
  ship: "Ship",
  "ship-wheel": "Helm",
  "life-buoy": "Life buoy",
  flask: "Flask",
  sparkles: "Sparkles",
  gem: "Gem",
  mountain: "Mountain",
  trees: "Trees",
  orbit: "Orbit",
  hexagon: "Hexagon",
  boxes: "Boxes",
  wind: "Wind",
  zap: "Zap",
  heart: "Heart",
  anvil: "Anvil",
}

export function parseTankIcon(value: unknown): TankIconId {
  const raw = String(value || "")
  return (TANK_ICON_IDS as readonly string[]).includes(raw) ? (raw as TankIconId) : "waves"
}

/** Named palette keys stored on tanks.icon_color */
export const TANK_ICON_COLOR_IDS = [
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "fuchsia",
  "rose",
  "orange",
  "amber",
  "lime",
  "emerald",
  "slate",
] as const

export type TankIconColorId = (typeof TANK_ICON_COLOR_IDS)[number]

export const TANK_ICON_COLORS: Record<
  TankIconColorId,
  { label: string; swatch: string }
> = {
  teal: { label: "Teal", swatch: "#0d9488" },
  cyan: { label: "Cyan", swatch: "#0891b2" },
  sky: { label: "Sky", swatch: "#0284c7" },
  blue: { label: "Blue", swatch: "#2563eb" },
  indigo: { label: "Indigo", swatch: "#4f46e5" },
  violet: { label: "Violet", swatch: "#7c3aed" },
  fuchsia: { label: "Fuchsia", swatch: "#c026d3" },
  rose: { label: "Rose", swatch: "#e11d48" },
  orange: { label: "Orange", swatch: "#ea580c" },
  amber: { label: "Amber", swatch: "#d97706" },
  lime: { label: "Lime", swatch: "#65a30d" },
  emerald: { label: "Emerald", swatch: "#059669" },
  slate: { label: "Slate", swatch: "#475569" },
}

export function parseTankIconColor(value: unknown): TankIconColorId {
  const raw = String(value || "")
  return (TANK_ICON_COLOR_IDS as readonly string[]).includes(raw)
    ? (raw as TankIconColorId)
    : "teal"
}

export function tankIconSwatch(value: unknown) {
  return TANK_ICON_COLORS[parseTankIconColor(value)].swatch
}
