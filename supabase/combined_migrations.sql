-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'attendant', 'citizen');

-- Create user_roles table for role-based access
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    assigned_lot_id UUID,
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create parking_lots table
CREATE TABLE public.parking_lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    zone TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 100,
    current_occupancy INTEGER NOT NULL DEFAULT 0,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    hourly_rate INTEGER NOT NULL DEFAULT 20,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.parking_lots ENABLE ROW LEVEL SECURITY;

-- Everyone can view parking lots
CREATE POLICY "Anyone can view parking lots"
ON public.parking_lots
FOR SELECT
USING (true);

-- Only admins can modify parking lots
CREATE POLICY "Admins can modify parking lots"
ON public.parking_lots
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create transactions table
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID REFERENCES public.parking_lots(id) ON DELETE CASCADE NOT NULL,
    vehicle_number TEXT NOT NULL,
    amount INTEGER NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('FASTag', 'Cash', 'UPI')),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    entry_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    exit_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Attendants and admins can insert transactions"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'attendant')
);

-- Create sensor_logs table
CREATE TABLE public.sensor_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID REFERENCES public.parking_lots(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('entry', 'exit')),
    vehicle_detected TEXT,
    has_payment BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sensor_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sensor logs"
ON public.sensor_logs
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System can insert sensor logs"
ON public.sensor_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create alerts table
CREATE TABLE public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID REFERENCES public.parking_lots(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('fraud', 'capacity', 'maintenance')),
    message TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    sensor_log_id UUID REFERENCES public.sensor_logs(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view alerts"
ON public.alerts
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System can insert alerts"
ON public.alerts
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can update alerts"
ON public.alerts
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.parking_lots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- Insert seed data for parking lots (Mixed Delhi Zones)
INSERT INTO public.parking_lots (name, zone, capacity, current_occupancy, lat, lng, hourly_rate, status) VALUES
('Karol Bagh Market', 'Central Delhi', 150, 87, 28.6519, 77.1905, 30, 'active'),
('Connaught Place Block A', 'New Delhi', 200, 156, 28.6315, 77.2167, 40, 'active'),
('Lajpat Nagar Central', 'South Delhi', 120, 45, 28.5700, 77.2400, 25, 'active'),
('Chandni Chowk Metro', 'Old Delhi', 80, 72, 28.6562, 77.2300, 20, 'active'),
('Nehru Place IT Hub', 'South-East Delhi', 180, 98, 28.5494, 77.2519, 35, 'active'),
('Sarojini Nagar Market', 'South-West Delhi', 100, 89, 28.5775, 77.1992, 25, 'active');
-- Allow users to insert their own role during signup
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;

CREATE POLICY "Users can insert their own role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Also allow users to update their own role (for demo role switching)
CREATE POLICY "Users can update their own role"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
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
-- Create function to update timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create reservations table for parking spot pre-booking
CREATE TABLE public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lot_id UUID NOT NULL REFERENCES public.parking_lots(id) ON DELETE CASCADE,
  vehicle_number TEXT NOT NULL,
  reservation_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  amount INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Create policies for reservations
CREATE POLICY "Users can view their own reservations"
ON public.reservations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reservations"
ON public.reservations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reservations"
ON public.reservations
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can cancel their own reservations"
ON public.reservations
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reservations"
ON public.reservations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all reservations"
ON public.reservations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Attendants can view reservations for their lot"
ON public.reservations
FOR SELECT
USING (
  has_role(auth.uid(), 'attendant'::app_role) 
  AND lot_id IN (
    SELECT assigned_lot_id FROM user_roles WHERE user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_reservations_updated_at
BEFORE UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster queries
CREATE INDEX idx_reservations_lot_date ON public.reservations(lot_id, reservation_date);
CREATE INDEX idx_reservations_user ON public.reservations(user_id);
-- Enable realtime for reservations table
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
-- Create enums for fraud alerts
DO $$ BEGIN
  CREATE TYPE fraud_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE fraud_status AS ENUM ('NEW', 'INVESTIGATING', 'RESOLVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE camera_status AS ENUM ('ONLINE', 'OFFLINE', 'OCCLUDED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create fraud_alerts table
CREATE TABLE IF NOT EXISTS public.fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  severity fraud_severity NOT NULL DEFAULT 'MEDIUM',
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  status fraud_status NOT NULL DEFAULT 'NEW',
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create cameras table
CREATE TABLE IF NOT EXISTS public.cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  zone TEXT NOT NULL,
  status camera_status NOT NULL DEFAULT 'ONLINE',
  stream_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vision_events table
CREATE TABLE IF NOT EXISTS public.vision_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id UUID NOT NULL REFERENCES public.cameras(id) ON DELETE CASCADE,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  object_type TEXT NOT NULL DEFAULT 'Car',
  bounding_box JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "width": 100, "height": 50}'::jsonb
);

-- Create occupancy_forecasts table
CREATE TABLE IF NOT EXISTS public.occupancy_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_lot_id UUID NOT NULL REFERENCES public.parking_lots(id) ON DELETE CASCADE,
  forecast_time TIMESTAMP WITH TIME ZONE NOT NULL,
  predicted_occupancy INTEGER NOT NULL,
  confidence_score FLOAT NOT NULL DEFAULT 0.85,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupancy_forecasts ENABLE ROW LEVEL SECURITY;

-- Fraud alerts policies - readable by authenticated users
CREATE POLICY "Authenticated users can view fraud alerts"
ON public.fraud_alerts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and attendants can insert fraud alerts"
ON public.fraud_alerts FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'attendant'));

