
-- 1. parking_reviews: authenticated-only reads
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.parking_reviews;
CREATE POLICY "Authenticated users can view reviews"
ON public.parking_reviews FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.parking_reviews;
CREATE POLICY "Admins can manage all reviews"
ON public.parking_reviews FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.parking_reviews;
CREATE POLICY "Authenticated users can create reviews"
ON public.parking_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.parking_reviews;
CREATE POLICY "Users can update their own reviews"
ON public.parking_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.parking_reviews;
CREATE POLICY "Users can delete their own reviews"
ON public.parking_reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

REVOKE ALL ON public.parking_reviews FROM anon;

-- 2. profiles: owner-only access
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
REVOKE ALL ON public.profiles FROM anon;

-- 3. reservations: authenticated-only, no anon
REVOKE ALL ON public.reservations FROM anon;
