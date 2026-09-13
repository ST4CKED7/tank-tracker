alter table public.tanks
  add column if not exists icon_photo_url text;

comment on column public.tanks.icon_photo_url is
  'Optional public URL for a custom tank icon photo; when set, UI shows it instead of the Lucide glyph.';
