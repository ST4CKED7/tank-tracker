import { NextResponse } from "next/server"
import { resolveSpeciesImageUrl, type SpeciesImageKind } from "@/lib/species-image"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const commonName = searchParams.get("common")?.trim()
  if (!commonName) {
    return NextResponse.json({ url: null }, { status: 400 })
  }
  const scientificName = searchParams.get("scientific")
  const kindParam = searchParams.get("kind")
  const kind =
    kindParam === "fish" || kindParam === "coral" || kindParam === "invert" || kindParam === "plant"
      ? (kindParam as SpeciesImageKind)
      : null
  const url = await resolveSpeciesImageUrl({ commonName, scientificName, kind })
  return NextResponse.json(
    { url },
    {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  )
}
