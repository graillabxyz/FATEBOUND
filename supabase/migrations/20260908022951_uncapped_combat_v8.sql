-- Version 8 removes the combat round limit. No prices, ownership or Card effects change.
update public.content_catalog
set version = 8,
    definition = case when definition ? 'mechanicalVersion'
      then jsonb_set(definition, '{mechanicalVersion}', '8'::jsonb)
      else definition end
where enabled;
