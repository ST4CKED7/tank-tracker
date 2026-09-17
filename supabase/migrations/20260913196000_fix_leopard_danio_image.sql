-- Leopard danio is a spotted morph of Danio rerio, so it resolved to the same
-- striped zebra danio photo. Pin a spotted specimen; zebra danio keeps its own.
update public.species_catalog
set image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Leopard_Danio_%284050116019%29.jpg/500px-Leopard_Danio_%284050116019%29.jpg'
where slug = 'leopard-danio' and owner_id is null;
