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