CREATE POLICY "Admins can update fraud alerts"
ON public.fraud_alerts FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete fraud alerts"
ON public.fraud_alerts FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Cameras policies
CREATE POLICY "Anyone can view cameras"
ON public.cameras FOR SELECT
USING (true);

CREATE POLICY "Admins can manage cameras"
ON public.cameras FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Vision events policies
CREATE POLICY "Authenticated users can view vision events"
ON public.vision_events FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage vision events"
ON public.vision_events FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Occupancy forecasts policies
CREATE POLICY "Anyone can view occupancy forecasts"
ON public.occupancy_forecasts FOR SELECT
USING (true);

CREATE POLICY "Admins can manage occupancy forecasts"
ON public.occupancy_forecasts FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Enable realtime for fraud_alerts and vision_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.fraud_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vision_events;

-- Seed some demo cameras
INSERT INTO public.cameras (name, zone, status, stream_url) VALUES
  ('CAM-A1', 'Zone A - Main Entry', 'ONLINE', '/placeholder.svg'),
  ('CAM-A2', 'Zone A - Exit Gate', 'ONLINE', '/placeholder.svg'),
  ('CAM-B1', 'Zone B - North Lot', 'ONLINE', '/placeholder.svg'),
  ('CAM-B2', 'Zone B - South Lot', 'OFFLINE', '/placeholder.svg'),
  ('CAM-C1', 'Zone C - VIP Section', 'ONLINE', '/placeholder.svg'),
  ('CAM-C2', 'Zone C - Overflow', 'OCCLUDED', '/placeholder.svg')
ON CONFLICT DO NOTHING;
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
-- Drop duplicate policies that were just created (existing policies already handle this)
DROP POLICY IF EXISTS "Attendants can create sensor logs" ON public.sensor_logs;
DROP POLICY IF EXISTS "Attendants can create transactions" ON public.transactions;
DROP POLICY IF EXISTS "Attendants can update occupancy" ON public.parking_lots;
DROP POLICY IF EXISTS "Attendants can update reservation status" ON public.reservations;
-- Create saved vehicles table
CREATE TABLE public.saved_vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vehicle_number TEXT NOT NULL,
  vehicle_name TEXT,
  vehicle_type TEXT NOT NULL DEFAULT 'car',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_vehicles ENABLE ROW LEVEL SECURITY;

-- Users can only view their own vehicles
CREATE POLICY "Users can view their own vehicles"
ON public.saved_vehicles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own vehicles
CREATE POLICY "Users can insert their own vehicles"
ON public.saved_vehicles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own vehicles
CREATE POLICY "Users can update their own vehicles"
ON public.saved_vehicles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own vehicles
CREATE POLICY "Users can delete their own vehicles"
ON public.saved_vehicles FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create user preferences table
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  sms_notifications BOOLEAN NOT NULL DEFAULT false,
  reminder_before_expiry INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view their own preferences"
ON public.user_preferences FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert their own preferences"
ON public.user_preferences FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update their own preferences"
ON public.user_preferences FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Add phone number to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public access to avatars
CREATE POLICY "Public avatar access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
-- Create user_fines table to track fines for missed/expired reservations
CREATE TABLE public.user_fines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  applied_to_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.user_fines ENABLE ROW LEVEL SECURITY;

-- Users can view their own fines
CREATE POLICY "Users can view their own fines"
ON public.user_fines
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all fines
CREATE POLICY "Admins can view all fines"
ON public.user_fines
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage fines
CREATE POLICY "Admins can manage fines"
ON public.user_fines
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert fines (for edge functions with service role)
CREATE POLICY "Service role can insert fines"
ON public.user_fines
FOR INSERT
WITH CHECK (true);

-- Add columns to reservations for notification tracking
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS notification_30_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_15_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS fine_applied BOOLEAN DEFAULT false;

-- Add index for efficient querying
CREATE INDEX idx_user_fines_user_id_status ON public.user_fines(user_id, status);
CREATE INDEX idx_reservations_status_date ON public.reservations(status, reservation_date);
-- Enable pg_cron and pg_net extensions for scheduled functions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;
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
-- Drop existing payment method constraints
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_payment_method_check;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS valid_payment_method;

