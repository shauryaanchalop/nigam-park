-- =====================================================
-- DEMO MODE: Create function to setup demo users
-- =====================================================

-- Create a function that returns demo user credentials
-- Demo users will be created on first login attempt
CREATE OR REPLACE FUNCTION public.get_demo_credentials()
RETURNS TABLE (
  demo_role text,
  demo_email text,
  demo_password text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 'admin'::text, 'demo.admin@nigampark.gov.in'::text, 'DemoAdmin123!'::text
  UNION ALL
  SELECT 'attendant'::text, 'demo.attendant@nigampark.gov.in'::text, 'DemoAttendant123!'::text
  UNION ALL
  SELECT 'citizen'::text, 'demo.citizen@nigampark.gov.in'::text, 'DemoCitizen123!'::text;
$$;

-- Grant execute to public so anyone can get demo credentials
GRANT EXECUTE ON FUNCTION public.get_demo_credentials() TO public;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_demo_credentials() IS 
'Returns demo user credentials for testing purposes. 
These are well-known test accounts - do not use for real data.';