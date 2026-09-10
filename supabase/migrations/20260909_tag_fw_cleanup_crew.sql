-- Tag common freshwater cleanup-crew animals for assessment/suggestions.
update public.species_catalog
set aggression_tags = array(
  select distinct t from unnest(coalesce(aggression_tags, '{}') || array['cleanup']) as t
)
where owner_id is null
  and water_type = 'freshwater'
  and (
    common_name ilike any(array[
      '%Nerite%', '%Mystery snail%', '%Ramshorn%', '%Rabbit snail%', '%Malaysian trumpet%',
      '%Amano%', '%Cherry shrimp%', '%Crystal red%', '%Ghost shrimp%',
      '%Otocinclus%', '%Bristlenose%', '%Hillstream%', '%Siamese algae%'
    ])
  );
