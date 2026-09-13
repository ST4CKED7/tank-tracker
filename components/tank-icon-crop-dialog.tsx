"use client"

import { useCallback, useState } from "react"
import Cropper, { type Area } from "react-easy-crop"
import "react-easy-crop/react-easy-crop.css"
import { cropImageToIconFile } from "@/lib/tank-photo"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export function TankIconCropDialog({
  open,
  imageSrc,
  pending = false,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  imageSrc: string | null
  pending?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (file: File) => void | Promise<void>
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [saving, setSaving] = useState(false)

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  function handleOpenChange(next: boolean) {
    if (saving || pending) return
    if (!next) {
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedAreaPixels(null)
    }
    onOpenChange(next)
  }

  async function handleConfirm() {
    if (!imageSrc || !croppedAreaPixels) return
    setSaving(true)
    try {
      const file = await cropImageToIconFile(imageSrc, croppedAreaPixels)
      await onConfirm(file)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedAreaPixels(null)
    } finally {
      setSaving(false)
    }
  }

  const busy = saving || pending

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md gap-3 sm:max-w-lg" showCloseButton={!busy}>
        <DialogHeader>
          <DialogTitle>Crop tank icon</DialogTitle>
          <DialogDescription>
            Drag to reposition and pinch or use the slider to zoom. The square matches the header icon.
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
          {imageSrc ? (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="rect"
              showGrid
              classes={{
                containerClassName: "rounded-xl",
                cropAreaClassName: "!rounded-2xl border-2 border-white/90",
              }}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="icon-crop-zoom">Zoom</Label>
          <input
            id="icon-crop-zoom"
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            disabled={busy}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="w-full accent-primary"
          />
        </div>

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" disabled={busy} onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={busy || !croppedAreaPixels} onClick={() => void handleConfirm()}>
            {busy ? "Saving…" : "Use crop"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
