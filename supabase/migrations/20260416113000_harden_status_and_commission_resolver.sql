BEGIN;

CREATE OR REPLACE FUNCTION public.resolve_commission_rate(
  p_source_type text,
  p_offer_type text DEFAULT NULL,
  p_is_platform_service boolean DEFAULT false
)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $function$
  SELECT public.default_commission_rate(
    p_source_type,
    p_offer_type,
    COALESCE(p_is_platform_service, false)
  );
$function$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.service_orders'::regclass
      AND conname = 'service_orders_status_check'
  ) THEN
    ALTER TABLE public.service_orders
      DROP CONSTRAINT service_orders_status_check;
  END IF;
END
$$;

ALTER TABLE public.service_orders
  ADD CONSTRAINT service_orders_status_check
  CHECK (
    status IN (
      'inquiry',
      'pending',
      'pending_selection',
      'pending_student_confirmation',
      'pending_confirmation',
      'proposal_sent',
      'sent',
      'countered',
      'accepted',
      'active',
      'in_progress',
      'revision',
      'delivered',
      'completed',
      'rejected',
      'cancelled',
      'disputed'
    )
  );

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.applications'::regclass
      AND conname = 'applications_status_check'
  ) THEN
    ALTER TABLE public.applications
      DROP CONSTRAINT applications_status_check;
  END IF;
END
$$;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_status_check
  CHECK (
    status IN (
      'sent',
      'countered',
      'accepted',
      'rejected',
      'withdrawn',
      'in_progress',
      'completed',
      'cancelled'
    )
  );

COMMIT;
