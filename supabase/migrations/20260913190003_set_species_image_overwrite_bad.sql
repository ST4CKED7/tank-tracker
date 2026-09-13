-- Allow correcting previously cached wrong thumbnails (Turbo plant, Capnella stonefly, etc.).
create or replace function public.set_species_image(p_id uuid, p_url text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_url is null or length(trim(p_url)) = 0 then
    return;
  end if;
  update public.species_catalog
  set image_url = p_url
  where id = p_id
    and owner_id is null
    and (
      image_url is null
      or image_url = ''
      or image_url like '%39295509%'
      or image_url like '%3027303%'
      or image_url like '%29616601%'
    );
end;
$$;
