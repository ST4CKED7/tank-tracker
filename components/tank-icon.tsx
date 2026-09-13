import type { LucideIcon } from "lucide-react"
import {
  Anchor,
  Anvil,
  Boxes,
  Bubbles,
  CloudRain,
  Droplet,
  Droplets,
  Egg,
  Fish,
  FishSymbol,
  FishingHook,
  FlaskConical,
  Flower2,
  Gem,
  Heart,
  Hexagon,
  Leaf,
  LifeBuoy,
  Mountain,
  Orbit,
  Sailboat,
  Shell,
  Ship,
  ShipWheel,
  Shrimp,
  Snail,
  Sparkles,
  Sun,
  Trees,
  Turtle,
  Waves,
  Wind,
  Worm,
  Zap,
} from "lucide-react"
import {
  parseTankIcon,
  parseTankIconColor,
  tankIconSwatch,
  type TankIconId,
  TANK_ICON_IDS,
  TANK_ICON_LABELS,
  TANK_ICON_PICKER_IDS,
  TANK_ICON_COLOR_IDS,
  TANK_ICON_COLORS,
} from "@/lib/tank-icons"
import { cn } from "@/lib/utils"

const ICONS: Record<TankIconId, LucideIcon> = {
  waves: Waves,
  fish: Fish,
  "fish-symbol": FishSymbol,
  "fishing-hook": FishingHook,
  shrimp: Shrimp,
  snail: Snail,
  turtle: Turtle,
  worm: Worm,
  shell: Shell,
  egg: Egg,
  droplets: Droplets,
  droplet: Droplet,
  bubbles: Bubbles,
  "cloud-rain": CloudRain,
  leaf: Leaf,
  flower: Flower2,
  sun: Sun,
  anchor: Anchor,
  sailboat: Sailboat,
  ship: Ship,
  "ship-wheel": ShipWheel,
  "life-buoy": LifeBuoy,
  flask: FlaskConical,
  sparkles: Sparkles,
  gem: Gem,
  mountain: Mountain,
  trees: Trees,
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
  color,
  photoUrl,
  waterType,
  className,
  iconClassName,
}: {
  icon?: string | null
  color?: string | null
  /** When set, shows a cropped photo instead of the Lucide glyph. */
  photoUrl?: string | null
  /** Used only when color is missing / invalid — emerald for FW, primary teal otherwise. */
  waterType?: string | null
  className?: string
  iconClassName?: string
}) {
  if (photoUrl) {
    return (
      <span
        className={cn(
          "relative flex size-8 shrink-0 overflow-hidden rounded-xl ring-1 ring-black/10",
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoUrl} alt="" className="size-full object-cover" />
      </span>
    )
  }

  const swatch =
    color != null && String(color) !== ""
      ? tankIconSwatch(color)
      : waterType === "freshwater"
        ? TANK_ICON_COLORS.emerald.swatch
        : TANK_ICON_COLORS.teal.swatch

  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-xl text-white",
        className,
      )}
      style={{ backgroundColor: swatch }}
    >
      <TankIconGlyph icon={icon} className={cn("size-3.5", iconClassName)} />
    </span>
  )
}

export {
  TANK_ICON_IDS,
  TANK_ICON_LABELS,
  TANK_ICON_PICKER_IDS,
  TANK_ICON_COLOR_IDS,
  TANK_ICON_COLORS,
  parseTankIcon,
  parseTankIconColor,
  tankIconSwatch,
  type TankIconId,
  ICONS as TANK_LUCIDE_ICONS,
}
