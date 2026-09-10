/** Soft motion helpers — CSS-first for snappy mobile feel. */

export function staggerStyle(index: number, stepMs = 45) {
  return { animationDelay: `${Math.min(index, 12) * stepMs}ms` } as const
}
