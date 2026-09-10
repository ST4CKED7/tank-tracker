export function tidyScientificName(scientific: string | null | undefined) {
  if (!scientific) return null
  const cleaned = scientific
    .split("/")[0]
    .replace(/\bspp\.?\b/gi, "")
    .replace(/\bsp\.\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
  if (!cleaned) return null
  const parts = cleaned.split(" ")
  if (parts.length >= 2) return `${parts[0]} ${parts[1]}`
  return parts[0]
}

function queryVariants(scientificName: string | null | undefined, commonName: string) {
  const scientific = tidyScientificName(scientificName)
  const genus = scientific?.split(" ")[0] ?? null
  const cleanedCommon = commonName.replace(/^NOT RECOMMENDED\s+/i, "").trim()
  const binomial = scientific && scientific.includes(" ") ? scientific : null
  const variants = [
    binomial,
    cleanedCommon,
    cleanedCommon.replace(/'/g, ""),
    // Genus-only wiki lookups are often wrong (e.g. Turbo → turbocharger); use with "snail"/taxon hints only.
    scientificName?.includes("spp") && genus ? genus : null,
    scientificName?.includes("spp") && genus ? `${genus} coral` : null,
    // Plants often resolve better with an aquarium/plant hint than bare genus
    /plant|fern|moss|anubias|crypt|sword|vallis|hygrophila|rotala|ludwigia|bacopa|hairgrass|hornwort|frogbit|duckweed|lotus|buceph|bolbitis|marimo/i.test(
      `${cleanedCommon} ${scientificName ?? ""}`,
    )
      ? `${cleanedCommon} plant`
      : null,
  ]
  return [...new Set(variants.filter(Boolean) as string[])]
}

async function wikipediaSummaryImage(title: string) {
  const encoded = encodeURIComponent(title.replace(/ /g, "_"))
  const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`, {
    headers: { Accept: "application/json", "User-Agent": "TankTracker/1.0 (reef tank hobby app)" },
  })
  if (!res.ok) return null
  const data = (await res.json()) as {
    type?: string
    thumbnail?: { source?: string }
    originalimage?: { source?: string }
  }
  if (data.type === "disambiguation") return null
  return data.thumbnail?.source ?? data.originalimage?.source ?? null
}

async function wikipediaSearchImage(query: string) {
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
    const image = await wikipediaSummaryImage(hit.title)
    if (image) return image
  }
  return null
}

async function iNaturalistImage(query: string) {
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
      default_photo?: { medium_url?: string; square_url?: string; url?: string } | null
      taxon_photos?: Array<{ photo?: { medium_url?: string; url?: string } }>
    }>
  }
  for (const taxa of data.results ?? []) {
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
}) {
  const queries = queryVariants(input.scientificName, input.commonName)
  for (const query of queries) {
    try {
      const wiki = await wikipediaSummaryImage(query)
      if (wiki) return wiki
    } catch {
      // continue
    }
    try {
      const inat = await iNaturalistImage(query)
      if (inat) return inat
    } catch {
      // continue
    }
  }
  for (const query of queries.slice(0, 2)) {
    try {
      const searched = await wikipediaSearchImage(query)
      if (searched) return searched
    } catch {
      // continue
    }
  }
  return null
}
