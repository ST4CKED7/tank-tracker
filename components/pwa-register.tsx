"use client"

import { useEffect } from "react"

export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return
    if (!("serviceWorker" in navigator)) return

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        })
      } catch {
        // Install still works via manifest on many browsers; SW is best-effort.
      }
    }

    void register()
  }, [])

  return null
}
