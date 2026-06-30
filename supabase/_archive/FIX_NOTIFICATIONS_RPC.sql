-- Fix create_notification permissions
-- Dropping and recreating ensuring SECURITY DEFINER is set

CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID, 
    p_typ TEXT, 
    p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Allows executing with privileges of the creator (usually postgres/service_role)
SET search_path = public -- Secure search_path
AS $$
BEGIN
  INSERT INTO notifications (user_id, typ, payload)
  VALUES (p_user_id, p_typ, p_payload);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_notification(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification(UUID, TEXT, JSONB) TO service_role;
