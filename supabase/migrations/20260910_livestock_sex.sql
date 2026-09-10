-- Sex on livestock entries (male / female / unknown / mixed for groups).
create type public.livestock_sex as enum ('male', 'female', 'unknown', 'mixed');

alter table public.livestock
  add column if not exists sex public.livestock_sex not null default 'unknown';

comment on column public.livestock.sex is 'Sex of this livestock entry: male, female, unknown, or mixed (group).';
