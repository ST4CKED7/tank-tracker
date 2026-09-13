insert into public.species_catalog
  (slug, common_name, scientific_name, kind, water_type, category, min_tank_gallons, adult_length_inches, bioload_factor, invert_points, temperament, reef_safe, aggression_tags, temp_min, temp_max, ph_min, ph_max, notes)
select
  v.slug, v.common_name, v.scientific_name, v.kind::public.species_kind, v.water_type::public.water_type, v.category,
  v.min_tank_gallons, v.adult_length_inches, v.bioload_factor, v.invert_points, v.temperament::public.temperament,
  v.reef_safe::public.reef_safe, '{}'::text[], v.temp_min, v.temp_max, v.ph_min, v.ph_max, v.notes
from (values
  ('cardinal-tetra','Cardinal tetra','Paracheirodon axelrodi','fish','freshwater','Tetras & characins',15,2.0,0.9,0,'peaceful','no',73,81,4.6,6.5,'Vivid red-and-blue schooler; keep 8+ in soft, warm water.'),
  ('rummynose-tetra','Rummynose tetra','Hemigrammus rhodostomus','fish','freshwater','Tetras & characins',20,2.0,0.9,0,'peaceful','no',75,82,5.5,7.0,'Tight schooler with a red nose; a great water-quality barometer.'),
  ('black-neon-tetra','Black neon tetra','Hyphessobrycon herbertaxelrodi','fish','freshwater','Tetras & characins',15,1.6,0.9,0,'peaceful','no',73,81,5.5,7.5,'Hardy schooling tetra with a silver-and-black stripe.'),
  ('cherry-barb','Cherry barb','Puntius titteya','fish','freshwater','Barbs',15,2.0,1.0,0,'peaceful','no',73,81,6.0,7.5,'Peaceful barb; males turn deep cherry-red when settled.'),
  ('gold-barb','Gold barb','Barbodes semifasciolatus','fish','freshwater','Barbs',20,3.0,1.0,0,'peaceful','no',64,78,6.0,8.0,'Active gold-bodied barb good for cooler community tanks.'),
  ('celestial-pearl-danio','Celestial pearl danio','Danio margaritatus','fish','freshwater','Danios & minnows',10,1.0,0.8,0,'peaceful','no',68,78,6.5,7.5,'Tiny jewel-spotted nano fish; keep in groups in calm water.'),
  ('pearl-danio','Pearl danio','Danio albolineatus','fish','freshwater','Danios & minnows',20,2.5,1.0,0,'peaceful','no',72,79,6.5,7.5,'Fast, iridescent schooler for the upper water column.'),
  ('endlers-livebearer','Endler''s livebearer','Poecilia wingei','fish','freshwater','Livebearers',10,1.2,0.9,0,'peaceful','no',72,82,7.0,8.5,'Colorful, prolific nano livebearer related to the guppy.'),
  ('pygmy-cory','Pygmy cory','Corydoras pygmaeus','fish','freshwater','Corydoras & catfish',10,1.0,0.8,0,'peaceful','no',72,79,6.4,7.4,'Schooling dwarf cory that swims mid-water in groups of 8+.'),
  ('panda-cory','Panda cory','Corydoras panda','fish','freshwater','Corydoras & catfish',20,2.0,0.9,0,'peaceful','no',68,77,6.0,7.4,'Popular panda-patterned bottom dweller; keep a shoal.'),
  ('zebra-pleco','Zebra pleco','Hypancistrus zebra','fish','freshwater','Plecos',30,3.5,1.1,0,'peaceful','no',79,88,6.0,7.2,'Striking black-and-white pleco; needs warm, oxygen-rich water.'),
  ('honey-gourami','Honey gourami','Trichogaster chuna','fish','freshwater','Gouramis & anabantoids',10,2.0,0.9,0,'peaceful','no',72,82,6.0,7.5,'Small, gentle gourami ideal for planted nano communities.'),
  ('pearl-gourami','Pearl gourami','Trichopodus leerii','fish','freshwater','Gouramis & anabantoids',30,4.5,1.1,0,'peaceful','no',77,84,6.0,7.5,'Elegant lace-patterned gourami; peaceful centerpiece.'),
  ('dwarf-gourami','Dwarf gourami','Trichogaster lalius','fish','freshwater','Gouramis & anabantoids',15,3.5,1.0,0,'peaceful','no',72,82,6.0,7.5,'Colorful labyrinth fish; one male per small tank.'),
  ('scarlet-badis','Scarlet badis','Dario dario','fish','freshwater','Oddballs & other',10,0.8,0.8,0,'peaceful','no',72,79,6.5,7.5,'Micro-predator that needs live/frozen foods and calm tankmates.'),
  ('dwarf-pufferfish','Dwarf pufferfish','Carinotetraodon travancoricus','fish','freshwater','Oddballs & other',10,1.0,1.2,0,'semi_aggressive','no',74,82,6.8,7.8,'Pea-sized puffer with big personality; needs snails and space.'),
  ('boesemani-rainbowfish','Boesemani rainbowfish','Melanotaenia boesemani','fish','freshwater','Rainbowfish',30,4.0,1.1,0,'peaceful','no',75,86,7.0,8.0,'Two-tone blue-and-orange rainbow; brilliant in groups.'),
  ('kribensis','Kribensis','Pelvicachromis pulcher','fish','freshwater','Dwarf cichlids',20,3.5,1.0,0,'semi_aggressive','no',75,82,6.0,7.5,'Colorful dwarf cichlid; territorial when breeding.'),
  ('bolivian-ram','Bolivian ram','Mikrogeophagus altispinosus','fish','freshwater','Dwarf cichlids',20,3.0,1.0,0,'peaceful','no',72,79,6.5,7.8,'Hardier ram alternative; gentle sifting cichlid.'),
  ('chili-rasbora','Chili rasbora','Boraras brigittae','fish','freshwater','Rasboras',8,0.8,0.7,0,'peaceful','no',75,82,4.5,7.0,'Fiery-red nano fish for calm, blackwater-style tanks.'),
  ('emerald-dwarf-rasbora','Emerald dwarf rasbora','Celestichthys erythromicron','fish','freshwater','Rasboras',10,0.9,0.7,0,'peaceful','no',72,78,6.5,7.5,'Barred nano fish; peaceful and shy in groups.'),
  ('bristlenose-pleco-common','Bristlenose pleco','Ancistrus cirrhosus','fish','freshwater','Plecos',25,5.0,1.2,0,'peaceful','no',73,81,6.5,7.5,'Efficient algae eater that stays tank-manageable.'),
  ('otocinclus-common','Otocinclus catfish','Otocinclus vittatus','fish','freshwater','Corydoras & catfish',10,1.8,0.7,0,'peaceful','no',72,79,6.0,7.5,'Gentle algae grazer; keep in groups in mature tanks.'),
  ('rope-fish-dup-guard','Rope fish','Erpetoichthys calabaricus','fish','freshwater','Oddballs & other',55,15.0,1.3,0,'peaceful','no',72,82,6.5,7.5,'Eel-like oddball; needs a tight lid and sinking meaty foods.'),
  ('amano-shrimp-add','Amano shrimp','Caridina multidentata','invert','freshwater','Shrimp',10,2.0,0,1.0,'peaceful','no',65,80,6.5,7.5,'Top-tier algae-eating shrimp for planted tanks.'),
  ('nerite-snail-add','Nerite snail','Neritina natalensis','invert','freshwater','Snails',5,1.0,0,0.5,'peaceful','no',65,85,7.0,8.5,'Best algae-eating snail; will not breed in freshwater.'),
  ('mystery-snail-add','Mystery snail','Pomacea bridgesii','invert','freshwater','Snails',5,2.0,0,0.8,'peaceful','no',68,82,7.0,8.0,'Peaceful, colorful snail that leaves plants alone.')
) as v(slug, common_name, scientific_name, kind, water_type, category, min_tank_gallons, adult_length_inches, bioload_factor, invert_points, temperament, reef_safe, temp_min, temp_max, ph_min, ph_max, notes)
where not exists (
  select 1 from public.species_catalog e
  where e.owner_id is null and lower(e.scientific_name) = lower(v.scientific_name)
);