-- Add updated constraint that includes 'Overstay Fee'
ALTER TABLE transactions ADD CONSTRAINT valid_payment_method 
CHECK (payment_method = ANY (ARRAY['FASTag'::text, 'Cash'::text, 'UPI'::text, 'Overstay Fee'::text]));
-- =============================================
-- ATTENDANT SHIFTS & ATTENDANCE
-- =============================================

-- Shift templates for scheduling
CREATE TABLE public.shift_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Scheduled shifts for attendants
CREATE TABLE public.attendant_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lot_id uuid NOT NULL REFERENCES public.parking_lots(id) ON DELETE CASCADE,
  shift_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Attendance records
CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid NOT NULL REFERENCES public.attendant_shifts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  check_in_time timestamptz,
  check_out_time timestamptz,
  check_in_location jsonb,
  check_out_location jsonb,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- LOYALTY PROGRAM
-- =============================================

-- Loyalty tiers
CREATE TABLE public.loyalty_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  min_points integer NOT NULL DEFAULT 0,
  discount_percentage integer NOT NULL DEFAULT 0,
  icon text,
  color text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User loyalty accounts
CREATE TABLE public.loyalty_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  total_points integer NOT NULL DEFAULT 0,
  lifetime_points integer NOT NULL DEFAULT 0,
  current_tier_id uuid REFERENCES public.loyalty_tiers(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Points transactions
CREATE TABLE public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.loyalty_accounts(id) ON DELETE CASCADE,
  points integer NOT NULL,
  transaction_type text NOT NULL,
  description text,
  reference_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- OVERSTAY DETECTION (ANPR Simulation)
-- =============================================

CREATE TABLE public.anpr_detections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id uuid NOT NULL REFERENCES public.parking_lots(id) ON DELETE CASCADE,
  camera_id uuid REFERENCES public.cameras(id),
  vehicle_number text NOT NULL,
  detection_type text NOT NULL DEFAULT 'entry',
  confidence_score numeric DEFAULT 0.95,
  image_url text,
  detected_at timestamptz NOT NULL DEFAULT now(),
  processed boolean DEFAULT false
);

CREATE TABLE public.overstay_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id uuid NOT NULL REFERENCES public.parking_lots(id) ON DELETE CASCADE,
  vehicle_number text NOT NULL,
  entry_time timestamptz NOT NULL,
  expected_exit_time timestamptz,
  overstay_minutes integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  fine_id uuid REFERENCES public.user_fines(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

-- =============================================
-- USAGE HEATMAPS & ANALYTICS
-- =============================================

CREATE TABLE public.lot_usage_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id uuid NOT NULL REFERENCES public.parking_lots(id) ON DELETE CASCADE,
  stat_date date NOT NULL,
  hour_of_day integer NOT NULL,
  avg_occupancy numeric NOT NULL DEFAULT 0,
  peak_occupancy integer NOT NULL DEFAULT 0,
  total_vehicles integer NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lot_id, stat_date, hour_of_day)
);

-- Revenue forecasts
CREATE TABLE public.revenue_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id uuid REFERENCES public.parking_lots(id) ON DELETE CASCADE,
  forecast_date date NOT NULL,
  predicted_revenue numeric NOT NULL,
  confidence_score numeric DEFAULT 0.85,
  model_version text DEFAULT 'v1',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Fraud patterns
CREATE TABLE public.fraud_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type text NOT NULL,
  description text NOT NULL,
  detection_rules jsonb NOT NULL DEFAULT '{}',
  severity text NOT NULL DEFAULT 'MEDIUM',
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.shift_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendant_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anpr_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overstay_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lot_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_patterns ENABLE ROW LEVEL SECURITY;

-- Shift templates - admins manage, all view
CREATE POLICY "Admins can manage shift templates" ON public.shift_templates FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view shift templates" ON public.shift_templates FOR SELECT USING (true);

-- Attendant shifts
CREATE POLICY "Admins can manage shifts" ON public.attendant_shifts FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Attendants can view their shifts" ON public.attendant_shifts FOR SELECT USING (auth.uid() = user_id);

-- Attendance records
CREATE POLICY "Admins can manage attendance" ON public.attendance_records FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Attendants can view own attendance" ON public.attendance_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Attendants can update own attendance" ON public.attendance_records FOR UPDATE USING (auth.uid() = user_id);

