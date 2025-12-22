-- =====================================================
-- SECURITY FIX: Fix alerts exposure, transactions protection, and add documentation
-- =====================================================

-- 1. FIX ALERTS TABLE EXPOSURE
-- Remove overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view alerts" ON public.alerts;

-- Admins can view all alerts
CREATE POLICY "Admins can view all alerts"
ON public.alerts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Attendants can view alerts for their assigned lots
CREATE POLICY "Attendants view their lot alerts"
ON public.alerts
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'attendant') AND
  lot_id IN (
    SELECT assigned_lot_id 
    FROM public.user_roles 
    WHERE user_id = auth.uid()
  )
);

-- 2. ADD EXPLICIT UPDATE/DELETE POLICIES FOR TRANSACTIONS
-- Only admins can update transactions (for corrections)
CREATE POLICY "Admins can update transactions"
ON public.transactions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete transactions (for corrections)
CREATE POLICY "Admins can delete transactions"
ON public.transactions
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. ADD EXPLICIT UPDATE/DELETE POLICIES FOR SENSOR_LOGS
-- Prevent any updates to sensor logs (audit trail integrity)
CREATE POLICY "No one can update sensor logs"
ON public.sensor_logs
FOR UPDATE
TO authenticated
USING (false);

-- Only admins can delete sensor logs
CREATE POLICY "Admins can delete sensor logs"
ON public.sensor_logs
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. ADD EXPLICIT DELETE POLICY FOR ALERTS
-- Only admins can delete alerts
CREATE POLICY "Admins can delete alerts"
ON public.alerts
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 5. ADD SECURITY DOCUMENTATION TO HAS_ROLE FUNCTION
COMMENT ON FUNCTION public.has_role(UUID, app_role) IS 
'SECURITY DEFINER function used in RLS policies to check user roles.
SECURITY CRITICAL - DO NOT MODIFY without thorough security review.
Must maintain: fixed search_path, no dynamic SQL, parameterized queries only.
This function bypasses RLS on user_roles table by design.';