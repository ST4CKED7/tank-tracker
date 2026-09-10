-- Extra reef livestock, including clown gobies. Safe to re-run.
update public.species_catalog
set notes = 'Tiny coral goby, also sold as green clown goby or clown goby. Perches in branching Acropora. Offer small meaty foods.'
where slug = 'green-clown-goby';

insert into public.species_catalog (
  slug, common_name, scientific_name, kind, min_tank_gallons, adult_length_inches,
  bioload_factor, invert_points, temperament, reef_safe, diet, lighting, flow,
  aggression_tags, temp_min, temp_max, salinity_min, salinity_max, ph_min, ph_max,
  alk_min, alk_max, ca_min, ca_max, no3_min, no3_max, po4_min, po4_max, notes
) values
('maroon-clownfish','Maroon clownfish','Premnas biaculeatus','fish',30,6.0,1.1,0,'semi_aggressive','yes','omnivore',null,null,'{territorial}',75,82,34,36,8.1,8.4,7.5,11,380,450,0,20,0,0.1,'Largest clown. Females get big and can bully other clowns. Gold-stripe variants are common.'),
('tomato-clownfish','Tomato clownfish','Amphiprion frenatus','fish',30,5.0,1.0,0,'semi_aggressive','yes','omnivore',null,null,'{territorial}',75,82,34,36,8.1,8.4,7.5,11,380,450,0,20,0,0.1,'Bold host clown. Can be territorial with other clowns as it matures.'),
('clarks-clownfish','Clark''s clownfish','Amphiprion clarkii','fish',30,5.0,1.0,0,'semi_aggressive','yes','omnivore',null,null,'{territorial}',75,82,34,36,8.1,8.4,7.5,11,380,450,0,20,0,0.1,'Hardy clown that hosts many anemones. Can be territorial in smaller tanks.'),
('cinnamon-clownfish','Cinnamon clownfish','Amphiprion melanopus','fish',30,5.0,1.0,0,'semi_aggressive','yes','omnivore',null,null,'{territorial}',75,82,34,36,8.1,8.4,7.5,11,380,450,0,20,0,0.1,'Also called red and black clown. Captive-bred fish are widely available.'),
('black-ocellaris-clownfish','Black ocellaris clownfish','Amphiprion ocellaris','fish',20,3.5,0.8,0,'peaceful','yes','omnivore',null,null,'{}',75,82,34,36,8.1,8.4,7.5,11,380,450,0,20,0,0.1,'Dark morph of ocellaris. Same peaceful care as common clowns.'),
('powder-blue-tang','Powder blue tang','Acanthurus leucosternon','fish',125,9.0,1.5,0,'semi_aggressive','yes','herbivore',null,'high','{territorial,delicate}',75,82,34,36,8.1,8.4,7.5,11,380,450,0,20,0,0.1,'Needs a huge, mature tank. Prone to ich and territorial with other tangs.'),
('scopas-tang','Scopas tang','Zebrasoma scopas','fish',75,8.0,1.4,0,'semi_aggressive','yes','herbivore',null,'high','{territorial}',75,82,34,36,8.1,8.4,7.5,11,380,450,0,20,0,0.1,'Brown sailfin relative. Excellent algae grazer with lots of swimming room.'),
('sailfin-tang','Sailfin tang','Zebrasoma velifer','fish',125,15.0,1.6,0,'semi_aggressive','yes','herbivore',null,'high','{territorial}',75,82,34,36,8.1,8.4,7.5,11,380,450,0,20,0,0.1,'Gets very large. Not a nano fish. Needs open swimming space and nori.'),
('purple-tang','Purple tang','Zebrasoma xanthurum','fish',100,10.0,1.5,0,'semi_aggressive','yes','herbivore',null,'high','{territorial}',75,82,34,36,8.1,8.4,7.5,11,380,450,0,20,0,0.1,'Striking grazer. Territorial with other Zebrasoma. Needs a large tank.'),
('blue-assessor','Blue assessor','Assessor macneilli','fish',20,3.0,0.6,0,'peaceful','yes','carnivore',null,'moderate','{caves}',75,82,34,36,8.1,8.4,7.5,11,380,450,0,20,0,0.1,'Often swims upside-down under ledges. Peaceful reef fish.'),
('yellow-assessor','Yellow assessor','Assessor flavissimus','fish',20,2.5,0.6,0,'peaceful','yes','carnivore',null,'moderate','{caves}',75,82,34,36,8.1,8.4,7.5,11,380,450,0,20,0,0.1,'Golden cave-swimmer. Keep a lid; they can jump when startled.'),
('mystery-wrasse','Mystery wrasse','Pseudocheilinus ocellatus','fish',40,4.5,0.8,0,'semi_aggressive','caution','carnivore',null,'moderate','{territorial,not_with_shrimp}',75,82,34,36,8.1,8.4,7.5,11,380,450,0,20,0,0.1,'Pest hunter. Can harass shrimp and smaller wrasses. Tight lid.'),
('pink-streaked-wrasse','Pink streaked wrasse','Pseudocheilinops ataenia','fish',20,2.5,0.5,0,'peaceful','yes','carnivore',null,'moderate','{}',75,82,34,36,8.1,8.4,7.5,11,380,450,0,20,0,0.1,'Tiny peaceful wrasse. Excellent nano-reef fish that ignores corals.'),
('yellow-coris-wrasse','Yellow coris wrasse','Halichoeres chrysus','fish',40,5.0,0.9,0,'peaceful','yes','carnivore',null,'moderate','{needs_sand,jumps}',75,82,34,36,8.1,8.4,7.5,11,380,450,0,20,0,0.1,'Sand-sleeping wrasse. Eats small pests. Needs a sand bed and a lid.'),
('aiptasia-eating-filefish','Aiptasia-eating filefish','Acreichthys tomentosus','fish',30,3.5,0.8,0,'peaceful','caution','omnivore',null,'moderate','{nips_corals}',75,82,34,36,8.1,8.4,7.5,11,380,450,0,20,0,0.1,'Often eats aiptasia. Some individuals also nip zoas, palys, or LPS.'),
('twinspot-goby','Twinspot goby','Signigobius biocellatus','fish',20,3.5,0.6,0,'peaceful','yes','carnivore',null,'moderate','{needs_sand,delicate}',75,82,34,36,8.1,8.4,7.5,11,380,450,0,15,0,0.08,'Also called crab-eyed goby. Sifts sand in pairs. Can be a shy eater.'),
('swissguard-basslet','Swissguard basslet','Liopropoma rubre','fish',30,3.5,0.8,0,'peaceful','yes','carnivore',null,'moderate','{caves}',75,82,34,36,8.1,8.4,7.5,11,380,450,0,20,0,0.1,'Shy cave fish. Peaceful with most tankmates; needs hiding spots.'),
('four-line-wrasse','Four line wrasse','Pseudocheilinus tetrataenia','fish',30,3.0,0.8,0,'semi_aggressive','caution','carnivore',null,'moderate','{territorial,not_with_shrimp}',75,82,34,36,8.1,8.4,7.5,11,380,450,0,20,0,0.1,'Small pest wrasse. Can be feisty with shrimp and similar wrasses.'),
('pistol-shrimp','Tiger pistol shrimp','Alpheus bellulus','invert',20,null,0,1.0,'peaceful','yes','omnivore',null,'moderate','{shrimp,needs_sand}',75,82,34,36,8.1,8.4,7.5,11,380,450,0,20,0,0.1,'Pairs with watchman and shrimp gobies. Needs a sand bed for the burrow.'),
('randalls-pistol-shrimp','Randall''s pistol shrimp','Alpheus randalli','invert',20,null,0,1.0,'peaceful','yes','omnivore',null,'moderate','{shrimp,needs_sand}',75,82,34,36,8.1,8.4,7.5,11,380,450,0,20,0,0.1,'Classic partner for Yasha and Randall''s gobies.'),
('astrea-snail','Astrea snail','Lithopoma / Astraea spp.','invert',10,null,0,0.4,'peaceful','yes','herbivore',null,'moderate','{cleanup}',75,82,34,36,8.1,8.4,7.5,11,380,450,0,25,0,0.15,'Film-algae grazer. Cannot right itself if it lands upside down.'),
('sand-sifting-star','Sand-sifting star','Astropecten spp.','invert',40,null,0,1.5,'peaceful','yes','scavenger',null,'low','{cleanup,needs_sand,delicate}',75,82,34,36,8.1,8.4,7.5,11,380,450,0,20,0,0.1,'Needs a deep, mature sand bed or it will starve. Not for small tanks.'),
('gorgonian','Gorgonian','Gorgonia / Muricea spp.','coral',20,null,0,0,null,'yes',null,'moderate','high','{delicate}',75,82,34,36,8.1,8.4,7.5,11,380,450,0,10,0,0.08,'Many are photosynthetic; NPS types need regular feeding. Give them flow.')
on conflict (slug) do nothing;
