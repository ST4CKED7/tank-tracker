"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { deleteTankPhoto, uploadTankPhoto } from "@/lib/actions"
import { prepareTankPhoto } from "@/lib/tank-photo"
import type { Tables } from "@/lib/database.types"
import { SubmitButton } from "@/components/submit-button"
import { EmptyState } from "@/components/empty-state"
import { softHaptic } from "@/components/form-success-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format, parseISO } from "date-fns"
import { Camera, ImagePlus, X } from "lucide-react"
import { toast } from "sonner"

const ACCEPT = "image/*,image/jpeg,image/png,image/webp,image/heic,image/heif"

export function TankPhotoTimeline({
  tankId,
  photos,
}: {
  tankId: string
  photos: Tables<"tank_photos">[]
}) {
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const libraryInputRef = useRef<HTMLInputElement>(null)
  const captionRef = useRef<HTMLInputElement>(null)
  const takenAtRef = useRef<HTMLInputElement>(null)

  function clearSelection() {
    setFile(null)
    setLocalPreview((current) => {
      if (current) URL.revokeObjectURL(current)
      return null
    })
    if (cameraInputRef.current) cameraInputRef.current.value = ""
    if (libraryInputRef.current) libraryInputRef.current.value = ""
  }

  function onPick(next: File | null) {
    if (!next) {
      clearSelection()
      return
    }
    setFile(next)
    setLocalPreview((current) => {
      if (current) URL.revokeObjectURL(current)
      return URL.createObjectURL(next)
    })
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) {
      toast.error("Choose a photo first.")
      return
    }

    startTransition(async () => {
      try {
        const prepared = await prepareTankPhoto(file)
        const formData = new FormData()
        formData.set("tank_id", tankId)
        formData.set("caption", captionRef.current?.value ?? "")
        formData.set("taken_at", takenAtRef.current?.value ?? "")
        formData.set("photo", prepared, prepared.name || "tank-photo.jpg")

        const result = await uploadTankPhoto(formData)
        if (!result?.ok) {
          toast.error(result?.error || "Could not upload photo.")
          return
        }
        softHaptic()
        toast.success("Photo added", { duration: 2400, className: "tt-toast-success" })
        clearSelection()
        if (captionRef.current) captionRef.current.value = ""
        if (takenAtRef.current) takenAtRef.current.value = ""
        router.refresh()
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not upload photo."
        toast.error(message.includes("Body exceeded") || message.includes("too large")
          ? "Photo is too large for upload. Try a smaller shot."
          : message)
      }
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
        <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-primary/15 bg-primary/5 p-3">
          <input
            ref={cameraInputRef}
            type="file"
            accept={ACCEPT}
            capture="environment"
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => onPick(event.target.files?.[0] ?? null)}
          />
          <input
            ref={libraryInputRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => onPick(event.target.files?.[0] ?? null)}
          />

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="default"
              className="min-h-11 w-full"
              disabled={pending}
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera className="size-4" />
              Take photo
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full"
              disabled={pending}
              onClick={() => libraryInputRef.current?.click()}
            >
              <ImagePlus className="size-4" />
              Choose from library
            </Button>
          </div>

          {file ? (
            <div className="flex items-center gap-3 rounded-lg border border-primary/15 bg-background/70 px-3 py-2">
              {localPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={localPreview} alt="" className="size-12 shrink-0 rounded-md object-cover" />
              ) : null}
              <div className="min-w-0 flex-1 text-sm">
                <div className="truncate font-medium">{file.name}</div>
                <div className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(0)} KB · ready to upload
                </div>
              </div>
              <Button type="button" size="icon" variant="ghost" className="size-8" onClick={clearSelection}>
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
              <Input id="taken_at" name="taken_at" type="datetime-local" ref={takenAtRef} disabled={pending} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="caption">Caption</Label>
              <Input
                id="caption"
                name="caption"
                placeholder="After water change…"
                ref={captionRef}
                disabled={pending}
              />
            </div>
          </div>
          <Button type="submit" className="min-h-11 w-full" disabled={pending || !file}>
            {pending ? "Uploading…" : "Add photo"}
          </Button>
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
                  onClick={() => setLightbox(photo.public_url)}
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

        {lightbox ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setLightbox(null)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setLightbox(null)
            }}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full bg-background/90 p-2"
              onClick={() => setLightbox(null)}
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox}
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
