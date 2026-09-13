"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Fish, Loader2 } from "lucide-react"
import { cacheSpeciesImage } from "@/lib/actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

/** Limit concurrent Wikipedia/iNat lookups so scrolling the catalog doesn't stampede. */
const MAX_IN_FLIGHT = 3
let inFlight = 0
const waitQueue: Array<() => void> = []

/** Known wrong auto-matches (insects/plants) that should be re-resolved. */
const BAD_IMAGE_RE =
  /photos\/(39295509|3027303|29616601)(?:\/|\.|$)|Allocapnia|flowering.?plant/i

function usableSrc(src?: string | null) {
  if (!src) return null
  if (BAD_IMAGE_RE.test(src)) return null
  return src
}

function acquireSlot() {
  if (inFlight < MAX_IN_FLIGHT) {
    inFlight += 1
    return Promise.resolve()
  }
  return new Promise<void>((resolve) => {
    waitQueue.push(() => {
      inFlight += 1
      resolve()
    })
  })
}

function releaseSlot() {
  inFlight = Math.max(0, inFlight - 1)
  const next = waitQueue.shift()
  if (next) next()
}

export function SpeciesImage({
  src,
  alt,
  speciesId,
  scientificName,
  commonName,
  kind,
  className,
  size = "md",
}: {
  src?: string | null
  alt: string
  speciesId?: string
  scientificName?: string | null
  commonName?: string
  kind?: "fish" | "coral" | "invert" | "plant" | null
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const initial = usableSrc(src)
  const [url, setUrl] = useState<string | null>(initial)
  const [failed, setFailed] = useState(false)
  const [loading, setLoading] = useState(!initial && Boolean(commonName))
  const [open, setOpen] = useState(false)
  const dim = size === "sm" ? "size-12" : size === "lg" ? "size-20" : "size-14"

  useEffect(() => {
    const next = usableSrc(src)
    setUrl(next)
    setFailed(false)
    setLoading(!next && Boolean(commonName))
  }, [src, commonName])

  useEffect(() => {
    if (url || !commonName) {
      setLoading(false)
      return
    }
    let cancelled = false
    const params = new URLSearchParams({ common: commonName })
    if (scientificName) params.set("scientific", scientificName)
    if (kind) params.set("kind", kind)

    ;(async () => {
      await acquireSlot()
      if (cancelled) {
        releaseSlot()
        return
      }
      try {
        const res = await fetch(`/api/species-image?${params}`)
        const data = (await res.json()) as { url?: string | null }
        if (cancelled) return
        const resolved = usableSrc(data.url)
        if (resolved) {
          setUrl(resolved)
          if (speciesId) void cacheSpeciesImage(speciesId, resolved)
        }
      } catch {
        // keep placeholder
      } finally {
        releaseSlot()
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [url, commonName, scientificName, speciesId, kind])

  const thumb = !url || failed ? (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary",
        dim,
        className,
      )}
      aria-hidden
    >
      {loading ? <Loader2 className="size-1/2 animate-spin opacity-70" /> : <Fish className="size-1/2 opacity-70" />}
    </div>
  ) : (
    // Catalog photos from Wikipedia / iNaturalist CDNs.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={cn("shrink-0 rounded-xl object-cover bg-muted", dim, className)}
    />
  )

  if (!url || failed) return thumb

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setOpen(true)
        }}
        className="shrink-0 rounded-xl outline-none ring-offset-background transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`View larger photo of ${alt}`}
      >
        {thumb}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl border-primary/20 p-3 sm:p-4">
          <DialogHeader>
            <DialogTitle>{alt}</DialogTitle>
            {scientificName ? (
              <DialogDescription className="italic">{scientificName}</DialogDescription>
            ) : (
              <DialogDescription className="sr-only">Enlarged species photo</DialogDescription>
            )}
          </DialogHeader>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={alt}
            referrerPolicy="no-referrer"
            className="max-h-[75vh] w-full rounded-xl object-contain bg-muted"
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
