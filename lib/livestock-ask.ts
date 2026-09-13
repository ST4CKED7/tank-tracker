import type { LivestockRow, Species, Tank } from "@/lib/bioload"
import { bioloadSummary, tankCapacity } from "@/lib/bioload"
import { evaluateSpecies, type Suggestion } from "@/lib/compatibility"
import {
  assessCleanupCrew,
  cleanupRoleLabel,
  cleanupRoles,
  isCleanupSpecies,
  type CleanupRole,
} from "@/lib/cleanup-crew"
import type { ParameterKey } from "@/lib/parameters"
import { tankProfile } from "@/lib/tank-profiles"

export type LivestockAskKind = Species["kind"]

export type LivestockAskIntent = {
  query: string
  isRecommendation: boolean
  kind?: LivestockAskKind
  cleanupRole?: CleanupRole
  temperament?: NonNullable<Species["temperament"]>
  diet?: NonNullable<Species["diet"]>
  /** Preferred catalog category substring / label. */
  categoryHint?: string
  preferCleanup: boolean
  preferReefSafe: boolean
  preferSmall: boolean
  preferLarge: boolean
  preferDiverse: boolean
  fillGaps: boolean
  /** Species the user wants something “like”. */
  likeSpeciesIds: string[]
  /** Free tokens for fuzzy name / notes matching. */
  keywords: string[]
  summary: string
}

export type LivestockAskResult = {
  intent: LivestockAskIntent
  results: Suggestion[]
  /** Total compatible matches before any UI paging. */
  total: number
  /** How the engine interpreted / softened the ask. */
  note?: string
}

type Ranked = {
  suggestion: Suggestion
  score: number
  why: string[]
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "to",
  "for",
  "my",
  "our",
  "me",
  "i",
  "and",
  "or",
  "of",
  "in",
  "on",
  "with",
  "without",
  "would",
  "be",
  "is",
  "are",
  "was",
  "were",
  "what",
  "which",
  "who",
  "how",
  "can",
  "could",
  "should",
  "shall",
  "some",
  "something",
  "anything",
  "someone",
  "good",
  "best",
  "better",
  "nice",
  "great",
  "solid",
  "recommend",
  "recommendation",
  "suggest",
  "suggestion",
  "suggestions",
  "add",
  "adding",
  "addition",
  "additions",
  "next",
  "new",
  "tank",
  "aquarium",
  "please",
  "show",
  "find",
  "looking",
  "want",
  "wanna",
  "need",
  "needs",
  "help",
  "ideas",
  "idea",
  "pick",
  "choose",
  "options",
  "option",
  "like",
  "similar",
  "kinda",
  "kind",
  "type",
  "sort",
  "pair",
  "stock",
  "stocking",
  "livestock",
  "creature",
  "animal",
  "animals",
  "critter",
  "critters",
  "thing",
  "things",
  "this",
  "that",
  "there",
  "here",
  "into",
  "from",
  "about",
  "around",
  "maybe",
  "also",
  "just",
  "really",
  "very",
  "too",
  "still",
  "another",
  "more",
  "few",
  "any",
  "get",
  "got",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "make",
  "made",
  "keep",
  "kept",
])

