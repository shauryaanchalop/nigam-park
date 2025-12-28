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