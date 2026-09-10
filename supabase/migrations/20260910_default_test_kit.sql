-- Per-tank preferred test kit for the Log Tests flow.
alter table public.tanks
  add column if not exists default_test_kit text;
