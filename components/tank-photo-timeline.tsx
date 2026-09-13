"use client"

import { useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  deleteTankPhoto,
  setTankIconPhoto,
  updateTankPhotoCaption,
  uploadTankPhoto,
} from "@/lib/actions"
import { objectUrlFromImageUrl, prepareTankPhoto } from "@/lib/tank-photo"
import type { Tables } from "@/lib/database.types"
import { SubmitButton } from "@/components/submit-button"
import { EmptyState } from "@/components/empty-state"
import { softHaptic } from "@/components/form-success-toast"
import { TankIconCropDialog } from "@/components/tank-icon-crop-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format, parseISO } from "date-fns"
import { Camera, ChevronLeft, ChevronRight, ImagePlus, Pencil, Sparkles, X } from "lucide-react"
import { toast } from "sonner"
import { PhotoCompareSlider } from "@/components/photo-compare-slider"

const ACCEPT = "image/*,image/jpeg,image/png,image/webp,image/heic,image/heif"

type Photo = Tables<"tank_photos">

export function TankPhotoTimeline({
  tankId,
  photos,
}: {
  tankId: string
  photos: Photo[]
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [iconPending, setIconPending] = useState(false)
  const [iconLoadingId, setIconLoadingId] = useState<string | null>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const router = useRouter()
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const libraryInputRef = useRef<HTMLInputElement>(null)
  const captionRef = useRef<HTMLInputElement>(null)
  const takenAtRef = useRef<HTMLInputElement>(null)

  // Photos arrive newest-first; group them into month buckets in that order.
  const months = useMemo(() => {
    const map = new Map<string, { label: string; items: Photo[] }>()
    for (const photo of photos) {
      const date = parseISO(photo.taken_at)
      const key = format(date, "yyyy-MM")
      const group = map.get(key) ?? { label: format(date, "MMMM yyyy"), items: [] }
      group.items.push(photo)
      map.set(key, group)
    }
    return Array.from(map.values())
  }, [photos])

  const activePhoto = lightboxIndex != null ? photos[lightboxIndex] ?? null : null

  function clearCropSrc() {
    setCropSrc((current) => {
      if (current) URL.revokeObjectURL(current)
      return null
    })
  }

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
        toast.error(
          message.includes("Body exceeded") || message.includes("too large")
            ? "Photo is too large for upload. Try a smaller shot."
            : message,
        )
      }
    })
  }

  function pickAsIcon(photo: Photo) {
    setIconPending(true)
    setIconLoadingId(photo.id)
    startTransition(async () => {
      try {
        const objectUrl = await objectUrlFromImageUrl(photo.public_url)
        setCropSrc((current) => {
          if (current) URL.revokeObjectURL(current)
          return objectUrl
        })
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not load photo.")
      } finally {
        setIconPending(false)
        setIconLoadingId(null)
      }
    })
  }

  function uploadCroppedIcon(file: File) {
    setIconPending(true)
    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set("tank_id", tankId)
        formData.set("photo", file, file.name || "tank-icon.jpg")
        const result = await setTankIconPhoto(formData)
        if (!result?.ok) {
          toast.error(result?.error || "Could not set tank icon.")
          return
        }
        clearCropSrc()
        softHaptic()
        toast.success("Set as tank icon", { duration: 2200, className: "tt-toast-success" })
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not set tank icon.")
      } finally {
        setIconPending(false)
      }
    })
  }

  function startEditing(photo: Photo) {
    setEditingId(photo.id)
    setEditValue(photo.caption ?? "")
  }

  function saveCaption(photoId: string) {
    const value = editValue
    startTransition(async () => {
      const formData = new FormData()
      formData.set("id", photoId)
      formData.set("caption", value)
      const result = await updateTankPhotoCaption(formData)
      if (!result?.ok) {
        toast.error(result?.error || "Could not save caption.")
        return
      }
      softHaptic()
      setEditingId(null)
      router.refresh()
    })
  }

  function showPrev() {
    setLightboxIndex((index) => (index == null ? index : Math.max(0, index - 1)))
  }
  function showNext() {
    setLightboxIndex((index) => (index == null ? index : Math.min(photos.length - 1, index + 1)))
  }

  return (
    <div className="space-y-4">
      {photos.length >= 2 ? <PhotoCompareSlider photos={photos} /> : null}

    <Card id="photos" className="scroll-mt-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="size-4 text-primary" />
          Add a photo
        </CardTitle>
        <CardDescription>
          Grouped by month, newest first. On your phone, Take photo opens the camera; Choose from library picks an
          existing shot. Any shot can also be used as the tank icon in the header switcher.
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
          <div className="space-y-6">
            {months.map((month) => (
              <div key={month.label} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{month.label}</h3>
                  <span className="text-xs text-muted-foreground">{month.items.length}</span>
                  <div className="h-px flex-1 bg-primary/10" />
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {month.items.map((photo) => {
                    const flatIndex = photos.indexOf(photo)
                    const isEditing = editingId === photo.id
                    return (
                      <figure
                        key={photo.id}
                        className="group relative overflow-hidden rounded-xl border border-primary/10 bg-background/40"
                      >
                        <button
                          type="button"
                          className="block w-full text-left"
                          onClick={() => setLightboxIndex(flatIndex)}
                          aria-label="View photo"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.public_url}
                            alt={photo.caption || "Tank photo"}
                            loading="lazy"
                            className="aspect-square w-full object-cover transition-transform group-hover:scale-[1.02]"
                          />
                        </button>
                        <figcaption className="space-y-1 px-2 py-1.5 text-xs">
                          <div className="font-medium text-muted-foreground">
                            {format(parseISO(photo.taken_at), "MMM d, yyyy")}
                          </div>
                          {isEditing ? (
                            <form
                              onSubmit={(event) => {
                                event.preventDefault()
                                saveCaption(photo.id)
                              }}
                              className="space-y-1.5"
                            >
                              <Input
                                autoFocus
                                value={editValue}
                                onChange={(event) => setEditValue(event.target.value)}
                                placeholder="Add a caption…"
                                className="h-8 text-xs"
                                disabled={pending}
                              />
                              <div className="flex gap-1">
                                <Button type="submit" size="sm" className="h-7 flex-1 text-[11px]" disabled={pending}>
                                  Save
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-[11px]"
                                  disabled={pending}
                                  onClick={() => setEditingId(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEditing(photo)}
                              className="flex w-full items-start gap-1 text-left transition-colors hover:text-foreground"
                            >
                              <span className={photo.caption ? "line-clamp-2" : "text-muted-foreground italic"}>
                                {photo.caption || "Add a caption"}
                              </span>
                              <Pencil className="mt-0.5 size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
                            </button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-7 w-full gap-1 px-2 text-[11px]"
                            disabled={pending || iconPending}
                            onClick={() => pickAsIcon(photo)}
                          >
                            <Sparkles className="size-3" />
                            {iconLoadingId === photo.id ? "Loading…" : "Use as icon"}
                          </Button>
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
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Focus-trapped lightbox with prev/next navigation. */}
      <Dialog open={activePhoto != null} onOpenChange={(open) => (open ? null : setLightboxIndex(null))}>
        <DialogContent className="max-w-4xl gap-2 border-primary/20 bg-background/95 p-3 sm:p-4">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {activePhoto ? format(parseISO(activePhoto.taken_at), "MMMM d, yyyy") : "Photo"}
            </DialogTitle>
            <DialogDescription className={activePhoto?.caption ? undefined : "sr-only"}>
              {activePhoto?.caption || "Tank photo"}
            </DialogDescription>
          </DialogHeader>
          {activePhoto ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activePhoto.public_url}
                alt={activePhoto.caption || "Tank photo"}
                className="max-h-[72vh] w-full rounded-lg object-contain"
              />
              {lightboxIndex != null && lightboxIndex > 0 ? (
                <button
                  type="button"
                  onClick={showPrev}
                  aria-label="Previous photo"
                  className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-background/85 p-2 shadow hover:bg-background"
                >
                  <ChevronLeft className="size-5" />
                </button>
              ) : null}
              {lightboxIndex != null && lightboxIndex < photos.length - 1 ? (
                <button
                  type="button"
                  onClick={showNext}
                  aria-label="Next photo"
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-background/85 p-2 shadow hover:bg-background"
                >
                  <ChevronRight className="size-5" />
                </button>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <TankIconCropDialog
        open={Boolean(cropSrc)}
        imageSrc={cropSrc}
        pending={iconPending}
        onOpenChange={(open) => {
          if (!open) clearCropSrc()
        }}
        onConfirm={uploadCroppedIcon}
      />
    </Card>
    </div>
  )
}
