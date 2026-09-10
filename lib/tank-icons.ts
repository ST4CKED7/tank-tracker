/** Stable keys stored on tanks.icon */
export const TANK_ICON_IDS = [
  "waves",
  "fish",
  "droplets",
  "leaf",
  "gem",
  "shell",
  "anchor",
  "ship",
  "flask",
  "sparkles",
  "sun",
  "mountain",
  "trees",
  "flower",
  "bubbles",
  "orbit",
  "hexagon",
  "boxes",
  "wind",
  "zap",
  "heart",
  "anvil",
] as const

export type TankIconId = (typeof TANK_ICON_IDS)[number]

export const TANK_ICON_LABELS: Record<TankIconId, string> = {
  waves: "Waves",
  fish: "Fish",
  droplets: "Droplets",
  leaf: "Leaf",
  gem: "Gem",
  shell: "Shell",
  anchor: "Anchor",
  ship: "Ship",
  flask: "Flask",
  sparkles: "Sparkles",
  sun: "Sun",
  mountain: "Mountain",
  trees: "Trees",
  flower: "Flower",
  bubbles: "Bubbles",
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
