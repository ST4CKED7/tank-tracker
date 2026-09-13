-- Capnella (Kenya tree) was matched to Allocapnia stoneflies via iNaturalist fuzzy search.
update public.species_catalog
set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Cauliflower_soft_coral_at_Rambler_Rock_south_reef_P9078397.JPG/330px-Cauliflower_soft_coral_at_Rambler_Rock_south_reef_P9078397.JPG'
where id = '629f19a9-20cb-4880-8ede-668b397817f3'
   or (common_name = 'Kenya tree' and scientific_name ilike 'Capnella%');
