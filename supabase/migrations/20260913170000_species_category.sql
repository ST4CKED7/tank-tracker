alter table public.species_catalog add column if not exists category text;
comment on column public.species_catalog.category is 'Sub-group within kind (e.g. Tetras, Plecos, SPS corals) for catalog browsing.';

-- Freshwater fish
update public.species_catalog s set category = case
  when g in ('hyphessobrycon','paracheirodon','hemigrammus','nematobrycon','gymnocorymbus','moenkhausia','aphyocharax','hasemania','thayeria','nannostomus','carnegiella','metynnis','exodon','phenacogrammus','astyanax','petitella','gasteropelecus','pristella','hemiodus') then 'Tetras & characins'
  when g in ('puntius','pethia','barbodes','puntigrus','sahyadria','oliotius','desmopuntius','systomus','barbus','dawkinsia') then 'Barbs'
  when g in ('rasbora','trigonostigma','boraras','microdevario','sundadanio') then 'Rasboras'
  when g in ('danio','devario','tanichthys') then 'Danios & minnows'
  when g in ('poecilia','xiphophorus','gambusia','heterandria') then 'Livebearers'
  when g in ('apistogramma','mikrogeophagus','pelvicachromis','laetacara','nannacara','dicrossus') then 'Dwarf cichlids'
  when g in ('pseudotropheus','maylandia','metriaclima','labidochromis','melanochromis','aulonocara','cyphotilapia','neolamprologus','julidochromis','tropheus','altolamprologus','hemichromis','etroplus','pseudocrenilabrus','cynotilapia','protomelas','sciaenochromis','nimbochromis','iodotropheus') then 'African cichlids'
  when g in ('amphilophus','herichthys','thorichthys','andinoacara','cleithracara','heros','symphysodon','pterophyllum','astronotus','cichla','mesonauta','uaru','hypselecara','rocio','amatitlania','herotilapia','trichromis','crenicichla','geophagus','cichlasoma','parachromis','vieja','archocentrus','hypsophrys') then 'American cichlids'
  when g in ('corydoras','aspidoras','scleromystax','synodontis','otocinclus','kryptopterus','microglanis','pimelodus','pangasianodon','pangasius','hoplosternum','brochis') then 'Corydoras & catfish'
  when g in ('hypancistrus','ancistrus','pterygoplichthys','baryancistrus','hypostomus','panaqolus','chaetostoma','panaque','peckoltia','sturisoma','farlowella') then 'Plecos'
  when g in ('botia','chromobotia','pangio','ambastaia','yasuhikotakia','misgurnus','nemacheilus','beaufortia','sewellia','gastromyzon','acanthocobitis') then 'Loaches'
  when g in ('betta') then 'Bettas'
  when g in ('trichogaster','trichopodus','trichopsis','colisa','macropodus','sphaerichthys','helostoma','osphronemus') then 'Gouramis & anabantoids'
  when g in ('melanotaenia','iriatherina','glossolepis','pseudomugil') then 'Rainbowfish'
  when g in ('fundulopanchax','nothobranchius','aphyosemion','aplocheilus') then 'Killifish'
  when g in ('carassius','cyprinus') then 'Goldfish & coldwater'
  when g in ('epalzeorhynchos','crossocheilus','gyrinocheilus','balantiocheilus','garra') then 'Sharks & algae eaters'
  else 'Oddballs & other'
 end
 from (select id, split_part(lower(coalesce(scientific_name,'')),' ',1) as g from public.species_catalog) x
 where s.id = x.id and s.owner_id is null and s.water_type = 'freshwater' and s.kind = 'fish';

-- Freshwater inverts
update public.species_catalog s set category = case
  when g in ('neocaridina','caridina','atyopsis','atya','palaemonetes','macrobrachium','limnopilos') then 'Shrimp'
  when g in ('neritina','pomacea','clea','anentome','melanoides','tylomelania','planorbidae','planorbella','physa','viviparus') then 'Snails'
  when g in ('geosesarma','cherax','procambarus','cambarellus') then 'Crabs & crayfish'
  else 'Other inverts'
 end
 from (select id, split_part(lower(coalesce(scientific_name,'')),' ',1) as g from public.species_catalog) x
 where s.id = x.id and s.owner_id is null and s.water_type = 'freshwater' and s.kind = 'invert';

-- Freshwater plants
update public.species_catalog s set category = case
  when g in ('anubias','microsorum','bucephalandra','bolbitis') then 'Rhizome & epiphyte'
  when g in ('rotala','ludwigia','hygrophila','bacopa','cabomba','myriophyllum','limnophila','pogostemon','alternanthera','cardamine','phyllanthus','ceratophyllum') then 'Stem plants'
  when g in ('echinodorus','cryptocoryne','vallisneria','sagittaria','aponogeton','crinum') then 'Rosette & sword'
  when g in ('hemianthus','micranthemum','eleocharis','marsilea','glossostigma','staurogyne','hydrocotyle','lilaeopsis') then 'Carpeting'
  when g in ('limnobium','pistia','salvinia','lemna','najas','ceratopteris','azolla') then 'Floating'
  when g in ('taxiphyllum','vesicularia','fontinalis','riccia','monosolenium','aegagropila','riccardia') then 'Mosses'
  when g in ('nymphaea','nymphoides','barclaya') then 'Lily & bulb'
  else 'Other plants'
 end
 from (select id, split_part(lower(coalesce(scientific_name,'')),' ',1) as g from public.species_catalog) x
 where s.id = x.id and s.owner_id is null and s.water_type = 'freshwater' and s.kind = 'plant';

