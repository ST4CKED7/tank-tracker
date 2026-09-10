/** Rough mix guide for common reef salt at ~35 ppt / 1.026 SG.
 *  Brands differ — always check the bag and verify with a refractometer.
 */
export function saltMixForGallons(gallons: number) {
  const safe = Math.max(0, Number(gallons) || 0)
  const cups = Number((safe * 0.5).toFixed(2)) // ~1/2 cup per US gallon (Instant Ocean-style)
  const grams = Number((safe * 3.785411784 * 35).toFixed(0)) // ~35 g per liter of water
  const ounces = Number((grams / 28.3495).toFixed(1))
  return { gallons: Number(safe.toFixed(2)), cups, grams, ounces }
}

export function waterChangeVolumeGallons(tankGallons: number, percent: number) {
  return Number(((Number(tankGallons) * Number(percent)) / 100).toFixed(2))
}
