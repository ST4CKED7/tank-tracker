export function tidyScientificName(scientific: string | null | undefined) {
  if (!scientific) return null
  const cleaned = scientific
    .split(/[/×x]+/i)[0]
    .replace(/\bspp\.?\b/gi, "")
    .replace(/\bsp\.\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
  if (!cleaned) return null
  const parts = cleaned.split(" ")
  if (parts.length >= 2) return `${parts[0]} ${parts[1]}`
  return parts[0]
}

export type SpeciesImageKind = "fish" | "coral" | "invert" | "plant"

function queryVariants(
  scientificName: string | null | undefined,
  commonName: string,
  kind?: SpeciesImageKind | null,
) {
  const scientific = tidyScientificName(scientificName)
  const genus = scientific?.split(" ")[0] ?? null
  const cleanedCommon = commonName
    .replace(/^NOT\s+RECOMMENDED[:\s-]*/i, "")
    .trim()
  const binomial = scientific && scientific.includes(" ") ? scientific : null
  const isSpp = Boolean(scientificName && /\bspp?\.?\b/i.test(scientificName))

  // Ambiguous aquarium genera that collide with plants/insects/cars on Wikipedia & iNat.
  const kindHint =
    kind === "coral"
      ? [genus ? `${genus} coral` : null, `${cleanedCommon} coral`]
      : kind === "plant"
        ? [genus ? `${genus} plant` : null, `${cleanedCommon} plant`]
        : kind === "invert"
          ? [
              /octopus|squid|cuttlefish|nautilus/i.test(cleanedCommon)
                ? cleanedCommon
                : null,
              /turbo|snail|hermit|conch|whelk|cowrie|nudibranch|shrimp|crab|lobster|urchin|starfish|cucumber|clam|oyster|mussel|scallop/i.test(
                `${cleanedCommon} ${scientificName ?? ""}`,
              )
                ? `${cleanedCommon} snail`.replace(/\bsnail snail\b/i, "snail")
                : null,
              genus && /turbo/i.test(genus) ? "Turbo (gastropod)" : null,
              genus ? `${genus} snail` : null,
              genus ? `${genus} mollusc` : null,
            ]
          : []

  const variants = [
    ...kindHint,
    cleanedCommon,
    cleanedCommon.replace(/'/g, ""),
    binomial,
    // Bare genus last for corals (after "Genus coral") so Capnella ≠ stonefly on iNat.
    isSpp && genus && kind === "coral" ? `${genus} coral` : null,
    genus && (isSpp || !binomial) ? genus : null,
    /plant|fern|moss|anubias|crypt|sword|vallis|hygrophila|rotala|ludwigia|bacopa|hairgrass|hornwort|frogbit|duckweed|lotus|buceph|bolbitis|marimo/i.test(
      `${cleanedCommon} ${scientificName ?? ""}`,
    )
      ? `${cleanedCommon} plant`
      : null,
  ]
  return [...new Set(variants.filter(Boolean) as string[])]
}

function wikipediaLooksWrong(
  blob: string,
  kind?: SpeciesImageKind | null,
) {
  if (/\b(insect|stonefly|plecoptera|mayfly|beetle|moth|fly genus|spider|arachnid|mite|tick)\b/.test(blob)) {
    return true
  }
  if (kind && kind !== "plant" && /\b(flowering plant|plant genus|angiosperm|orchid|rose family)\b/.test(blob)) {
    return true
  }
  if (kind === "invert" && /\b(plant|flower|botany|asteraceae|rosaceae)\b/.test(blob) && !/\b(snail|mollusc|mollusk|gastropod|crustacean|echinoderm|coral|anemone)\b/.test(blob)) {
    return true
  }
  return false
}

async function wikipediaSummaryImage(title: string, kind?: SpeciesImageKind | null) {
  const encoded = encodeURIComponent(title.replace(/ /g, "_"))
  const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`, {
    headers: { Accept: "application/json", "User-Agent": "TankTracker/1.0 (reef tank hobby app)" },
  })
  if (!res.ok) return null
  const data = (await res.json()) as {
    type?: string
    title?: string
    description?: string
    extract?: string
    thumbnail?: { source?: string }
    originalimage?: { source?: string }
  }
  if (data.type === "disambiguation") return null
  const blob = `${data.title ?? ""} ${data.description ?? ""} ${data.extract ?? ""}`.toLowerCase()
  if (wikipediaLooksWrong(blob, kind)) return null
  return data.thumbnail?.source ?? data.originalimage?.source ?? null
}

async function wikipediaSearchImage(query: string, kind?: SpeciesImageKind | null) {
  const url = new URL("https://en.wikipedia.org/w/api.php")
  url.searchParams.set("action", "query")
  url.searchParams.set("list", "search")
  url.searchParams.set("srsearch", query)
  url.searchParams.set("srlimit", "5")
  url.searchParams.set("format", "json")
  url.searchParams.set("origin", "*")
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "TankTracker/1.0 (reef tank hobby app)" },
  })
  if (!res.ok) return null
  const data = (await res.json()) as { query?: { search?: Array<{ title: string }> } }
  for (const hit of data.query?.search ?? []) {
    const image = await wikipediaSummaryImage(hit.title, kind)
    if (image) return image
  }
  return null
}

const ICONIC_OK: Record<SpeciesImageKind, Set<string>> = {
  fish: new Set(["Actinopterygii", "Animalia"]),
  coral: new Set(["Animalia"]),
  invert: new Set(["Animalia", "Mollusca", "Chromista", "Protozoa"]),
  plant: new Set(["Plantae"]),
}

function taxonLooksRight(
  taxa: {
    name?: string
    preferred_common_name?: string
    iconic_taxon_name?: string
  },
  query: string,
  kind?: SpeciesImageKind | null,
) {
  const iconic = taxa.iconic_taxon_name ?? ""
  if (iconic === "Insecta" || iconic === "Arachnida" || iconic === "Aves" || iconic === "Mammalia") {
    return false
  }
  // Never assign a plant photo to fish/coral/invert (Turbo → flowering plant trap).
  if (kind && kind !== "plant" && iconic === "Plantae") return false
  if (kind === "plant" && iconic && iconic !== "Plantae") return false
  if (kind && ICONIC_OK[kind] && iconic && !ICONIC_OK[kind].has(iconic)) {
    return false
  }

  const q = query.toLowerCase().replace(/[()]/g, " ").replace(/\s+/g, " ").trim()
  const name = (taxa.name ?? "").toLowerCase()
  const common = (taxa.preferred_common_name ?? "").toLowerCase()
  // Prefer exact / prefix genus matches over fuzzy near-misses.
  if (name === q || common === q) return true
  if (name.startsWith(q + " ") || name === q) return true
  if (q.split(/\s+/).every((part) => part.length > 1 && (name.includes(part) || common.includes(part)))) {
    return true
  }
  if (name.includes(q) || common.includes(q)) return true
  return false
}

async function iNaturalistImage(query: string, kind?: SpeciesImageKind | null) {
  const url = new URL("https://api.inaturalist.org/v1/taxa")
  url.searchParams.set("q", query)
  url.searchParams.set("per_page", "8")
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "TankTracker/1.0 (reef tank hobby app)" },
  })
  if (!res.ok) return null
  const data = (await res.json()) as {
    results?: Array<{
      name?: string
      preferred_common_name?: string
      iconic_taxon_name?: string
      default_photo?: { medium_url?: string; square_url?: string; url?: string } | null
      taxon_photos?: Array<{ photo?: { medium_url?: string; url?: string } }>
    }>
  }
  const ranked = (data.results ?? []).filter((taxa) => taxonLooksRight(taxa, query, kind))
  for (const taxa of ranked) {
    const photo =
      taxa.default_photo?.medium_url ??
      taxa.default_photo?.url ??
      taxa.default_photo?.square_url ??
      taxa.taxon_photos?.[0]?.photo?.medium_url ??
      taxa.taxon_photos?.[0]?.photo?.url
    if (photo) return photo
  }
  return null
}

/** Resolve a free photo URL for a species. Prefers Wikipedia summary, then iNaturalist, then wiki search. */
export async function resolveSpeciesImageUrl(input: {
  scientificName?: string | null
  commonName: string
  kind?: SpeciesImageKind | null
}) {
  const queries = queryVariants(input.scientificName, input.commonName, input.kind)
  for (const query of queries) {
    try {
      const wiki = await wikipediaSummaryImage(query, input.kind)
      if (wiki) return wiki
    } catch {
      // continue
    }
    try {
      const inat = await iNaturalistImage(query, input.kind)
      if (inat) return inat
    } catch {
      // continue
    }
  }
  for (const query of queries.slice(0, 3)) {
    try {
      const searched = await wikipediaSearchImage(query, input.kind)
      if (searched) return searched
    } catch {
      // continue
    }
  }
  return null
}
