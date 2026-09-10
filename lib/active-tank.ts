import { cookies } from "next/headers"
import type { Tank } from "@/lib/bioload"

export const ACTIVE_TANK_COOKIE = "tt_active_tank_id"

export async function readActiveTankIdCookie() {
  const store = await cookies()
  return store.get(ACTIVE_TANK_COOKIE)?.value ?? null
}

export async function writeActiveTankIdCookie(tankId: string) {
  const store = await cookies()
  store.set(ACTIVE_TANK_COOKIE, tankId, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  })
}

export async function clearActiveTankIdCookie() {
  const store = await cookies()
  store.delete(ACTIVE_TANK_COOKIE)
}

export function resolveActiveTank<T extends Pick<Tank, "id">>(tanks: T[], preferredId?: string | null) {
  if (tanks.length === 0) return null
  if (preferredId) {
    const match = tanks.find((tank) => tank.id === preferredId)
    if (match) return match
  }
  return tanks[0] ?? null
}
