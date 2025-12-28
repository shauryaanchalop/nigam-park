import React, { useState } from 'react';
import { MessageSquare, Edit2, Trash2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Reply {
  id: string;
  reply_text: string;
  user_id: string;
  created_at: string;
}

interface ReviewReplyProps {
  reviewId: string;
  replies: Reply[];
  onReplyAdded: () => void;
  canReply: boolean;
  lotName?: string;
}

export function ReviewReply({ reviewId, replies, onReplyAdded, canReply, lotName }: ReviewReplyProps) {
  const { user } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sendNotification = async (replyText: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-review-reply-notification', {
        body: { 
          review_id: reviewId, 
          reply_text: replyText,
          lot_name: lotName || 'Parking Lot'
        }
      });
      if (error) {
        console.warn('Failed to send notification:', error);
      } else {
        console.log('Notification sent successfully');
      }
    } catch (err) {
      console.warn('Notification error:', err);
    }
  };

  const handleSubmit = async () => {
    if (!replyText.trim() || !user) return;
    
    setIsSubmitting(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('review_replies')
          .update({ reply_text: replyText, updated_at: new Date().toISOString() })
          .eq('id', editingId);
        
        if (error) throw error;
        toast.success('Reply updated');
      } else {
        const { error } = await supabase
          .from('review_replies')
          .insert({ review_id: reviewId, user_id: user.id, reply_text: replyText });
        
        if (error) throw error;
        toast.success('Reply added');
        
        // Send email notification for new replies
        await sendNotification(replyText);
      }
      
      setReplyText('');
      setIsReplying(false);
      setEditingId(null);
      onReplyAdded();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (reply: Reply) => {
    setEditingId(reply.id);
    setReplyText(reply.reply_text);
    setIsReplying(true);
  };

  const handleDelete = async (replyId: string) => {
    try {
      const { error } = await supabase
        .from('review_replies')
        .delete()
        .eq('id', replyId);
      
      if (error) throw error;
      toast.success('Reply deleted');
      onReplyAdded();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete reply');
    }
  };

  return (
    <div className="mt-3 space-y-2">
      {/* Existing replies */}
      {replies.map((reply) => (
        <div key={reply.id} className="ml-4 pl-3 border-l-2 border-primary/30 bg-primary/5 rounded-r-lg p-2">
          <div className="flex items-center justify-between mb-1">
            <Badge variant="secondary" className="text-xs gap-1">
              <Building2 className="w-3 h-3" />
              Management Response
            </Badge>
            {user?.id === reply.user_id && (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(reply)}>
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(reply.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          <p className="text-sm">{reply.reply_text}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {format(new Date(reply.created_at), 'MMM d, yyyy')}
          </p>
        </div>
      ))}

      {/* Reply form */}
      {canReply && !isReplying && replies.length === 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="ml-4 text-xs"
          onClick={() => setIsReplying(true)}
        >
          <MessageSquare className="w-3 h-3 mr-1" />
          Reply as Management
        </Button>
      )}

      {isReplying && (
        <div className="ml-4 pl-3 border-l-2 border-primary/30 space-y-2">
          <Textarea
            placeholder="Write your response..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={2}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSubmit} disabled={!replyText.trim() || isSubmitting}>
              {isSubmitting ? 'Saving...' : (editingId ? 'Update' : 'Reply')}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                setIsReplying(false);
                setEditingId(null);
                setReplyText('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
