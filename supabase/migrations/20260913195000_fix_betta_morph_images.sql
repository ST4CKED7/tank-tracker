-- Every Betta splendens morph resolved to the same iNaturalist photo, so the
-- crowntail / halfmoon / plakat cards looked identical. Pin a photo per morph
-- that actually shows the finnage the card describes.
update public.species_catalog
set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Bojownik_syjamski.jpg/500px-Bojownik_syjamski.jpg'
where slug = 'betta' and owner_id is null;

update public.species_catalog
set image_url = 'https://upload.wikimedia.org/wikipedia/commons/4/44/Hector_betta_splendens.jpg'
where slug = 'crowntail-betta' and owner_id is null;

update public.species_catalog
set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Betta_halfmoon.jpg/500px-Betta_halfmoon.jpg'
where slug = 'halfmoon-betta' and owner_id is null;

update public.species_catalog
set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/A_male_Plakat_%28short-finned_Siamese_fighting_fish%29.jpg/500px-A_male_Plakat_%28short-finned_Siamese_fighting_fish%29.jpg'
where slug = 'plakat-betta' and owner_id is null;

update public.species_catalog
set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Betta_imbellis_%28male%29_20100512.jpg/500px-Betta_imbellis_%28male%29_20100512.jpg'
where slug = 'betta-imbellis' and owner_id is null;

-- Let the client re-resolve any row still holding a shared betta photo.
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
    );
end;
$$;
