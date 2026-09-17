"use client"

import { useState } from "react"
import { upsertTank } from "@/lib/actions"
import { TankForm } from "@/components/tank-form"
import { withActionToast } from "@/components/form-success-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"

export function CreateTankSheet() {
  const [open, setOpen] = useState(false)

  const createTank = withActionToast(upsertTank, "Tank created", { onSuccess: () => setOpen(false) })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" className="min-h-11 w-full sm:w-auto">
          <Plus className="size-4" />
          Add another tank
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(92vh,40rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a tank</DialogTitle>
          <DialogDescription>
            Each tank keeps its own livestock, tests, dosing, and gear. Switch from the header after creating.
          </DialogDescription>
        </DialogHeader>
        <TankForm key={String(open)} tank={null} mode="create" bare formAction={createTank} />
      </DialogContent>
    </Dialog>
  )
}
