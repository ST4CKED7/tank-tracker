"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Copy, Link2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { disableTankShare, enableTankShare } from "@/lib/actions"
import { softHaptic } from "@/components/form-success-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export function TankSharePanel({
  tankId,
  token: initialToken,
}: {
  tankId: string
  /** Existing share token, or null when sharing is off. */
  token: string | null
}) {
  const router = useRouter()
  const [token, setToken] = useState(initialToken)
  const [shareUrl, setShareUrl] = useState("")
  const [copied, setCopied] = useState(false)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setToken(initialToken)
  }, [initialToken])

  useEffect(() => {
    if (token) setShareUrl(`${window.location.origin}/share/${token}`)
    else setShareUrl("")
  }, [token])

  async function copy() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      softHaptic()
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard blocked — select the field so the user can copy manually.
      toast.message("Select the link and copy it manually.")
    }
  }

  function createOrRotate() {
    const formData = new FormData()
    formData.set("tank_id", tankId)
    startTransition(async () => {
      const result = await enableTankShare(formData)
      if (!result?.ok) {
        toast.error(result?.error || "Could not create share link.")
        return
      }
      setToken(result.token)
      softHaptic()
      toast.success(token ? "New share link ready" : "Share link created", {
        duration: 2200,
        className: "tt-toast-success",
      })
      router.refresh()
    })
  }

  function turnOff() {
    const formData = new FormData()
    formData.set("tank_id", tankId)
    startTransition(async () => {
      const result = await disableTankShare(formData)
      if (!result?.ok) {
        toast.error(result?.error || "Could not turn off sharing.")
        return
      }
      setToken(null)
      softHaptic()
      toast.success("Sharing turned off", { duration: 2000, className: "tt-toast-success" })
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="size-4 text-primary" />
          Share link
        </CardTitle>
        <CardDescription>
          Create a read-only link to show this tank&apos;s parameters, livestock, and photos. Anyone
          with the link can view — no account needed. Turn it off anytime.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {token ? (
          <>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                readOnly
                value={shareUrl}
                onFocus={(event) => event.currentTarget.select()}
                className="font-mono text-xs"
                aria-label="Share link"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={copy}
                className="min-h-11 shrink-0 sm:min-h-9"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="min-h-11 sm:min-h-8"
                disabled={pending}
                onClick={createOrRotate}
              >
                <RefreshCw className="size-4" />
                {pending ? "Generating…" : "New link"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="min-h-11 sm:min-h-8"
                disabled={pending}
                onClick={turnOff}
              >
                {pending ? "Turning off…" : "Turn off sharing"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Generating a new link disables the old one.
            </p>
          </>
        ) : (
          <Button
            type="button"
            size="sm"
            className="min-h-11 w-full sm:min-h-8 sm:w-auto"
            disabled={pending}
            onClick={createOrRotate}
          >
            <Link2 className="size-4" />
            {pending ? "Creating…" : "Create share link"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
