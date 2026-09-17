-- Follow-up to 20260917023421. Dropping test_logs_user_tank_tested_idx removed
-- the only index whose leading column was test_logs.user_id, which left the
-- test_logs_user_id_fkey constraint uncovered. A single-column index covers the
-- foreign key at a fraction of the size of the three-column one it replaces.

create index if not exists test_logs_user_id_idx on public.test_logs (user_id);
