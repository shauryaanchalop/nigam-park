-- Create review_helpful_votes table to track who voted what
CREATE TABLE public.review_helpful_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.parking_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Add photo_url column to parking_reviews
ALTER TABLE public.parking_reviews 
ADD COLUMN photo_url TEXT NULL;

-- Enable RLS
ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;

-- RLS policies for review_helpful_votes
CREATE POLICY "Anyone can view helpful votes" 
ON public.review_helpful_votes 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create votes" 
ON public.review_helpful_votes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" 
ON public.review_helpful_votes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage bucket for review photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('review-photos', 'review-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for review photos
CREATE POLICY "Anyone can view review photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'review-photos');

CREATE POLICY "Authenticated users can upload review photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'review-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own review photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'review-photos' AND auth.uid()::text = (storage.foldername(name))[1]);