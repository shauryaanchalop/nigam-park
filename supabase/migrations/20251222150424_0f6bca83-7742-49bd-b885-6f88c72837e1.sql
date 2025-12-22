-- =====================================================
-- SECURITY FIX: Restrict transactions and profiles access
-- =====================================================

-- 1. FIX TRANSACTIONS TABLE EXPOSURE
-- Remove overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view transactions" ON public.transactions;

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Attendants can view transactions for their assigned lots
CREATE POLICY "Attendants view their lot transactions"
ON public.transactions
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

-- 2. FIX PROFILES TABLE EXPOSURE
-- Remove overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Users can only view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all profiles (for user management)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));