-- Loyalty tiers - public read
CREATE POLICY "Anyone can view loyalty tiers" ON public.loyalty_tiers FOR SELECT USING (true);
CREATE POLICY "Admins can manage loyalty tiers" ON public.loyalty_tiers FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Loyalty accounts
CREATE POLICY "Users can view own loyalty account" ON public.loyalty_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage loyalty accounts" ON public.loyalty_accounts FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Loyalty transactions
CREATE POLICY "Users can view own transactions" ON public.loyalty_transactions FOR SELECT 
  USING (account_id IN (SELECT id FROM public.loyalty_accounts WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage loyalty transactions" ON public.loyalty_transactions FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ANPR & Overstay - admin and attendant access
CREATE POLICY "Staff can view ANPR detections" ON public.anpr_detections FOR SELECT 
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'attendant'));
CREATE POLICY "Admins can manage ANPR detections" ON public.anpr_detections FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view overstay alerts" ON public.overstay_alerts FOR SELECT 
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'attendant'));
CREATE POLICY "Admins can manage overstay alerts" ON public.overstay_alerts FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Usage stats and forecasts - public read for citizens
CREATE POLICY "Anyone can view lot usage stats" ON public.lot_usage_stats FOR SELECT USING (true);
CREATE POLICY "Admins can manage lot usage stats" ON public.lot_usage_stats FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view revenue forecasts" ON public.revenue_forecasts FOR SELECT USING (true);
CREATE POLICY "Admins can manage revenue forecasts" ON public.revenue_forecasts FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Fraud patterns - admin only
CREATE POLICY "Admins can manage fraud patterns" ON public.fraud_patterns FOR ALL USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- INSERT DEFAULT DATA
-- =============================================

-- Default shift templates
INSERT INTO public.shift_templates (name, start_time, end_time) VALUES
  ('Morning Shift', '06:00', '14:00'),
  ('Afternoon Shift', '14:00', '22:00'),
  ('Night Shift', '22:00', '06:00');

-- Default loyalty tiers
INSERT INTO public.loyalty_tiers (name, min_points, discount_percentage, icon, color) VALUES
  ('Bronze', 0, 0, 'award', 'amber'),
  ('Silver', 500, 5, 'award', 'slate'),
  ('Gold', 2000, 10, 'crown', 'yellow'),
  ('Platinum', 5000, 15, 'gem', 'purple');

-- Default fraud patterns
INSERT INTO public.fraud_patterns (pattern_type, description, detection_rules, severity) VALUES
  ('MULTIPLE_ENTRIES', 'Same vehicle detected entering multiple times without exit', '{"threshold": 2, "timeWindow": 60}', 'MEDIUM'),
  ('EXTENDED_OVERSTAY', 'Vehicle overstayed beyond 4 hours without payment', '{"overstayMinutes": 240}', 'HIGH'),
  ('PAYMENT_ANOMALY', 'Payment amount significantly below expected rate', '{"discountThreshold": 50}', 'HIGH'),
  ('RAPID_TURNOVER', 'Unusually high vehicle turnover for single spot', '{"turnoversPerHour": 10}', 'MEDIUM');
-- Create revenue_targets table for tracking goals
CREATE TABLE public.revenue_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lot_id UUID REFERENCES public.parking_lots(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('daily', 'weekly', 'monthly')),
  target_amount NUMERIC NOT NULL,
  target_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(lot_id, target_type, target_date)
);

-- Create attendant_performance table for tracking daily stats
CREATE TABLE public.attendant_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lot_id UUID REFERENCES public.parking_lots(id) ON DELETE CASCADE,
  performance_date DATE NOT NULL,
  total_collections NUMERIC NOT NULL DEFAULT 0,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  avg_transaction_time INTEGER, -- in seconds
  shift_hours NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, lot_id, performance_date)
);

-- Create notification_logs table for SMS/WhatsApp tracking
CREATE TABLE public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('sms', 'whatsapp', 'email')),
  recipient TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  external_id TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.revenue_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendant_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for revenue_targets
CREATE POLICY "Admins can manage revenue targets"
ON public.revenue_targets FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view revenue targets"
ON public.revenue_targets FOR SELECT
USING (true);

-- RLS Policies for attendant_performance
CREATE POLICY "Admins can manage attendant performance"
ON public.attendant_performance FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Attendants can view their own performance"
ON public.attendant_performance FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Attendants can insert their own performance"
ON public.attendant_performance FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Attendants can update their own performance"
ON public.attendant_performance FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for notification_logs
CREATE POLICY "Admins can manage notification logs"
ON public.notification_logs FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own notifications"
ON public.notification_logs FOR SELECT
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_attendant_performance_updated_at
BEFORE UPDATE ON public.attendant_performance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on revenue_targets
CREATE TRIGGER update_revenue_targets_updated_at
BEFORE UPDATE ON public.revenue_targets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create violation reports table
CREATE TABLE public.violation_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  lot_id UUID REFERENCES public.parking_lots(id),
  vehicle_number TEXT NOT NULL,
  violation_type TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.violation_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Citizens can create violation reports"
ON public.violation_reports FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Citizens can view their own reports"
ON public.violation_reports FOR SELECT
USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can manage all reports"
ON public.violation_reports FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Attendants can view reports for their lot"
ON public.violation_reports FOR SELECT
USING (has_role(auth.uid(), 'attendant'::app_role) AND lot_id IN (
  SELECT assigned_lot_id FROM user_roles WHERE user_id = auth.uid()
));

-- Create storage bucket for violation photos
INSERT INTO storage.buckets (id, name, public) VALUES ('violations', 'violations', true);

