import type { LivestockRow, Tank } from "@/lib/bioload"
import { nitrateRisingDespiteChanges } from "@/lib/bioload"
import {
  displayRange,
  isFreshwater,
  parameterMeta,
  type ParameterKey,
  type WaterType,
} from "@/lib/parameters"
import { waterChangeGallons } from "@/lib/reminders"
import { displayParam, formatVolume, type UnitPrefs } from "@/lib/units"
import { suggestDoses, type DoseSuggestion } from "@/lib/dose-suggest"
import { resolveParameterTarget } from "@/lib/parameter-targets"
import { suggestWaterChange, type WaterChangeSuggestion } from "@/lib/water-change-suggest"

export type AdviceSeverity = "ok" | "info" | "watch" | "action" | "urgent"

export type TestAdviceAction = {
  label: string
  href: string
}

export type TestAdvice = {
  id: string
  parameter: ParameterKey
  severity: AdviceSeverity
  title: string
  detail: string
  actions: TestAdviceAction[]
  /** Where the target came from when relevant. */
  source?: "livestock" | "typical" | "trend" | "custom"
  /** When set, Home can prefill the water-change calculator. */
  suggestedChangePercent?: number
}

export type { WaterChangeSuggestion, DoseSuggestion }

type TestPoint = { parameter: string; tested_at: string; value: number }
type WaterChangePoint = { changed_at: string }

function severityRank(severity: AdviceSeverity) {
  switch (severity) {
    case "urgent":
      return 0
    case "action":
      return 1
    case "watch":
      return 2
    case "info":
      return 3
    default:
      return 4
  }
}

function resolveTarget(
  key: ParameterKey,
  tank: Tank,
  livestock: LivestockRow[],
  prefs: UnitPrefs,
): { min: number; max: number; source: "livestock" | "typical" | "custom" } | null {
  const resolved = resolveParameterTarget({ key, tank, livestock, prefs })
  if (!resolved) return null
  return { min: resolved.min, max: resolved.max, source: resolved.source }
}

function distanceOutside(value: number, min: number, max: number) {
  if (value < min) return min - value
  if (value > max) return value - max
  return 0
}

function bandWidth(min: number, max: number) {
  const width = max - min
  return width <= 0 ? 1 : width
}

function formatReading(key: ParameterKey, value: number, prefs: UnitPrefs, waterType: WaterType) {
  const meta = parameterMeta(prefs, waterType)[key]
  const shown = displayParam(key, value, prefs)
  return meta.unit ? `${shown} ${meta.unit}` : String(shown)
}

function formatTarget(
  key: ParameterKey,
  target: { min: number; max: number },
  prefs: UnitPrefs,
  waterType: WaterType,
) {
  const meta = parameterMeta(prefs, waterType)[key]
  const shown = displayRange(key, target, prefs)
  const unit = meta.unit ? ` ${meta.unit}` : ""
  return `${shown.min}–${shown.max}${unit}`
}

function waterChangeAction(
  tank: Tank,
  prefs: UnitPrefs,
  suggestion?: WaterChangeSuggestion | null,
): TestAdviceAction {
  const percent = suggestion?.percent ?? (Number(tank.water_change_percent) || 20)
  const gallons = suggestion?.gallons ?? waterChangeGallons(tank, percent)
  return {
    label: `Do ~${percent}% · ${formatVolume(gallons, prefs)}`,
    href: "/#reminders",
  }
}

function doseAction(label = "Log a dose"): TestAdviceAction {
  return { label, href: "/dosing" }
}

/**
 * Suggest next steps from latest readings vs livestock / typical targets.
 * Values are expected in storage units (°F, ppt, dKH, ppm).
 */
