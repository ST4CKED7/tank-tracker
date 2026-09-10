"use client"

import { useEffect, useRef } from "react"
import { useFormStatus } from "react-dom"
import { toast } from "sonner"

function softHaptic() {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(12)
    }
  } catch {
    // ignore
  }
}

/** Place inside a server-action <form> to toast + haptic when the submit finishes. */
export function FormSuccessToast({ message }: { message: string }) {
  const { pending } = useFormStatus()
  const wasPending = useRef(false)

  useEffect(() => {
    if (wasPending.current && !pending) {
      softHaptic()
      toast.success(message, {
        duration: 2400,
        className: "tt-toast-success",
      })
    }
    wasPending.current = pending
  }, [pending, message])

  return null
}

export { softHaptic }
