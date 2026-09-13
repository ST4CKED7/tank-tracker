-- Drop the "NOT RECOMMENDED" label from octopus; keep it as a normal catalog entry.
update public.species_catalog
set
  common_name = 'Octopus',
  notes = 'Escape artist and predator. Needs a species-only setup with a tight-fitting lid.'
where id = '4eb4743a-869f-4ba6-b62a-6a3f5097ec6d'
   or common_name ilike 'NOT RECOMMENDED%octopus%';
