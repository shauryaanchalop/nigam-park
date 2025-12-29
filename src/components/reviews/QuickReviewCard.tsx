import React, { useState } from 'react';
import { Star, MessageSquare, Camera, Send, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useParkingReviews } from '@/hooks/useParkingReviews';
import { useParkingLots } from '@/hooks/useParkingLots';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function QuickReviewCard() {
  const { isHindi } = useLanguage();
  const { user } = useAuth();
  const { data: lots } = useParkingLots();
  const [selectedLotId, setSelectedLotId] = useState<string>('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createReview } = useParkingReviews(selectedLotId);

  const handleSubmit = async () => {
    if (!user) {
      toast.error(isHindi ? 'कृपया पहले लॉगिन करें' : 'Please login first');
      return;
    }
    if (!selectedLotId) {
      toast.error(isHindi ? 'कृपया पार्किंग चुनें' : 'Please select a parking lot');
      return;
    }
    if (rating === 0) {
      toast.error(isHindi ? 'कृपया रेटिंग दें' : 'Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      await createReview.mutateAsync({
        lot_id: selectedLotId,
        rating,
        review_text: reviewText.trim() || null,
        photo_url: null,
      });
      toast.success(isHindi ? 'समीक्षा सबमिट की गई!' : 'Review submitted!');
      setRating(0);
      setReviewText('');
      setSelectedLotId('');
    } catch (error: any) {
      if (error.message?.includes('already reviewed')) {
        toast.error(isHindi ? 'आप पहले ही इस पार्किंग की समीक्षा कर चुके हैं' : 'You have already reviewed this parking lot');
      } else {
        toast.error(isHindi ? 'समीक्षा सबमिट करने में त्रुटि' : 'Error submitting review');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          {isHindi ? 'अपनी समीक्षा लिखें' : 'Write a Review'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Parking Lot Selection */}
        <div className="space-y-2">
          <Label>{isHindi ? 'पार्किंग चुनें' : 'Select Parking Lot'}</Label>
          <Select value={selectedLotId} onValueChange={setSelectedLotId}>
            <SelectTrigger>
              <SelectValue placeholder={isHindi ? 'पार्किंग स्थान चुनें...' : 'Select a parking location...'} />
            </SelectTrigger>
            <SelectContent>
              {lots?.map((lot) => (
                <SelectItem key={lot.id} value={lot.id}>
                  {lot.name} - {lot.zone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Star Rating */}
        <div className="space-y-2">
          <Label>{isHindi ? 'रेटिंग' : 'Rating'}</Label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    'w-7 h-7 transition-colors',
                    (hoverRating || rating) >= star
                      ? 'fill-warning text-warning'
                      : 'text-muted-foreground'
                  )}
                />
              </button>
            ))}
            {rating > 0 && (
              <Badge variant="secondary" className="ml-2">
                {rating}/5
              </Badge>
            )}
          </div>
        </div>

        {/* Review Text */}
        <div className="space-y-2">
          <Label>{isHindi ? 'आपकी समीक्षा (वैकल्पिक)' : 'Your Review (optional)'}</Label>
          <Textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder={isHindi ? 'अपना अनुभव साझा करें...' : 'Share your experience...'}
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">
            {reviewText.length}/500
          </p>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedLotId || rating === 0}
          className="w-full gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {isHindi ? 'समीक्षा सबमिट करें' : 'Submit Review'}
        </Button>

        {!user && (
          <p className="text-sm text-muted-foreground text-center">
            {isHindi ? 'समीक्षा लिखने के लिए लॉगिन आवश्यक है' : 'Login required to write a review'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
