-- Current fish length for growing bioload as animals grow.
alter table public.livestock
  add column if not exists current_length_inches numeric;

comment on column public.livestock.current_length_inches is 'Current fish length in inches; used for bioload. Null falls back to species adult length.';
