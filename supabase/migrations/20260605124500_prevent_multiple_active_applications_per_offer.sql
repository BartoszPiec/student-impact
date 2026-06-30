BEGIN;

CREATE OR REPLACE FUNCTION public.prevent_multiple_active_applications_per_offer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_platform_service boolean;
BEGIN
  IF NEW.offer_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF COALESCE(NEW.status, '') NOT IN ('accepted', 'in_progress', 'completed') THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(NEW.offer_id::text));

  SELECT COALESCE(o.is_platform_service, false)
  INTO v_is_platform_service
  FROM public.offers o
  WHERE o.id = NEW.offer_id;

  IF COALESCE(v_is_platform_service, false) = true THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.applications a
    WHERE a.offer_id = NEW.offer_id
      AND a.id <> NEW.id
      AND a.status IN ('accepted', 'in_progress', 'completed')
  ) THEN
    RAISE EXCEPTION 'To zlecenie ma juz zaakceptowanego wykonawce.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_multiple_active_applications_per_offer ON public.applications;

CREATE TRIGGER prevent_multiple_active_applications_per_offer
BEFORE INSERT OR UPDATE OF status, offer_id
ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.prevent_multiple_active_applications_per_offer();

COMMIT;
