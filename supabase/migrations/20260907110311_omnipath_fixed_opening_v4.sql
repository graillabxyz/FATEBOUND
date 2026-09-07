-- Keep stable collectible IDs and ownership; align catalog with the fixed opening rules cohort.
update public.content_catalog
set version = 4,
    definition = case when definition ? 'mechanicalVersion'
      then jsonb_set(definition, '{mechanicalVersion}', '4'::jsonb)
      else definition end;
