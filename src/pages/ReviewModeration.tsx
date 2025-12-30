import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GovHeader } from '@/components/ui/GovHeader';
import { SEOHead } from '@/components/SEOHead';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Star, 
  User, 
  Trash2, 
  Eye, 
  CheckCircle, 
  AlertTriangle,
  Search,
  Shield,
  Flag,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Footer } from '@/components/Footer';

interface Review {
  id: string;
  lot_id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  photo_url: string | null;
  is_verified: boolean;
  helpful_count: number;
  created_at: string;
  parking_lots?: { name: string } | null;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
}

export default function ReviewModeration() {
  const queryClient = useQueryClient();
  const [filterRating, setFilterRating] = useState<string>('all');
  const [filterVerified, setFilterVerified] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['admin-reviews', filterRating, filterVerified],
    queryFn: async () => {
      let query = supabase
        .from('parking_reviews')
        .select(`
          *,
          parking_lots(name)
        `)
        .order('created_at', { ascending: false });

      if (filterRating !== 'all') {
        query = query.eq('rating', parseInt(filterRating));
      }
      if (filterVerified === 'verified') {
        query = query.eq('is_verified', true);
      } else if (filterVerified === 'unverified') {
        query = query.eq('is_verified', false);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profiles separately
      const userIds = [...new Set(data?.map(r => r.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      return data?.map(review => ({
        ...review,
        profiles: profileMap.get(review.user_id) || null
      })) as Review[];
    }
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ id, verified }: { id: string; verified: boolean }) => {
      const { error } = await supabase
        .from('parking_reviews')
        .update({ is_verified: verified })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Review verification updated');
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update review');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('parking_reviews')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Review deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      setDeleteDialogOpen(false);
      setReviewToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete review');
    }
  });

  const filteredReviews = reviews?.filter(review => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      review.review_text?.toLowerCase().includes(query) ||
      review.profiles?.full_name?.toLowerCase().includes(query) ||
      review.parking_lots?.name?.toLowerCase().includes(query)
    );
  });

  const stats = {
    total: reviews?.length || 0,
    verified: reviews?.filter(r => r.is_verified).length || 0,
    withPhotos: reviews?.filter(r => r.photo_url).length || 0,
    lowRating: reviews?.filter(r => r.rating <= 2).length || 0,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Review Moderation - Admin" 
        description="Manage and moderate parking lot reviews" 
      />
      <GovHeader />
      
      <main className="container py-6 flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Review Moderation
            </h1>
            <p className="text-muted-foreground">Manage and moderate user reviews</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Total Reviews</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
              <p className="text-sm text-muted-foreground">Verified</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{stats.withPhotos}</div>
              <p className="text-sm text-muted-foreground">With Photos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-amber-600">{stats.lowRating}</div>
              <p className="text-sm text-muted-foreground">Low Rating (≤2★)</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reviews..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterRating} onValueChange={setFilterRating}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterVerified} onValueChange={setFilterVerified}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reviews Table */}
        <Card>
          <CardHeader>
            <CardTitle>Reviews ({filteredReviews?.length || 0})</CardTitle>
            <CardDescription>Click on a review to view details</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading reviews...</div>
            ) : filteredReviews?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No reviews found</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Parking Lot</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Review</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReviews?.map((review) => (
                      <TableRow key={review.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={review.profiles?.avatar_url || undefined} />
                              <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                            </Avatar>
                            <span className="text-sm truncate max-w-[120px]">
                              {review.profiles?.full_name || 'Anonymous'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm truncate max-w-[150px]">
                          {review.parking_lots?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{review.rating}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="flex items-center gap-2">
                            {review.photo_url && <ImageIcon className="h-4 w-4 text-blue-500" />}
                            <span className="text-sm text-muted-foreground truncate">
                              {review.review_text || '(No text)'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {review.is_verified ? (
                            <Badge variant="secondary" className="gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline">Unverified</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(review.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setSelectedReview(review)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => verifyMutation.mutate({ 
                                id: review.id, 
                                verified: !review.is_verified 
                              })}
                            >
                              <CheckCircle className={`h-4 w-4 ${review.is_verified ? 'text-green-500' : ''}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => {
                                setReviewToDelete(review);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* View Review Dialog */}
      <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedReview.profiles?.avatar_url || undefined} />
                  <AvatarFallback><User className="h-6 w-6" /></AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedReview.profiles?.full_name || 'Anonymous'}</p>
                  <p className="text-sm text-muted-foreground">{selectedReview.parking_lots?.name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${star <= selectedReview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                  />
                ))}
                <span className="text-sm text-muted-foreground ml-2">
                  {format(new Date(selectedReview.created_at), 'PPP')}
                </span>
              </div>

              {selectedReview.review_text && (
                <p className="text-sm">{selectedReview.review_text}</p>
              )}

              {selectedReview.photo_url && (
                <img 
                  src={selectedReview.photo_url} 
                  alt="Review" 
                  className="w-full max-h-64 object-cover rounded-lg"
                />
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Helpful: {selectedReview.helpful_count}</span>
                {selectedReview.is_verified && (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Review
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => reviewToDelete && deleteMutation.mutate(reviewToDelete.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}