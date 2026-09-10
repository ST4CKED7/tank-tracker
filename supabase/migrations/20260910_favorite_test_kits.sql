-- Multi-favorite test kits/methods (starred). Instruments defaults on but can be unstarred.
alter table public.tanks
  add column if not exists favorite_test_kits text[] not null default array['instruments']::text[];

update public.tanks
set favorite_test_kits = (
  select coalesce(array_agg(distinct kit), array['instruments']::text[])
  from unnest(
    array['instruments']::text[]
    || coalesce(favorite_test_kits, array[]::text[])
    || case
         when default_test_kit is not null and default_test_kit <> ''
           then array[default_test_kit]
         else array[]::text[]
       end
  ) as kit
);

comment on column public.tanks.favorite_test_kits is 'Starred kit/method ids for Tests; instruments is default when unset but can be unstarred.';
