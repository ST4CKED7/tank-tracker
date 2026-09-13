"use client"

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { format, parseISO } from "date-fns"
import { Columns2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export type ComparePhoto = {
  id: string
  public_url: string
  caption: string | null
  taken_at: string
}

function photoLabel(photo: ComparePhoto) {
  const date = format(parseISO(photo.taken_at), "MMM d, yyyy")
  return photo.caption ? `${date} — ${photo.caption}` : date
}

function PhotoSelect({
  id,
  label,
  photos,
  value,
  onChange,
}: {
  id: string
  label: string
  photos: ComparePhoto[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {photos.map((photo) => (
          <option key={photo.id} value={photo.id}>
            {photoLabel(photo)}
          </option>
        ))}
      </select>
    </div>
  )
}

/** Classic before/after wipe slider — drag the handle to reveal the newer shot. */
export function PhotoCompareSlider({ photos }: { photos: ComparePhoto[] }) {
  const sorted = useMemo(
    () => [...photos].sort((a, b) => a.taken_at.localeCompare(b.taken_at)),
    [photos],
  )

  const beforeIdDefault = sorted[0]?.id ?? ""
  const afterIdDefault = sorted[sorted.length - 1]?.id ?? ""

  const [beforeId, setBeforeId] = useState(beforeIdDefault)
  const [afterId, setAfterId] = useState(afterIdDefault)
  const [position, setPosition] = useState(50)
  const dragging = useRef(false)
  const frameRef = useRef<HTMLDivElement>(null)
  const labelId = useId()

  // Keep selections valid when the photo list changes (upload/delete).
  useEffect(() => {
    if (!sorted.some((p) => p.id === beforeId) && beforeIdDefault) setBeforeId(beforeIdDefault)
    if (!sorted.some((p) => p.id === afterId) && afterIdDefault) setAfterId(afterIdDefault)
  }, [sorted, beforeId, afterId, beforeIdDefault, afterIdDefault])

  const before = sorted.find((p) => p.id === beforeId) ?? sorted[0]
  const after = sorted.find((p) => p.id === afterId) ?? sorted[sorted.length - 1]

  const updateFromClientX = useCallback((clientX: number) => {
    const el = frameRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.width <= 0) return
    const next = ((clientX - rect.left) / rect.width) * 100
    setPosition(Math.min(100, Math.max(0, next)))
  }, [])

  useEffect(() => {
    function onMove(event: PointerEvent) {
      if (!dragging.current) return
      updateFromClientX(event.clientX)
    }
    function onUp() {
      dragging.current = false
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
    }
  }, [updateFromClientX])

  if (sorted.length < 2 || !before || !after) return null

  const sameShot = before.id === after.id

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Columns2 className="size-4 text-primary" />
          Before &amp; after
        </CardTitle>
        <CardDescription>
          Pick two shots and drag the divider to compare aquascape, algae, or coral growth.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <PhotoSelect
            id={`${labelId}-before`}
            label="Before"
            photos={sorted}
            value={before.id}
            onChange={setBeforeId}
          />
          <PhotoSelect
            id={`${labelId}-after`}
            label="After"
            photos={[...sorted].reverse()}
            value={after.id}
            onChange={setAfterId}
          />
        </div>

        {sameShot ? (
          <p className="text-sm text-muted-foreground">Pick two different photos to compare.</p>
        ) : (
          <div
            ref={frameRef}
            role="img"
            aria-label={`Before and after comparison, divider at ${Math.round(position)} percent`}
            className="relative aspect-[4/3] w-full touch-none overflow-hidden rounded-2xl border border-primary/15 bg-muted select-none"
            onPointerDown={(event) => {
              dragging.current = true
              ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
              updateFromClientX(event.clientX)
            }}
          >
            {/* After (full base layer) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={after.public_url}
              alt={after.caption || "After"}
              draggable={false}
              className="absolute inset-0 size-full object-cover"
            />

            {/* Before — clipped from the right so both images stay aligned */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={before.public_url}
              alt={before.caption || "Before"}
              draggable={false}
              className="absolute inset-0 size-full object-cover"
              style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
            />

            {/* Divider + handle */}
            <div
              className="absolute inset-y-0 z-10 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.25)]"
              style={{ left: `${position}%`, transform: "translateX(-50%)" }}
            >
              <div
                className={cn(
                  "absolute top-1/2 left-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center",
                  "rounded-full border-2 border-white bg-primary text-primary-foreground shadow-lg",
                )}
                aria-hidden
              >
                <Columns2 className="size-4" />
              </div>
            </div>

            {/* Corner badges */}
            <span className="absolute left-2 top-2 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
              Before · {format(parseISO(before.taken_at), "MMM d, yyyy")}
            </span>
            <span className="absolute right-2 top-2 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
              After · {format(parseISO(after.taken_at), "MMM d, yyyy")}
            </span>

            {/* Keyboard-accessible range */}
            <input
              type="range"
              min={0}
              max={100}
              value={position}
              aria-label="Comparison slider"
              onChange={(event) => setPosition(Number(event.target.value))}
              className="absolute inset-x-3 bottom-3 z-20 h-2 cursor-pointer appearance-none rounded-full bg-white/40 accent-primary"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
