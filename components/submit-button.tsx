"use client"

import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import type { ComponentProps } from "react"

type Props = ComponentProps<typeof Button> & {
  pendingLabel?: string
}

/**
 * Instant feedback for server-action forms — disables + shows pending label.
 * Success/failure toasts belong on the form's action via `withActionToast`,
 * which knows the outcome; the button only knows that a submit happened.
 */
export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  disabled,
  className,
  ...props
}: Props) {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
      className={className}
      {...props}
    >
      {pending ? pendingLabel : children}
    </Button>
  )
}
