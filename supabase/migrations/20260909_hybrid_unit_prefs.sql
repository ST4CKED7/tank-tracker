alter table public.tanks
  add column if not exists volume_unit text not null default 'gal',
  add column if not exists temp_unit text not null default 'F',
  add column if not exists length_unit text not null default 'in';

alter table public.tanks
  drop constraint if exists tanks_volume_unit_check,
  drop constraint if exists tanks_temp_unit_check,
  drop constraint if exists tanks_length_unit_check;

alter table public.tanks
  add constraint tanks_volume_unit_check check (volume_unit in ('gal', 'L')),
  add constraint tanks_temp_unit_check check (temp_unit in ('F', 'C')),
  add constraint tanks_length_unit_check check (length_unit in ('in', 'cm'));

update public.tanks
set
  volume_unit = case when unit_system = 'metric' then 'L' else 'gal' end,
  temp_unit = case when unit_system = 'metric' then 'C' else 'F' end,
  length_unit = case when unit_system = 'metric' then 'cm' else 'in' end;

comment on column public.tanks.volume_unit is 'Display/input unit for volume: gal or L';
comment on column public.tanks.temp_unit is 'Display/input unit for temperature: F or C';
comment on column public.tanks.length_unit is 'Display/input unit for length: in or cm';
