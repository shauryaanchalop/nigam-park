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
  photo_url: string | null;
  is_verified: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  user_has_voted?: boolean;
}

interface CreateReviewInput {
  lot_id: string;
  rating: number;
  review_text?: string;
  photo_url?: string;
}

export type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful';
export type FilterOption = 'all' | 'verified' | 'with_photos' | 'with_text';

export function useParkingReviews(lotId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const reviewsQuery = useQuery({
    queryKey: ['parking-reviews', lotId, user?.id],
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

      // If user is logged in, check which reviews they voted for
      let userVotes: string[] = [];
      if (user?.id) {
        const { data: votes } = await supabase
          .from('review_helpful_votes')
          .select('review_id')
          .eq('user_id', user.id);
        userVotes = votes?.map(v => v.review_id) || [];
      }

      // Map profiles to reviews
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      return reviews.map(review => ({
        ...review,
        profiles: profileMap.get(review.user_id) || null,
        user_has_voted: userVotes.includes(review.id),
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
          photo_url: input.photo_url || null,
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
    mutationFn: async ({ id, ...input }: { id: string; rating: number; review_text?: string; photo_url?: string }) => {
      const { data, error } = await supabase
        .from('parking_reviews')
        .update({
          rating: input.rating,
          review_text: input.review_text || null,
          photo_url: input.photo_url || null,
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

  const voteHelpful = useMutation({
    mutationFn: async (reviewId: string) => {
      if (!user?.id) throw new Error('Must be logged in');
      
      // Check if already voted
      const { data: existingVote } = await supabase
        .from('review_helpful_votes')
        .select('id')
        .eq('review_id', reviewId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingVote) {
        // Remove vote
        await supabase
          .from('review_helpful_votes')
          .delete()
          .eq('id', existingVote.id);
        
        // Decrement count manually
        const { data: review } = await supabase
          .from('parking_reviews')
          .select('helpful_count')
          .eq('id', reviewId)
          .single();
        
        await supabase
          .from('parking_reviews')
          .update({ helpful_count: Math.max(0, (review?.helpful_count || 0) - 1) })
          .eq('id', reviewId);
        
        return { action: 'removed' };
      } else {
        // Add vote
        await supabase
          .from('review_helpful_votes')
          .insert({ review_id: reviewId, user_id: user.id });
        
        // Increment count manually
        const { data: review } = await supabase
          .from('parking_reviews')
          .select('helpful_count')
          .eq('id', reviewId)
          .single();
        
        await supabase
          .from('parking_reviews')
          .update({ helpful_count: (review?.helpful_count || 0) + 1 })
          .eq('id', reviewId);
        
        return { action: 'added' };
      }
    },
    onSuccess: (data) => {
      toast.success(data.action === 'added' ? 'Marked as helpful' : 'Vote removed');
      queryClient.invalidateQueries({ queryKey: ['parking-reviews', lotId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to vote');
    },
  });

  const uploadPhoto = async (file: File): Promise<string> => {
    if (!user?.id) throw new Error('Must be logged in');
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('review-photos')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('review-photos')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const getAverageRating = () => {
    const reviews = reviewsQuery.data;
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / reviews.length;
  };

  const getSortedAndFilteredReviews = (sortBy: SortOption, filterBy: FilterOption) => {
    let filtered = reviewsQuery.data || [];
    
    // Apply filters
    switch (filterBy) {
      case 'verified':
        filtered = filtered.filter(r => r.is_verified);
        break;
      case 'with_photos':
        filtered = filtered.filter(r => r.photo_url);
        break;
      case 'with_text':
        filtered = filtered.filter(r => r.review_text);
        break;
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        case 'helpful':
          return b.helpful_count - a.helpful_count;
        default:
          return 0;
      }
    });
    
    return sorted;
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
    voteHelpful,
    uploadPhoto,
    getSortedAndFilteredReviews,
  };
}
