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