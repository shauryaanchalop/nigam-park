
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance numeric NOT NULL DEFAULT 0 CHECK (balance >= 0),
  auto_debit boolean NOT NULL DEFAULT true,
  low_balance_threshold numeric NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own wallet" ON public.wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own wallet" ON public.wallets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own wallet" ON public.wallets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('topup','debit','refund','bonus')),
  description text,
  reference_id uuid,
  balance_after numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own wallet ledger" ON public.wallet_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own wallet ledger" ON public.wallet_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS wallet_transactions_user_created_idx ON public.wallet_transactions(user_id, created_at DESC);

-- Atomic wallet movement
CREATE OR REPLACE FUNCTION public.wallet_apply_transaction(_amount numeric, _type text, _description text, _reference_id uuid DEFAULT NULL)
RETURNS public.wallet_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _wallet public.wallets;
  _new_balance numeric;
  _row public.wallet_transactions;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _type NOT IN ('topup','debit','refund','bonus') THEN RAISE EXCEPTION 'Invalid transaction type'; END IF;
  IF _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;
  IF _amount > 100000 THEN RAISE EXCEPTION 'Amount exceeds maximum'; END IF;

  INSERT INTO public.wallets (user_id) VALUES (_uid)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO _wallet FROM public.wallets WHERE user_id = _uid FOR UPDATE;

  IF _type = 'debit' THEN
    _new_balance := _wallet.balance - _amount;
    IF _new_balance < 0 THEN RAISE EXCEPTION 'Insufficient wallet balance'; END IF;
  ELSE
    _new_balance := _wallet.balance + _amount;
  END IF;

  UPDATE public.wallets SET balance = _new_balance WHERE id = _wallet.id;

  INSERT INTO public.wallet_transactions (wallet_id, user_id, amount, transaction_type, description, reference_id, balance_after)
  VALUES (_wallet.id, _uid, _amount, _type, _description, _reference_id, _new_balance)
  RETURNING * INTO _row;

  RETURN _row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.wallet_apply_transaction(numeric, text, text, uuid) TO authenticated;

-- Public transparency aggregates (anonymised, zone level only)
CREATE OR REPLACE FUNCTION public.get_zone_transparency(_days integer DEFAULT 30)
RETURNS TABLE (
  zone text,
  lot_count bigint,
  total_capacity bigint,
  current_occupancy bigint,
  occupancy_percent numeric,
  total_revenue numeric,
  transaction_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    l.zone,
    COUNT(DISTINCT l.id) AS lot_count,
    COALESCE(SUM(l.capacity), 0)::bigint AS total_capacity,
    COALESCE(SUM(l.current_occupancy), 0)::bigint AS current_occupancy,
    ROUND(CASE WHEN SUM(l.capacity) > 0 THEN SUM(l.current_occupancy)::numeric * 100 / SUM(l.capacity) ELSE 0 END, 1) AS occupancy_percent,
    COALESCE((
      SELECT SUM(t.amount) FROM public.transactions t
      JOIN public.parking_lots pl ON pl.id = t.lot_id
      WHERE pl.zone = l.zone AND t.status = 'completed'
        AND t.created_at >= now() - (GREATEST(LEAST(_days, 365), 1) || ' days')::interval
    ), 0)::numeric AS total_revenue,
    COALESCE((
      SELECT COUNT(*) FROM public.transactions t
      JOIN public.parking_lots pl ON pl.id = t.lot_id
      WHERE pl.zone = l.zone AND t.status = 'completed'
        AND t.created_at >= now() - (GREATEST(LEAST(_days, 365), 1) || ' days')::interval
    ), 0)::bigint AS transaction_count
  FROM public.parking_lots l
  GROUP BY l.zone
  ORDER BY l.zone;
$$;

GRANT EXECUTE ON FUNCTION public.get_zone_transparency(integer) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_daily_transparency(_days integer DEFAULT 14)
RETURNS TABLE (day date, total_revenue numeric, transaction_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (t.created_at AT TIME ZONE 'UTC')::date AS day,
    COALESCE(SUM(t.amount), 0)::numeric AS total_revenue,
    COUNT(*)::bigint AS transaction_count
  FROM public.transactions t
  WHERE t.status = 'completed'
    AND t.created_at >= now() - (GREATEST(LEAST(_days, 365), 1) || ' days')::interval
  GROUP BY 1
  ORDER BY 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_daily_transparency(integer) TO anon, authenticated;
