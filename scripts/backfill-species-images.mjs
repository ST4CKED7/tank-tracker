/**
 * One-off backfill: resolve Wikipedia/iNaturalist images for catalog rows
 * missing image_url. Writes scripts/species-image-updates.json
 *
 * Usage: node scripts/backfill-species-images.mjs < missing.json
 * Or:    node scripts/backfill-species-images.mjs path/to/missing.json
 */

import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

function tidyScientificName(scientific) {
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

function queryVariants(scientificName, commonName) {
  const scientific = tidyScientificName(scientificName)
  const genus = scientific?.split(" ")[0] ?? null
  const cleanedCommon = commonName.replace(/^NOT RECOMMENDED\s+/i, "").trim()
  const binomial = scientific && scientific.includes(" ") ? scientific : null
  const variants = [
    binomial,
    cleanedCommon,
    cleanedCommon.replace(/'/g, ""),
    scientificName?.includes("spp") && genus ? genus : null,
    scientificName?.includes("spp") && genus ? `${genus} coral` : null,
    /plant|fern|moss|anubias|crypt|sword|vallis|hygrophila|rotala|ludwigia|bacopa|hairgrass|hornwort|frogbit|duckweed|lotus|buceph|bolbitis|marimo/i.test(
      `${cleanedCommon} ${scientificName ?? ""}`,
    )
      ? `${cleanedCommon} plant`
      : null,
  ]
  return [...new Set(variants.filter(Boolean))]
}

async function wikipediaSummaryImage(title) {
  const encoded = encodeURIComponent(title.replace(/ /g, "_"))
  const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`, {
    headers: { Accept: "application/json", "User-Agent": "TankTracker/1.0 (reef tank hobby app)" },
  })
  if (!res.ok) return null
  const data = await res.json()
  if (data.type === "disambiguation") return null
  return data.thumbnail?.source ?? data.originalimage?.source ?? null
}

async function wikipediaSearchImage(query) {
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
  const data = await res.json()
  for (const hit of data.query?.search ?? []) {
    const image = await wikipediaSummaryImage(hit.title)
    if (image) return image
  }
  return null
}

async function iNaturalistImage(query) {
  const url = new URL("https://api.inaturalist.org/v1/taxa")
  url.searchParams.set("q", query)
  url.searchParams.set("per_page", "8")
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "TankTracker/1.0 (reef tank hobby app)" },
  })
  if (!res.ok) return null
  const data = await res.json()
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

async function resolveSpeciesImageUrl({ scientificName, commonName }) {
  const queries = queryVariants(scientificName, commonName)
  // Prefer cheap lookups first (summary + iNat). Wikipedia search is last — it fans out.
  for (const query of queries) {
    try {
      const wiki = await wikipediaSummaryImage(query)
      if (wiki) return wiki
    } catch {
      /* continue */
    }
    try {
      const inat = await iNaturalistImage(query)
      if (inat) return inat
    } catch {
      /* continue */
    }
  }
  for (const query of queries.slice(0, 2)) {
    try {
      const searched = await wikipediaSearchImage(query)
      if (searched) return searched
    } catch {
      /* continue */
    }
  }
  return null
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function resolveWithRetry(row, attempts = 3) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const url = await resolveSpeciesImageUrl({
      scientificName: row.scientific_name,
      commonName: row.common_name,
    })
    if (url) return url
    if (attempt < attempts) await sleep(1500 * attempt)
  }
  return null
}

const inputPath = process.argv[2]
const raw = inputPath ? readFileSync(resolve(inputPath), "utf8") : readFileSync(0, "utf8")
const rows = JSON.parse(raw)

const updates = []
const failed = []
let i = 0
for (const row of rows) {
  i += 1
  process.stdout.write(`[${i}/${rows.length}] ${row.common_name}... `)
  const url = await resolveWithRetry(row)
  if (url) {
    updates.push({ id: row.id, url })
    console.log("ok")
  } else {
    failed.push(row)
    console.log("MISS")
  }
  await sleep(600)
}

const outPath = resolve("scripts/species-image-updates.json")
writeFileSync(outPath, JSON.stringify({ updates, failed }, null, 2))
console.log(`\nDone: ${updates.length} found, ${failed.length} missing → ${outPath}`)
