CREATE OR REPLACE FUNCTION get_application_by_id(p_app_id UUID)
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
  WHERE a.id = p_app_id;
END;
$$;
