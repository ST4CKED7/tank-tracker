alter table public.tanks
  add column if not exists icon text not null default 'waves';

comment on column public.tanks.icon is 'Lucide icon key for tank switcher / settings.';
