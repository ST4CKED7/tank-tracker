"use client"

import { toast } from "sonner"
import type { ActionResult } from "@/lib/action-result"

function softHaptic() {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(12)
    }
  } catch {
    // ignore
  }
}

/** redirect() / notFound() travel as thrown errors — never swallow them. */
function isFrameworkSignal(error: unknown) {
  const digest = (error as { digest?: unknown } | null)?.digest
  return typeof digest === "string" && digest.startsWith("NEXT_")
}

const GENERIC_ERROR = "Could not save. Check your connection and try again."

/**
 * Wrap a server action for use as a <form action>. The success toast fires only
 * after the server confirms the write; a returned or thrown failure toasts the
 * reason instead, and `onSuccess` (e.g. closing a dialog) is skipped.
 */
export function withActionToast(
  action: (formData: FormData) => Promise<ActionResult>,
  successMessage: string,
  options?: { onSuccess?: () => void; errorMessage?: string },
) {
  return async (formData: FormData) => {
    let result: ActionResult
    try {
      result = await action(formData)
    } catch (error) {
      if (isFrameworkSignal(error)) throw error
      toast.error(options?.errorMessage ?? GENERIC_ERROR)
      return
    }

    if (!result?.ok) {
      toast.error(result?.error || options?.errorMessage || GENERIC_ERROR)
      return
    }

    softHaptic()
    toast.success(successMessage, { duration: 2400, className: "tt-toast-success" })
    options?.onSuccess?.()
  }
}

export { softHaptic }
