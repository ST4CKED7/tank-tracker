-- Read-only public sharing of a tank (photos, livestock, parameters) via an unguessable token.
create table if not exists public.tank_shares (
  id uuid primary key default gen_random_uuid(),
  tank_id uuid not null unique references public.tanks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists tank_shares_user_idx on public.tank_shares (user_id);

alter table public.tank_shares enable row level security;

create policy tank_shares_select on public.tank_shares
  for select using (user_id = auth.uid());
create policy tank_shares_insert on public.tank_shares
  for insert with check (user_id = auth.uid());
create policy tank_shares_update on public.tank_shares
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy tank_shares_delete on public.tank_shares
  for delete using (user_id = auth.uid());

-- Security-definer read: returns a safe, read-only bundle for a valid share token, else null.
create or replace function public.get_shared_tank(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with s as (
    select tank_id from public.tank_shares where token = p_token limit 1
  )
  select case when not exists (select 1 from s) then null else jsonb_build_object(
    'tank', (
      select jsonb_build_object(
        'name', t.name,
        'gallons', t.gallons,
        'water_type', t.water_type,
        'tank_type', t.tank_type,
        'icon', t.icon,
        'icon_color', t.icon_color,
        'icon_photo_url', t.icon_photo_url,
        'has_sump', t.has_sump,
        'sump_gallons', t.sump_gallons,
        'volume_unit', t.volume_unit,
        'temp_unit', t.temp_unit,
        'length_unit', t.length_unit,
        'unit_system', t.unit_system,
        'created_at', t.created_at
      )
      from public.tanks t where t.id = (select tank_id from s)
    ),
    'livestock', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', l.id,
        'quantity', l.quantity,
        'nickname', l.nickname,
        'coral_size', l.coral_size,
        'sex', l.sex,
        'current_length_inches', l.current_length_inches,
        'added_on', l.added_on,
        'species', jsonb_build_object(
          'common_name', sp.common_name,
          'scientific_name', sp.scientific_name,
          'kind', sp.kind,
          'category', sp.category,
          'image_url', sp.image_url,
          'adult_length_inches', sp.adult_length_inches,
          'temp_min', sp.temp_min,
          'temp_max', sp.temp_max
        )
      ) order by l.added_on desc), '[]'::jsonb)
      from public.livestock l
      join public.species_catalog sp on sp.id = l.species_id
      where l.tank_id = (select tank_id from s)
    ),
    'photos', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', p.id, 'public_url', p.public_url, 'caption', p.caption, 'taken_at', p.taken_at
      ) order by p.taken_at desc), '[]'::jsonb)
      from public.tank_photos p where p.tank_id = (select tank_id from s)
    ),
    'tests', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'parameter', x.parameter, 'value', x.value, 'unit', x.unit, 'tested_at', x.tested_at
      ) order by x.tested_at desc), '[]'::jsonb)
      from (
        select parameter, value, unit, tested_at
        from public.test_logs
        where tank_id = (select tank_id from s)
        order by tested_at desc
        limit 300
      ) x
    )
  ) end
$$;

grant execute on function public.get_shared_tank(text) to anon, authenticated;
