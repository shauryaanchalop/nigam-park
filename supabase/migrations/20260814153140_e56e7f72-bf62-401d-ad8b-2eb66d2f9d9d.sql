CREATE OR REPLACE FUNCTION public.ensure_daily_demo_data(_days integer DEFAULT 14)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _d date;
  _lot record;
  _n int;
  _i int;
  _ts timestamptz;
  _amount int;
  _plates text[] := ARRAY['DL01AB1234','DL02CD5678','DL03EF9012','DL04GH3456','DL05IJ7890','DL06KL2345','HR26MN6789','UP16OP1122','DL08QR3344','DL09ST5566'];
  _methods text[] := ARRAY['upi','card','cash','wallet'];
BEGIN
  FOR _d IN
    SELECT generate_series(current_date - (GREATEST(LEAST(_days,60),1) - 1), current_date, '1 day')::date
  LOOP
    CONTINUE WHEN EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE (t.created_at AT TIME ZONE 'UTC')::date = _d
    );

    FOR _lot IN SELECT id, hourly_rate, capacity FROM public.parking_lots LOOP
      _n := 6 + floor(random() * 10)::int;
      FOR _i IN 1.._n LOOP
        _ts := _d::timestamptz
               + make_interval(hours => 7 + floor(random() * 13)::int,
                               mins => floor(random() * 60)::int);
        IF _ts > now() THEN
          _ts := now() - make_interval(mins => floor(random() * 120)::int);
        END IF;
        _amount := GREATEST(_lot.hourly_rate, 10) * (1 + floor(random() * 4)::int);

        INSERT INTO public.transactions
          (lot_id, vehicle_number, amount, payment_method, status, entry_time, exit_time, created_at)
        VALUES
          (_lot.id,
           _plates[1 + floor(random() * array_length(_plates,1))::int],
           _amount,
           _methods[1 + floor(random() * array_length(_methods,1))::int],
           'completed',
           _ts,
           _ts + make_interval(hours => 1 + floor(random() * 4)::int),
           _ts);

        INSERT INTO public.sensor_logs (lot_id, event_type, vehicle_detected, has_payment, created_at)
        VALUES (_lot.id, 'entry',
                _plates[1 + floor(random() * array_length(_plates,1))::int],
                true, _ts);
      END LOOP;

      -- occasional unpaid entry that triggers a revenue-leakage alert
      IF random() < 0.35 THEN
        _ts := _d::timestamptz + make_interval(hours => 10 + floor(random() * 8)::int);
        IF _ts > now() THEN _ts := now() - make_interval(mins => 30); END IF;

        INSERT INTO public.sensor_logs (lot_id, event_type, vehicle_detected, has_payment, created_at)
        VALUES (_lot.id, 'entry',
                _plates[1 + floor(random() * array_length(_plates,1))::int],
                false, _ts);

        INSERT INTO public.alerts (lot_id, alert_type, message, severity, is_resolved, created_at)
        VALUES (_lot.id, 'revenue_leakage',
                'Vehicle entry detected without matching payment',
                CASE WHEN random() < 0.3 THEN 'high' ELSE 'medium' END,
                _d < current_date, _ts);
      END IF;
    END LOOP;
  END LOOP;

  -- keep live occupancy realistic for today's demo
  UPDATE public.parking_lots
  SET current_occupancy = GREATEST(0, LEAST(capacity, (capacity * (0.35 + random() * 0.55))::int));
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_daily_demo_data(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_daily_demo_data(integer) TO anon, authenticated, service_role;