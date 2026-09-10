"use client"

import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import type { ComponentProps } from "react"

type Props = ComponentProps<typeof Button> & {
  pendingLabel?: string
}

/** Instant feedback for server-action forms — disables + shows pending label. */
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
