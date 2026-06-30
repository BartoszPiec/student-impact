-- Drop old function signature just in case
DROP FUNCTION IF EXISTS get_application_by_id(UUID);
DROP FUNCTION IF EXISTS get_application_by_id(TEXT);

-- Re-create with TEXT input and explicit permissions
CREATE OR REPLACE FUNCTION get_application_by_id(p_app_id TEXT)
RETURNS TABLE (
  id UUID,
  status TEXT,
  proposed_stawka NUMERIC,
  counter_stawka NUMERIC,
  agreed_stawka NUMERIC,
  cancelled_at TIMESTAMPTZ,
  offer_id UUID,
  package_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.status,
    a.proposed_stawka,
    a.counter_stawka,
    a.agreed_stawka,
    a.cancelled_at,
    a.offer_id,
    a.package_id
  FROM applications a
  WHERE a.id = p_app_id::UUID;
END;
$$;

-- Grant permissions explicitly
GRANT EXECUTE ON FUNCTION get_application_by_id(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_application_by_id(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_application_by_id(TEXT) TO public; -- Just to be sure
