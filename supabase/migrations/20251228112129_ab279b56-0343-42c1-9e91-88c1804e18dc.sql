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