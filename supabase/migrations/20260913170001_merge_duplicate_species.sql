-- Merge clearly redundant duplicate species (keep canonical name, repoint livestock, drop the label-only duplicate).
with pairs(drop_name, keep_name) as (
  values
    ('Four line wrasse','Fourline wrasse'),
    ('Open brain','Open brain coral'),
    ('Birdsnest','Birdsnest coral'),
    ('Toadstool','Toadstool leather'),
    ('Scarlet hermit','Scarlet reef hermit'),
    ('Copperband butterfly','Copperband butterflyfish'),
    ('Coral beauty','Coral beauty angelfish'),
    ('Zoanthid tuft','Zoanthids'),
    ('Pajama cardinal group','Pajama cardinalfish'),
    ('Orange spotted sleeper goby','Diamond watchman goby'),
    ('Blue-green chromis','Green chromis'),
    ('Hi fin red banded goby','Yasha goby'),
    ('Pearly jawfish','Yellowhead jawfish'),
    ('Pocillopora','Cauliflower coral')
),
resolved as (
  select d.id as drop_id, k.id as keep_id
  from pairs p
  join public.species_catalog d on d.owner_id is null and d.common_name = p.drop_name
  join public.species_catalog k on k.owner_id is null and k.common_name = p.keep_name
)
update public.livestock l
  set species_id = r.keep_id
  from resolved r
  where l.species_id = r.drop_id;

with pairs(drop_name, keep_name) as (
  values
    ('Four line wrasse','Fourline wrasse'),
    ('Open brain','Open brain coral'),
    ('Birdsnest','Birdsnest coral'),
    ('Toadstool','Toadstool leather'),
    ('Scarlet hermit','Scarlet reef hermit'),
    ('Copperband butterfly','Copperband butterflyfish'),
    ('Coral beauty','Coral beauty angelfish'),
    ('Zoanthid tuft','Zoanthids'),
    ('Pajama cardinal group','Pajama cardinalfish'),
    ('Orange spotted sleeper goby','Diamond watchman goby'),
    ('Blue-green chromis','Green chromis'),
    ('Hi fin red banded goby','Yasha goby'),
    ('Pearly jawfish','Yellowhead jawfish'),
    ('Pocillopora','Cauliflower coral')
)
delete from public.species_catalog s
  using pairs p
  where s.owner_id is null and s.common_name = p.drop_name;
