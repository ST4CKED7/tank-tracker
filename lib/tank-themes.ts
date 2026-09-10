export const TANK_THEME_IDS = [
  "ocean",
  "lagoon",
  "kelp",
  "coral",
  "abyss",
  "arctic",
  "mangrove",
  "sunset",
  "slate",
  "volcanic",
] as const

export type TankThemeId = (typeof TANK_THEME_IDS)[number]

export type TankThemeMeta = {
  id: TankThemeId
  label: string
  blurb: string
  /** Preview swatches: primary, accent, background (light) */
  swatches: [string, string, string]
  /** Browser chrome / PWA theme-color */
  chrome: { light: string; dark: string }
}

export const TANK_THEMES: Record<TankThemeId, TankThemeMeta> = {
  ocean: {
    id: "ocean",
    label: "Ocean",
    blurb: "Classic teal reef water",
    swatches: ["#0f766e", "#d4a017", "#f4fafb"],
    chrome: { light: "#f4f7f8", dark: "#0b1214" },
  },
  lagoon: {
    id: "lagoon",
    label: "Lagoon",
    blurb: "Bright tropical cyan",
    swatches: ["#0e7490", "#14b8a6", "#f0fbfd"],
    chrome: { light: "#f0fbfd", dark: "#07161c" },
  },
  kelp: {
    id: "kelp",
    label: "Kelp",
    blurb: "Planted freshwater greens",
    swatches: ["#3f6212", "#84cc16", "#f4f7ef"],
    chrome: { light: "#f4f7ef", dark: "#0f140c" },
  },
  coral: {
    id: "coral",
    label: "Coral",
    blurb: "Warm reef pinks & peach",
    swatches: ["#c2410c", "#fb7185", "#fff7f4"],
    chrome: { light: "#fff7f4", dark: "#1a0f10" },
  },
  abyss: {
    id: "abyss",
    label: "Abyss",
    blurb: "Deep open-ocean blue",
    swatches: ["#1d4ed8", "#38bdf8", "#f3f6fc"],
    chrome: { light: "#f3f6fc", dark: "#070b16" },
  },
  arctic: {
    id: "arctic",
    label: "Arctic",
    blurb: "Cool ice & steel",
    swatches: ["#475569", "#7dd3fc", "#f5f8fb"],
    chrome: { light: "#f5f8fb", dark: "#0c1014" },
  },
  mangrove: {
    id: "mangrove",
    label: "Mangrove",
    blurb: "Olive shallows & mud",
    swatches: ["#4d7c0f", "#a3e635", "#f5f6ef"],
    chrome: { light: "#f5f6ef", dark: "#11140c" },
  },
  sunset: {
    id: "sunset",
    label: "Sunset",
    blurb: "Golden hour amber",
    swatches: ["#b45309", "#f59e0b", "#fffbf3"],
    chrome: { light: "#fffbf3", dark: "#140f08" },
  },
  slate: {
    id: "slate",
    label: "Slate",
    blurb: "Neutral lab gray",
    swatches: ["#334155", "#64748b", "#f6f7f9"],
    chrome: { light: "#f6f7f9", dark: "#0c0e12" },
  },
  volcanic: {
    id: "volcanic",
    label: "Volcanic",
    blurb: "Charcoal with lava ember",
    swatches: ["#ea580c", "#f97316", "#f7f4f1"],
    chrome: { light: "#f7f4f1", dark: "#100c0a" },
  },
}

export function parseTankTheme(value: unknown): TankThemeId {
  const raw = String(value || "")
  return (TANK_THEME_IDS as readonly string[]).includes(raw) ? (raw as TankThemeId) : "ocean"
}

export function tankThemeMeta(value: unknown): TankThemeMeta {
  return TANK_THEMES[parseTankTheme(value)]
}

/** Inline boot script for layouts — avoids a flash of the wrong theme. */
export function tankThemeBootScript(theme?: string | null) {
  const id = parseTankTheme(theme)
  return `document.documentElement.setAttribute("data-theme",${JSON.stringify(id)});`
}
