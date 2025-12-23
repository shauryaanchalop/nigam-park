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