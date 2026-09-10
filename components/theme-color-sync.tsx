"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { parseTankTheme, tankThemeMeta } from "@/lib/tank-themes"

/** Keep browser chrome / installed PWA status bar in sync with light/dark + tank color theme. */
export function ThemeColorSync() {
  const { resolvedTheme } = useTheme()
  const [themeId, setThemeId] = useState("ocean")

  useEffect(() => {
    const read = () => setThemeId(parseTankTheme(document.documentElement.getAttribute("data-theme")))
    read()
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })
    return () => observer.disconnect()
  }, [])

  const meta = tankThemeMeta(themeId)

  useEffect(() => {
    const dark = resolvedTheme === "dark"
    const color = dark ? meta.chrome.dark : meta.chrome.light

    const metas = document.querySelectorAll('meta[name="theme-color"]')
    if (metas.length === 0) {
      const el = document.createElement("meta")
      el.name = "theme-color"
      el.content = color
      document.head.appendChild(el)
    } else {
      metas.forEach((el) => el.setAttribute("content", color))
    }

    let status = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
    if (!status) {
      status = document.createElement("meta")
      status.setAttribute("name", "apple-mobile-web-app-status-bar-style")
      document.head.appendChild(status)
    }
    status.setAttribute("content", dark ? "black-translucent" : "default")

    document.documentElement.style.colorScheme = dark ? "dark" : "light"
  }, [resolvedTheme, meta.chrome.dark, meta.chrome.light])

  return null
}
