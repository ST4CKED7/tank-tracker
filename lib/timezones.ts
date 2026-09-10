/** IANA time zones for tank reminder scheduling. */
export function listTimeZones(): string[] {
  try {
    if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
      return Intl.supportedValuesOf("timeZone")
    }
  } catch {
    // fall through
  }
  return FALLBACK_TIME_ZONES
}

export function timeZoneGroups(zones: string[] = listTimeZones()) {
  const groups = new Map<string, string[]>()
  for (const zone of zones) {
    const region = zone.includes("/") ? zone.slice(0, zone.indexOf("/")) : "Other"
    const list = groups.get(region) ?? []
    list.push(zone)
    groups.set(region, list)
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([region, items]) => ({ region, zones: items }))
}

export function defaultTimeZone(fallback = "America/Denver") {
  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (detected && listTimeZones().includes(detected)) return detected
  } catch {
    // fall through
  }
  return fallback
}

const FALLBACK_TIME_ZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Europe/Warsaw",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Perth",
  "Pacific/Auckland",
  "UTC",
]
