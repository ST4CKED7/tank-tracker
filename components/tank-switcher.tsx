"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { setActiveTank } from "@/lib/actions"
import type { Tank } from "@/lib/bioload"
import { formatLastTestAge } from "@/lib/anomalies"
import { formatVolume } from "@/lib/units"
import { useUnits } from "@/components/units-provider"
import { TankIconBadge } from "@/components/tank-icon"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

export type SwitcherTank = Pick<Tank, "id" | "name" | "gallons" | "water_type"> & {
  icon?: string | null
  icon_color?: string | null
  icon_photo_url?: string | null
  lastTestAt?: string | null
}

export function TankSwitcher({
  tanks,
  activeTankId,
  className,
}: {
  tanks: SwitcherTank[]
  activeTankId: string | null
  className?: string
}) {
  const prefs = useUnits()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const rootRef = useRef<HTMLDivElement>(null)
  const active = tanks.find((tank) => tank.id === activeTankId) ?? tanks[0]

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    window.addEventListener("mousedown", onPointer)
    window.addEventListener("touchstart", onPointer)
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("mousedown", onPointer)
      window.removeEventListener("touchstart", onPointer)
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  if (tanks.length === 0 || !active) return null

  function selectTank(tankId: string) {
    if (tankId === activeTankId) {
      setOpen(false)
      return
    }
    const fd = new FormData()
    fd.set("tank_id", tankId)
    startTransition(async () => {
      await setActiveTank(fd)
      setOpen(false)
    })
  }

  return (
    <div ref={rootRef} className={cn("relative min-w-0", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={pending}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex h-10 w-full min-w-0 max-w-full items-center gap-2 rounded-2xl border border-primary/20 bg-background px-2 text-left shadow-sm transition active:scale-[0.99]",
          open && "ring-2 ring-primary/25",
          pending && "opacity-70",
        )}
      >
        <TankIconBadge
          icon={active.icon}
          color={active.icon_color}
          photoUrl={active.icon_photo_url}
          waterType={active.water_type}
          className="size-7 shrink-0 rounded-lg"
        />
        <span className="min-w-0 flex-1 overflow-hidden">
          <span className="block truncate text-sm font-medium leading-tight">{active.name}</span>
          <span className="block truncate text-[11px] leading-tight text-muted-foreground">
            {active.water_type === "freshwater" ? "FW" : "SW"} · {formatLastTestAge(active.lastTestAt)}
          </span>
        </span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-muted-foreground transition", open && "rotate-180")}
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          className="tt-fade-up absolute left-0 top-[calc(100%+0.4rem)] z-50 w-[min(18rem,calc(100vw-1.5rem))] max-h-[min(70vh,22rem)] overflow-auto rounded-2xl border border-primary/15 bg-popover/95 p-1.5 shadow-xl shadow-primary/10 backdrop-blur-xl"
        >
          {tanks.map((tank) => {
            const selected = tank.id === active.id
            return (
              <li key={tank.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => selectTank(tank.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition-colors",
                    selected ? "bg-primary/15" : "hover:bg-muted/70",
                  )}
                >
                  <TankIconBadge
                    icon={tank.icon}
                    color={tank.icon_color}
                    photoUrl={tank.icon_photo_url}
                    waterType={tank.water_type}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{tank.name}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {formatVolume(Number(tank.gallons), prefs)} ·{" "}
                      {tank.water_type === "freshwater" ? "FW" : "SW"} · {formatLastTestAge(tank.lastTestAt)}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
