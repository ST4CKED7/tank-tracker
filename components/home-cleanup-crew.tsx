import { CleanupCrewPanel } from "@/components/cleanup-crew-panel"
import type { LivestockRow, Tank } from "@/lib/bioload"
import type { ParameterKey } from "@/lib/parameters"
import { getAuthedUserId } from "@/lib/queries"
import type { Tables } from "@/lib/database.types"

/** Loads the species catalog after the rest of Home so the dashboard isn't blocked. */
export async function HomeCleanupCrew({
  tank,
  livestock,
  latest,
}: {
  tank: Tank
  livestock: LivestockRow[]
  latest: Partial<Record<ParameterKey, number>>
}) {
  const { supabase } = await getAuthedUserId()
  const { data } = await supabase
    .from("species_catalog")
    .select(
      "id, common_name, scientific_name, kind, diet, temperament, aggression_tags, bioload_factor, adult_length_inches, invert_points, min_tank_gallons, image_url, water_type, reef_safe, ph_min, ph_max, temp_min, temp_max, salinity_min, salinity_max, alk_min, alk_max, ca_min, ca_max, no3_min, no3_max, po4_min, po4_max, flow, lighting, notes, owner_id, slug",
    )
    .eq("water_type", tank.water_type ?? "saltwater")
    .in("kind", ["fish", "invert"])
    .order("common_name")

  return (
    <CleanupCrewPanel
      tank={tank}
      livestock={livestock}
      catalog={(data ?? []) as Tables<"species_catalog">[]}
      latest={latest}
    />
  )
}
