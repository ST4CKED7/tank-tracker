"use client"

import { useEffect } from "react"
import { parseTankTheme } from "@/lib/tank-themes"

/** Applies the active tank's color theme to <html data-theme="…">. Light/dark stays on next-themes. */
export function TankThemeSync({ theme }: { theme?: string | null }) {
  const id = parseTankTheme(theme)

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", id)
  }, [id])

  return null
}

/** Inline boot script for server layouts — avoids a flash of the wrong theme. */
export function tankThemeBootScript(theme?: string | null) {
  const id = parseTankTheme(theme)
  return `document.documentElement.setAttribute("data-theme",${JSON.stringify(id)});`
}
