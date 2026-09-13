create table if not exists public.parameter_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tank_id uuid not null references public.tanks (id) on delete cascade,
  parameter text not null,
  every_days integer not null default 7 check (every_days >= 1),
  created_at timestamptz not null default now(),
  unique (tank_id, parameter)
);

create index if not exists parameter_reminders_tank_idx on public.parameter_reminders (tank_id);
create index if not exists parameter_reminders_user_idx on public.parameter_reminders (user_id);

alter table public.parameter_reminders enable row level security;

create policy parameter_reminders_select on public.parameter_reminders
  for select using (user_id = auth.uid());
create policy parameter_reminders_insert on public.parameter_reminders
  for insert with check (user_id = auth.uid());
create policy parameter_reminders_update on public.parameter_reminders
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy parameter_reminders_delete on public.parameter_reminders
  for delete using (user_id = auth.uid());
