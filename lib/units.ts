export type VolumeUnit = "gal" | "L"
export type TempUnit = "F" | "C"
export type LengthUnit = "in" | "cm"

/** @deprecated Prefer UnitPrefs for hybrid volume/temp/length. */
export type UnitSystem = "imperial" | "metric"

export type UnitPrefs = {
  volume: VolumeUnit
  temp: TempUnit
  length: LengthUnit
}

export const DEFAULT_UNIT_PREFS: UnitPrefs = {
  volume: "gal",
  temp: "F",
  length: "in",
}

export function parseVolumeUnit(value: unknown): VolumeUnit {
  return value === "L" ? "L" : "gal"
}

export function parseTempUnit(value: unknown): TempUnit {
  return value === "C" ? "C" : "F"
}

export function parseLengthUnit(value: unknown): LengthUnit {
  return value === "cm" ? "cm" : "in"
}

export function unitPrefsFromTank(tank: {
  volume_unit?: string | null
  temp_unit?: string | null
  length_unit?: string | null
  unit_system?: string | null
} | null | undefined): UnitPrefs {
  if (!tank) return { ...DEFAULT_UNIT_PREFS }
  // Prefer explicit hybrid columns; fall back to legacy unit_system.
  if (tank.volume_unit || tank.temp_unit || tank.length_unit) {
    return {
      volume: parseVolumeUnit(tank.volume_unit),
      temp: parseTempUnit(tank.temp_unit),
      length: parseLengthUnit(tank.length_unit),
    }
  }
  if (tank.unit_system === "metric") {
    return { volume: "L", temp: "C", length: "cm" }
  }
  return { ...DEFAULT_UNIT_PREFS }
}

/** Legacy helper: true only when all three prefs are metric. */
export function isMetric(system: UnitSystem | UnitPrefs | string | null | undefined): boolean {
  if (system && typeof system === "object") {
    return system.volume === "L" && system.temp === "C" && system.length === "cm"
  }
  return system === "metric"
}

export function legacyUnitSystem(prefs: UnitPrefs): UnitSystem {
  return isMetric(prefs) ? "metric" : "imperial"
}

export function galToL(gallons: number) {
  return gallons * 3.785411784
}

export function lToGal(liters: number) {
  return liters / 3.785411784
}

export function fToC(f: number) {
  return ((f - 32) * 5) / 9
}

export function cToF(c: number) {
  return (c * 9) / 5 + 32
}

export function inToCm(inches: number) {
  return inches * 2.54
}

export function cmToIn(cm: number) {
  return cm / 2.54
}

export function round(value: number, digits = 1) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

export function volumeLabel(prefs: UnitPrefs | VolumeUnit | UnitSystem) {
  if (prefs === "metric") return "L"
  if (prefs === "imperial") return "gal"
  if (typeof prefs === "string") return prefs === "L" ? "L" : "gal"
  return prefs.volume === "L" ? "L" : "gal"
}

export function tempLabel(prefs: UnitPrefs | TempUnit | UnitSystem) {
  if (prefs === "metric") return "°C"
  if (prefs === "imperial") return "°F"
  if (typeof prefs === "string") return prefs === "C" ? "°C" : "°F"
  return prefs.temp === "C" ? "°C" : "°F"
}

export function lengthLabel(prefs: UnitPrefs | LengthUnit | UnitSystem) {
  if (prefs === "metric") return "cm"
  if (prefs === "imperial") return "in"
  if (typeof prefs === "string") return prefs === "cm" ? "cm" : "in"
  return prefs.length === "cm" ? "cm" : "in"
}

function volumeUnitOf(prefs: UnitPrefs | VolumeUnit | UnitSystem): VolumeUnit {
  if (prefs === "metric") return "L"
  if (prefs === "imperial") return "gal"
  if (typeof prefs === "string") return prefs === "L" ? "L" : "gal"
  return prefs.volume
}

function tempUnitOf(prefs: UnitPrefs | TempUnit | UnitSystem): TempUnit {
  if (prefs === "metric") return "C"
  if (prefs === "imperial") return "F"
  if (typeof prefs === "string") return prefs === "C" ? "C" : "F"
  return prefs.temp
}

function lengthUnitOf(prefs: UnitPrefs | LengthUnit | UnitSystem): LengthUnit {
  if (prefs === "metric") return "cm"
  if (prefs === "imperial") return "in"
  if (typeof prefs === "string") return prefs === "cm" ? "cm" : "in"
  return prefs.length
}

export function displayVolume(gallons: number, prefs: UnitPrefs | VolumeUnit | UnitSystem, digits = 1) {
  return round(volumeUnitOf(prefs) === "L" ? galToL(gallons) : gallons, digits)
}

export function displayTemp(fahrenheit: number, prefs: UnitPrefs | TempUnit | UnitSystem, digits = 1) {
  return round(tempUnitOf(prefs) === "C" ? fToC(fahrenheit) : fahrenheit, digits)
}

export function displayLength(inches: number, prefs: UnitPrefs | LengthUnit | UnitSystem, digits = 1) {
  return round(lengthUnitOf(prefs) === "cm" ? inToCm(inches) : inches, digits)
}

export function toStoredVolume(input: number, prefs: UnitPrefs | VolumeUnit | UnitSystem) {
  return volumeUnitOf(prefs) === "L" ? lToGal(input) : input
}

export function toStoredTemp(input: number, prefs: UnitPrefs | TempUnit | UnitSystem) {
  return tempUnitOf(prefs) === "C" ? cToF(input) : input
}

export function toStoredLength(input: number, prefs: UnitPrefs | LengthUnit | UnitSystem) {
  return lengthUnitOf(prefs) === "cm" ? cmToIn(input) : input
}

export function displayParam(parameter: string, value: number, prefs: UnitPrefs | TempUnit | UnitSystem) {
  if (parameter === "temperature") return displayTemp(value, prefs)
  return value
}

export function formatVolume(gallons: number, prefs: UnitPrefs | VolumeUnit | UnitSystem) {
  return `${displayVolume(gallons, prefs)} ${volumeLabel(prefs)}`
}

export function formatLength(inches: number, prefs: UnitPrefs | LengthUnit | UnitSystem) {
  return `${displayLength(inches, prefs)} ${lengthLabel(prefs)}`
}

export function formatTemp(fahrenheit: number, prefs: UnitPrefs | TempUnit | UnitSystem) {
  return `${displayTemp(fahrenheit, prefs)} ${tempLabel(prefs)}`
}

/** Species catalog stores °F; format a recommended range in the user's unit. */
export function formatTempRange(
  minF: number | null | undefined,
  maxF: number | null | undefined,
  prefs: UnitPrefs | TempUnit | UnitSystem,
) {
  if (minF == null && maxF == null) return null
  if (minF != null && maxF != null) {
    return `${displayTemp(Number(minF), prefs)}–${displayTemp(Number(maxF), prefs)} ${tempLabel(prefs)}`
  }
  if (minF != null) return `≥ ${formatTemp(Number(minF), prefs)}`
  return `≤ ${formatTemp(Number(maxF!), prefs)}`
}

export function unitPrefsSummary(prefs: UnitPrefs) {
  return `${volumeLabel(prefs)}, ${tempLabel(prefs)}, ${lengthLabel(prefs)}`
}
