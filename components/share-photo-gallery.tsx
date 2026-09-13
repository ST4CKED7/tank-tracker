"use client"

import { useCallback, useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"

export type SharePhoto = {
  id: string
  public_url: string
  caption: string | null
  taken_at: string | null
}

function formatTaken(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

export function SharePhotoGallery({ photos }: { photos: SharePhoto[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const show = openIndex !== null
  const active = show ? photos[openIndex] : null

  const step = useCallback(
    (delta: number) => {
      setOpenIndex((current) => {
        if (current === null) return current
        const next = (current + delta + photos.length) % photos.length
        return next
      })
    },
    [photos.length],
  )

  useEffect(() => {
    if (!show) return
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") step(1)
      if (event.key === "ArrowLeft") step(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [show, step])

  if (photos.length === 0) return null

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setOpenIndex(index)}
            className="group relative aspect-square overflow-hidden rounded-2xl ring-1 ring-border focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.public_url}
              alt={photo.caption ?? "Tank photo"}
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {photo.caption ? (
              <span className="absolute inset-x-0 bottom-0 line-clamp-1 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 text-left text-xs text-white">
                {photo.caption}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <Dialog open={show} onOpenChange={(next) => (next ? null : setOpenIndex(null))}>
        <DialogContent
          showCloseButton={false}
          className="max-w-3xl overflow-hidden border-0 bg-black/95 p-0 sm:rounded-3xl"
        >
          <DialogTitle className="sr-only">Tank photo</DialogTitle>
          {active ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={active.public_url}
                alt={active.caption ?? "Tank photo"}
                className="max-h-[80vh] w-full object-contain"
              />
              <button
                type="button"
                onClick={() => setOpenIndex(null)}
                aria-label="Close"
                className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
              >
                <X className="size-5" />
              </button>
              {photos.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label="Previous photo"
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label="Next photo"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </>
              ) : null}
              {active.caption || formatTaken(active.taken_at) ? (
                <div className="absolute inset-x-0 bottom-0 space-y-0.5 bg-gradient-to-t from-black/80 to-transparent px-4 py-3 text-white">
                  {active.caption ? <p className="text-sm">{active.caption}</p> : null}
                  {formatTaken(active.taken_at) ? (
                    <p className="text-xs text-white/70">{formatTaken(active.taken_at)}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
