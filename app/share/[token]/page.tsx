import type { Metadata } from "next"
import Link from "next/link"
import { Droplets } from "lucide-react"
import { SharePhotoGallery, type SharePhoto } from "@/components/share-photo-gallery"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TankIconBadge } from "@/components/tank-icon"
import { createClient } from "@/lib/supabase/server"
import { dashboardParameterKeys, parameterMeta, type ParameterKey, type WaterType } from "@/lib/parameters"
import { displayParam, formatTempRange, formatVolume, unitPrefsFromTank } from "@/lib/units"

export const dynamic = "force-dynamic"

type SharedTank = {
  name: string
  gallons: number | string
  water_type: string
  tank_type: string | null
  icon: string | null
  icon_color: string | null
  icon_photo_url: string | null
  has_sump: boolean | null
  sump_gallons: number | string | null
  volume_unit: string | null
  temp_unit: string | null
  length_unit: string | null
  unit_system: string | null
  created_at: string | null
}

type SharedSpecies = {
  common_name: string
  scientific_name: string | null
  kind: string
  category: string | null
  image_url: string | null
  adult_length_inches: number | null
  temp_min: number | null
  temp_max: number | null
}

type SharedLivestock = {
  id: string
  quantity: number | null
  nickname: string | null
  coral_size: string | null
  sex: string | null
  current_length_inches: number | null
  added_on: string | null
  species: SharedSpecies
}

type SharedTest = {
  parameter: string
  value: number
  unit: string | null
  tested_at: string
}

type SharedBundle = {
  tank: SharedTank
  livestock: SharedLivestock[]
  photos: SharePhoto[]
  tests: SharedTest[]
}

async function loadShare(token: string): Promise<SharedBundle | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_shared_tank", { p_token: token })
  if (error || !data) return null
  return data as unknown as SharedBundle
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  const bundle = await loadShare(token)
  return {
    title: bundle ? `${bundle.tank.name} · Shared tank` : "Shared tank",
    robots: { index: false, follow: false },
  }
}

const KIND_LABELS: Record<string, string> = {
  fish: "Fish",
  coral: "Corals",
  invert: "Inverts",
  plant: "Plants",
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const bundle = await loadShare(token)

  if (!bundle) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Droplets className="size-7" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Link unavailable</h1>
        <p className="text-sm text-muted-foreground">
          This share link is invalid or has been turned off by its owner.
        </p>
        <Link
          href="/"
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Go to Tank Tracker
        </Link>
      </main>
    )
  }

  const { tank, livestock, photos, tests } = bundle
  const waterType: WaterType = tank.water_type === "freshwater" ? "freshwater" : "saltwater"
  const prefs = unitPrefsFromTank(tank)
  const meta = parameterMeta(prefs, waterType)

  // Latest reading per parameter (tests arrive newest-first).
  const latest = new Map<string, SharedTest>()
  for (const test of tests) {
    if (!latest.has(test.parameter)) latest.set(test.parameter, test)
  }
  const paramKeys = dashboardParameterKeys(waterType).filter((key) => latest.has(key))

  // Group livestock by kind, then render.
  const kindOrder = ["fish", "coral", "invert", "plant"]
  const byKind = new Map<string, SharedLivestock[]>()
  for (const item of livestock) {
    const list = byKind.get(item.species.kind) ?? []
    list.push(item)
    byKind.set(item.species.kind, list)
  }
  const kindGroups = kindOrder
    .filter((kind) => byKind.has(kind))
    .map((kind) => [kind, byKind.get(kind)!] as const)

  const dateLabel = (value: string) =>
    new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" })

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-16 sm:px-6">
      {/* Hero */}
      <header className="mb-6 flex flex-col gap-4 rounded-3xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <TankIconBadge
            icon={tank.icon}
            color={tank.icon_color}
            photoUrl={tank.icon_photo_url}
            waterType={tank.water_type}
            className="size-14 rounded-2xl"
            iconClassName="size-6"
          />
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight">{tank.name}</h1>
            <p className="text-sm text-muted-foreground">
              {formatVolume(Number(tank.gallons), prefs)} ·{" "}
              {waterType === "freshwater" ? "Freshwater" : "Saltwater"}
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Read-only
              </span>
            </p>
          </div>
        </div>
        <Link
          href="/"
          className="shrink-0 rounded-full border px-4 py-2 text-center text-sm font-medium hover:bg-muted"
        >
          Track your own tank
        </Link>
      </header>

      {/* Parameters */}
      {paramKeys.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold tracking-tight">Latest parameters</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {paramKeys.map((key) => {
              const test = latest.get(key)!
              const info = meta[key as ParameterKey]
              const target =
                key === "temperature"
                  ? formatTempRange(info.establishedTarget?.min, info.establishedTarget?.max, prefs)
                  : info.establishedTarget
                    ? `${info.establishedTarget.min}–${info.establishedTarget.max}${info.unit ? ` ${info.unit}` : ""}`
                    : null
              return (
                <Card key={key} className="gap-0 py-4">
                  <CardHeader className="px-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {info.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4">
                    <div className="text-2xl font-semibold tabular-nums">
                      {displayParam(key, test.value, prefs)}
                      <span className="ml-1 text-sm font-normal text-muted-foreground">
                        {key === "temperature" ? prefs.temp === "C" ? "°C" : "°F" : info.unit}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {target ? `Target ${target} · ` : ""}
                      {dateLabel(test.tested_at)}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      ) : null}

      {/* Livestock */}
      {livestock.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold tracking-tight">
            Livestock <span className="text-muted-foreground">({livestock.length})</span>
          </h2>
          <div className="space-y-6">
            {kindGroups.map(([kind, items]) => (
              <div key={kind}>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                  {KIND_LABELS[kind] ?? kind}
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {items.map((item) => (
                    <Card key={item.id} className="overflow-hidden py-0">
                      <div className="relative aspect-square bg-muted">
                        {item.species.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.species.image_url}
                            alt={item.species.common_name}
                            loading="lazy"
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-muted-foreground">
                            <Droplets className="size-8" />
                          </div>
                        )}
                        {item.quantity && item.quantity > 1 ? (
                          <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
                            ×{item.quantity}
                          </span>
                        ) : null}
                      </div>
                      <div className="space-y-0.5 p-3">
                        <p className="truncate text-sm font-medium">
                          {item.nickname || item.species.common_name}
                        </p>
                        {item.species.scientific_name ? (
                          <p className="truncate text-xs italic text-muted-foreground">
                            {item.species.scientific_name}
                          </p>
                        ) : null}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Photos */}
      {photos.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold tracking-tight">
            Photos <span className="text-muted-foreground">({photos.length})</span>
          </h2>
          <SharePhotoGallery photos={photos} />
        </section>
      ) : null}

      {paramKeys.length === 0 && livestock.length === 0 && photos.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          This tank doesn&apos;t have anything to show yet.
        </p>
      ) : null}

      <footer className="mt-10 border-t pt-6 text-center text-xs text-muted-foreground">
        Shared from{" "}
        <Link href="/" className="font-medium text-foreground hover:underline">
          Tank Tracker
        </Link>
      </footer>
    </main>
  )
}
