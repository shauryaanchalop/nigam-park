-- Create parking_reviews table for user ratings and reviews
CREATE TABLE public.parking_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lot_id UUID NOT NULL REFERENCES public.parking_lots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_parking_reviews_lot_id ON public.parking_reviews(lot_id);
CREATE INDEX idx_parking_reviews_user_id ON public.parking_reviews(user_id);

-- Enable RLS
ALTER TABLE public.parking_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view reviews"
ON public.parking_reviews FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create reviews"
ON public.parking_reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
ON public.parking_reviews FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
ON public.parking_reviews FOR DELETE
USING (auth.uid() = user_id);

-- Admins can manage all reviews
CREATE POLICY "Admins can manage all reviews"
ON public.parking_reviews FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add average_rating column to parking_lots for caching
ALTER TABLE public.parking_lots 
ADD COLUMN IF NOT EXISTS average_rating NUMERIC(2,1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Create trigger to update parking_lots stats when reviews change
CREATE OR REPLACE FUNCTION public.update_lot_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.parking_lots
    SET 
      average_rating = (SELECT AVG(rating)::NUMERIC(2,1) FROM public.parking_reviews WHERE lot_id = OLD.lot_id),
      review_count = (SELECT COUNT(*) FROM public.parking_reviews WHERE lot_id = OLD.lot_id)
    WHERE id = OLD.lot_id;
    RETURN OLD;
  ELSE
    UPDATE public.parking_lots
    SET 
      average_rating = (SELECT AVG(rating)::NUMERIC(2,1) FROM public.parking_reviews WHERE lot_id = NEW.lot_id),
      review_count = (SELECT COUNT(*) FROM public.parking_reviews WHERE lot_id = NEW.lot_id)
    WHERE id = NEW.lot_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_lot_rating_on_review
AFTER INSERT OR UPDATE OR DELETE ON public.parking_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_lot_rating_stats();