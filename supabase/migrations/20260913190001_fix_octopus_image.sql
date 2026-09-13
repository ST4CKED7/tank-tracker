-- "NOT RECOMMENDED octopus" had been matched to an arachnid/insect photo.
update public.species_catalog
set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Octopus2.jpg/330px-Octopus2.jpg'
where id = '4eb4743a-869f-4ba6-b62a-6a3f5097ec6d'
   or (common_name ilike '%octopus%' and scientific_name ilike 'Octopus%');
