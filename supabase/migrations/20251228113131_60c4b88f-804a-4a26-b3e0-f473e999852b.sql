-- Drop the overly permissive insert policy
DROP POLICY IF EXISTS "Service role can insert fines" ON public.user_fines;

-- Allow attendants to update reservations for check-in (when they scan QR)
CREATE POLICY "Attendants can update reservations for their lot"
ON public.reservations
FOR UPDATE
USING (
  has_role(auth.uid(), 'attendant'::app_role) 
  AND lot_id IN (
    SELECT assigned_lot_id FROM user_roles WHERE user_id = auth.uid()
  )
);