import type { LucideIcon } from "lucide-react"
import {
  Anchor,
  Anvil,
  Boxes,
  Bubbles,
  Droplets,
  Fish,
  FlaskConical,
  Flower2,
  Gem,
  Heart,
  Hexagon,
  Leaf,
  Mountain,
  Orbit,
  Shell,
  Ship,
  Sparkles,
  Sun,
  Trees,
  Waves,
  Wind,
  Zap,
} from "lucide-react"
import { parseTankIcon, type TankIconId, TANK_ICON_IDS, TANK_ICON_LABELS } from "@/lib/tank-icons"
import { cn } from "@/lib/utils"

const ICONS: Record<TankIconId, LucideIcon> = {
  waves: Waves,
  fish: Fish,
  droplets: Droplets,
  leaf: Leaf,
  gem: Gem,
  shell: Shell,
  anchor: Anchor,
  ship: Ship,
  flask: FlaskConical,
  sparkles: Sparkles,
  sun: Sun,
  mountain: Mountain,
  trees: Trees,
  flower: Flower2,
  bubbles: Bubbles,
  orbit: Orbit,
  hexagon: Hexagon,
  boxes: Boxes,
  wind: Wind,
  zap: Zap,
  heart: Heart,
  anvil: Anvil,
}

export function TankIconGlyph({
  icon,
  className,
}: {
  icon?: string | null
  className?: string
}) {
  const id = parseTankIcon(icon)
  const Icon = ICONS[id]
  return <Icon className={className} aria-hidden />
}

export function TankIconBadge({
  icon,
  waterType,
  className,
  iconClassName,
}: {
  icon?: string | null
  waterType?: string | null
  className?: string
  iconClassName?: string
}) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-xl text-primary-foreground",
        waterType === "freshwater" ? "bg-emerald-600" : "bg-primary",
        className,
      )}
    >
      <TankIconGlyph icon={icon} className={cn("size-3.5", iconClassName)} />
    </span>
  )
}

export { TANK_ICON_IDS, TANK_ICON_LABELS, parseTankIcon, type TankIconId, ICONS as TANK_LUCIDE_ICONS }
