alter table public.tanks
  add column if not exists has_sump boolean not null default false,
  add column if not exists sump_gallons numeric not null default 0,
  add column if not exists sump_media text[] not null default '{}'::text[];

comment on column public.tanks.has_sump is 'Whether the system includes a sump';
comment on column public.tanks.sump_gallons is 'Sump water volume in US gallons';
comment on column public.tanks.sump_media is 'Filtration/media types present in the sump';
