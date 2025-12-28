import React, { useState } from 'react';
import { 
  Send, 
  Users, 
  MessageSquare, 
  Phone, 
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

interface BroadcastTarget {
  user_id: string;
  phone: string | null;
  full_name: string | null;
  sms_enabled: boolean;
}

export function AdminBroadcastPanel() {
  const [message, setMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'sms' | 'whatsapp'>('sms');
  const [targetGroup, setTargetGroup] = useState<'all' | 'active' | 'expiring'>('all');
  const [isSending, setIsSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sendResults, setSendResults] = useState<{ sent: number; failed: number } | null>(null);

  // Fetch users with SMS enabled
  const { data: targetUsers, isLoading } = useQuery({
    queryKey: ['broadcast-targets', targetGroup],
    queryFn: async () => {
      // Get users with their preferences and phone numbers
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, phone, full_name')
        .not('phone', 'is', null);

      if (error) throw error;

      // Get preferences
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('user_id, sms_notifications');

      const prefMap = new Map(prefs?.map(p => [p.user_id, p.sms_notifications]) || []);

      const targets: BroadcastTarget[] = (profiles || [])
        .filter(p => p.phone)
        .map(p => ({
          user_id: p.user_id,
          phone: p.phone,
          full_name: p.full_name,
          sms_enabled: prefMap.get(p.user_id) ?? false,
        }));

      return targets;
    },
  });

  const eligibleUsers = targetUsers?.filter(u => u.sms_enabled) || [];

  const handleSendBroadcast = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (eligibleUsers.length === 0) {
      toast.error('No eligible users to send to');
      return;
    }

    setIsSending(true);
    let sent = 0;
    let failed = 0;

    for (const user of eligibleUsers) {
      if (!user.phone) continue;

      try {
        const { error } = await supabase.functions.invoke('send-sms-notification', {
          body: {
            phone: user.phone,
            message: message,
            type: notificationType,
            user_id: user.user_id,
          },
        });

        if (error) {
          failed++;
        } else {
          sent++;
        }
      } catch (err) {
        failed++;
      }

      // Small delay between messages
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setSendResults({ sent, failed });
    setIsSending(false);
    setConfirmOpen(false);
    
    if (sent > 0) {
      toast.success(`Broadcast sent to ${sent} users`);
    }
    if (failed > 0) {
      toast.error(`Failed to send to ${failed} users`);
    }
  };

  const presetMessages = [
    { label: 'Parking Closure', message: '🚨 NigamPark Alert: Parking operations will be temporarily suspended on [DATE] for maintenance. Please plan accordingly.' },
    { label: 'Rate Update', message: '📢 NigamPark Update: New parking rates will be effective from [DATE]. Visit our app for details.' },
    { label: 'Emergency', message: '⚠️ Emergency Alert: Due to unforeseen circumstances, please evacuate [LOCATION] parking lot immediately.' },
    { label: 'Festival Hours', message: '🎉 Festival Special: Extended parking hours available from [DATE] to [DATE]. Book now!' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5 text-primary" />
          Broadcast Notifications
        </CardTitle>
        <CardDescription>
          Send bulk SMS/WhatsApp messages to all users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Target Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{targetUsers?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Total with phone</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <div>
                <p className="text-2xl font-bold">{eligibleUsers.length}</p>
                <p className="text-xs text-muted-foreground">SMS enabled</p>
              </div>
            </div>
          </div>
        </div>

        {/* Channel Selection */}
        <div className="space-y-2">
          <Label>Notification Channel</Label>
          <div className="flex gap-2">
            <Button
              variant={notificationType === 'sms' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setNotificationType('sms')}
              className="flex-1"
            >
              <Phone className="w-4 h-4 mr-2" />
              SMS
            </Button>
            <Button
              variant={notificationType === 'whatsapp' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setNotificationType('whatsapp')}
              className="flex-1"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
          </div>
        </div>

        {/* Quick Templates */}
        <div className="space-y-2">
          <Label>Quick Templates</Label>
          <div className="flex flex-wrap gap-2">
            {presetMessages.map((preset, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setMessage(preset.message)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Message Input */}
        <div className="space-y-2">
          <Label>Message</Label>
          <Textarea
            placeholder="Enter your broadcast message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">
            {message.length}/500 characters
          </p>
        </div>

        {/* Send Results */}
        {sendResults && (
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm font-medium mb-2">Last Broadcast Results:</p>
            <div className="flex gap-4">
              <Badge variant="outline" className="text-success border-success">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {sendResults.sent} sent
              </Badge>
              {sendResults.failed > 0 && (
                <Badge variant="outline" className="text-destructive border-destructive">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {sendResults.failed} failed
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Send Button */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogTrigger asChild>
            <Button 
              className="w-full" 
              size="lg"
              disabled={!message.trim() || eligibleUsers.length === 0 || isSending}
            >
              <Send className="w-4 h-4 mr-2" />
              Send to {eligibleUsers.length} Users
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Broadcast</DialogTitle>
              <DialogDescription>
                You are about to send a {notificationType.toUpperCase()} message to {eligibleUsers.length} users. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="p-4 rounded-lg bg-muted my-4">
              <p className="text-sm font-medium mb-2">Message Preview:</p>
              <p className="text-sm">{message}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendBroadcast} disabled={isSending}>
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Broadcast
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
