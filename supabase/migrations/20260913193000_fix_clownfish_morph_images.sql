-- Fix clown morph / lookalike thumbnails that resolved to the same orange ocellaris photo.
update public.species_catalog set image_url = 'https://inaturalist-open-data.s3.amazonaws.com/photos/375609126/medium.jpeg'
where slug = 'black-ocellaris-clownfish' and owner_id is null;

update public.species_catalog set image_url = 'https://upload.wikimedia.org/wikipedia/commons/6/68/Black_storm_Clownfish.jpg'
where slug = 'black-ice-clownfish' and owner_id is null;

update public.species_catalog set image_url = 'https://upload.wikimedia.org/wikipedia/commons/a/af/Black_storm_Clownfish_among_coral.jpg'
where slug = 'snowflake-clownfish' and owner_id is null;

update public.species_catalog set image_url = 'https://static.inaturalist.org/photos/8164741/medium.jpg'
where slug = 'frostbite-clownfish' and owner_id is null;

update public.species_catalog set image_url = 'https://upload.wikimedia.org/wikipedia/commons/0/08/Amphiprion_percula_1.jpg'
where slug = 'percula-clownfish' and owner_id is null;

update public.species_catalog set image_url = 'https://inaturalist-open-data.s3.amazonaws.com/photos/9045216/medium.jpg'
where slug = 'ocellaris-clownfish' and owner_id is null;

-- Allow correcting previously cached wrong clown morph thumbnails.
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
    );
end;
$$;