/** Phrase → catalog category fragment (matched case-insensitively against species.category). */
const CATEGORY_PHRASES: {
  re: RegExp
  category: string
  kind?: LivestockAskKind
  water?: "freshwater" | "saltwater"
}[] = [
  { re: /\b(tetra|tetras|characin|characins)\b/, category: "Tetras", kind: "fish", water: "freshwater" },
  { re: /\b(barb|barbs)\b/, category: "Barbs", kind: "fish", water: "freshwater" },
  { re: /\b(rasbora|rasboras)\b/, category: "Rasboras", kind: "fish", water: "freshwater" },
  { re: /\b(danio|danios|minnow|minnows)\b/, category: "Danios", kind: "fish", water: "freshwater" },
  {
    re: /\b(livebearer|livebearers|guppy|guppies|molly|mollies|platy|platies|swordtail|swordtails)\b/,
    category: "Livebearers",
    kind: "fish",
    water: "freshwater",
  },
  { re: /\b(dwarf\s*cichlid|apistogramma|ram\s*cichlid|\brams\b)\b/, category: "Dwarf cichlids", kind: "fish", water: "freshwater" },
  { re: /\b(african\s*cichlid|malawi|tanganyika|mbuna)\b/, category: "African cichlids", kind: "fish", water: "freshwater" },
  { re: /\b(american\s*cichlid|oscar|discus|convict|angelfish|freshwater\s*angel)\b/, category: "American cichlids", kind: "fish", water: "freshwater" },
  { re: /\b(cory|corys|corydoras|catfish)\b/, category: "Corydoras", kind: "fish", water: "freshwater" },
  { re: /\b(pleco|plecos|bristlenose|ancistrus)\b/, category: "Plecos", kind: "fish", water: "freshwater" },
  { re: /\b(loach|loaches|kuhli|clown\s*loach)\b/, category: "Loaches", kind: "fish", water: "freshwater" },
  { re: /\b(betta|bettas|siamese\s*fighting)\b/, category: "Bettas", kind: "fish", water: "freshwater" },
  { re: /\b(gourami|gouramis|anabantoid)\b/, category: "Gouramis", kind: "fish", water: "freshwater" },
  { re: /\b(rainbowfish|rainbow\s*fish)\b/, category: "Rainbowfish", kind: "fish", water: "freshwater" },
  { re: /\b(killifish|killie|killies)\b/, category: "Killifish", kind: "fish", water: "freshwater" },
  { re: /\b(goldfish|koi|coldwater)\b/, category: "Goldfish", kind: "fish", water: "freshwater" },
  { re: /\b(siamese\s*algae|\bsae\b|flying\s*fox|otocinclus|\boto\b)\b/, category: "Sharks & algae", kind: "fish", water: "freshwater" },
  { re: /\b(clownfish|clown|nemo|amphiprion|premnas)\b/, category: "Clownfish", kind: "fish", water: "saltwater" },
  { re: /\b(tang|tangs|surgeon|surgeons|unicornfish)\b/, category: "Tangs", kind: "fish", water: "saltwater" },
  { re: /\b(damsel|damsels|chromis)\b/, category: "Damsels", kind: "fish", water: "saltwater" },
  { re: /\b(goby|gobies|watchman|clown\s*goby)\b/, category: "Gobies", kind: "fish", water: "saltwater" },
  { re: /\b(dartfish|firefish|fire\s*fish)\b/, category: "Dartfish", kind: "fish", water: "saltwater" },
  { re: /\b(blenny|blennies|lawnmower)\b/, category: "Blennies", kind: "fish", water: "saltwater" },
  { re: /\b(wrasse|wrasses|fairy\s*wrasse|flasher\s*wrasse|six\s*line)\b/, category: "Wrasses", kind: "fish", water: "saltwater" },
  { re: /\b(dwarf\s*angel|centropyge|angelfish|\bangels?\b)\b/, category: "Angelfish", kind: "fish", water: "saltwater" },
  { re: /\b(butterfly|butterflyfish|chelmon)\b/, category: "Butterflyfish", kind: "fish", water: "saltwater" },
  { re: /\b(anthias)\b/, category: "Anthias", kind: "fish", water: "saltwater" },
  { re: /\b(cardinal|cardinalfish)\b/, category: "Cardinalfish", kind: "fish", water: "saltwater" },
  { re: /\b(dottyback|pseudochromis)\b/, category: "Dottybacks", kind: "fish", water: "saltwater" },
  { re: /\b(hawkfish)\b/, category: "Hawkfish", kind: "fish", water: "saltwater" },
  { re: /\b(jawfish)\b/, category: "Jawfish", kind: "fish", water: "saltwater" },
  { re: /\b(basslet|gramma|royal\s*gramma)\b/, category: "Basslets", kind: "fish", water: "saltwater" },
  { re: /\b(dragonet|mandarin|scooter)\b/, category: "Dragonets", kind: "fish", water: "saltwater" },
  { re: /\b(seahorse|pipefish)\b/, category: "Pipefish", kind: "fish", water: "saltwater" },
  { re: /\b(rabbitfish|foxface)\b/, category: "Rabbitfish", kind: "fish", water: "saltwater" },
  { re: /\b(shrimp|skunk\s*shrimp|cleaner\s*shrimp|cherry\s*shrimp|amano)\b/, category: "Shrimp", kind: "invert" },
  { re: /\b(snail|snails|nerite|turbo|trochus|cerith|nassarius|mystery\s*snail)\b/, category: "Snails", kind: "invert" },
  { re: /\b(hermit|hermits|crab|crabs|emerald\s*crab)\b/, category: "Crabs", kind: "invert" },
  { re: /\b(starfish|sea\s*star|urchin|urchins)\b/, category: "Stars", kind: "invert" },
  { re: /\b(crayfish|cray|crawfish)\b/, category: "Crabs & crayfish", kind: "invert", water: "freshwater" },
  { re: /\b(\bsps\b|acropora|montipora)\b/, category: "SPS", kind: "coral", water: "saltwater" },
  { re: /\b(\blps\b|euphyllia|torch|hammer|frogspawn|acan)\b/, category: "LPS", kind: "coral", water: "saltwater" },
  { re: /\b(soft\s*coral|toadstool|leather|xenia|kenya\s*tree)\b/, category: "Soft corals", kind: "coral", water: "saltwater" },
  { re: /\b(zoanthid|zoas|paly|palys|palythoa)\b/, category: "Zoanthids", kind: "coral", water: "saltwater" },
  { re: /\b(mushroom\s*coral|ricordea|discosoma)\b/, category: "Mushrooms", kind: "coral", water: "saltwater" },
  { re: /\b(anemone|anemones|bubble\s*tip|\bbta\b)\b/, category: "Anemones", kind: "coral", water: "saltwater" },
  { re: /\b(anubias|java\s*fern|bucephalandra)\b/, category: "Rhizome", kind: "plant", water: "freshwater" },
  { re: /\b(stem\s*plant|rotala|ludwigia|hygrophila)\b/, category: "Stem plants", kind: "plant", water: "freshwater" },
  { re: /\b(carpet|carpeting|dwarf\s*hairgrass|monte\s*carlo)\b/, category: "Carpeting", kind: "plant", water: "freshwater" },
  { re: /\b(floating\s*plant|frogbit|duckweed|salvinia)\b/, category: "Floating", kind: "plant", water: "freshwater" },
  { re: /\b(moss|java\s*moss|christmas\s*moss)\b/, category: "Mosses", kind: "plant", water: "freshwater" },
]

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s/-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function levenshtein(a: string, b: string) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  const row = new Array<number>(b.length + 1)
  for (let j = 0; j <= b.length; j++) row[j] = j
  for (let i = 1; i <= a.length; i++) {
    let prev = i - 1
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cur = row[j]
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost)
      prev = cur
    }
  }
  return row[b.length]
}

