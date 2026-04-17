-- 20260417220000_deactivate_most_system_packages.sql
-- Keep only selected system packages active during iterative rebuild.

DO $$
DECLARE
  keep_package_ids uuid[] := ARRAY[
    '5de0e9f6-3768-4732-987b-5c0073591646'::uuid, -- Projekt Logo
    'c9fea07e-ba17-4dba-b15e-5b045cd267db'::uuid, -- Miesieczny Pakiet Social Media
    'd2c5a96c-e955-440b-bd29-d94e96aadcc5'::uuid  -- Setup email marketingu
  ];
BEGIN
  -- Hide most system packages from catalog (service_packages status drives visibility).
  UPDATE public.service_packages
  SET status = 'inactive',
      updated_at = now()
  WHERE coalesce(is_system, false) = true
    AND status = 'active'
    AND id <> ALL(keep_package_ids);

  -- Close only currently published platform offers tied to deactivated packages.
  -- We do not touch in_progress/closed offers to avoid impacting active workflows.
  UPDATE public.offers
  SET status = 'closed',
      updated_at = now()
  WHERE coalesce(is_platform_service, false) = true
    AND status = 'published'
    AND service_package_id IS NOT NULL
    AND service_package_id <> ALL(keep_package_ids);
END $$;
