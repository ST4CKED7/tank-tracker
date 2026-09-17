-- The three Poecilia sphenops rows shared one wild-type photo, so the black and
-- balloon morphs were indistinguishable from the base molly. Base molly keeps
-- the wild-type shot; the two morphs get photos that show what they look like.
update public.species_catalog
set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Molly_Black_Sail_fin_120_copy.jpg/500px-Molly_Black_Sail_fin_120_copy.jpg'
where slug = 'black-molly' and owner_id is null;

update public.species_catalog
set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Balloon_Molly_female.jpg/500px-Balloon_Molly_female.jpg'
where slug = 'balloon-molly' and owner_id is null;

-- Lyretail swordtail held an iNaturalist photo of a butterfly on a buddleia
-- (the observation was of the plant). Pin an actual lyretail Xiphophorus.
update public.species_catalog
set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Xiphophorus_hellerii_lyretail_female_pregnant_02.jpg/500px-Xiphophorus_hellerii_lyretail_female_pregnant_02.jpg'
where slug = 'lyretail-swordtail' and owner_id is null;

-- Let the client re-resolve any row still holding that butterfly photo.
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
    );
end;
$$;