function fuzzyTokenMatch(token: string, target: string) {
  if (!token || !target) return 0
  if (target.includes(token)) return 1
  if (token.length < 3) return 0
  const parts = target.split(/[\s/-]+/)
  let best = 0
  for (const part of parts) {
    if (!part) continue
    if (part.startsWith(token) || token.startsWith(part)) {
      best = Math.max(best, 0.85)
      continue
    }
    const dist = levenshtein(token, part)
    const maxLen = Math.max(token.length, part.length)
    const ratio = 1 - dist / maxLen
    if (ratio >= 0.72) best = Math.max(best, ratio)
  }
  return best
}

function looksLikeRecommendation(normalized: string) {
  if (!normalized) return false
  if (
    /\b(what|which|recommend|suggest|good|best|next|should|could|would|idea|ideas|looking for|help me|show me|advice|any\s+ideas|what\s+to\s+add|what\s+should\s+i)\b/.test(
      normalized,
    )
  ) {
    return true
  }
  if (
    /\b(sand\s*cleaner|sand\s*sifter|algae\s*eater|algae\s*grazer|cleanup\s*crew|clean\s*up\s*crew|\bcuc\b|scavenger|community\s*fish|centerpiece|feature\s*fish)\b/.test(
      normalized,
    )
  ) {
    return true
  }
  return false
}

function detectKind(normalized: string, freshwater: boolean): LivestockAskKind | undefined {
  if (/\b(fish|fishes|swimmer|swimmers)\b/.test(normalized)) return "fish"
  if (!freshwater && /\b(coral|corals|softie|softies|polyp|polyps)\b/.test(normalized)) return "coral"
  if (freshwater && /\b(plant|plants|aquascape|flora)\b/.test(normalized)) return "plant"
  if (
    /\b(invert|invertebrate|invertebrates|snail|snails|shrimp|crab|crabs|hermit|urchin|cucumber)\b/.test(
      normalized,
    )
  ) {
    return "invert"
  }
  return undefined
}

function detectCleanupRole(normalized: string): CleanupRole | undefined {
  if (
    /\b(sand\s*cleaner|sand\s*sifter|sand\s*sifting|sand\s*bed|sift(er|ing)?|nassarius|clean\s*the\s*sand|stir\s*the\s*sand)\b/.test(
      normalized,
    )
  ) {
    return "sand"
  }
  if (
    /\b(algae\s*eater|algae\s*grazer|eat\s*algae|hair\s*algae|film\s*algae|glass\s*cleaner|clean\s*algae|algae\s*problem|green\s*algae)\b/.test(
      normalized,
    )
  ) {
    return "algae"
  }
  // Bare "algae" still implies algae role when asking for help.
  if (/\balgae\b/.test(normalized) && !/\b(coral|fish\s*only)\b/.test(normalized)) return "algae"
  if (
    /\b(scavenger|cleanup\s*crew|clean\s*up\s*crew|\bcuc\b|detritus\s*eater|waste\s*eater|clean\s*up\s*leftovers|janitor)\b/.test(
      normalized,
    )
  ) {
    return "scavenger"
  }
  return undefined
}

function detectTemperament(normalized: string): LivestockAskIntent["temperament"] | undefined {
  if (/\b(peaceful|community|beginner[- ]friendly|nano[- ]safe|reef[- ]safe\s+community)\b/.test(normalized)) {
    return "peaceful"
  }
  if (/\b(semi[- ]aggressive|semi aggressive|semiaggressive)\b/.test(normalized)) return "semi_aggressive"
  if (/\b(aggressive|predator|hunter|mean|bully)\b/.test(normalized)) return "aggressive"
  return undefined
}

function detectDiet(normalized: string): LivestockAskIntent["diet"] | undefined {
  if (/\b(herbivore|herbivorous|plant[- ]eater|veggie|vegetarian)\b/.test(normalized)) return "herbivore"
  if (/\b(carnivore|carnivorous|meat[- ]eater)\b/.test(normalized)) return "carnivore"
  if (/\b(omnivore|omnivorous)\b/.test(normalized)) return "omnivore"
  if (/\b(scavenger)\b/.test(normalized) && !/\bcleanup\b/.test(normalized)) return "scavenger"
  return undefined
}

function detectCategory(
  normalized: string,
  waterType: Tank["water_type"],
): { category: string; kind?: LivestockAskKind } | undefined {
  for (const entry of CATEGORY_PHRASES) {
    if (entry.water && entry.water !== waterType) continue
    if (entry.re.test(normalized)) return { category: entry.category, kind: entry.kind }
  }
  return undefined
}

function extractKeywords(normalized: string, extraDrop: string[] = []) {
  const drop = new Set(extraDrop.map((w) => w.toLowerCase()))
  return normalized
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token) && !drop.has(token))
}

