-- Create review_replies table for manager responses
CREATE TABLE public.review_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.parking_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reply_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;

-- RLS policies for review_replies
CREATE POLICY "Anyone can view review replies" 
ON public.review_replies 
FOR SELECT 
USING (true);

CREATE POLICY "Admins and attendants can create replies" 
ON public.review_replies 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'attendant'::app_role));

CREATE POLICY "Admins can update any reply" 
ON public.review_replies 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete any reply" 
ON public.review_replies 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update own replies" 
ON public.review_replies 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own replies" 
ON public.review_replies 
FOR DELETE 
USING (auth.uid() = user_id);