-- Storage policies for violations bucket
CREATE POLICY "Anyone can view violation photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'violations');

CREATE POLICY "Authenticated users can upload violation photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'violations' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own violation photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'violations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own violation photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'violations' AND auth.uid()::text = (storage.foldername(name))[1]);
-- Add EV charging support to parking lots
ALTER TABLE public.parking_lots 
ADD COLUMN IF NOT EXISTS has_ev_charging boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_covered_parking boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS near_metro boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS metro_station text;

-- Create monthly passes table
CREATE TABLE public.monthly_passes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lot_id UUID REFERENCES public.parking_lots(id),
  pass_type text NOT NULL DEFAULT 'standard',
  vehicle_number text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on monthly_passes
ALTER TABLE public.monthly_passes ENABLE ROW LEVEL SECURITY;

-- RLS policies for monthly_passes
CREATE POLICY "Users can view their own passes" 
ON public.monthly_passes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own passes" 
ON public.monthly_passes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID,
  referral_code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  reward_points integer DEFAULT 100,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

-- Enable RLS on referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies for referrals
CREATE POLICY "Users can view their own referrals" 
ON public.referrals 
FOR SELECT 
USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can create referrals" 
ON public.referrals 
FOR INSERT 
WITH CHECK (auth.uid() = referrer_id);

-- Add referral_code to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID;

-- Update some parking lots with EV charging and covered parking (sample data)
UPDATE public.parking_lots SET has_ev_charging = true, has_covered_parking = true, near_metro = true, metro_station = 'Rajiv Chowk' WHERE zone = 'New Delhi';
UPDATE public.parking_lots SET has_covered_parking = true, near_metro = true, metro_station = 'Karol Bagh' WHERE zone = 'Central Delhi';
UPDATE public.parking_lots SET near_metro = true, metro_station = 'Chandni Chowk' WHERE zone = 'Old Delhi';
UPDATE public.parking_lots SET has_ev_charging = true, near_metro = true, metro_station = 'Lajpat Nagar' WHERE zone = 'South Delhi';
UPDATE public.parking_lots SET has_ev_charging = true, has_covered_parking = true, near_metro = true, metro_station = 'Nehru Place' WHERE zone = 'South-East Delhi';
UPDATE public.parking_lots SET near_metro = true, metro_station = 'INA' WHERE zone = 'South-West Delhi';
-- Create parking_reviews table for user ratings and reviews
CREATE TABLE public.parking_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lot_id UUID NOT NULL REFERENCES public.parking_lots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_parking_reviews_lot_id ON public.parking_reviews(lot_id);
CREATE INDEX idx_parking_reviews_user_id ON public.parking_reviews(user_id);

-- Enable RLS
ALTER TABLE public.parking_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view reviews"
ON public.parking_reviews FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create reviews"
ON public.parking_reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
ON public.parking_reviews FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
ON public.parking_reviews FOR DELETE
USING (auth.uid() = user_id);

-- Admins can manage all reviews
CREATE POLICY "Admins can manage all reviews"
ON public.parking_reviews FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add average_rating column to parking_lots for caching
ALTER TABLE public.parking_lots 
ADD COLUMN IF NOT EXISTS average_rating NUMERIC(2,1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Create trigger to update parking_lots stats when reviews change
CREATE OR REPLACE FUNCTION public.update_lot_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.parking_lots
    SET 
      average_rating = (SELECT AVG(rating)::NUMERIC(2,1) FROM public.parking_reviews WHERE lot_id = OLD.lot_id),
      review_count = (SELECT COUNT(*) FROM public.parking_reviews WHERE lot_id = OLD.lot_id)
    WHERE id = OLD.lot_id;
    RETURN OLD;
  ELSE
    UPDATE public.parking_lots
    SET 
      average_rating = (SELECT AVG(rating)::NUMERIC(2,1) FROM public.parking_reviews WHERE lot_id = NEW.lot_id),
      review_count = (SELECT COUNT(*) FROM public.parking_reviews WHERE lot_id = NEW.lot_id)
    WHERE id = NEW.lot_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_lot_rating_on_review
AFTER INSERT OR UPDATE OR DELETE ON public.parking_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_lot_rating_stats();
-- Create review_helpful_votes table to track who voted what
CREATE TABLE public.review_helpful_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.parking_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Add photo_url column to parking_reviews
ALTER TABLE public.parking_reviews 
ADD COLUMN photo_url TEXT NULL;

-- Enable RLS
ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;

-- RLS policies for review_helpful_votes
CREATE POLICY "Anyone can view helpful votes" 
ON public.review_helpful_votes 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create votes" 
ON public.review_helpful_votes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" 
ON public.review_helpful_votes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage bucket for review photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('review-photos', 'review-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for review photos
CREATE POLICY "Anyone can view review photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'review-photos');

CREATE POLICY "Authenticated users can upload review photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'review-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own review photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'review-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
-- Create review_replies table for manager responses
CREATE TABLE public.review_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.parking_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reply_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;

-- RLS policies for review_replies
CREATE POLICY "Anyone can view review replies" 
ON public.review_replies 
FOR SELECT 
USING (true);

CREATE POLICY "Admins and attendants can create replies" 
ON public.review_replies 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'attendant'::app_role));

