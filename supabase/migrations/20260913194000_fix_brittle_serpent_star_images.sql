-- Brittle star and serpent star were sharing the same Ophiocoma default photo.
update public.species_catalog
set image_url = 'https://inaturalist-open-data.s3.amazonaws.com/photos/104797444/medium.jpeg'
where slug = 'star-brittle' and owner_id is null;

update public.species_catalog
set image_url = 'https://inaturalist-open-data.s3.amazonaws.com/photos/15839847/medium.jpg'
where slug = 'serpent-star' and owner_id is null;

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
    );
end;
$$;
