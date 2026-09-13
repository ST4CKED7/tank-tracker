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
