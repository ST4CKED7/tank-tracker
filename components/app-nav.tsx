"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { signOut } from "@/lib/actions"
import { SubmitButton } from "@/components/submit-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { TankSwitcher, type SwitcherTank } from "@/components/tank-switcher"
import { cn } from "@/lib/utils"
import {
  Beaker,
  Camera,
  ChartLine,
  Droplets,
  Fish,
  FlaskConical,
  Home,
  LayoutGrid,
  MoreHorizontal,
  Settings,
  Waves,
  Wrench,
} from "lucide-react"

const LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/tanks", label: "Tanks", icon: LayoutGrid },
  { href: "/tests", label: "Tests", icon: FlaskConical },
  { href: "/charts", label: "Charts", icon: ChartLine },
  { href: "/cycle", label: "Cycle", icon: Beaker },
  { href: "/livestock", label: "Livestock", icon: Fish },
  { href: "/photos", label: "Photos", icon: Camera },
  { href: "/dosing", label: "Dosing", icon: Droplets },
  { href: "/equipment", label: "Gear", icon: Wrench },
  { href: "/settings", label: "Settings", icon: Settings },
]

/** Desktop top-nav omits Home — the brand mark already goes there. */
const DESKTOP_LINKS = LINKS.filter((link) => link.href !== "/")

/** Four fixed tabs; everything else lives behind the mobile "More" sheet. */
const BOTTOM_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/tests", label: "Tests", icon: FlaskConical },
  { href: "/charts", label: "Charts", icon: ChartLine },
  { href: "/livestock", label: "Livestock", icon: Fish },
]

const BOTTOM_HREFS = new Set(BOTTOM_LINKS.map((link) => link.href))

function linkActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppNav({
  tanks,
  activeTankId,
  unitSummary,
}: {
  tanks: SwitcherTank[]
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

  // "More" tab is active when the current route isn't one of the four fixed tabs.
  const moreActive = !BOTTOM_HREFS.has(pathname) && !BOTTOM_LINKS.some((l) => linkActive(pathname, l.href))

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-primary/15 bg-background/95 shadow-sm shadow-primary/5 backdrop-blur-md md:bg-background/80 md:backdrop-blur-xl pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2.5 sm:px-4">
          <Link
            href="/"
            className="relative z-10 flex shrink-0 items-center gap-2 font-semibold tracking-tight"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/30 sm:size-8">
              <Waves className="size-4" />
            </span>
            <span className="hidden lg:inline">Tank Tracker</span>
          </Link>

          <TankSwitcher
            tanks={tanks}
            activeTankId={activeTankId}
            className="min-w-0 flex-1 sm:max-w-[13rem] lg:flex-none lg:w-[12.5rem]"
          />

          <nav className="ml-auto hidden min-w-0 items-center gap-1 text-sm lg:flex">
            {DESKTOP_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={linkActive(pathname, link.href) ? "page" : undefined}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-full px-2 py-1.5 transition-colors hover:bg-primary/10 hover:text-foreground",
                  linkActive(pathname, link.href) ? "bg-primary/10 text-foreground" : "text-muted-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
            {activeTankId ? (
              <Link
                href="/settings#units"
                className="ml-1 shrink-0 whitespace-nowrap rounded-full border border-primary/20 bg-background/60 px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                title="Change display units"
              >
                {unitSummary}
              </Link>
            ) : null}
            <ThemeToggle className="size-8 md:size-8" />
            <form action={signOut} className="shrink-0">
              <SubmitButton variant="ghost" size="sm" className="h-8 px-2.5" pendingLabel="…">
                Sign out
              </SubmitButton>
            </form>
          </nav>
        </div>
      </header>

      {/* Mobile "More" sheet — opened from the bottom More tab. */}
      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="More navigation">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm tt-fade-in"
            onClick={() => setMenuOpen(false)}
          />
          <div
            id="mobile-nav-menu"
            className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl border-t border-primary/15 bg-background px-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 shadow-2xl tt-slide-up"
          >
            <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-muted" aria-hidden />
            <div className="mx-auto grid max-w-6xl grid-cols-2 gap-1.5">
              {LINKS.map((link) => {
                const Icon = link.icon
                const active = linkActive(pathname, link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
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
            </div>
            <div className="mx-auto mt-3 flex max-w-6xl items-center justify-between gap-2 border-t border-primary/10 pt-3">
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

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/15 bg-background/95 backdrop-blur-md lg:hidden pb-[env(safe-area-inset-bottom)]"
        aria-label="Primary"
      >
        <div className="mx-auto grid max-w-6xl grid-cols-5">
          {BOTTOM_LINKS.map((link) => {
            const Icon = link.icon
            const active = linkActive(pathname, link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
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
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-menu"
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
              moreActive || menuOpen ? "text-primary" : "text-muted-foreground",
            )}
          >
            <MoreHorizontal className="size-5" />
            More
          </button>
        </div>
      </nav>
    </>
  )
}
