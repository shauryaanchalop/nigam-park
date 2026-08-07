
DROP POLICY IF EXISTS "Anyone can view review photos" ON storage.objects;
CREATE POLICY "Authenticated users can view review photos"
ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'review-photos');

DROP POLICY IF EXISTS "Anyone can view violation photos" ON storage.objects;
CREATE POLICY "Authenticated users can view violation photos"
ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'violations');

DROP POLICY IF EXISTS "Users can delete their own review photos" ON storage.objects;
CREATE POLICY "Users can delete their own review photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'review-photos' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own violation photos" ON storage.objects;
CREATE POLICY "Users can delete their own violation photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'violations' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own violation photos" ON storage.objects;
CREATE POLICY "Users can update their own violation photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'violations' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Authenticated users can upload review photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload review photos"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'review-photos');

DROP POLICY IF EXISTS "Authenticated users can upload violation photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload violation photos"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'violations');
