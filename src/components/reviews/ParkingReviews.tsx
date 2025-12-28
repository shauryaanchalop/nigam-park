import React, { useState, useRef } from 'react';
import { Star, User, ThumbsUp, Edit2, Trash2, CheckCircle, Camera, X, SlidersHorizontal, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useParkingReviews, SortOption, FilterOption } from '@/hooks/useParkingReviews';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ParkingReviewsProps {
  lotId: string;
  lotName: string;
}

function StarRating({ 
  rating, 
  onRatingChange, 
  readonly = false,
  size = 'md' 
}: { 
  rating: number; 
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={cn(
            "transition-colors",
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
          )}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
          onClick={() => onRatingChange?.(star)}
        >
          <Star
            className={cn(
              sizeClasses[size],
              (hoverRating || rating) >= star
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function ParkingReviews({ lotId, lotName }: ParkingReviewsProps) {
  const { user } = useAuth();
  const { 
    reviews, 
    isLoading, 
    userReview,
    hasUserReviewed,
    averageRating,
    reviewCount,
    createReview,
    updateReview,
    deleteReview,
    voteHelpful,
    uploadPhoto,
    getSortedAndFilteredReviews,
  } = useParkingReviews(lotId);

  const [isWriting, setIsWriting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState(userReview?.rating || 0);
  const [reviewText, setReviewText] = useState(userReview?.review_text || '');
  const [photoUrl, setPhotoUrl] = useState<string | null>(userReview?.photo_url || null);
  const [isUploading, setIsUploading] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadPhoto(file);
      setPhotoUrl(url);
      toast.success('Photo uploaded');
    } catch (error) {
      toast.error('Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) return;

    if (isEditing && userReview) {
      await updateReview.mutateAsync({
        id: userReview.id,
        rating,
        review_text: reviewText,
        photo_url: photoUrl || undefined,
      });
      setIsEditing(false);
    } else {
      await createReview.mutateAsync({
        lot_id: lotId,
        rating,
        review_text: reviewText,
        photo_url: photoUrl || undefined,
      });
      setIsWriting(false);
    }
    setRating(0);
    setReviewText('');
    setPhotoUrl(null);
  };

  const handleEdit = () => {
    if (userReview) {
      setRating(userReview.rating);
      setReviewText(userReview.review_text || '');
      setPhotoUrl(userReview.photo_url || null);
      setIsEditing(true);
    }
  };

  const handleDelete = async () => {
    if (userReview) {
      await deleteReview.mutateAsync(userReview.id);
    }
  };

  const handleVoteHelpful = async (reviewId: string) => {
    if (!user) {
      toast.error('Please sign in to vote');
      return;
    }
    await voteHelpful.mutateAsync(reviewId);
  };

  const filteredReviews = getSortedAndFilteredReviews(sortBy, filterBy)
    .filter(r => r.id !== userReview?.id);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-lg">Reviews & Ratings</CardTitle>
          <div className="flex items-center gap-2">
            <StarRating rating={Math.round(averageRating)} readonly size="sm" />
            <span className="text-sm text-muted-foreground">
              {averageRating.toFixed(1)} ({reviewCount} reviews)
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Write Review Section */}
        {user && !hasUserReviewed && !isWriting && (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setIsWriting(true)}
          >
            <Star className="w-4 h-4 mr-2" />
            Write a Review
          </Button>
        )}

        {/* Review Form */}
        {(isWriting || isEditing) && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Your rating:</span>
              <StarRating rating={rating} onRatingChange={setRating} />
            </div>
            <Textarea
              placeholder="Share your parking experience (optional)"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={3}
            />
            
            {/* Photo Upload */}
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                className="hidden"
              />
              
              {photoUrl ? (
                <div className="relative inline-block">
                  <img 
                    src={photoUrl} 
                    alt="Review photo" 
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => setPhotoUrl(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Add Photo'}
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleSubmit}
                disabled={rating === 0 || createReview.isPending || updateReview.isPending}
              >
                {createReview.isPending || updateReview.isPending ? 'Submitting...' : (isEditing ? 'Update' : 'Submit')}
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setIsWriting(false);
                  setIsEditing(false);
                  setRating(0);
                  setReviewText('');
                  setPhotoUrl(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* User's Own Review */}
        {userReview && !isEditing && (
          <div className="p-4 border rounded-lg bg-primary/5 border-primary/20">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">Your Review</Badge>
                <StarRating rating={userReview.rating} readonly size="sm" />
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleEdit}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={handleDelete}
                  disabled={deleteReview.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {userReview.review_text && (
              <p className="text-sm text-foreground">{userReview.review_text}</p>
            )}
            {userReview.photo_url && (
              <img 
                src={userReview.photo_url} 
                alt="Review photo" 
                className="mt-2 w-full max-w-xs h-48 object-cover rounded-lg border"
              />
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {format(new Date(userReview.created_at), 'MMM d, yyyy')}
            </p>
          </div>
        )}

        <Separator />

        {/* Sorting and Filtering */}
        {reviews.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[140px]">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="highest">Highest Rated</SelectItem>
                <SelectItem value="lowest">Lowest Rated</SelectItem>
                <SelectItem value="helpful">Most Helpful</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterBy} onValueChange={(v) => setFilterBy(v as FilterOption)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reviews</SelectItem>
                <SelectItem value="verified">Verified Only</SelectItem>
                <SelectItem value="with_photos">With Photos</SelectItem>
                <SelectItem value="with_text">With Text</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Reviews List */}
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">Loading reviews...</div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>{filterBy !== 'all' ? 'No reviews match your filter' : 'No reviews yet. Be the first to review!'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <div key={review.id} className="flex gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={review.profiles?.avatar_url || undefined} />
                  <AvatarFallback>
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {review.profiles?.full_name || 'Anonymous'}
                    </span>
                    {review.is_verified && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <StarRating rating={review.rating} readonly size="sm" />
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(review.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {review.review_text && (
                    <p className="text-sm text-muted-foreground mb-2">{review.review_text}</p>
                  )}
                  {review.photo_url && (
                    <img 
                      src={review.photo_url} 
                      alt="Review photo" 
                      className="w-full max-w-xs h-40 object-cover rounded-lg border mb-2"
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-7 text-xs",
                      review.user_has_voted && "text-primary"
                    )}
                    onClick={() => handleVoteHelpful(review.id)}
                    disabled={voteHelpful.isPending}
                  >
                    <ThumbsUp className={cn("w-3 h-3 mr-1", review.user_has_voted && "fill-current")} />
                    Helpful ({review.helpful_count})
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!user && (
          <p className="text-sm text-center text-muted-foreground">
            Sign in to leave a review
          </p>
        )}
      </CardContent>
    </Card>
  );
}