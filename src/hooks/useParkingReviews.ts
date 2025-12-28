import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ParkingReview {
  id: string;
  lot_id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  is_verified: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface CreateReviewInput {
  lot_id: string;
  rating: number;
  review_text?: string;
}

export function useParkingReviews(lotId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const reviewsQuery = useQuery({
    queryKey: ['parking-reviews', lotId],
    queryFn: async () => {
      if (!lotId) return [];
      
      // First get reviews
      const { data: reviews, error: reviewsError } = await supabase
        .from('parking_reviews')
        .select('*')
        .eq('lot_id', lotId)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;
      if (!reviews || reviews.length === 0) return [];

      // Get unique user ids
      const userIds = [...new Set(reviews.map(r => r.user_id))];
      
      // Fetch profiles for those users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      if (profilesError) {
        console.warn('Failed to fetch profiles:', profilesError);
      }

      // Map profiles to reviews
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      return reviews.map(review => ({
        ...review,
        profiles: profileMap.get(review.user_id) || null,
      })) as ParkingReview[];
    },
    enabled: !!lotId,
  });

  const userReviewQuery = useQuery({
    queryKey: ['user-review', lotId, user?.id],
    queryFn: async () => {
      if (!lotId || !user?.id) return null;
      
      const { data, error } = await supabase
        .from('parking_reviews')
        .select('*')
        .eq('lot_id', lotId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as ParkingReview | null;
    },
    enabled: !!lotId && !!user?.id,
  });

  const createReview = useMutation({
    mutationFn: async (input: CreateReviewInput) => {
      if (!user?.id) throw new Error('Must be logged in');
      
      const { data, error } = await supabase
        .from('parking_reviews')
        .insert({
          lot_id: input.lot_id,
          user_id: user.id,
          rating: input.rating,
          review_text: input.review_text || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Review submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['parking-reviews', lotId] });
      queryClient.invalidateQueries({ queryKey: ['user-review', lotId] });
      queryClient.invalidateQueries({ queryKey: ['parkingLots'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit review');
    },
  });

  const updateReview = useMutation({
    mutationFn: async ({ id, ...input }: { id: string; rating: number; review_text?: string }) => {
      const { data, error } = await supabase
        .from('parking_reviews')
        .update({
          rating: input.rating,
          review_text: input.review_text || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Review updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['parking-reviews', lotId] });
      queryClient.invalidateQueries({ queryKey: ['user-review', lotId] });
      queryClient.invalidateQueries({ queryKey: ['parkingLots'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update review');
    },
  });

  const deleteReview = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('parking_reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Review deleted');
      queryClient.invalidateQueries({ queryKey: ['parking-reviews', lotId] });
      queryClient.invalidateQueries({ queryKey: ['user-review', lotId] });
      queryClient.invalidateQueries({ queryKey: ['parkingLots'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete review');
    },
  });

  const getAverageRating = () => {
    const reviews = reviewsQuery.data;
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / reviews.length;
  };

  return {
    reviews: reviewsQuery.data || [],
    isLoading: reviewsQuery.isLoading,
    userReview: userReviewQuery.data,
    hasUserReviewed: !!userReviewQuery.data,
    averageRating: getAverageRating(),
    reviewCount: reviewsQuery.data?.length || 0,
    createReview,
    updateReview,
    deleteReview,
  };
}
