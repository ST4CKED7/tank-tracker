"use client"

import { useRef, useState } from "react"
import { deleteTankPhoto, uploadTankPhoto } from "@/lib/actions"
import type { Tables } from "@/lib/database.types"
import { SubmitButton } from "@/components/submit-button"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format, parseISO } from "date-fns"
import { Camera, ImagePlus, X } from "lucide-react"

const ACCEPT = "image/*,image/jpeg,image/png,image/webp,image/heic,image/heif"

export function TankPhotoTimeline({
  tankId,
  photos,
}: {
  tankId: string
  photos: Tables<"tank_photos">[]
}) {
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const libraryInputRef = useRef<HTMLInputElement>(null)

  function assignFile(file: File | null) {
    if (!photoInputRef.current) return
    if (!file) {
      photoInputRef.current.value = ""
      setSelectedName(null)
      setLocalPreview((current) => {
        if (current) URL.revokeObjectURL(current)
        return null
      })
      return
    }
    const transfer = new DataTransfer()
    transfer.items.add(file)
    photoInputRef.current.files = transfer.files
    setSelectedName(file.name)
    setLocalPreview((current) => {
      if (current) URL.revokeObjectURL(current)
      return URL.createObjectURL(file)
    })
  }

  return (
    <Card id="photos" className="scroll-mt-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="size-4 text-primary" />
          Tank photos
        </CardTitle>
        <CardDescription>
          Build a timeline of aquascape, algae, and livestock changes. Newest first. On your phone, use Take photo to
          open the camera.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={uploadTankPhoto} className="space-y-3 rounded-xl border border-primary/15 bg-primary/5 p-3">
          <input type="hidden" name="tank_id" value={tankId} />
          {/* Submitted file — kept in sync from camera / library pickers */}
          <input
            ref={photoInputRef}
            id="photo"
            name="photo"
            type="file"
            accept={ACCEPT}
            required
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => assignFile(event.target.files?.[0] ?? null)}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept={ACCEPT}
            capture="environment"
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => assignFile(event.target.files?.[0] ?? null)}
          />
          <input
            ref={libraryInputRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => assignFile(event.target.files?.[0] ?? null)}
          />

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="default"
              className="min-h-11 w-full"
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera className="size-4" />
              Take photo
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full"
              onClick={() => libraryInputRef.current?.click()}
            >
              <ImagePlus className="size-4" />
              Choose from library
            </Button>
          </div>

          {selectedName ? (
            <div className="flex items-center gap-3 rounded-lg border border-primary/15 bg-background/70 px-3 py-2">
              {localPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={localPreview} alt="" className="size-12 shrink-0 rounded-md object-cover" />
              ) : null}
              <div className="min-w-0 flex-1 text-sm">
                <div className="truncate font-medium">{selectedName}</div>
                <div className="text-xs text-muted-foreground">Ready to upload</div>
              </div>
              <Button type="button" size="icon" variant="ghost" className="size-8" onClick={() => assignFile(null)}>
                <X className="size-4" />
                <span className="sr-only">Clear photo</span>
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Pick a photo with the camera or from your library first.</p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="taken_at">Taken</Label>
              <Input id="taken_at" name="taken_at" type="datetime-local" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="caption">Caption</Label>
              <Input id="caption" name="caption" placeholder="After water change…" />
            </div>
          </div>
          <SubmitButton className="min-h-11 w-full" pendingLabel="Uploading…" successMessage="Photo added">
            Add photo
          </SubmitButton>
        </form>

        {photos.length === 0 ? (
          <EmptyState
            icon={<Camera className="size-6" />}
            title="No photos yet"
            description="Snap the tank after a scape change, outbreak, or recovery — progress is easier to see in a strip."
            className="py-6 shadow-none"
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((photo) => (
              <figure
                key={photo.id}
                className="group relative overflow-hidden rounded-xl border border-primary/10 bg-background/40"
              >
                <button
                  type="button"
                  className="block w-full text-left"
                  onClick={() => setPreview(photo.public_url)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.public_url}
                    alt={photo.caption || "Tank photo"}
                    className="aspect-square w-full object-cover transition-transform group-hover:scale-[1.02]"
                  />
                </button>
                <figcaption className="space-y-0.5 px-2 py-1.5 text-xs">
                  <div className="font-medium text-muted-foreground">
                    {format(parseISO(photo.taken_at), "MMM d, yyyy")}
                  </div>
                  {photo.caption ? <div className="line-clamp-2">{photo.caption}</div> : null}
                </figcaption>
                <form action={deleteTankPhoto} className="absolute right-1.5 top-1.5">
                  <input type="hidden" name="id" value={photo.id} />
                  <SubmitButton
                    type="submit"
                    size="icon"
                    variant="secondary"
                    className="size-8 opacity-90 shadow"
                    pendingLabel="…"
                    aria-label="Delete photo"
                  >
                    <X className="size-3.5" />
                  </SubmitButton>
                </form>
              </figure>
            ))}
          </div>
        )}

        {preview ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setPreview(null)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setPreview(null)
            }}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full bg-background/90 p-2"
              onClick={() => setPreview(null)}
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Tank photo preview"
              className="max-h-[90vh] max-w-full rounded-lg object-contain"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
