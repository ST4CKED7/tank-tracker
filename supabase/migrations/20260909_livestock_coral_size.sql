-- Coral size on livestock for bioload weighting.
create type public.coral_size as enum ('frag', 'small', 'colony');

alter table public.livestock
  add column if not exists coral_size public.coral_size;

comment on column public.livestock.coral_size is 'Size class for coral livestock; null for fish/inverts.';
