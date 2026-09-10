alter table public.tanks
  add column if not exists color_theme text not null default 'ocean';

comment on column public.tanks.color_theme is 'UI color theme id (ocean, lagoon, …); light/dark still via next-themes.';