CREATE POLICY "Admins can update any reply" 
ON public.review_replies 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete any reply" 
ON public.review_replies 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update own replies" 
ON public.review_replies 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own replies" 
ON public.review_replies 
FOR DELETE 
USING (auth.uid() = user_id);
-- Add surge pricing rules table
CREATE TABLE public.surge_pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID REFERENCES public.parking_lots(id) ON DELETE CASCADE,
  min_occupancy_percent INTEGER NOT NULL DEFAULT 70,
  max_occupancy_percent INTEGER NOT NULL DEFAULT 100,
  multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.surge_pricing_rules ENABLE ROW LEVEL SECURITY;

-- Public read access for surge pricing rules
CREATE POLICY "Surge pricing rules are publicly readable"
ON public.surge_pricing_rules
FOR SELECT
USING (true);

-- Only admins can modify surge pricing rules
CREATE POLICY "Admins can manage surge pricing rules"
ON public.surge_pricing_rules
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default surge pricing rules
INSERT INTO public.surge_pricing_rules (lot_id, min_occupancy_percent, max_occupancy_percent, multiplier) VALUES
(NULL, 0, 50, 1.0),   -- Normal pricing up to 50% occupancy
(NULL, 50, 70, 1.2),  -- 20% surge at 50-70%
(NULL, 70, 85, 1.5),  -- 50% surge at 70-85%
(NULL, 85, 100, 2.0); -- Double pricing above 85%
-- Create fleet/business accounts table
CREATE TABLE public.business_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  company_email TEXT,
  company_phone TEXT,
  gst_number TEXT,
  max_vehicles INTEGER DEFAULT 10,
  monthly_budget NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fleet vehicles table
CREATE TABLE public.fleet_vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_account_id UUID NOT NULL REFERENCES public.business_accounts(id) ON DELETE CASCADE,
  vehicle_number TEXT NOT NULL,
  vehicle_type TEXT DEFAULT 'car',
  driver_name TEXT,
  driver_phone TEXT,
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  monthly_limit NUMERIC DEFAULT 0,
  current_month_usage NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create availability subscriptions table for push notifications
CREATE TABLE public.availability_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lot_id UUID NOT NULL REFERENCES public.parking_lots(id) ON DELETE CASCADE,
  notify_when_available BOOLEAN DEFAULT true,
  threshold_percent INTEGER DEFAULT 90,
  is_active BOOLEAN DEFAULT true,
  last_notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_subscriptions ENABLE ROW LEVEL SECURITY;

-- Business accounts policies
CREATE POLICY "Users can view their own business account" 
ON public.business_accounts FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own business account" 
ON public.business_accounts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business account" 
ON public.business_accounts FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all business accounts"
ON public.business_accounts FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Fleet vehicles policies
CREATE POLICY "Users can view their fleet vehicles" 
ON public.fleet_vehicles FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.business_accounts ba 
  WHERE ba.id = fleet_vehicles.business_account_id 
  AND ba.user_id = auth.uid()
));

CREATE POLICY "Users can manage their fleet vehicles" 
ON public.fleet_vehicles FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.business_accounts ba 
  WHERE ba.id = fleet_vehicles.business_account_id 
  AND ba.user_id = auth.uid()
));

CREATE POLICY "Admins can view all fleet vehicles"
ON public.fleet_vehicles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Availability subscriptions policies
CREATE POLICY "Users can manage their own subscriptions" 
ON public.availability_subscriptions FOR ALL 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_business_accounts_updated_at
BEFORE UPDATE ON public.business_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fleet_vehicles_updated_at
BEFORE UPDATE ON public.fleet_vehicles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 1. parking_reviews: authenticated-only reads
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.parking_reviews;
CREATE POLICY "Authenticated users can view reviews"
ON public.parking_reviews FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.parking_reviews;
CREATE POLICY "Admins can manage all reviews"
ON public.parking_reviews FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.parking_reviews;
CREATE POLICY "Authenticated users can create reviews"
ON public.parking_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.parking_reviews;
CREATE POLICY "Users can update their own reviews"
ON public.parking_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.parking_reviews;
CREATE POLICY "Users can delete their own reviews"
ON public.parking_reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

REVOKE ALL ON public.parking_reviews FROM anon;

-- 2. profiles: owner-only access
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
REVOKE ALL ON public.profiles FROM anon;

-- 3. reservations: authenticated-only, no anon
REVOKE ALL ON public.reservations FROM anon;

DROP POLICY IF EXISTS "Anyone can view review photos" ON storage.objects;
CREATE POLICY "Authenticated users can view review photos"
ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'review-photos');

