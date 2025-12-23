-- Drop duplicate policies that were just created (existing policies already handle this)
DROP POLICY IF EXISTS "Attendants can create sensor logs" ON public.sensor_logs;
DROP POLICY IF EXISTS "Attendants can create transactions" ON public.transactions;
DROP POLICY IF EXISTS "Attendants can update occupancy" ON public.parking_lots;
DROP POLICY IF EXISTS "Attendants can update reservation status" ON public.reservations;