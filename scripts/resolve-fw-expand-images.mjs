/**
 * Resolve Wikipedia/iNaturalist images for newly added FW fish (by slug).
 * Writes scripts/fw-expand-image-updates.sql
 *
 * Usage: node scripts/resolve-fw-expand-images.mjs
 */
import { writeFileSync } from "node:fs"
import { resolve } from "node:path"

const SPECIES = [
  ["blood-parrot-cichlid", "Blood parrot cichlid", "Amphilophus citrinellus x Vieja melanurus"],
  ["flowerhorn-cichlid", "Flowerhorn cichlid", "Amphilophus citrinellus"],
  ["firemouth-cichlid", "Firemouth cichlid", "Thorichthys meeki"],
  ["jewel-cichlid", "Jewel cichlid", "Hemichromis bimaculatus"],
  ["jack-dempsey", "Jack Dempsey", "Rocio octofasciata"],
  ["green-terror", "Green terror", "Andinoacara rivulatus"],
  ["texas-cichlid", "Texas cichlid", "Herichthys cyanoguttatus"],
  ["red-devil-cichlid", "Red devil cichlid", "Amphilophus labiatus"],
  ["midas-cichlid", "Midas cichlid", "Amphilophus citrinellus"],
  ["severum", "Severum", "Heros efasciatus"],
  ["uara-cichlid", "Uaru amphiacanthoides", "Uaru amphiacanthoides"],
  ["festivum", "Mesonauta festivus", "Mesonauta festivus"],
  ["keyhole-cichlid", "Keyhole cichlid", "Cleithracara maronii"],
  ["blue-acara", "Blue acara", "Andinoacara pulcher"],
  ["kribensis", "Kribensis", "Pelvicachromis pulcher"],
  ["rainbow-cichlid", "Rainbow cichlid", "Herotilapia multispinosa"],
  ["salvini-cichlid", "Salvini cichlid", "Trichromis salvini"],
  ["chocolate-cichlid", "Chocolate cichlid", "Hypselecara temporalis"],
  ["eartheater-geophagus", "Geophagus", "Geophagus brasiliensis"],
  ["pike-cichlid", "Pike cichlid", "Crenicichla"],
  ["flag-cichlid-laetacara", "Laetacara curviceps", "Laetacara curviceps"],
  ["ramirezi-electric-blue", "Mikrogeophagus ramirezi", "Mikrogeophagus ramirezi"],
  ["kenyi-cichlid", "Maylandia lombardoi", "Maylandia lombardoi"],
  ["demasoni-cichlid", "Pseudotropheus demasoni", "Pseudotropheus demasoni"],
  ["acei-cichlid", "Pseudotropheus acei", "Pseudotropheus acei"],
  ["cobalt-zebra", "Maylandia callainos", "Maylandia callainos"],
  ["auratus-cichlid", "Melanochromis auratus", "Melanochromis auratus"],
  ["tropheus-moorii", "Tropheus moorii", "Tropheus moorii"],
  ["compressiceps", "Altolamprologus compressiceps", "Altolamprologus compressiceps"],
  ["calvus", "Altolamprologus calvus", "Altolamprologus calvus"],
  ["frontosa-blue", "Cyphotilapia frontosa", "Cyphotilapia frontosa"],
  ["orange-chromide", "Etroplus maculatus", "Etroplus maculatus"],
  ["sailfin-molly", "Sailfin molly", "Poecilia latipinna"],
  ["balloon-molly", "Molly", "Poecilia sphenops"],
  ["black-molly", "Black molly", "Poecilia sphenops"],
  ["lyretail-swordtail", "Swordtail", "Xiphophorus hellerii"],
  ["wagtail-platy", "Platy", "Xiphophorus maculatus"],
  ["mosquito-fish", "Mosquitofish", "Gambusia affinis"],
  ["rosy-barb", "Rosy barb", "Pethia conchonius"],
  ["odessa-barb", "Odessa barb", "Pethia padamya"],
  ["gold-barb", "Gold barb", "Barbodes semifasciolatus"],
  ["denison-barb", "Sahyadria denisonii", "Sahyadria denisonii"],
  ["clown-barb", "Clown barb", "Barbodes everetti"],
  ["checkerboard-barb", "Checker barb", "Oliotius oligolepis"],
  ["pearl-danio", "Pearl danio", "Danio albolineatus"],
  ["giant-danio", "Giant danio", "Devario aequipinnatus"],
  ["leopard-danio", "Leopard danio", "Danio rerio"],
  ["lambchop-rasbora", "Trigonostigma espei", "Trigonostigma espei"],
  ["scissortail-rasbora", "Rasbora trilineata", "Rasbora trilineata"],
  ["black-phantom-tetra", "Black phantom tetra", "Hyphessobrycon megalopterus"],
  ["red-phantom-tetra", "Red phantom tetra", "Hyphessobrycon sweglesi"],
  ["diamond-tetra", "Diamond tetra", "Moenkhausia pittieri"],
  ["emperor-tetra", "Emperor tetra", "Nematobrycon palmeri"],
  ["penguin-tetra", "Penguin tetra", "Thayeria boehlkei"],
  ["silvertip-tetra", "Silvertip tetra", "Hasemania nana"],
  ["colombian-tetra", "Colombian tetra", "Hyphessobrycon columbianus"],
  ["bucktooth-tetra", "Exodon paradoxus", "Exodon paradoxus"],
  ["mexican-tetra", "Astyanax mexicanus", "Astyanax mexicanus"],
  ["bloodfin-tetra", "Bloodfin tetra", "Aphyocharax anisitsi"],
  ["pictus-catfish", "Pictus catfish", "Pimelodus pictus"],
  ["bumblebee-catfish", "Bumblebee catfish", "Microglanis iheringi"],
  ["iridescent-shark", "Iridescent shark", "Pangasianodon hypophthalmus"],
  ["bala-shark", "Bala shark", "Balantiocheilus melanopterus"],
  ["dojo-loach", "Dojo loach", "Misgurnus anguillicaudatus"],
  ["zebra-loach", "Zebra loach", "Botia striata"],
  ["dwarf-chain-loach", "Ambastaia sidthimunki", "Ambastaia sidthimunki"],
  ["clown-pleco", "Clown pleco", "Panaqolus maccus"],
  ["rubber-lip-pleco", "Chaetostoma", "Chaetostoma"],
  ["gold-nugget-pleco", "Baryancistrus", "Baryancistrus"],
  ["sailfin-pleco", "Pterygoplichthys gibbiceps", "Pterygoplichthys gibbiceps"],
  ["chinese-algae-eater", "Chinese algae eater", "Gyrinocheilus aymonieri"],
  ["elephant-nose", "Elephantnose fish", "Gnathonemus petersii"],
  ["african-butterflyfish", "African butterflyfish", "Pantodon buchholzi"],
  ["senegal-bichir", "Senegal bichir", "Polypterus senegalus"],
  ["spotted-gar", "Spotted gar", "Lepisosteus oculatus"],
  ["sparkling-gourami", "Sparkling gourami", "Trichopsis pumila"],
  ["croaking-gourami", "Croaking gourami", "Trichopsis vittata"],
  ["chocolate-gourami", "Chocolate gourami", "Sphaerichthys osphromenoides"],
  ["snakeskin-gourami", "Snakeskin gourami", "Trichopodus pectoralis"],
  ["thick-lip-gourami", "Thick-lipped gourami", "Trichogaster labiosa"],
  ["opaline-gourami", "Three spot gourami", "Trichopodus trichopterus"],
  ["halfmoon-betta", "Betta splendens", "Betta splendens"],
  ["crowntail-betta", "Betta splendens", "Betta splendens"],
  ["plakat-betta", "Betta splendens", "Betta splendens"],
  ["betta-imbellis", "Betta imbellis", "Betta imbellis"],
  ["turquoise-rainbowfish", "Melanotaenia lacustris", "Melanotaenia lacustris"],
  ["threadfin-rainbow", "Iriatherina werneri", "Iriatherina werneri"],
  ["red-rainbowfish", "Glossolepis incisus", "Glossolepis incisus"],
  ["australian-rainbowfish", "Melanotaenia splendida", "Melanotaenia splendida"],
]

