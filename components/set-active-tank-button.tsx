"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { setActiveTank } from "@/lib/actions"
import { softHaptic } from "@/components/form-success-toast"
import { Button } from "@/components/ui/button"

export function SetActiveTankButton({ tankId, isActive }: { tankId: string; isActive: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function open() {
    softHaptic()
    startTransition(async () => {
      if (!isActive) {
        const fd = new FormData()
        fd.set("tank_id", tankId)
        await setActiveTank(fd)
      }
      router.push("/")
    })
  }

  return (
    <Button type="button" size="sm" variant={isActive ? "default" : "outline"} disabled={pending} onClick={open}>
      {isActive ? "Open" : "Switch & open"}
      <ArrowRight className="size-4" />
    </Button>
  )
}
