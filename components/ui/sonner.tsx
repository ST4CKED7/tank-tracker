"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

export function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme()
  return (
    <Sonner
      theme={(resolvedTheme as ToasterProps["theme"]) ?? "system"}
      className="toaster group"
      position="top-center"
      gap={10}
      icons={{
        success: <CircleCheckIcon className="size-4 text-teal-700 dark:text-teal-300" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "cn-toast group toast border-primary/15 bg-card/95 text-foreground shadow-lg shadow-primary/10 backdrop-blur-md",
          success: "tt-toast-success border-teal-600/20",
          title: "text-sm font-medium",
          description: "text-xs text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}