function findLikeSpecies(normalized: string, catalog: Species[]): Species[] {
  // “like a clownfish”, “similar to neon tetra”, “something like wrasse”
  const m =
    normalized.match(/\b(?:like|similar to|same as|instead of)\s+(?:a|an|the)?\s*(.+)$/) ||
    normalized.match(/\b(?:pair with|go with|compatible with)\s+(?:a|an|the)?\s*(.+)$/)
  if (!m?.[1]) return []
  const phrase = m[1].replace(/\b(please|thanks|fish|invert|coral|plant)\b/g, " ").replace(/\s+/g, " ").trim()
  if (phrase.length < 3) return []

  const scored = catalog
    .map((species) => {
      const hay = nameHaystack(species)
      let score = 0
      if (hay.includes(phrase)) score = 3
      else {
        const tokens = phrase.split(" ").filter((t) => t.length > 2)
        let hits = 0
        for (const t of tokens) {
          const f = fuzzyTokenMatch(t, hay)
          if (f >= 0.85) hits += 1
          else if (f >= 0.72) hits += 0.5
        }
        score = hits
      }
      return { species, score }
    })
    .filter((row) => row.score >= 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((row) => row.species)

  return scored
}

function nameHaystack(species: Species) {
  return `${species.common_name} ${species.scientific_name ?? ""} ${species.notes ?? ""} ${species.category ?? ""} ${(species.aggression_tags ?? []).join(" ")}`.toLowerCase()
}

function buildSummary(intent: Omit<LivestockAskIntent, "summary">): string {
  const parts: string[] = []
  if (intent.cleanupRole) parts.push(cleanupRoleLabel(intent.cleanupRole))
  else if (intent.preferCleanup) parts.push("cleanup crew")
  if (intent.categoryHint) parts.push(intent.categoryHint)
  if (intent.kind && !intent.categoryHint) {
    parts.push(intent.kind === "invert" ? "inverts" : `${intent.kind}s`)
  }
  if (intent.temperament === "peaceful") parts.push("peaceful")
  if (intent.temperament === "semi_aggressive") parts.push("semi-aggressive")
  if (intent.temperament === "aggressive") parts.push("aggressive")
  if (intent.diet) parts.push(intent.diet.replaceAll("_", " "))
  if (intent.preferSmall) parts.push("smaller / nano-friendly")
  if (intent.preferReefSafe) parts.push("reef-safe")
  if (intent.fillGaps) parts.push("filling stocking gaps")
  if (parts.length === 0 && intent.keywords.length > 0) {
    return `Best matches for “${intent.keywords.slice(0, 5).join(" ")}” that fit this tank`
  }
  if (parts.length === 0) return "Smart picks for this tank’s current stock and headroom"
  return `Best ${parts.join(" · ")} for this tank`
}

/** Parse a free-text livestock question into structured filters. */
export function parseLivestockAsk(
  query: string,
  tank: Tank,
  catalog: Species[] = [],
): LivestockAskIntent {
  const normalized = normalize(query)
  const freshwater = tank.water_type === "freshwater"
  const cleanupRole = detectCleanupRole(normalized)
  const categoryHit = detectCategory(normalized, tank.water_type)
  let kind = detectKind(normalized, freshwater) ?? categoryHit?.kind
  const temperament = detectTemperament(normalized)
  const diet = detectDiet(normalized)
  const preferCleanup =
    Boolean(cleanupRole) ||
    /\b(cleanup|clean\s*up|\bcuc\b|janitor|cleaner\b|grazer|sifter)\b/.test(normalized)
  // Don't treat bare "eater" as cleanup — too noisy.
  const preferReefSafe = /\b(reef[- ]safe|reefsafe|coral[- ]safe)\b/.test(normalized)
  const preferSmall = /\b(nano|small\s*tank|pico|tiny|dwarf(?!\s*cichlid)|beginner)\b/.test(normalized)
  const preferLarge = /\b(large|big\s*fish|show\s*fish|centerpiece|feature\s*fish)\b/.test(normalized)
  const preferDiverse = /\b(different|diversity|variety|something\s+else|new\s+type)\b/.test(normalized)
  const fillGaps =
    /\b(what\s+should\s+i\s+add|what\s+to\s+add|next\s+add|stocking\s+advice|what'?s\s+missing|fill\s+(?:the\s+)?gaps?|complete\s+(?:the\s+)?tank)\b/.test(
      normalized,
    ) ||
    (looksLikeRecommendation(normalized) && !kind && !cleanupRole && !categoryHit && !diet && !temperament)

  const likeSpecies = findLikeSpecies(normalized, catalog)
  if (likeSpecies[0] && !kind) kind = likeSpecies[0].kind
  const categoryHint =
    categoryHit?.category ??
    (likeSpecies[0]?.category ? likeSpecies[0].category.split("&")[0].trim() : undefined)

  const isRecommendation =
    looksLikeRecommendation(normalized) ||
    preferCleanup ||
    fillGaps ||
    Boolean(categoryHit) ||
    likeSpecies.length > 0

  const dropForKeywords = [
    ...(cleanupRole ? [cleanupRole, "sand", "cleaner", "sifter", "algae", "grazer", "scavenger", "crew"] : []),
    ...(kind ? [kind, `${kind}s`] : []),
    ...(categoryHint ? categoryHint.toLowerCase().split(/\s+/) : []),
  ]

  const intentWithoutSummary: Omit<LivestockAskIntent, "summary"> = {
    query: query.trim(),
    isRecommendation,
    kind,
    cleanupRole,
    temperament,
    diet,
    categoryHint,
    preferCleanup,
    preferReefSafe,
    preferSmall,
    preferLarge,
    preferDiverse,
    fillGaps,
    likeSpeciesIds: likeSpecies.map((s) => s.id),
    keywords: extractKeywords(normalized, dropForKeywords),
  }

  return {
    ...intentWithoutSummary,
    summary: buildSummary(intentWithoutSummary),
  }
}

function categoryMatch(species: Species, hint?: string) {
  if (!hint) return 0
  const cat = (species.category ?? "").toLowerCase()
  const h = hint.toLowerCase()
  if (!cat) return 0
  if (cat === h || cat.includes(h) || h.includes(cat)) return 1
  // token overlap
  const catParts = cat.split(/[^a-z0-9]+/).filter(Boolean)
  const hintParts = h.split(/[^a-z0-9]+/).filter(Boolean)
  let hits = 0
  for (const hp of hintParts) {
    if (catParts.some((cp) => cp.includes(hp) || hp.includes(cp) || fuzzyTokenMatch(hp, cp) >= 0.85)) hits += 1
  }
  return hits / Math.max(hintParts.length, 1)
}

function keywordRelevance(species: Species, keywords: string[]) {
  if (keywords.length === 0) return { score: 0, hits: 0 }
  const hay = nameHaystack(species)
  let score = 0
  let hits = 0
  for (const word of keywords) {
    const exact = hay.includes(word)
    if (exact) {
      score += 1
      hits += 1
      continue
    }
    const fuzzy = fuzzyTokenMatch(word, hay)
    if (fuzzy >= 0.85) {
      score += fuzzy
      hits += 1
    } else if (fuzzy >= 0.72) {
      score += fuzzy * 0.6
    }
  }
  return { score, hits }
}

type FilterMode = "strict" | "soft" | "loose"

function passesFilters(species: Species, intent: LivestockAskIntent, mode: FilterMode): boolean {
  const cleanupAsk = Boolean(intent.cleanupRole || intent.preferCleanup)

  if (intent.kind && species.kind !== intent.kind) {
    // Sand cleaner / algae eater asks often imply inverts even if someone says "fish".
    if (cleanupAsk && isCleanupSpecies(species) && mode !== "strict") {
      // allow
    } else if (mode === "loose" && cleanupAsk && species.kind === "invert") {
      // allow
    } else {
      return false
    }
  }

  if (intent.temperament && species.temperament !== intent.temperament && mode === "strict") {
    return false
  }

  if (intent.diet && species.diet !== intent.diet && mode === "strict") {
    return false
  }

  if (intent.cleanupRole) {
    if (!isCleanupSpecies(species)) {
      return mode === "loose" && species.kind === "invert"
    }
    if (!cleanupRoles(species).includes(intent.cleanupRole)) {
      return mode !== "strict" && isCleanupSpecies(species)
    }
  } else if (intent.preferCleanup && !isCleanupSpecies(species) && mode !== "loose") {
    return false
  }

  if (intent.categoryHint) {
    const cm = categoryMatch(species, intent.categoryHint)
    if (cm < 0.34 && mode === "strict") return false
    if (cm < 0.2 && mode === "soft" && intent.keywords.length === 0 && !cleanupAsk) return false
  }

  if (intent.preferReefSafe && species.reef_safe === "no" && mode === "strict") return false

  if (!intent.isRecommendation && intent.keywords.length > 0) {
    const { hits } = keywordRelevance(species, intent.keywords)
    if (hits === 0 && categoryMatch(species, intent.categoryHint) < 0.34) return false
  }

  return true
}

function tankOwnedIds(livestock: LivestockRow[]) {
  return new Set(livestock.map((item) => item.species_id))
}

function tankCategories(livestock: LivestockRow[]) {
  return new Set(
    livestock.map((item) => item.species.category).filter((c): c is string => Boolean(c)),
  )
}

function tankHasPeacefulFish(livestock: LivestockRow[]) {
  return livestock.some((item) => item.species.kind === "fish" && item.species.temperament === "peaceful")
}

function tankHasAggressiveFish(livestock: LivestockRow[]) {
  return livestock.some((item) => item.species.kind === "fish" && item.species.temperament === "aggressive")
}

function sizeFitScore(species: Species, gallons: number, intent: LivestockAskIntent) {
  const min = Number(species.min_tank_gallons) || 0
  const length = Number(species.adult_length_inches) || 0
  let score = 0
  if (min > 0 && gallons >= min) {
    const headroom = gallons - min
    score += Math.min(12, headroom / 5)
    if (gallons < min * 1.15) score -= 4
  }
  if (intent.preferSmall) {
    if (length > 0 && length <= 3) score += 14
    else if (length > 5) score -= 10
    if (min > 0 && min <= gallons * 0.7) score += 6
  }
  if (intent.preferLarge) {
    if (length >= 4) score += 10
    if (min >= gallons * 0.5) score += 4
  }
  if (gallons > 0 && gallons <= 20 && length > 0) {
    if (length <= 2.5) score += 8
    else if (length >= 5) score -= 8
  }
  return score
}

function rankCandidate(
  suggestion: Suggestion,
  intent: LivestockAskIntent,
  ctx: {
    missingRoles: Set<CleanupRole>
    owned: Set<string>
    categoriesPresent: Set<string>
    bioloadPercent: number
    hasPeaceful: boolean
    hasAggressive: boolean
    gallons: number
    likeCategories: Set<string>
    likeKinds: Set<string>
  },
): Ranked {
  const species = suggestion.species
  const why: string[] = []
  let score = 0

  const roles = cleanupRoles(species)
  if (intent.cleanupRole && roles.includes(intent.cleanupRole)) {
    score += 55
    why.push(`Covers ${cleanupRoleLabel(intent.cleanupRole)}`)
  }
  for (const role of roles) {
    if (ctx.missingRoles.has(role)) {
      score += intent.cleanupRole === role ? 10 : 28
      if (!why.some((w) => w.includes(cleanupRoleLabel(role)))) {
        why.push(`Fills missing ${cleanupRoleLabel(role)}`)
      }
    }
  }
  if (intent.preferCleanup && isCleanupSpecies(species)) score += 18

  if (intent.kind && species.kind === intent.kind) score += 16
  if (intent.temperament && species.temperament === intent.temperament) {
    score += 18
    why.push(`${intent.temperament.replaceAll("_", " ")} temperament`)
  }
  if (intent.diet && species.diet === intent.diet) score += 12

  const cm = categoryMatch(species, intent.categoryHint)
  if (cm >= 0.34) {
    score += 30 * cm
    if (intent.categoryHint) why.push(`Matches ${species.category ?? intent.categoryHint}`)
  }

  const { score: kwScore, hits } = keywordRelevance(species, intent.keywords)
  score += kwScore * 14
  if (hits > 0 && intent.keywords.length > 0) why.push("Name / notes match your wording")

  if (intent.likeSpeciesIds.length > 0) {
    if (species.category && ctx.likeCategories.has(species.category)) {
      score += 22
      why.push("Same group as what you referenced")
    } else if (ctx.likeKinds.has(species.kind)) {
      score += 8
    }
    if (intent.likeSpeciesIds.includes(species.id)) score -= 40 // don't recommend the exact same as "like X"
  }

  if (intent.preferReefSafe) {
    if (species.reef_safe === "yes") {
      score += 14
      why.push("Reef-safe")
    } else if (species.reef_safe === "caution") score += 4
    else score -= 20
  }

  score += sizeFitScore(species, ctx.gallons, intent)

  if (suggestion.projectedBioloadPercent != null) {
    const projected = suggestion.projectedBioloadPercent
    score += Math.max(0, 45 - projected / 2)
    if (projected < 70) score += 6
    if (projected >= 90) score -= 12
  } else {
    score += Math.max(0, 20 - ctx.bioloadPercent / 5)
  }

  // Diversity: prefer categories not already stocked.
  const cat = species.category
  if (cat && !ctx.categoriesPresent.has(cat)) {
    score += intent.preferDiverse || intent.fillGaps ? 16 : 8
    if (intent.preferDiverse || intent.fillGaps) why.push("Adds a new group to the tank")
  } else if (cat && ctx.categoriesPresent.has(cat) && intent.preferDiverse) {
    score -= 12
  }

  // Community harmony heuristics.
  if (ctx.hasPeaceful && species.temperament === "aggressive") score -= 18
  if (ctx.hasAggressive && species.temperament === "peaceful") score -= 8
  if (!ctx.hasAggressive && species.temperament === "peaceful") score += 5

  // Empty / sparse tanks: beginner-friendly fish first for “next fish”.
  if (ctx.owned.size === 0 && species.kind === "fish" && species.temperament === "peaceful") {
    score += 10
    why.push("Beginner-friendly starter pick")
  }

  if (intent.fillGaps && isCleanupSpecies(species) && ctx.missingRoles.size > 0) {
    score += 12
  }

  // Slight preference for species that leave a clear “why”.
  if (why.length === 0 && intent.isRecommendation) {
    why.push("Passes tank size, compatibility, and bioload checks")
  }

  return { suggestion, score, why }
}

function annotateReasons(ranked: Ranked, intent: LivestockAskIntent): Suggestion {
  const reasons = [...ranked.suggestion.reasons]
  for (const line of ranked.why.slice(0, 2).reverse()) {
    if (!reasons.includes(line)) reasons.unshift(line)
  }
  if (
    intent.kind === "fish" &&
    /\bnext\b/.test(normalize(intent.query)) &&
    !reasons[0]?.toLowerCase().includes("next")
  ) {
    reasons.unshift("Strong next-fish candidate for this tank’s rules and headroom")
  }
  return { ...ranked.suggestion, reasons }
}

function collectCandidates(
  catalog: Species[],
  intent: LivestockAskIntent,
  mode: FilterMode,
): Species[] {
  return catalog.filter((species) => passesFilters(species, intent, mode))
}

/**
 * Answer a natural-language stocking question with catalog species that
 * already pass tank compatibility / bioload rules.
 */
export function askLivestock(
  query: string,
  catalog: Species[],
  tank: Tank,
  livestock: LivestockRow[],
  currentParams: Partial<Record<ParameterKey, number>>,
  limit = 48,
): LivestockAskResult {
  const intent = parseLivestockAsk(query, tank, catalog)
  if (!intent.query) {
    return { intent, results: [], total: 0 }
  }

  const cuc = assessCleanupCrew(tank, livestock)
  const missingRoles = new Set(cuc.rolesMissing)
  // Vague asks: if cleanup is light, bias toward missing roles.
  if (intent.fillGaps && !intent.cleanupRole && missingRoles.size > 0) {
    // Don't rewrite intent; ranking boosts missing roles.
  }

  const owned = tankOwnedIds(livestock)
  const categoriesPresent = tankCategories(livestock)
  const load = bioloadSummary(tank, livestock)
  const bioloadPercent = tankCapacity(tank) > 0 ? (load.used / tankCapacity(tank)) * 100 : 0
  const likeSpecies = catalog.filter((species) => intent.likeSpeciesIds.includes(species.id))
  const ctx = {
    missingRoles,
    owned,
    categoriesPresent,
    bioloadPercent,
    hasPeaceful: tankHasPeacefulFish(livestock),
    hasAggressive: tankHasAggressiveFish(livestock),
    gallons: Number(tank.gallons) || 0,
    likeCategories: new Set(likeSpecies.map((s) => s.category).filter((c): c is string => Boolean(c))),
    likeKinds: new Set(likeSpecies.map((s) => s.kind)),
  }

  const modes: FilterMode[] = intent.isRecommendation
    ? ["strict", "soft", "loose"]
    : ["strict", "soft"]

  let usedMode: FilterMode = "strict"
  let evaluated: Suggestion[] = []

  for (const mode of modes) {
    const candidates = collectCandidates(catalog, intent, mode)
    evaluated = candidates
      .map((species) => evaluateSpecies(species, tank, livestock, currentParams))
      .filter((item) => item.ok)
    if (evaluated.length >= Math.min(3, limit) || evaluated.length >= limit) {
      usedMode = mode
      break
    }
    if (evaluated.length > 0 && mode === "soft") {
      usedMode = mode
      // keep going only if we have almost nothing
      if (evaluated.length >= 2) break
    }
    usedMode = mode
  }

  // Last resort for recommendations: any compatible catalog species, ranked by tank needs.
  if (evaluated.length === 0 && intent.isRecommendation) {
    evaluated = catalog
      .map((species) => evaluateSpecies(species, tank, livestock, currentParams))
      .filter((item) => item.ok)
    usedMode = "loose"
  }

  const rankedAll = evaluated
    .map((suggestion) => rankCandidate(suggestion, intent, ctx))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.suggestion.species.common_name.localeCompare(b.suggestion.species.common_name)
    })
  // Cap only as a safety valve for huge catalogs; UI pages through this list.
  const ranked = rankedAll.slice(0, limit).map((row) => annotateReasons(row, intent))
  const total = ranked.length
  const truncated = rankedAll.length > ranked.length

  let note: string | undefined
  if (usedMode === "soft") {
    note = "Broadened filters a little to find solid fits (still compatible with this tank)."
  } else if (usedMode === "loose") {
    note = "Few exact matches — showing the closest compatible options for your ask."
  } else if (intent.fillGaps && missingRoles.size > 0) {
    note = `Prioritizing gaps: ${[...missingRoles].map(cleanupRoleLabel).join(", ")}.`
  } else if (intent.likeSpeciesIds.length > 0) {
    note = "Using similar catalog entries to guide category and temperament."
  } else if (truncated) {
    note = `Showing the top ${ranked.length} matches of ${rankedAll.length} compatible options.`
  }

  return { intent, results: ranked, total, note }
}

