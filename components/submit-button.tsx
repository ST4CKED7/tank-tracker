"use client"

import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { FormSuccessToast } from "@/components/form-success-toast"
import type { ComponentProps } from "react"

type Props = ComponentProps<typeof Button> & {
  pendingLabel?: string
  successMessage?: string
}

/** Instant feedback for server-action forms — disables + shows pending label. */
export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  successMessage,
  disabled,
  className,
  ...props
}: Props) {
  const { pending } = useFormStatus()
  return (
    <>
      {successMessage ? <FormSuccessToast message={successMessage} /> : null}
      <Button
        type="submit"
        disabled={disabled || pending}
        aria-busy={pending}
        className={className}
        {...props}
      >
        {pending ? pendingLabel : children}
      </Button>
    </>
  )
}
