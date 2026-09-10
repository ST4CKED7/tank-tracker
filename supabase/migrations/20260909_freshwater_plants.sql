-- Add plant kind + freshwater plant catalog (applied remotely as add_species_kind_plant / seed_freshwater_plants)
alter type public.species_kind add value if not exists 'plant';

-- Plant seed SQL applied via migration seed_freshwater_plants (48 common aquarium plants).
