/** Resize/compress an image for upload. Falls back to the original if decode fails (e.g. HEIC). */
export async function prepareTankPhoto(file: File, maxEdge = 1600, quality = 0.82): Promise<File> {
  if (!file.type.startsWith("image/") && file.type !== "") {
    return file
  }

  // Already small enough — keep as-is.
  if (file.size <= 900_000 && file.type === "image/jpeg") {
    return file
  }

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      bitmap.close()
      return file
    }
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), "image/jpeg", quality)
    })
    if (!blob) return file

    const base = file.name.replace(/\.[^.]+$/, "") || "tank-photo"
    return new File([blob], `${base}.jpg`, { type: "image/jpeg", lastModified: Date.now() })
  } catch {
    return file
  }
}

export type PixelCrop = { x: number; y: number; width: number; height: number }

/** Crop a displayed image to a square JPEG sized for the tank icon badge. */
export async function cropImageToIconFile(
  imageSrc: string,
  pixelCrop: PixelCrop,
  outputSize = 512,
  fileName = "tank-icon.jpg",
): Promise<File> {
  const image = await loadImage(imageSrc)
  const canvas = document.createElement("canvas")
  canvas.width = outputSize
  canvas.height = outputSize
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Could not crop photo.")

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize,
  )

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), "image/jpeg", 0.9)
  })
  if (!blob) throw new Error("Could not crop photo.")
  return new File([blob], fileName, { type: "image/jpeg", lastModified: Date.now() })
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", () => reject(new Error("Could not load photo for cropping.")))
    image.src = src
  })
}

/** Fetch a remote photo into a local object URL so canvas cropping is not CORS-tainted. */
export async function objectUrlFromImageUrl(url: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error("Could not load photo.")
  const blob = await response.blob()
  return URL.createObjectURL(blob)
}

