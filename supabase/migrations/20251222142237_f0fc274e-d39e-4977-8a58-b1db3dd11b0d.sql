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