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