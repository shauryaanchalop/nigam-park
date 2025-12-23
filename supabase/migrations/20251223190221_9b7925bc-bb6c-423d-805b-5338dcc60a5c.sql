-- Add INSERT policy for sensor_logs - allow attendants to create sensor logs
CREATE POLICY "Attendants can create sensor logs"
ON public.sensor_logs
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'attendant') OR has_role(auth.uid(), 'admin')
);

-- Add INSERT policy for transactions - allow attendants to create transactions
CREATE POLICY "Attendants can create transactions"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'attendant') OR has_role(auth.uid(), 'admin')
);

-- Add UPDATE policy for parking_lots occupancy - allow attendants and admins to update
CREATE POLICY "Attendants can update occupancy"
ON public.parking_lots
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'attendant') OR has_role(auth.uid(), 'admin')
)
WITH CHECK (
  has_role(auth.uid(), 'attendant') OR has_role(auth.uid(), 'admin')
);

-- Add UPDATE policy for reservations status - allow attendants to update status
CREATE POLICY "Attendants can update reservation status"
ON public.reservations
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'attendant') OR has_role(auth.uid(), 'admin')
)
WITH CHECK (
  has_role(auth.uid(), 'attendant') OR has_role(auth.uid(), 'admin')
);