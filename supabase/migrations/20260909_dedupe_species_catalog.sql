-- Remove duplicate public catalog rows that share the same common name + water_type.
-- Prefer rows already used in livestock, then slugs closest to the common name.

with ranked as (
  select id, water_type,
         lower(regexp_replace(trim(common_name), '\s+', ' ', 'g')) as name_key,
         row_number() over (
           partition by water_type, lower(regexp_replace(trim(common_name), '\s+', ' ', 'g'))
           order by
             exists (select 1 from public.livestock l where l.species_id = species_catalog.id) desc,
             case
               when slug = regexp_replace(lower(trim(common_name)), '[^a-z0-9]+', '-', 'g') then 0
               when slug like regexp_replace(lower(trim(common_name)), '[^a-z0-9]+', '-', 'g') || '%' then 1
               when regexp_replace(lower(trim(common_name)), '[^a-z0-9]+', '-', 'g') like slug || '%' then 2
               else 3
             end asc,
             length(coalesce(slug, '')) asc,
             slug asc nulls last,
             id asc
         ) as rn
  from public.species_catalog
  where owner_id is null
),
mapped as (
  select l.id as loser_id, k.id as keeper_id
  from ranked l
  join ranked k
    on k.water_type = l.water_type
   and k.name_key = l.name_key
   and k.rn = 1
  where l.rn > 1
)
update public.livestock liv
set species_id = m.keeper_id
from mapped m
where liv.species_id = m.loser_id;

with ranked as (
  select id, water_type,
         lower(regexp_replace(trim(common_name), '\s+', ' ', 'g')) as name_key,
         row_number() over (
           partition by water_type, lower(regexp_replace(trim(common_name), '\s+', ' ', 'g'))
           order by
             exists (select 1 from public.livestock l where l.species_id = species_catalog.id) desc,
             case
               when slug = regexp_replace(lower(trim(common_name)), '[^a-z0-9]+', '-', 'g') then 0
               when slug like regexp_replace(lower(trim(common_name)), '[^a-z0-9]+', '-', 'g') || '%' then 1
               when regexp_replace(lower(trim(common_name)), '[^a-z0-9]+', '-', 'g') like slug || '%' then 2
               else 3
             end asc,
             length(coalesce(slug, '')) asc,
             slug asc nulls last,
             id asc
         ) as rn
  from public.species_catalog
  where owner_id is null
)
delete from public.species_catalog sc
using ranked r
where sc.id = r.id and r.rn > 1;
