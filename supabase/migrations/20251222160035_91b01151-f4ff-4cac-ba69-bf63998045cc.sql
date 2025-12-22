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