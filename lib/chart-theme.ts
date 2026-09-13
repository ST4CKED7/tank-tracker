/**
 * Shared Recharts styling that follows the active theme tokens
 * (`--chart-*`, `--popover`, `--border`) so charts recolor with dark mode
 * and each tank color theme.
 */
export const chartTooltipStyle = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    color: "var(--popover-foreground)",
    fontSize: 12,
    boxShadow: "0 8px 24px rgb(0 0 0 / 0.12)",
  },
  labelStyle: { color: "var(--popover-foreground)", fontWeight: 600 },
  itemStyle: { color: "var(--popover-foreground)" },
} as const

/** Ordered palette for multi-series charts. */
export const CHART_SERIES_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const
