"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

/**
 * Pull-to-refresh for installed PWA / touch devices.
 * Soft-navigates with router.refresh() when pulled past the threshold.
 */
export function PullToRefresh({ children, className }: { children: ReactNode; className?: string }) {
  const router = useRouter()
  const startY = useRef(0)
  const pulling = useRef(false)
  const offsetRef = useRef(0)
  const [offset, setOffset] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const setPullOffset = useCallback((value: number) => {
    offsetRef.current = value
    setOffset(value)
  }, [])

  const reset = useCallback(() => {
    pulling.current = false
    setPullOffset(0)
  }, [setPullOffset])

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
    const coarse = window.matchMedia("(pointer: coarse)").matches
    if (!standalone && !coarse) return

    const onStart = (event: TouchEvent) => {
      if (refreshing) return
      if (window.scrollY > 2) return
      startY.current = event.touches[0]?.clientY ?? 0
      pulling.current = true
    }
    const onMove = (event: TouchEvent) => {
      if (!pulling.current || refreshing) return
      const y = event.touches[0]?.clientY ?? 0
      const delta = Math.max(0, y - startY.current)
      if (delta > 8 && window.scrollY <= 0) {
        setPullOffset(Math.min(88, delta * 0.45))
      }
    }
    const onEnd = async () => {
      if (!pulling.current) return
      const shouldRefresh = offsetRef.current > 56
      pulling.current = false
      if (shouldRefresh) {
        setRefreshing(true)
        setPullOffset(52)
        try {
          router.refresh()
          await new Promise((resolve) => setTimeout(resolve, 450))
        } finally {
          setRefreshing(false)
          setPullOffset(0)
        }
      } else {
        reset()
      }
    }

    window.addEventListener("touchstart", onStart, { passive: true })
    window.addEventListener("touchmove", onMove, { passive: true })
    window.addEventListener("touchend", onEnd)
    return () => {
      window.removeEventListener("touchstart", onStart)
      window.removeEventListener("touchmove", onMove)
      window.removeEventListener("touchend", onEnd)
    }
  }, [refreshing, reset, router, setPullOffset])

  return (
    <div className={cn("relative", className)}>
      <div
        className="pointer-events-none flex items-center justify-center overflow-hidden text-muted-foreground transition-[height] duration-150"
        style={{ height: offset || (refreshing ? 52 : 0) }}
        aria-hidden
      >
        <Loader2 className={cn("size-5", (refreshing || offset > 40) && "animate-spin text-primary")} />
      </div>
      {children}
    </div>
  )
}
