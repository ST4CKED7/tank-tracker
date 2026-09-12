"use client"

import { X, Timer, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  formatTimerClock,
  remainingSeconds,
  useTestTimers,
} from "@/components/test-timer-provider"
import { cn } from "@/lib/utils"

export function TestTimerBubbles() {
  const { timers, now, dismissTimer } = useTestTimers()
  if (timers.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-end gap-2 px-3 md:bottom-6 md:right-6 md:left-auto md:px-0"
      aria-live="polite"
    >
      {timers.map((timer) => {
        const left = remainingSeconds(timer, now)
        const done = left <= 0
        const kindLabel = timer.kind === "shake" ? "Shake" : "Wait"
        return (
          <div
            key={timer.id}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-stretch overflow-hidden rounded-2xl border shadow-lg backdrop-blur-md sm:w-80",
              done
                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-950 dark:text-emerald-50"
                : "border-primary/25 bg-background/95 text-foreground",
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3">
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  done ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-200" : "bg-primary/15 text-primary",
                )}
              >
                {done ? <CheckCircle2 className="size-5" /> : <Timer className="size-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{timer.label}</div>
                <div className="text-xs text-muted-foreground">
                  {kindLabel}
                  {done ? " · finished" : ` · ${timer.durationSeconds}s total`}
                </div>
              </div>
              <div
                className={cn(
                  "shrink-0 font-mono text-lg font-semibold tabular-nums",
                  done && "text-emerald-700 dark:text-emerald-200",
                )}
              >
                {done ? "Done" : formatTimerClock(left)}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-auto w-11 shrink-0 rounded-none border-l border-inherit"
              aria-label={`Close ${timer.label} timer`}
              onClick={() => dismissTimer(timer.id)}
            >
              <X className="size-4" />
            </Button>
          </div>
        )
      })}
    </div>
  )
}
