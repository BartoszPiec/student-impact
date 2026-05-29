-- Student2Work: harden single-instance company offer lifecycle.
-- System services (offers.is_platform_service = true) may stay open for many students.
-- Company-created offers, including typ = micro, must close or move in_progress after one accepted realization.

UPDATE public.offers o
SET status = 'closed'
WHERE COALESCE(o.is_platform_service, false) = false
  AND o.status <> 'closed'
  AND EXISTS (
    SELECT 1
    FROM public.applications a
    WHERE a.offer_id = o.id
      AND a.status = 'completed'
  );

UPDATE public.offers o
SET status = 'closed'
WHERE COALESCE(o.is_platform_service, false) = false
  AND o.status <> 'closed'
  AND EXISTS (
    SELECT 1
    FROM public.applications a
    JOIN public.contracts c ON c.application_id = a.id
    WHERE a.offer_id = o.id
      AND c.status = 'completed'
  );

UPDATE public.offers o
SET status = 'closed'
WHERE COALESCE(o.is_platform_service, false) = false
  AND o.status <> 'closed'
  AND EXISTS (
    SELECT 1
    FROM public.applications a
    JOIN public.deliverables d ON d.application_id = a.id
    WHERE a.offer_id = o.id
      AND d.status IN ('accepted', 'approved', 'completed', 'released')
  );

UPDATE public.offers o
SET status = 'in_progress'
WHERE COALESCE(o.is_platform_service, false) = false
  AND o.status = 'published'
  AND EXISTS (
    SELECT 1
    FROM public.applications a
    WHERE a.offer_id = o.id
      AND a.status IN ('accepted', 'in_progress')
  );

CREATE OR REPLACE FUNCTION public.sync_single_instance_offer_status(p_offer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_platform_service boolean;
BEGIN
  SELECT COALESCE(is_platform_service, false)
  INTO v_is_platform_service
  FROM public.offers
  WHERE id = p_offer_id;

  IF v_is_platform_service IS NULL OR v_is_platform_service = true THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.applications a
    WHERE a.offer_id = p_offer_id
      AND a.status = 'completed'
  ) OR EXISTS (
    SELECT 1
    FROM public.applications a
    JOIN public.contracts c ON c.application_id = a.id
    WHERE a.offer_id = p_offer_id
      AND c.status = 'completed'
  ) OR EXISTS (
    SELECT 1
    FROM public.applications a
    JOIN public.deliverables d ON d.application_id = a.id
    WHERE a.offer_id = p_offer_id
      AND d.status IN ('accepted', 'approved', 'completed', 'released')
  ) THEN
    UPDATE public.offers
    SET status = 'closed'
    WHERE id = p_offer_id
      AND status <> 'closed';
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.applications a
    WHERE a.offer_id = p_offer_id
      AND a.status IN ('accepted', 'in_progress')
  ) THEN
    UPDATE public.offers
    SET status = 'in_progress'
    WHERE id = p_offer_id
      AND status = 'published';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_sync_single_instance_offer_from_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.offer_id IS NOT NULL THEN
    PERFORM public.sync_single_instance_offer_status(NEW.offer_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_single_instance_offer_from_application ON public.applications;
CREATE TRIGGER sync_single_instance_offer_from_application
AFTER INSERT OR UPDATE OF status, offer_id ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.trg_sync_single_instance_offer_from_application();

CREATE OR REPLACE FUNCTION public.trg_sync_single_instance_offer_from_contract()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer_id uuid;
BEGIN
  SELECT offer_id
  INTO v_offer_id
  FROM public.applications
  WHERE id = NEW.application_id;

  IF v_offer_id IS NOT NULL THEN
    PERFORM public.sync_single_instance_offer_status(v_offer_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_single_instance_offer_from_contract ON public.contracts;
CREATE TRIGGER sync_single_instance_offer_from_contract
AFTER INSERT OR UPDATE OF status, application_id ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.trg_sync_single_instance_offer_from_contract();

CREATE OR REPLACE FUNCTION public.trg_sync_single_instance_offer_from_deliverable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer_id uuid;
BEGIN
  SELECT offer_id
  INTO v_offer_id
  FROM public.applications
  WHERE id = NEW.application_id;

  IF v_offer_id IS NOT NULL THEN
    PERFORM public.sync_single_instance_offer_status(v_offer_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_single_instance_offer_from_deliverable ON public.deliverables;
CREATE TRIGGER sync_single_instance_offer_from_deliverable
AFTER INSERT OR UPDATE OF status, application_id ON public.deliverables
FOR EACH ROW
EXECUTE FUNCTION public.trg_sync_single_instance_offer_from_deliverable();

CREATE OR REPLACE FUNCTION public.prevent_reopen_locked_single_instance_offer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'published'
     AND OLD.status IS DISTINCT FROM NEW.status
     AND COALESCE(NEW.is_platform_service, false) = false
     AND EXISTS (
       SELECT 1
       FROM public.applications a
       WHERE a.offer_id = NEW.id
         AND a.status IN ('accepted', 'in_progress', 'completed')
     ) THEN
    RAISE EXCEPTION 'Cannot reopen offer with active or completed realization';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_reopen_locked_single_instance_offer ON public.offers;
CREATE TRIGGER prevent_reopen_locked_single_instance_offer
BEFORE UPDATE OF status ON public.offers
FOR EACH ROW
EXECUTE FUNCTION public.prevent_reopen_locked_single_instance_offer();
