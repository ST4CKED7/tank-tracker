-- Performance pass from the Supabase database linter. No behaviour changes.
--
-- 1. RLS policies re-evaluated auth.uid() once per row. Wrapping the call in a
--    scalar subquery lets Postgres hoist it into an InitPlan and run it once per
--    query. ALTER POLICY is used (rather than drop/create) so the command and
--    role grants on each policy stay exactly as they are.
-- 2. Four foreign keys on user_id had no covering index.
-- 3. Four indexes have never been scanned and are redundant.

-- ── 1. auth.uid() → (select auth.uid()) ─────────────────────────────────────

alter policy tanks_select on public.tanks using (user_id = (select auth.uid()));
alter policy tanks_insert on public.tanks with check (user_id = (select auth.uid()));
alter policy tanks_update on public.tanks
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
alter policy tanks_delete on public.tanks using (user_id = (select auth.uid()));

alter policy test_logs_select on public.test_logs using (user_id = (select auth.uid()));
alter policy test_logs_insert on public.test_logs with check (user_id = (select auth.uid()));
alter policy test_logs_update on public.test_logs
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
alter policy test_logs_delete on public.test_logs using (user_id = (select auth.uid()));

alter policy water_changes_select on public.water_changes using (user_id = (select auth.uid()));
alter policy water_changes_insert on public.water_changes with check (user_id = (select auth.uid()));
alter policy water_changes_update on public.water_changes
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
alter policy water_changes_delete on public.water_changes using (user_id = (select auth.uid()));

alter policy dose_logs_select on public.dose_logs using (user_id = (select auth.uid()));
alter policy dose_logs_insert on public.dose_logs with check (user_id = (select auth.uid()));
alter policy dose_logs_update on public.dose_logs
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
alter policy dose_logs_delete on public.dose_logs using (user_id = (select auth.uid()));

alter policy dose_schedules_select on public.dose_schedules using (user_id = (select auth.uid()));
alter policy dose_schedules_insert on public.dose_schedules with check (user_id = (select auth.uid()));
alter policy dose_schedules_update on public.dose_schedules
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
alter policy dose_schedules_delete on public.dose_schedules using (user_id = (select auth.uid()));

alter policy equipment_select on public.equipment using (user_id = (select auth.uid()));
alter policy equipment_insert on public.equipment with check (user_id = (select auth.uid()));
alter policy equipment_update on public.equipment
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
alter policy equipment_delete on public.equipment using (user_id = (select auth.uid()));

alter policy livestock_select on public.livestock using (user_id = (select auth.uid()));
alter policy livestock_insert on public.livestock with check (user_id = (select auth.uid()));
alter policy livestock_update on public.livestock
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
alter policy livestock_delete on public.livestock using (user_id = (select auth.uid()));

alter policy tank_photos_select on public.tank_photos using (user_id = (select auth.uid()));
alter policy tank_photos_insert on public.tank_photos with check (user_id = (select auth.uid()));
alter policy tank_photos_update on public.tank_photos
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
alter policy tank_photos_delete on public.tank_photos using (user_id = (select auth.uid()));

alter policy parameter_reminders_select on public.parameter_reminders using (user_id = (select auth.uid()));
alter policy parameter_reminders_insert on public.parameter_reminders with check (user_id = (select auth.uid()));
alter policy parameter_reminders_update on public.parameter_reminders
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
alter policy parameter_reminders_delete on public.parameter_reminders using (user_id = (select auth.uid()));

alter policy tank_shares_select on public.tank_shares using (user_id = (select auth.uid()));
alter policy tank_shares_insert on public.tank_shares with check (user_id = (select auth.uid()));
alter policy tank_shares_update on public.tank_shares
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
alter policy tank_shares_delete on public.tank_shares using (user_id = (select auth.uid()));

-- species_catalog is keyed on owner_id; seeded rows have owner_id is null and
-- stay readable by everyone signed in.
alter policy species_select on public.species_catalog
  using ((owner_id is null) or (owner_id = (select auth.uid())));
alter policy species_insert on public.species_catalog with check (owner_id = (select auth.uid()));
alter policy species_update on public.species_catalog
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
alter policy species_delete on public.species_catalog using (owner_id = (select auth.uid()));

-- ── 2. Cover the user_id foreign keys ───────────────────────────────────────
-- These serve referential integrity (e.g. cascading an auth.users delete), not
-- app queries, which all filter by tank_id.

create index if not exists dose_logs_user_id_idx on public.dose_logs (user_id);
create index if not exists equipment_user_id_idx on public.equipment (user_id);
create index if not exists livestock_user_id_idx on public.livestock (user_id);
create index if not exists water_changes_user_id_idx on public.water_changes (user_id);

-- ── 3. Drop indexes that have never been scanned ────────────────────────────
-- Superseded by test_logs_tank_tested_idx (tank_id, tested_at desc), which the
-- planner uses instead: every reading query filters by tank, and latest-per-
-- parameter grouping happens in the app rather than in SQL.
drop index if exists public.test_logs_user_tank_tested_idx;
drop index if exists public.test_logs_tank_param_tested_idx;

-- No query filters on species_catalog.category — the ask/compatibility engines
-- read it in JS after fetching. species_catalog_water_type_idx covers the
-- water_type filter that queries do use.
drop index if exists public.species_catalog_water_category_idx;

-- tanks holds a handful of rows per user and is never filtered by water_type.
drop index if exists public.tanks_water_type_idx;
