"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"

const LIGHT = "#f4f7f8"
const DARK = "#0b1214"
const BRAND = "#0f766e"

/** Keep browser chrome / installed PWA status bar in sync with next-themes. */
export function ThemeColorSync() {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const dark = resolvedTheme === "dark"
    const color = dark ? DARK : LIGHT

    const metas = document.querySelectorAll('meta[name="theme-color"]')
    if (metas.length === 0) {
      const meta = document.createElement("meta")
      meta.name = "theme-color"
      meta.content = color
      document.head.appendChild(meta)
    } else {
      metas.forEach((meta) => meta.setAttribute("content", color))
    }

    let status = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
    if (!status) {
      status = document.createElement("meta")
      status.setAttribute("name", "apple-mobile-web-app-status-bar-style")
      document.head.appendChild(status)
    }
    status.setAttribute("content", dark ? "black-translucent" : "default")

    document.documentElement.style.colorScheme = dark ? "dark" : "light"
  }, [resolvedTheme])

  useEffect(() => {
    // Brand tint while bootstrapping before theme resolves.
    if (!document.querySelector('meta[name="theme-color"]')) {
      const meta = document.createElement("meta")
      meta.name = "theme-color"
      meta.content = BRAND
      document.head.appendChild(meta)
    }
  }, [])

  return null
}
