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