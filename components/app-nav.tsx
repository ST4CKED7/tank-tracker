"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { signOut } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { SubmitButton } from "@/components/submit-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { TankSwitcher } from "@/components/tank-switcher"
import type { Tank } from "@/lib/bioload"
import { cn } from "@/lib/utils"
import {
  Beaker,
  ChartLine,
  Droplets,
  Fish,
  FlaskConical,
  Home,
  Menu,
  Settings,
  Waves,
  Wrench,
  X,
} from "lucide-react"

const LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/tests", label: "Log tests", icon: FlaskConical },
  { href: "/charts", label: "Charts", icon: ChartLine },
  { href: "/cycle", label: "Cycle", icon: Beaker },
  { href: "/livestock", label: "Livestock", icon: Fish },
  { href: "/dosing", label: "Dosing", icon: Droplets },
  { href: "/equipment", label: "Gear", icon: Wrench },
  { href: "/settings", label: "Settings", icon: Settings },
]

const BOTTOM_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/tests", label: "Tests", icon: FlaskConical },
  { href: "/livestock", label: "Stock", icon: Fish },
  { href: "/settings", label: "Settings", icon: Settings },
]

function linkActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppNav({
  tanks,
  activeTankId,
  unitSummary,
}: {
  tanks: Pick<Tank, "id" | "name" | "gallons" | "water_type">[]
  activeTankId: string | null
  unitSummary: string
}) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [menuOpen])

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-primary/15 bg-background/95 shadow-sm shadow-primary/5 backdrop-blur-md md:bg-background/80 md:backdrop-blur-xl pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
          <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/30 sm:size-8">
              <Waves className="size-4" />
            </span>
            <span className="hidden sm:inline">Tank Tracker</span>
          </Link>

          <div className="min-w-0 flex-1">
            <TankSwitcher tanks={tanks} activeTankId={activeTankId} />
          </div>

          <nav className="hidden items-center gap-1 text-sm md:flex">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-2.5 py-1.5 transition-colors hover:bg-primary/10 hover:text-foreground",
                  linkActive(pathname, link.href) ? "bg-primary/10 text-foreground" : "text-muted-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
            {activeTankId ? (
              <Link
                href="/settings#units"
                className="rounded-full border border-primary/20 bg-background/60 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                title="Change display units"
              >
                {unitSummary}
              </Link>
            ) : null}
            <ThemeToggle />
            <form action={signOut}>
              <SubmitButton variant="ghost" size="sm" pendingLabel="…">
                Sign out
              </SubmitButton>
            </form>
          </nav>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 shrink-0 md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>

        {menuOpen ? (
          <div
            id="mobile-nav-menu"
            className="border-t border-primary/10 bg-background/95 px-3 py-3 md:hidden"
          >
            <div className="mx-auto grid max-w-6xl gap-1">
              {LINKS.map((link) => {
                const Icon = link.icon
                const active = linkActive(pathname, link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/15 text-foreground"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {link.label}
                  </Link>
                )
              })}
              <div className="mt-2 flex items-center justify-between gap-2 border-t border-primary/10 pt-3">
                {activeTankId ? (
                  <Link
                    href="/settings#units"
                    className="rounded-full border border-primary/20 px-3 py-2 text-xs text-muted-foreground"
                  >
                    Units · {unitSummary}
                  </Link>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-1">
                  <ThemeToggle />
                  <form action={signOut}>
                    <SubmitButton variant="ghost" className="min-h-11" pendingLabel="…">
                      Sign out
                    </SubmitButton>
                  </form>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/15 bg-background/95 backdrop-blur-md md:hidden pb-[env(safe-area-inset-bottom)]"
        aria-label="Primary"
      >
        <div className="mx-auto grid max-w-6xl grid-cols-4">
          {BOTTOM_LINKS.map((link) => {
            const Icon = link.icon
            const active = linkActive(pathname, link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
                {link.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
