/** Canonical sump media option ids stored on tanks.sump_media */
export const SUMP_MEDIA_OPTIONS = [
  { id: "live_rock", label: "Live rock / rubble" },
  { id: "ceramic_biomedia", label: "Ceramic biomedia" },
  { id: "bio_balls", label: "Bio balls" },
  { id: "marinepure", label: "MarinePure / foam" },
  { id: "filter_socks", label: "Filter socks" },
  { id: "sponge_floss", label: "Sponge / floss" },
  { id: "activated_carbon", label: "Activated carbon" },
  { id: "gfo", label: "GFO" },
  { id: "purigen", label: "Purigen / resin" },
  { id: "sand_bed", label: "Sand bed" },
  { id: "chaeto", label: "Chaeto / macroalgae" },
  { id: "other", label: "Other" },
] as const

export type SumpMediaId = (typeof SUMP_MEDIA_OPTIONS)[number]["id"]

const LABELS = Object.fromEntries(SUMP_MEDIA_OPTIONS.map((o) => [o.id, o.label])) as Record<
  SumpMediaId,
  string
>

export function isSumpMediaId(value: string): value is SumpMediaId {
  return value in LABELS
}

export function sumpMediaLabel(id: string) {
  return LABELS[id as SumpMediaId] ?? id
}

export function parseSumpMedia(values: FormDataEntryValue[]): SumpMediaId[] {
  const seen = new Set<SumpMediaId>()
  for (const value of values) {
    const id = String(value)
    if (isSumpMediaId(id)) seen.add(id)
  }
  return [...seen]
}