function tidyScientificName(scientific) {
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

function queryVariants(scientificName, commonName) {
  const scientific = tidyScientificName(scientificName)
  const binomial = scientific && scientific.includes(" ") ? scientific : null
  return [...new Set([binomial, commonName, scientificName, scientific].filter(Boolean))]
}

async function wikipediaSummaryImage(title) {
  const encoded = encodeURIComponent(title.replace(/ /g, "_"))
  const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`, {
    headers: { Accept: "application/json", "User-Agent": "TankTracker/1.0 (aquarium hobby app)" },
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
    headers: { Accept: "application/json", "User-Agent": "TankTracker/1.0 (aquarium hobby app)" },
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
    headers: { Accept: "application/json", "User-Agent": "TankTracker/1.0 (aquarium hobby app)" },
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

const updates = []
const failed = []
let i = 0
for (const [slug, commonName, scientificName] of SPECIES) {
  i += 1
  process.stdout.write(`[${i}/${SPECIES.length}] ${commonName}... `)
  let url = null
  for (let attempt = 1; attempt <= 2; attempt++) {
    url = await resolveSpeciesImageUrl({ scientificName, commonName })
    if (url) break
    if (attempt < 2) await sleep(800)
  }
  if (url) {
    updates.push({ slug, url })
    console.log("ok")
  } else {
    failed.push(slug)
    console.log("MISS")
  }
  await sleep(350)
}

const esc = (s) => s.replace(/'/g, "''")
const sql = updates
  .map(
    (row) =>
      `update public.species_catalog set image_url = '${esc(row.url)}' where slug = '${esc(row.slug)}' and (image_url is null or image_url = '');`,
  )
  .join("\n")

const outSql = resolve("scripts/fw-expand-image-updates.sql")
const outJson = resolve("scripts/fw-expand-image-updates.json")
writeFileSync(outSql, sql + (sql ? "\n" : ""))
writeFileSync(outJson, JSON.stringify({ updates, failed }, null, 2))
console.log(`\nDone: ${updates.length} found, ${failed.length} missing → ${outSql}`)
