-- 20260417221500_deactivate_legacy_platform_service_packages.sql
-- Cleanup relics: old platform_service packages with is_system=false still visible in company catalog.

DO $$
DECLARE
  keep_package_ids uuid[] := ARRAY[
    '5de0e9f6-3768-4732-987b-5c0073591646'::uuid, -- Projekt Logo
    'c9fea07e-ba17-4dba-b15e-5b045cd267db'::uuid, -- Miesieczny Pakiet Social Media
    'd2c5a96c-e955-440b-bd29-d94e96aadcc5'::uuid  -- Setup email marketingu
  ];
BEGIN
  -- Deactivate all active platform_service packages except the explicit keep-list.
  UPDATE public.service_packages
  SET status = 'inactive',
      updated_at = now()
  WHERE status = 'active'
    AND type = 'platform_service'
    AND id <> ALL(keep_package_ids);

  -- Defensive sync for legacy platform offers tied to deactivated packages.
  UPDATE public.offers
  SET status = 'closed',
      updated_at = now()
  WHERE coalesce(is_platform_service, false) = true
    AND status = 'published'
    AND (
      service_package_id IS NULL
      OR service_package_id <> ALL(keep_package_ids)
    );
END $$;
