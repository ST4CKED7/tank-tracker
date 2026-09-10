alter table public.tanks
  add column if not exists icon_color text not null default 'teal';

comment on column public.tanks.icon_color is 'Named palette key for tank icon badge color.';
