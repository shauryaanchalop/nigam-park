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