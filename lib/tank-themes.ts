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
  "orchid",
  "twilight",
  "rose",
  "sand",
  "indigo",
  "ruby",
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
    blurb: "Electric tropical cyan",
    swatches: ["#0891b2", "#22d3ee", "#ecfeff"],
    chrome: { light: "#ecfeff", dark: "#042f2e" },
  },
  kelp: {
    id: "kelp",
    label: "Kelp",
    blurb: "Bright planted greens",
    swatches: ["#3f6212", "#a3e635", "#f7fee7"],
    chrome: { light: "#f7fee7", dark: "#0f140c" },
  },
  coral: {
    id: "coral",
    label: "Coral",
    blurb: "Warm reef peach",
    swatches: ["#ea580c", "#fb7185", "#fff7ed"],
    chrome: { light: "#fff7ed", dark: "#1a0f10" },
  },
  abyss: {
    id: "abyss",
    label: "Abyss",
    blurb: "Deep open-ocean blue",
    swatches: ["#1d4ed8", "#38bdf8", "#eff6ff"],
    chrome: { light: "#eff6ff", dark: "#070b16" },
  },
  arctic: {
    id: "arctic",
    label: "Arctic",
    blurb: "Cool ice & steel",
    swatches: ["#475569", "#7dd3fc", "#f8fafc"],
    chrome: { light: "#f8fafc", dark: "#0c1014" },
  },
  mangrove: {
    id: "mangrove",
    label: "Mangrove",
    blurb: "Olive shallows & mud",
    swatches: ["#3f6212", "#a16207", "#f5f5f0"],
    chrome: { light: "#f5f5f0", dark: "#14140c" },
  },
  sunset: {
    id: "sunset",
    label: "Sunset",
    blurb: "Golden hour amber",
    swatches: ["#d97706", "#fbbf24", "#fffbeb"],
    chrome: { light: "#fffbeb", dark: "#140f08" },
  },
  slate: {
    id: "slate",
    label: "Slate",
    blurb: "Neutral lab gray",
    swatches: ["#334155", "#94a3b8", "#f8fafc"],
    chrome: { light: "#f8fafc", dark: "#0c0e12" },
  },
  volcanic: {
    id: "volcanic",
    label: "Volcanic",
    blurb: "Charcoal with lava ember",
    swatches: ["#c2410c", "#f97316", "#fafaf9"],
    chrome: { light: "#fafaf9", dark: "#0c0a09" },
  },
  orchid: {
    id: "orchid",
    label: "Orchid",
    blurb: "Magenta anemone bloom",
    swatches: ["#c026d3", "#e879f9", "#fdf4ff"],
    chrome: { light: "#fdf4ff", dark: "#140a16" },
  },
  twilight: {
    id: "twilight",
    label: "Twilight",
    blurb: "Royal purple dusk",
    swatches: ["#7c3aed", "#a78bfa", "#f5f3ff"],
    chrome: { light: "#f5f3ff", dark: "#0f0a1a" },
  },
  rose: {
    id: "rose",
    label: "Rose",
    blurb: "Soft rose & blush",
    swatches: ["#e11d48", "#fb7185", "#fff1f2"],
    chrome: { light: "#fff1f2", dark: "#16080c" },
  },
  sand: {
    id: "sand",
    label: "Sand",
    blurb: "Warm sand & champagne",
    swatches: ["#a16207", "#eab308", "#fffbeb"],
    chrome: { light: "#fffbeb", dark: "#12100a" },
  },
  indigo: {
    id: "indigo",
    label: "Indigo",
    blurb: "Deep indigo night",
    swatches: ["#4338ca", "#818cf8", "#eef2ff"],
    chrome: { light: "#eef2ff", dark: "#0a0a18" },
  },
  ruby: {
    id: "ruby",
    label: "Ruby",
    blurb: "Bold reef red",
    swatches: ["#dc2626", "#f87171", "#fef2f2"],
    chrome: { light: "#fef2f2", dark: "#140808" },
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
