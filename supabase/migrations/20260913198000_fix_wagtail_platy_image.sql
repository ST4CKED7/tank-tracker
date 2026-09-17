-- "Wagtail platy" resolved to a wagtail bird instead of the fish. Pin a wagtail
-- variety of Xiphophorus maculatus (pale body, black tail and fins).
update public.species_catalog
set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Gold_crescent_platy.JPG/500px-Gold_crescent_platy.JPG'
where slug = 'wagtail-platy' and owner_id is null;

-- Let the client re-resolve any row still holding the bird photo.
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
      or image_url like '%Clown_fish_in_the_Andaman_Coral_Reef%'
      or image_url like '%photos/9045216%'
      or image_url like '%photos/28590571%'
      or image_url like '%photos/564865375%'
      or image_url like '%photos/564865351%'
      or image_url like '%photos/36931664%'
      or image_url like '%photos/13015850%'
    );
end;
$$;
