-- =====================================================
-- SECURITY FIX: Comprehensive RLS policy improvements
-- =====================================================

-- 1. FIX SENSOR_LOGS EXPOSURE
-- Remove overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view sensor logs" ON public.sensor_logs;

-- Admins can view all sensor logs
CREATE POLICY "Admins can view all sensor logs"
ON public.sensor_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Attendants can view sensor logs for their assigned lots
CREATE POLICY "Attendants view their lot sensor logs"
ON public.sensor_logs
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

-- 2. FIX UNRESTRICTED INSERTS
-- Remove overly permissive INSERT policies
DROP POLICY IF EXISTS "System can insert sensor logs" ON public.sensor_logs;
DROP POLICY IF EXISTS "System can insert alerts" ON public.alerts;

-- Only admins and attendants can insert sensor logs
CREATE POLICY "Admins and attendants insert sensor logs"
ON public.sensor_logs
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'attendant')
);

-- Only admins and attendants can insert alerts
CREATE POLICY "Admins and attendants insert alerts"
ON public.alerts
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'attendant')
);

-- 3. FIX USER ROLE SELF-ASSIGNMENT (PRIVILEGE ESCALATION)
-- Remove dangerous policies that allow users to set their own roles
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update their own role" ON public.user_roles;

-- Only admins can manually insert roles (except via trigger)
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update roles
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. CREATE TRIGGER TO AUTO-ASSIGN CITIZEN ROLE ON SIGNUP
-- This function will be called by the trigger on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Automatically assign 'citizen' role to new users
  -- This bypasses RLS since it's SECURITY DEFINER
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'citizen')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-assign role on user creation
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- 5. ADD DATABASE CONSTRAINTS FOR INPUT VALIDATION
-- Add check constraint for positive transaction amounts
ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS valid_amount;

ALTER TABLE public.transactions
ADD CONSTRAINT valid_amount CHECK (amount > 0 AND amount <= 100000);

-- Add check constraint for vehicle number format (Indian format)
ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS valid_vehicle_number;

ALTER TABLE public.transactions
ADD CONSTRAINT valid_vehicle_number CHECK (
  vehicle_number ~ '^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$'
);

-- Add check constraint for profile name length
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS valid_name_length;

ALTER TABLE public.profiles
ADD CONSTRAINT valid_name_length CHECK (
  full_name IS NULL OR LENGTH(full_name) <= 100
);

-- Add check constraint for valid payment methods
ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS valid_payment_method;

ALTER TABLE public.transactions
ADD CONSTRAINT valid_payment_method CHECK (
  payment_method IN ('FASTag', 'Cash', 'UPI')
);

-- Add check constraint for valid transaction status
ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS valid_status;

ALTER TABLE public.transactions
ADD CONSTRAINT valid_status CHECK (
  status IN ('pending', 'completed', 'failed')
);