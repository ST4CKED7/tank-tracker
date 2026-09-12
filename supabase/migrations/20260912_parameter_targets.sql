-- Per-tank custom chemistry target windows (storage units: °F, ppt, dKH, ppm).
alter table public.tanks
  add column if not exists parameter_targets jsonb not null default '{}'::jsonb;

comment on column public.tanks.parameter_targets is
  'Per-parameter custom target windows { param: { min, max } } in storage units; empty means use livestock/typical defaults.';
