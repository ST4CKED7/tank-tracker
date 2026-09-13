-- Turbo snails had been matched to a flowering-plant photo (genus name collision).
update public.species_catalog
set image_url = 'https://inaturalist-open-data.s3.amazonaws.com/photos/90897284/medium.jpeg'
where id in (
  '850a7433-a3a8-45c6-acb5-1bdf35d36f0a',
  'e1acea4a-20cc-4dd7-b482-b67a54ea1699'
)
or image_url like '%39295509%'
or (scientific_name ilike 'Turbo%' and kind = 'invert');
