-- Add Springer's damsel / demoiselle (Chrysiptera springeri) to the saltwater catalog.
insert into public.species_catalog (
  slug, common_name, scientific_name, kind, water_type, category,
  min_tank_gallons, adult_length_inches, bioload_factor, invert_points,
  temperament, reef_safe, diet, flow, aggression_tags,
  temp_min, temp_max, salinity_min, salinity_max, ph_min, ph_max,
  alk_min, alk_max, ca_min, ca_max, no3_min, no3_max, po4_min, po4_max,
  notes, image_url
)
select
  'springer-damsel',
  'Springer damsel',
  'Chrysiptera springeri',
  'fish',
  'saltwater',
  'Damsels & chromis',
  30,
  2.2,
  0.7,
  0,
  'semi_aggressive',
  'yes',
  'omnivore',
  'moderate',
  array['territorial'],
  75, 82, 34, 36, 8.1, 8.4,
  7.5, 11, 380, 450, 0, 20, 0, 0.1,
  'Also called Springer''s demoiselle. Bright purple/blue with yellow accents. Like other damsels, can get territorial — add last.',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Chrysiptera_springeri.jpg/330px-Chrysiptera_springeri.jpg'
where not exists (
  select 1 from public.species_catalog
  where slug = 'springer-damsel'
     or scientific_name ilike 'Chrysiptera springeri%'
     or common_name ilike '%springer%damsel%'
     or common_name ilike '%springer%demoiselle%'
);