DROP POLICY IF EXISTS "Anyone can view violation photos" ON storage.objects;
CREATE POLICY "Authenticated users can view violation photos"
ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'violations');

DROP POLICY IF EXISTS "Users can delete their own review photos" ON storage.objects;
CREATE POLICY "Users can delete their own review photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'review-photos' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own violation photos" ON storage.objects;
CREATE POLICY "Users can delete their own violation photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'violations' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own violation photos" ON storage.objects;
CREATE POLICY "Users can update their own violation photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'violations' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Authenticated users can upload review photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload review photos"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'review-photos');

DROP POLICY IF EXISTS "Authenticated users can upload violation photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload violation photos"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'violations');

CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance numeric NOT NULL DEFAULT 0 CHECK (balance >= 0),
  auto_debit boolean NOT NULL DEFAULT true,
  low_balance_threshold numeric NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own wallet" ON public.wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own wallet" ON public.wallets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own wallet" ON public.wallets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('topup','debit','refund','bonus')),
  description text,
  reference_id uuid,
  balance_after numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own wallet ledger" ON public.wallet_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own wallet ledger" ON public.wallet_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS wallet_transactions_user_created_idx ON public.wallet_transactions(user_id, created_at DESC);

-- Atomic wallet movement
CREATE OR REPLACE FUNCTION public.wallet_apply_transaction(_amount numeric, _type text, _description text, _reference_id uuid DEFAULT NULL)
RETURNS public.wallet_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _wallet public.wallets;
  _new_balance numeric;
  _row public.wallet_transactions;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _type NOT IN ('topup','debit','refund','bonus') THEN RAISE EXCEPTION 'Invalid transaction type'; END IF;
  IF _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;
  IF _amount > 100000 THEN RAISE EXCEPTION 'Amount exceeds maximum'; END IF;

  INSERT INTO public.wallets (user_id) VALUES (_uid)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO _wallet FROM public.wallets WHERE user_id = _uid FOR UPDATE;

  IF _type = 'debit' THEN
    _new_balance := _wallet.balance - _amount;
    IF _new_balance < 0 THEN RAISE EXCEPTION 'Insufficient wallet balance'; END IF;
  ELSE
    _new_balance := _wallet.balance + _amount;
  END IF;

  UPDATE public.wallets SET balance = _new_balance WHERE id = _wallet.id;

  INSERT INTO public.wallet_transactions (wallet_id, user_id, amount, transaction_type, description, reference_id, balance_after)
  VALUES (_wallet.id, _uid, _amount, _type, _description, _reference_id, _new_balance)
  RETURNING * INTO _row;

  RETURN _row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.wallet_apply_transaction(numeric, text, text, uuid) TO authenticated;

