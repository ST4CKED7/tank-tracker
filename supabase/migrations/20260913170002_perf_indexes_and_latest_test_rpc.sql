-- Indexes to remove RLS/user scans and speed catalog + last-test lookups
create index if not exists test_logs_user_tank_tested_idx on public.test_logs (user_id, tank_id, tested_at desc);
create index if not exists livestock_species_idx on public.livestock (species_id);
create index if not exists species_catalog_owner_idx on public.species_catalog (owner_id) where owner_id is not null;
create index if not exists species_catalog_water_category_idx on public.species_catalog (water_type, category);
create index if not exists test_logs_tank_param_tested_idx on public.test_logs (tank_id, parameter, tested_at desc);

-- Single-query latest test timestamp per tank (replaces one query per tank)
create or replace function public.latest_test_per_tank()
returns table (tank_id uuid, tested_at timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  select distinct on (t.tank_id) t.tank_id, t.tested_at
  from public.test_logs t
  where t.user_id = auth.uid()
  order by t.tank_id, t.tested_at desc
$$;

grant execute on function public.latest_test_per_tank() to authenticated;
