"use client"

import { useState } from "react"
import { deleteTankPhoto, uploadTankPhoto } from "@/lib/actions"
import type { Tables } from "@/lib/database.types"
import { SubmitButton } from "@/components/submit-button"
import { EmptyState } from "@/components/empty-state"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format, parseISO } from "date-fns"
import { Camera, X } from "lucide-react"

export function TankPhotoTimeline({
  tankId,
  photos,
}: {
  tankId: string
  photos: Tables<"tank_photos">[]
}) {
  const [preview, setPreview] = useState<string | null>(null)

  return (
    <Card id="photos" className="scroll-mt-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="size-4 text-primary" />
          Tank photos
        </CardTitle>
        <CardDescription>
          Build a timeline of aquascape, algae, and livestock changes. Newest first.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={uploadTankPhoto} className="grid gap-3 rounded-xl border border-primary/15 bg-primary/5 p-3 sm:grid-cols-[1fr_1fr_auto]">
          <input type="hidden" name="tank_id" value={tankId} />
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="photo">Photo</Label>
            <Input
              id="photo"
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              required
              className="cursor-pointer"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="taken_at">Taken</Label>
            <Input id="taken_at" name="taken_at" type="datetime-local" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="caption">Caption</Label>
            <Input id="caption" name="caption" placeholder="After water change…" />
          </div>
          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <SubmitButton className="min-h-11 w-full" pendingLabel="Uploading…" successMessage="Photo added">
              Add photo
            </SubmitButton>
          </div>
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
