-- Cache auto-resolved species thumbnails without opening full catalog updates.
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
    and (image_url is null or image_url = '');
end;
$$;

revoke all on function public.set_species_image(uuid, text) from public;
grant execute on function public.set_species_image(uuid, text) to authenticated;
