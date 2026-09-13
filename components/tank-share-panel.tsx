"use client"

import { useEffect, useState } from "react"
import { Check, Copy, Link2, RefreshCw } from "lucide-react"
import { disableTankShare, enableTankShare } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SubmitButton } from "@/components/submit-button"

export function TankSharePanel({
  tankId,
  token,
}: {
  tankId: string
  /** Existing share token, or null when sharing is off. */
  token: string | null
}) {
  const [shareUrl, setShareUrl] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (token) setShareUrl(`${window.location.origin}/share/${token}`)
    else setShareUrl("")
  }, [token])

  async function copy() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard blocked — user can still select the text manually.
    }
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
                className="shrink-0"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={enableTankShare}>
                <input type="hidden" name="tank_id" value={tankId} />
                <SubmitButton size="sm" variant="outline" pendingLabel="Generating…">
                  <RefreshCw className="size-4" />
                  New link
                </SubmitButton>
              </form>
              <form action={disableTankShare}>
                <input type="hidden" name="tank_id" value={tankId} />
                <SubmitButton size="sm" variant="ghost" pendingLabel="Turning off…">
                  Turn off sharing
                </SubmitButton>
              </form>
            </div>
            <p className="text-xs text-muted-foreground">
              Generating a new link disables the old one.
            </p>
          </>
        ) : (
          <form action={enableTankShare}>
            <input type="hidden" name="tank_id" value={tankId} />
            <SubmitButton size="sm" pendingLabel="Creating…">
              <Link2 className="size-4" />
              Create share link
            </SubmitButton>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
