"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

export type TestTimerKind = "shake" | "wait"

export type TestTimer = {
  id: string
  label: string
  kind: TestTimerKind
  durationSeconds: number
  /** Epoch ms when the countdown reaches zero. */
  endsAt: number
}

type StartTimerInput = {
  label: string
  kind: TestTimerKind
  durationSeconds: number
}

type TestTimerContextValue = {
  timers: TestTimer[]
  now: number
  startTimer: (input: StartTimerInput) => void
  dismissTimer: (id: string) => void
}

const STORAGE_KEY = "tt-active-timers"
const TestTimerContext = createContext<TestTimerContextValue | null>(null)

function readStoredTimers(): TestTimer[] {
  if (typeof window === "undefined") return []
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as TestTimer[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.label === "string" &&
        (item.kind === "shake" || item.kind === "wait") &&
        typeof item.durationSeconds === "number" &&
        typeof item.endsAt === "number",
    )
  } catch {
    return []
  }
}

function writeStoredTimers(timers: TestTimer[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(timers))
  } catch {
    /* ignore quota / private mode */
  }
}

export function remainingSeconds(timer: TestTimer, now: number) {
  return Math.max(0, Math.ceil((timer.endsAt - now) / 1000))
}

export function formatTimerClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export function TestTimerProvider({ children }: { children: ReactNode }) {
  const [timers, setTimers] = useState<TestTimer[]>([])
  const [now, setNow] = useState(() => Date.now())
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setTimers(readStoredTimers())
    setNow(Date.now())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    writeStoredTimers(timers)
  }, [timers, hydrated])

  useEffect(() => {
    if (!hydrated || timers.length === 0) return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [hydrated, timers.length])

  const startTimer = useCallback((input: StartTimerInput) => {
    const duration = Math.max(1, Math.round(input.durationSeconds))
    const timer: TestTimer = {
      id: `${input.kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label: input.label,
      kind: input.kind,
      durationSeconds: duration,
      endsAt: Date.now() + duration * 1000,
    }
    setTimers((current) => [...current, timer])
    setNow(Date.now())
  }, [])

  const dismissTimer = useCallback((id: string) => {
    setTimers((current) => current.filter((timer) => timer.id !== id))
  }, [])

  const value = useMemo(
    () => ({ timers, now, startTimer, dismissTimer }),
    [timers, now, startTimer, dismissTimer],
  )

  return <TestTimerContext.Provider value={value}>{children}</TestTimerContext.Provider>
}

export function useTestTimers() {
  const ctx = useContext(TestTimerContext)
  if (!ctx) throw new Error("useTestTimers must be used within TestTimerProvider")
  return ctx
}