-- Saltwater fish
update public.species_catalog s set category = case
  when g in ('amphiprion','premnas') then 'Clownfish'
  when g in ('zebrasoma','acanthurus','paracanthurus','naso','ctenochaetus') then 'Tangs & surgeonfish'
  when g in ('chromis','chrysiptera','dascyllus','pomacentrus') then 'Damsels & chromis'
  when g in ('gobiodon','elacatinus','valenciennea','stonogobiops','cryptocentrus','amblyeleotris','amblygobius','signigobius','lythrypnus','koumansetta') then 'Gobies'
  when g in ('nemateleotris','ptereleotris') then 'Dartfish & firefish'
  when g in ('salarias','ecsenius','meiacanthus','scartella','blenniella') then 'Blennies'
  when g in ('halichoeres','cirrhilabrus','pseudocheilinus','paracheilinus','labroides','thalassoma','macropharyngodon','coris','wetmorella','pseudocheilinops','choerodon','gomphosus') then 'Wrasses'
  when g in ('centropyge','pomacanthus','genicanthus','holacanthus','apolemichthys') then 'Angelfish'
  when g in ('chelmon','chaetodon','heniochus','forcipiger') then 'Butterflyfish'
  when g in ('pseudanthias') then 'Anthias'
  when g in ('sphaeramia','pterapogon','apogon') then 'Cardinalfish'
  when g in ('pseudochromis') then 'Dottybacks'
  when g in ('neocirrhites','oxycirrhites','paracirrhites','cirrhitichthys') then 'Hawkfish'
  when g in ('opistognathus') then 'Jawfish'
  when g in ('gramma','liopropoma','serranus','assessor') then 'Basslets & bass'
  when g in ('synchiropus') then 'Dragonets'
  when g in ('doryrhamphus','hippocampus','syngnathus') then 'Pipefish & seahorses'
  when g in ('siganus') then 'Rabbitfish'
  else 'Oddballs & other'
 end
 from (select id, split_part(lower(coalesce(scientific_name,'')),' ',1) as g from public.species_catalog) x
 where s.id = x.id and s.owner_id is null and s.water_type = 'saltwater' and s.kind = 'fish';

-- Saltwater inverts
update public.species_catalog s set category = case
  when g in ('lysmata','stenopus','thor','rhynchocinetes','alpheus','odontodactylus') then 'Shrimp'
  when g in ('paguristes','calcinus','clibanarius','ciliopagurus','neopetrolisthes','percnon','mithraculus','stenorhynchus') then 'Crabs'
  when g in ('trochus','turbo','nassarius','cerithium','lithopoma','engina','stomatella','astraea','nerita') then 'Snails'
  when g in ('fromia','astropecten','ophiocoma','diadema','eucidaris','mespilia','linckia') then 'Stars & urchins'
  when g in ('sabellastarte','spirobranchus') then 'Featherdusters & worms'
  else 'Other inverts'
 end
 from (select id, split_part(lower(coalesce(scientific_name,'')),' ',1) as g from public.species_catalog) x
 where s.id = x.id and s.owner_id is null and s.water_type = 'saltwater' and s.kind = 'invert';

-- Corals
update public.species_catalog s set category = case
  when g in ('acropora','montipora','seriatopora','stylophora','pocillopora','pavona') then 'SPS corals'
  when g in ('euphyllia','trachyphyllia','acanthastrea','favia','lobophyllia','caulastrea','fungia','duncanopsammia','goniopora','blastomussa','micromussa','catalaphyllia','plerogyra','echinophyllia','symphyllia','cynarina','scolymia','turbinaria','favites','montastraea','hydnophora','galaxea','tubastraea','alveopora','homophyllia','platygyra','herpolitha','polyphyllia','nemenzophyllia') then 'LPS corals'
  when g in ('sarcophyton','sinularia','xenia','clavularia','cladiella','nephthea','capnella','anthelia','lobophytum','litophyton') then 'Soft corals'
  when g in ('zoanthus','palythoa','protopalythoa','briareum','pachyclavularia') then 'Zoanthids & polyps'
  when g in ('rhodactis','discosoma','ricordea','actinodiscus','amplexidiscus') then 'Mushrooms'
  when g in ('entacmaea','heteractis','stichodactyla','macrodactyla','condylactis','epicystis') then 'Anemones'
  else 'Other corals'
 end
 from (select id, split_part(lower(coalesce(scientific_name,'')),' ',1) as g from public.species_catalog) x
 where s.id = x.id and s.owner_id is null and s.kind = 'coral';