export function buildTestAdvice(input: {
  tank: Tank
  latest: Partial<Record<ParameterKey, number>>
  livestock: LivestockRow[]
  tests: TestPoint[]
  waterChanges: WaterChangePoint[]
  prefs: UnitPrefs
}): TestAdvice[] {
  const waterType: WaterType = isFreshwater(input.tank.water_type) ? "freshwater" : "saltwater"
  const fw = waterType === "freshwater"
  const advice: TestAdvice[] = []
  const changePlan = suggestWaterChange({
    tank: input.tank,
    latest: input.latest,
    livestock: input.livestock,
    prefs: input.prefs,
  })
  const dosePlans = suggestDoses({
    tank: input.tank,
    latest: input.latest,
    livestock: input.livestock,
    prefs: input.prefs,
  })
  const wc = waterChangeAction(input.tank, input.prefs, changePlan)
  const doseById = (id: string) => dosePlans.find((item) => item.id === id)

  const targetOf = (key: ParameterKey) =>
    resolveTarget(key, input.tank, input.livestock, input.prefs)

  if (changePlan) {
    advice.push({
      id: "water-change-plan",
      parameter: changePlan.primary.parameter,
      severity: changePlan.severity,
      title: `Suggested water change · ~${changePlan.percent}%`,
      detail: changePlan.detail,
      actions: [wc, { label: "Open calculator", href: "/#reminders" }],
      suggestedChangePercent: changePlan.percent,
    })
  }

  for (const dose of dosePlans) {
    const parameter: ParameterKey =
      dose.parameter === "other" || dose.parameter === "magnesium" ? "alkalinity" : dose.parameter
    advice.push({
      id: dose.id,
      parameter,
      severity: dose.severity,
      title: `Dose ${dose.productName}`,
      detail: dose.detail,
      actions: [
        { label: `Use ${dose.amount} ${dose.unit}`, href: dose.href },
        { label: "Open dosing", href: "/dosing" },
      ],
    })
  }

  const ammonia = input.latest.ammonia
  const nitrite = input.latest.nitrite

  if (ammonia != null && ammonia > 0) {
    const prime = doseById("dose-prime")
    advice.push({
      id: "ammonia",
      parameter: "ammonia",
      severity: ammonia >= 0.5 ? "urgent" : "action",
      title: "Ammonia detected — act now",
      detail: `${formatReading("ammonia", ammonia, input.prefs, waterType)} is toxic. Do a water change, pause feeding, and watch the cycle. Aim for 0 ppm.${
        changePlan ? ` Plan: ~${changePlan.percent}% (${formatVolume(changePlan.gallons, input.prefs)}).` : ""
      }${prime ? ` Detox: ~${prime.amount} ${prime.unit} ${prime.productName}.` : ""}`,
      actions: [
        wc,
        prime
          ? { label: `Dose ${prime.amount} ${prime.unit} Prime`, href: prime.href }
          : doseAction("Log conditioner dose"),
        { label: "Open cycle tracker", href: "/cycle" },
      ],
      suggestedChangePercent: changePlan?.percent,
    })
  }

  if (nitrite != null && nitrite > 0) {
    const prime = doseById("dose-prime")
    advice.push({
      id: "nitrite",
      parameter: "nitrite",
      severity: nitrite >= 0.5 ? "urgent" : "action",
      title: "Nitrite is elevated",
      detail: `${formatReading("nitrite", nitrite, input.prefs, waterType)} means the nitrogen cycle isn’t finished or crashed. Water change and retest daily until it hits 0.${
        changePlan ? ` Plan: ~${changePlan.percent}% (${formatVolume(changePlan.gallons, input.prefs)}).` : ""
      }${prime ? ` Detox: ~${prime.amount} ${prime.unit} ${prime.productName}.` : ""}`,
      actions: [
        wc,
        prime
          ? { label: `Dose ${prime.amount} ${prime.unit} Prime`, href: prime.href }
          : doseAction("Log conditioner dose"),
        { label: "Open cycle tracker", href: "/cycle" },
      ],
      suggestedChangePercent: changePlan?.percent,
    })
  }

  const nitrate = input.latest.nitrate
  const nitrateTarget = targetOf("nitrate")
  if (nitrate != null && nitrateTarget) {
    if (nitrate > nitrateTarget.max) {
      const over = nitrate - nitrateTarget.max
      advice.push({
        id: "nitrate-high",
        parameter: "nitrate",
        severity: over > nitrateTarget.max ? "action" : "watch",
        source: nitrateTarget.source,
        title: "Nitrate above target",
        detail: `${formatReading("nitrate", nitrate, input.prefs, waterType)} vs ${formatTarget("nitrate", nitrateTarget, input.prefs, waterType)}. A water change is the fastest fix; check bioload and feeding if it climbs again.${
          changePlan ? ` Try ~${changePlan.percent}% (${formatVolume(changePlan.gallons, input.prefs)}).` : ""
        }`,
        actions: [wc, { label: "Review livestock bioload", href: "/livestock" }],
        suggestedChangePercent: changePlan?.percent,
      })
    }
  }

  const nitrateRising = nitrateRisingDespiteChanges(
    input.tests
      .filter((test) => test.parameter === "nitrate")
      .map((test) => ({ testedAt: test.tested_at, value: Number(test.value) })),
    input.waterChanges.map((change) => ({ changedAt: change.changed_at })),
  )
  if (nitrateRising && !advice.some((item) => item.id === "nitrate-high")) {
    const bump = Math.max(
      changePlan?.percent ?? 0,
      Math.min(40, (Number(input.tank.water_change_percent) || 15) + 10),
    )
    const bumpGallons = waterChangeGallons(input.tank, bump)
    advice.push({
      id: "nitrate-rising",
      parameter: "nitrate",
      severity: "watch",
      source: "trend",
      title: "Nitrate keeps climbing",
      detail: `Recent nitrate readings are rising even with water changes. Consider a larger ~${bump}% change (${formatVolume(bumpGallons, input.prefs)}), fewer feedings, or more cleanup crew / export.`,
      actions: [
        {
          label: `Do ~${bump}% · ${formatVolume(bumpGallons, input.prefs)}`,
          href: "/#reminders",
        },
        { label: "Check bioload", href: "/livestock" },
      ],
      suggestedChangePercent: bump,
    })
  }

  const alk = input.latest.alkalinity
  const alkTarget = targetOf("alkalinity")
  if (alk != null && alkTarget) {
    const outside = distanceOutside(alk, alkTarget.min, alkTarget.max)
    if (outside > 0) {
      const low = alk < alkTarget.min
      const far = outside > bandWidth(alkTarget.min, alkTarget.max) * 0.25
      advice.push({
        id: "alkalinity",
        parameter: "alkalinity",
        severity: far ? "action" : "watch",
        source: alkTarget.source,
        title: low
          ? fw
            ? "KH is low"
            : "Alkalinity is low"
          : fw
            ? "KH is high"
            : "Alkalinity is high",
        detail: low
          ? `${formatReading("alkalinity", alk, input.prefs, waterType)} vs ${formatTarget("alkalinity", alkTarget, input.prefs, waterType)}. ${
              fw
                ? "Dose a KH buffer slowly and retest — sudden swings stress fish."
                : "Dose alkalinity (or two-part) in small increments and retest before the next dose."
            }`
          : `${formatReading("alkalinity", alk, input.prefs, waterType)} is above ${formatTarget("alkalinity", alkTarget, input.prefs, waterType)}. Hold buffers${
              changePlan
                ? ` and try a ~${changePlan.percent}% water change (${formatVolume(changePlan.gallons, input.prefs)})`
                : " and let consumption or a water change bring it down"
            }.`,
        actions: low
          ? [
              (() => {
                const dose = doseById("dose-alk") ?? doseById("dose-ph-buffer")
                return dose
                  ? { label: `Dose ${dose.amount} ${dose.unit}`, href: dose.href }
                  : doseAction(fw ? "Log KH buffer dose" : "Log alk dose")
              })(),
              { label: "Retest later", href: "/tests" },
            ]
          : [wc],
        suggestedChangePercent: low ? undefined : changePlan?.percent,
      })
    }
  }

  const calcium = input.latest.calcium
  const caTarget = targetOf("calcium")
  if (!fw && calcium != null && caTarget) {
    const outside = distanceOutside(calcium, caTarget.min, caTarget.max)
    if (outside > 0) {
      const low = calcium < caTarget.min
      const caDose = doseById("dose-calcium")
      advice.push({
        id: "calcium",
        parameter: "calcium",
        severity: outside > 40 ? "action" : "watch",
        source: caTarget.source,
        title: low ? "Calcium is low" : "Calcium is high",
        detail: low
          ? `${formatReading("calcium", calcium, input.prefs, waterType)} vs ${formatTarget("calcium", caTarget, input.prefs, waterType)}.${
              caDose ? ` ${caDose.summary} should raise it about ${caDose.raiseBy} ppm.` : " Dose calcium (keep alk in step if you run two-part) and retest."
            }`
          : `${formatReading("calcium", calcium, input.prefs, waterType)} is above target. Pause calcium dosing and retest after a day.`,
        actions: low
          ? [
              caDose
                ? { label: `Dose ${caDose.amount} ${caDose.unit}`, href: caDose.href }
                : doseAction("Log calcium dose"),
            ]
          : [{ label: "View dosing history", href: "/dosing" }],
      })
    }
  }

  const phosphate = input.latest.phosphate
  const po4Target = targetOf("phosphate")
  if (phosphate != null && po4Target && phosphate > po4Target.max) {
    advice.push({
      id: "phosphate",
      parameter: "phosphate",
      severity: phosphate > po4Target.max * 3 ? "action" : "watch",
      source: po4Target.source,
      title: "Phosphate above target",
      detail: `${formatReading("phosphate", phosphate, input.prefs, waterType)} vs ${formatTarget("phosphate", po4Target, input.prefs, waterType)}. Water change, reduce feeding, and consider media / export if it stays high.${
        changePlan ? ` Start with ~${changePlan.percent}% (${formatVolume(changePlan.gallons, input.prefs)}).` : ""
      }`,
      actions: [wc, doseAction("Log phosphate treatment")],
      suggestedChangePercent: changePlan?.percent,
    })
  }

  const ph = input.latest.ph
  const phTarget = targetOf("ph")
  if (ph != null && phTarget) {
    const outside = distanceOutside(ph, phTarget.min, phTarget.max)
    if (outside > 0) {
      const low = ph < phTarget.min
      advice.push({
        id: "ph",
        parameter: "ph",
        severity: outside >= 0.3 ? "action" : "watch",
        source: phTarget.source,
        title: low ? "pH is low" : "pH is high",
        detail: low
          ? `${formatReading("ph", ph, input.prefs, waterType)} vs ${formatTarget("ph", phTarget, input.prefs, waterType)}. ${
              fw
                ? "Check KH — soft water often drifts down. Aeration and a gentle buffer help."
                : "Low pH often tracks low alkalinity. Test alk and dose if needed; improve surface agitation."
            }`
          : `${formatReading("ph", ph, input.prefs, waterType)} is high for this tank. Confirm the kit reading and avoid big swings.`,
        actions: low
          ? fw
            ? [doseAction("Log buffer dose"), { label: "Log another test", href: "/tests" }]
            : [
                { label: "Check alkalinity advice", href: "/tests" },
                doseAction("Log alk dose"),
              ]
          : [{ label: "Compare on charts", href: "/charts" }],
      })
    }
  }

  const salinity = input.latest.salinity
  const salTarget = targetOf("salinity")
  if (!fw && salinity != null && salTarget) {
    const outside = distanceOutside(salinity, salTarget.min, salTarget.max)
    if (outside > 0) {
      const low = salinity < salTarget.min
      advice.push({
        id: "salinity",
        parameter: "salinity",
        severity: outside >= 1 ? "action" : "watch",
        source: salTarget.source,
        title: low ? "Salinity is low" : "Salinity is high",
        detail: low
          ? `${formatReading("salinity", salinity, input.prefs, waterType)} vs ${formatTarget("salinity", salTarget, input.prefs, waterType)}. Top off evaporation with saltwater (not freshwater) or mix a slightly saltier change.`
          : `${formatReading("salinity", salinity, input.prefs, waterType)} is high. Top off with RO/DI only and correct gradually — don’t crash salinity.`,
        actions: [wc, { label: "Home water-change tools", href: "/#reminders" }],
      })
    }
  }

  const temperature = input.latest.temperature
  const tempTarget = targetOf("temperature")
  if (temperature != null && tempTarget) {
    const outside = distanceOutside(temperature, tempTarget.min, tempTarget.max)
    if (outside > 0) {
      const low = temperature < tempTarget.min
      advice.push({
        id: "temperature",
        parameter: "temperature",
        severity: outside >= 3 ? "action" : "watch",
        source: tempTarget.source,
        title: low ? "Temperature is low" : "Temperature is high",
        detail: `${formatReading("temperature", temperature, input.prefs, waterType)} vs ${formatTarget("temperature", tempTarget, input.prefs, waterType)}. Adjust the heater${low ? "" : " / add cooling or reduce lights"} and recheck in an hour.`,
        actions: [{ label: "Gear checklist", href: "/equipment" }],
      })
    }
  }

  if (
    !fw &&
    advice.some((item) => item.id === "alkalinity" && item.title.includes("low")) &&
    advice.some((item) => item.id === "calcium" && item.title.includes("low"))
  ) {
    advice.push({
      id: "two-part",
      parameter: "alkalinity",
      severity: "info",
      title: "Alk and calcium are both low",
      detail:
        "A balanced two-part (or calcium reactor) usually works better than chasing one number alone. Dose evenly and retest both.",
      actions: [doseAction("Log two-part dose")],
    })
  }

  const actionable = advice.filter((item) => item.severity !== "ok")
  if (actionable.length === 0) {
    const logged = Object.keys(input.latest).length
    if (logged === 0) {
      return [
        {
          id: "no-tests",
          parameter: "nitrate",
          severity: "info",
          title: "No readings yet",
          detail: "Log ammonia, nitrite, nitrate, and pH to get water-change and dosing suggestions.",
          actions: [{ label: "Log a test", href: "/tests" }],
        },
      ]
    }
    return [
      {
        id: "all-ok",
        parameter: "nitrate",
        severity: "ok",
        title: "Latest readings look on target",
        detail: "Nothing urgent from the numbers on file. Keep your usual test and water-change schedule.",
        actions: [{ label: "View charts", href: "/charts" }],
      },
    ]
  }

  return actionable.sort((a, b) => severityRank(a.severity) - severityRank(b.severity))
}

/** Convenience for Home / calculator prefills. */
export function getWaterChangeSuggestion(input: {
  tank: Tank
  latest: Partial<Record<ParameterKey, number>>
  livestock: LivestockRow[]
  prefs: UnitPrefs
}) {
  return suggestWaterChange(input)
}

export function getDoseSuggestions(input: {
  tank: Tank
  latest: Partial<Record<ParameterKey, number>>
  livestock: LivestockRow[]
  prefs: UnitPrefs
}) {
  return suggestDoses(input)
}
