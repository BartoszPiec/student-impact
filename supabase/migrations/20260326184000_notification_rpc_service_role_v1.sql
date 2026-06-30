BEGIN;

CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_typ text,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF COALESCE(auth.role(), '') NOT IN ('service_role', 'supabase_service_role') THEN
    RAISE EXCEPTION 'Unauthorized: create_notification is server-only';
  END IF;

  INSERT INTO public.notifications (user_id, typ, payload)
  VALUES (p_user_id, p_typ, p_payload);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.create_notification(uuid, text, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_notification(uuid, text, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, jsonb) TO service_role;

COMMIT;