export function suggestAskPrompts(
  tank: Tank,
  livestock: LivestockRow[],
  limit = 6,
): string[] {
  const fw = tank.water_type === "freshwater"
  const gallons = Number(tank.gallons) || 0
  const nano = gallons > 0 && gallons <= 20
  const load = bioloadSummary(tank, livestock)
  const capacity = tankCapacity(tank)
  const bioloadPercent = capacity > 0 ? (load.used / capacity) * 100 : 0
  const headroomTight = bioloadPercent >= 85
  const headroomOk = bioloadPercent < 75
  const cuc = assessCleanupCrew(tank, livestock)
  const missing = new Set(cuc.rolesMissing)
  const profile = tankProfile(tank.tank_type)
  const reefy = !fw && profile.reefSafeRequired

  const categories = new Set(
    livestock.map((item) => item.species.category).filter((c): c is string => Boolean(c)),
  )
  const fishCount = livestock.filter((item) => item.species.kind === "fish").length
  const invertCount = livestock.filter((item) => item.species.kind === "invert").length
  const coralCount = livestock.filter((item) => item.species.kind === "coral").length
  const plantCount = livestock.filter((item) => item.species.kind === "plant").length
  const hasPeacefulFish = livestock.some(
    (item) => item.species.kind === "fish" && item.species.temperament === "peaceful",
  )
  const hasAggressiveFish = livestock.some(
    (item) => item.species.kind === "fish" && item.species.temperament === "aggressive",
  )
  const hasClown = [...categories].some((c) => /clown/i.test(c)) ||
    livestock.some((item) => /clown/i.test(item.species.common_name))
  const hasGoby = [...categories].some((c) => /goby/i.test(c))
  const hasWrasse = [...categories].some((c) => /wrasse/i.test(c))
  const hasShrimp = [...categories].some((c) => /shrimp/i.test(c)) ||
    livestock.some((item) => /shrimp/i.test(item.species.common_name))
  const hasTetra = [...categories].some((c) => /tetra/i.test(c))
  const hasCory = [...categories].some((c) => /cory/i.test(c))
  const hasPleco = [...categories].some((c) => /pleco/i.test(c))

  type Scored = { text: string; score: number }
  const picks: Scored[] = []
  const push = (text: string, score: number) => {
    if (!picks.some((p) => p.text === text)) picks.push({ text, score })
  }

  if (livestock.length === 0) {
    if (fw) {
      push("What would be a good starter fish for this tank?", 100)
      push(nano ? "Nano-friendly shrimp for a new tank" : "Peaceful community fish to start with", 92)
      push("Good algae eater to start the cleanup crew", 88)
      push("What's a solid cleanup crew for this tank size?", 84)
      if (!nano) push("Something like a neon tetra", 70)
    } else {
      push("What would be a good starter fish for this tank?", 100)
      push(reefy ? "Reef-safe first fish suggestions" : "Good next fish for this tank", 94)
      push("What would be a good sand cleaner to add?", 90)
      push("Cleanup crew ideas for a new tank", 86)
      push("Something like a clownfish", 72)
    }
  } else {
    // Cleanup gaps — highest priority when CUC is weak.
    if (missing.has("sand")) {
      push("What would be a good sand cleaner to add?", 98)
    }
    if (missing.has("algae")) {
      push(
        fw ? "Good algae eater for this tank" : "Algae grazer for glass and rock",
        96,
      )
    }
    if (missing.has("scavenger")) {
      push(fw ? "Good scavenger invert for leftover food" : "Scavenger for leftover food and detritus", 94)
    }
    if (cuc.status !== "ok") {
      push("What's missing from my cleanup crew?", 92)
    }

    // Next livestock by bioload / stocking state.
    if (headroomOk && !hasAggressiveFish) {
      push(
        fishCount === 0 ? "What would be a good first fish to add?" : "What would be a good next fish to add?",
        fishCount === 0 ? 95 : 88,
      )
    } else if (headroomOk && hasAggressiveFish) {
      push("Compatible tank mate for my current fish", 86)
    }

    if (headroomTight) {
      push(
        fw ? "Low-bioload invert or shrimp ideas" : "Low-bioload invert to add without crowding",
        90,
      )
      push("Cleanup crew that won't add much bioload", 82)
    }

    if (hasPeacefulFish && headroomOk) {
      push(fw ? "Peaceful community fish to add next" : "Peaceful reef fish for this community", 80)
    }

    if (reefy) {
      if (!hasWrasse && headroomOk) push("Reef-safe wrasse suggestions", 78)
      if (!hasGoby && headroomOk) push("Good goby for this reef tank", 74)
      if (hasClown && headroomOk) push("Something that pairs well with clownfish", 76)
      if (!hasClown && fishCount > 0 && headroomOk) push("Something like a clownfish", 68)
      if (coralCount === 0) push("Beginner soft coral or LPS ideas", 70)
      else if (coralCount > 0 && headroomOk) push("Good next coral for this reef", 66)
      if (!hasShrimp && invertCount < 3) push("Reef-safe shrimp for this tank", 64)
    }

    if (fw) {
      if (!hasTetra && headroomOk) push("Peaceful community tetra", 76)
      if (!hasCory && headroomOk) push("Something like a corydoras", 74)
      if (!hasPleco && missing.has("algae")) push("Algae-eating pleco or oto ideas", 72)
      if (!hasShrimp) push(nano ? "Nano-friendly shrimp" : "Shrimp that fit this community", 70)
      if (plantCount === 0) push("Easy beginner plants for this tank", 68)
      else push("Carpeting or stem plant ideas", 58)
      if (hasCory) push("Something like a corydoras", 55)
    }

    // Diversity / vague asks when stocked but balanced.
    if (cuc.status === "ok" && headroomOk && fishCount > 0) {
      push("What should I add next to round out this tank?", 62)
      push("Something different from what I already keep", 58)
    }

    if (nano) {
      push(fw ? "Nano-friendly fish for this tank" : "Nano reef fish that fit this volume", 75)
    }
  }

  // Always keep at least a couple of safe fallbacks.
  if (fw) {
    push("What's missing from my cleanup crew?", 40)
    push("Good next fish for this tank", 35)
  } else {
    push("What's missing from my cleanup crew?", 40)
    push("Good next fish for this tank", 35)
    if (reefy) push("Reef-safe wrasse suggestions", 30)
  }

  return picks
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((p) => p.text)
}

/** @deprecated Prefer suggestAskPrompts(tank, livestock) for tank-aware chips. */
export const LIVESTOCK_ASK_EXAMPLES_FW = [
  "What would be a good next fish to add?",
  "Good algae eater for this tank",
  "Peaceful community tetra",
  "Something like a corydoras",
  "What's missing from my cleanup crew?",
  "Nano-friendly shrimp",
] as const

export const LIVESTOCK_ASK_EXAMPLES_SW = [
  "What would be a good sand cleaner to add?",
  "Good next fish for this tank",
  "Reef-safe wrasse suggestions",
  "Algae grazer for glass and rock",
  "Something like a clownfish",
  "What's missing from my cleanup crew?",
] as const
