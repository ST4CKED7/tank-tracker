"use client"

import { deleteTank } from "@/lib/actions"
import { Button } from "@/components/ui/button"

export function DeleteTankButton({ tankId, tankName }: { tankId: string; tankName: string }) {
  return (
    <form
      action={deleteTank}
      onSubmit={(event) => {
        if (!window.confirm(`Delete “${tankName}” and all of its logs, livestock, and gear? This cannot be undone.`)) {
          event.preventDefault()
        }
      }}
    >
      <input type="hidden" name="tank_id" value={tankId} />
      <Button type="submit" size="sm" variant="ghost" className="text-destructive hover:text-destructive">
        Delete
      </Button>
    </form>
  )
}
