"use client"

import { useEffect, useState } from "react"
import { Download, Share } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

function isStandalone() {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  )
}

function isIos() {
  if (typeof navigator === "undefined") return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function InstallAppCard() {
  const [installed, setInstalled] = useState(false)
  const [ios, setIos] = useState(false)
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    setInstalled(isStandalone())
    setIos(isIos())

    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      setDeferred(event as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  if (installed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Installed as an app</CardTitle>
          <CardDescription>Tank Tracker is running in standalone mode on this device.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Install Tank Tracker</CardTitle>
        <CardDescription>
          Add it to your home screen for a full-screen app experience — no App Store needed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {deferred ? (
          <Button type="button" className="min-h-11 w-full sm:w-auto" onClick={() => void install()}>
            <Download className="size-4" />
            Install app
          </Button>
        ) : ios ? (
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              Tap the <Share className="mx-0.5 inline size-3.5 align-text-bottom" /> Share button in Safari
            </li>
            <li>Choose <span className="font-medium text-foreground">Add to Home Screen</span></li>
            <li>Confirm with <span className="font-medium text-foreground">Add</span></li>
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">
            On Chrome or Edge, open the browser menu and choose <span className="font-medium text-foreground">Install app</span>{" "}
            (or Add to Home screen). The install button appears here once your browser is ready.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