-- Public transparency aggregates (anonymised, zone level only)
CREATE OR REPLACE FUNCTION public.get_zone_transparency(_days integer DEFAULT 30)
RETURNS TABLE (
  zone text,
  lot_count bigint,
  total_capacity bigint,
  current_occupancy bigint,
  occupancy_percent numeric,
  total_revenue numeric,
  transaction_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    l.zone,
    COUNT(DISTINCT l.id) AS lot_count,
    COALESCE(SUM(l.capacity), 0)::bigint AS total_capacity,
    COALESCE(SUM(l.current_occupancy), 0)::bigint AS current_occupancy,
    ROUND(CASE WHEN SUM(l.capacity) > 0 THEN SUM(l.current_occupancy)::numeric * 100 / SUM(l.capacity) ELSE 0 END, 1) AS occupancy_percent,
    COALESCE((
      SELECT SUM(t.amount) FROM public.transactions t
      JOIN public.parking_lots pl ON pl.id = t.lot_id
      WHERE pl.zone = l.zone AND t.status = 'completed'
        AND t.created_at >= now() - (GREATEST(LEAST(_days, 365), 1) || ' days')::interval
    ), 0)::numeric AS total_revenue,
    COALESCE((
      SELECT COUNT(*) FROM public.transactions t
      JOIN public.parking_lots pl ON pl.id = t.lot_id
      WHERE pl.zone = l.zone AND t.status = 'completed'
        AND t.created_at >= now() - (GREATEST(LEAST(_days, 365), 1) || ' days')::interval
    ), 0)::bigint AS transaction_count
  FROM public.parking_lots l
  GROUP BY l.zone
  ORDER BY l.zone;
$$;

GRANT EXECUTE ON FUNCTION public.get_zone_transparency(integer) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_daily_transparency(_days integer DEFAULT 14)
RETURNS TABLE (day date, total_revenue numeric, transaction_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (t.created_at AT TIME ZONE 'UTC')::date AS day,
    COALESCE(SUM(t.amount), 0)::numeric AS total_revenue,
    COUNT(*)::bigint AS transaction_count
  FROM public.transactions t
  WHERE t.status = 'completed'
    AND t.created_at >= now() - (GREATEST(LEAST(_days, 365), 1) || ' days')::interval
  GROUP BY 1
  ORDER BY 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_daily_transparency(integer) TO anon, authenticated;
CREATE OR REPLACE FUNCTION public.ensure_daily_demo_data(_days integer DEFAULT 14)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _d date;
  _lot record;
  _n int;
  _i int;
  _ts timestamptz;
  _amount int;
  _plates text[] := ARRAY['DL01AB1234','DL02CD5678','DL03EF9012','DL04GH3456','DL05IJ7890','DL06KL2345','HR26MN6789','UP16OP1122','DL08QR3344','DL09ST5566'];
  _methods text[] := ARRAY['upi','card','cash','wallet'];
BEGIN
  FOR _d IN
    SELECT generate_series(current_date - (GREATEST(LEAST(_days,60),1) - 1), current_date, '1 day')::date
  LOOP
    CONTINUE WHEN EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE (t.created_at AT TIME ZONE 'UTC')::date = _d
    );

    FOR _lot IN SELECT id, hourly_rate, capacity FROM public.parking_lots LOOP
      _n := 6 + floor(random() * 10)::int;
      FOR _i IN 1.._n LOOP
        _ts := _d::timestamptz
               + make_interval(hours => 7 + floor(random() * 13)::int,
                               mins => floor(random() * 60)::int);
        IF _ts > now() THEN
          _ts := now() - make_interval(mins => floor(random() * 120)::int);
        END IF;
        _amount := GREATEST(_lot.hourly_rate, 10) * (1 + floor(random() * 4)::int);

        INSERT INTO public.transactions
          (lot_id, vehicle_number, amount, payment_method, status, entry_time, exit_time, created_at)
        VALUES
          (_lot.id,
           _plates[1 + floor(random() * array_length(_plates,1))::int],
           _amount,
           _methods[1 + floor(random() * array_length(_methods,1))::int],
           'completed',
           _ts,
           _ts + make_interval(hours => 1 + floor(random() * 4)::int),
           _ts);

        INSERT INTO public.sensor_logs (lot_id, event_type, vehicle_detected, has_payment, created_at)
        VALUES (_lot.id, 'entry',
                _plates[1 + floor(random() * array_length(_plates,1))::int],
                true, _ts);
      END LOOP;

      -- occasional unpaid entry that triggers a revenue-leakage alert
      IF random() < 0.35 THEN
        _ts := _d::timestamptz + make_interval(hours => 10 + floor(random() * 8)::int);
        IF _ts > now() THEN _ts := now() - make_interval(mins => 30); END IF;

        INSERT INTO public.sensor_logs (lot_id, event_type, vehicle_detected, has_payment, created_at)
        VALUES (_lot.id, 'entry',
                _plates[1 + floor(random() * array_length(_plates,1))::int],
                false, _ts);

        INSERT INTO public.alerts (lot_id, alert_type, message, severity, is_resolved, created_at)
        VALUES (_lot.id, 'revenue_leakage',
                'Vehicle entry detected without matching payment',
                CASE WHEN random() < 0.3 THEN 'high' ELSE 'medium' END,
                _d < current_date, _ts);
      END IF;
    END LOOP;
  END LOOP;

  -- keep live occupancy realistic for today's demo
  UPDATE public.parking_lots
  SET current_occupancy = GREATEST(0, LEAST(capacity, (capacity * (0.35 + random() * 0.55))::int));
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_daily_demo_data(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_daily_demo_data(integer) TO anon, authenticated, service_role;

-- Seed demo profiles & roles for demo users
DO $$
DECLARE
  v_admin_id UUID;
  v_attendant_id UUID;
  v_citizen_id UUID;
BEGIN
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'demo.admin@nigampark.gov.in';
  SELECT id INTO v_attendant_id FROM auth.users WHERE email = 'demo.attendant@nigampark.gov.in';
  SELECT id INTO v_citizen_id FROM auth.users WHERE email = 'demo.citizen@nigampark.gov.in';

  IF v_admin_id IS NOT NULL THEN
    INSERT INTO public.profiles (user_id, full_name) VALUES (v_admin_id, 'Demo Administrator') ON CONFLICT (user_id) DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (v_admin_id, 'admin') ON CONFLICT (user_id, role) DO UPDATE SET role = 'admin';
  END IF;

  IF v_attendant_id IS NOT NULL THEN
    INSERT INTO public.profiles (user_id, full_name) VALUES (v_attendant_id, 'Demo Attendant') ON CONFLICT (user_id) DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (v_attendant_id, 'attendant') ON CONFLICT (user_id, role) DO UPDATE SET role = 'attendant';
  END IF;

  IF v_citizen_id IS NOT NULL THEN
    INSERT INTO public.profiles (user_id, full_name) VALUES (v_citizen_id, 'Demo Citizen') ON CONFLICT (user_id) DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (v_citizen_id, 'citizen') ON CONFLICT (user_id, role) DO UPDATE SET role = 'citizen';
  END IF;
END $$;
