-- water_type axis + freshwater catalog seed
-- Applied remotely as: add_water_type, seed_freshwater_catalog

create type public.water_type as enum ('saltwater', 'freshwater');

alter table public.tanks
  add column if not exists water_type public.water_type not null default 'saltwater';

alter table public.species_catalog
  add column if not exists water_type public.water_type not null default 'saltwater';

create index if not exists species_catalog_water_type_idx on public.species_catalog (water_type);
create index if not exists tanks_water_type_idx on public.tanks (water_type);

-- See scripts/fw-seed.sql / applied migration seed_freshwater_catalog for the 84-row INSERT.
