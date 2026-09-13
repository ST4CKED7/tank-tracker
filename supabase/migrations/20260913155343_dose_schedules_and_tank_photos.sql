-- Scheduled dosing plans (mirror equipment service cadence)
create table if not exists public.dose_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tank_id uuid not null references public.tanks (id) on delete cascade,
  product text not null,
  amount numeric not null,
  unit text not null default 'ml',
  target_parameter text,
  every_days integer not null default 1 check (every_days >= 1),
  last_dosed_at date,
  starts_at date,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists dose_schedules_tank_id_idx on public.dose_schedules (tank_id);
create index if not exists dose_schedules_user_id_idx on public.dose_schedules (user_id);

alter table public.dose_schedules enable row level security;

create policy dose_schedules_select on public.dose_schedules
  for select using (user_id = auth.uid());
create policy dose_schedules_insert on public.dose_schedules
  for insert with check (user_id = auth.uid());
create policy dose_schedules_update on public.dose_schedules
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy dose_schedules_delete on public.dose_schedules
  for delete using (user_id = auth.uid());

-- Tank photo timeline
create table if not exists public.tank_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tank_id uuid not null references public.tanks (id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  caption text,
  taken_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists tank_photos_tank_id_idx on public.tank_photos (tank_id, taken_at desc);
create index if not exists tank_photos_user_id_idx on public.tank_photos (user_id);

alter table public.tank_photos enable row level security;

create policy tank_photos_select on public.tank_photos
  for select using (user_id = auth.uid());
create policy tank_photos_insert on public.tank_photos
  for insert with check (user_id = auth.uid());
create policy tank_photos_update on public.tank_photos
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy tank_photos_delete on public.tank_photos
  for delete using (user_id = auth.uid());

-- Storage bucket for tank photos (public read; owner write)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tank-photos',
  'tank-photos',
  true,
  5242880,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy tank_photos_storage_select on storage.objects
  for select using (bucket_id = 'tank-photos');

create policy tank_photos_storage_insert on storage.objects
  for insert with check (
    bucket_id = 'tank-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy tank_photos_storage_update on storage.objects
  for update using (
    bucket_id = 'tank-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'tank-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy tank_photos_storage_delete on storage.objects
  for delete using (
    bucket_id = 'tank-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
