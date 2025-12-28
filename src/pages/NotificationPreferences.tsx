import React, { useState } from 'react';
import { 
  Bell, 
  MessageSquare, 
  Phone, 
  Mail, 
  Clock, 
  Save,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GovHeader } from '@/components/ui/GovHeader';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface UserPreferences {
  id: string;
  user_id: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  reminder_before_expiry: number;
}

export default function NotificationPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [phone, setPhone] = useState('');
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('30');

  // Fetch preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setEmailEnabled(data.email_notifications);
        setSmsEnabled(data.sms_notifications);
        setPushEnabled(data.push_notifications);
        setReminderTime(String(data.reminder_before_expiry));
      }

      // Get phone from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile?.phone) {
        setPhone(profile.phone);
      }

      return data;
    },
    enabled: !!user,
  });

  // Save preferences
  const savePreferences = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      // Upsert preferences
      const { error: prefsError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          email_notifications: emailEnabled,
          sms_notifications: smsEnabled || whatsappEnabled,
          push_notifications: pushEnabled,
          reminder_before_expiry: parseInt(reminderTime),
        }, {
          onConflict: 'user_id',
        });

      if (prefsError) throw prefsError;

      // Update phone in profile
      if (phone) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ phone })
          .eq('user_id', user.id);

        if (profileError) throw profileError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success('Preferences saved successfully');
    },
    onError: (error) => {
      toast.error(`Failed to save preferences: ${error.message}`);
    },
  });

  const notificationTypes = [
    {
      id: 'email',
      title: 'Email Notifications',
      description: 'Receive parking reminders and receipts via email',
      icon: Mail,
      enabled: emailEnabled,
      setEnabled: setEmailEnabled,
    },
    {
      id: 'sms',
      title: 'SMS Notifications',
      description: 'Get text message alerts for parking updates',
      icon: Phone,
      enabled: smsEnabled,
      setEnabled: setSmsEnabled,
      requiresPhone: true,
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp Notifications',
      description: 'Receive notifications on WhatsApp',
      icon: MessageSquare,
      enabled: whatsappEnabled,
      setEnabled: setWhatsappEnabled,
      requiresPhone: true,
      badge: 'Recommended',
    },
    {
      id: 'push',
      title: 'Push Notifications',
      description: 'Browser notifications for real-time alerts',
      icon: Bell,
      enabled: pushEnabled,
      setEnabled: setPushEnabled,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <GovHeader 
        title="Notification Preferences" 
        subtitle="Manage your parking alerts"
      />

      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Phone Number */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Mobile Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Required for SMS and WhatsApp notifications
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notification Channels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {notificationTypes.map((type) => (
              <div 
                key={type.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-full bg-primary/10">
                    <type.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{type.title}</p>
                      {type.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {type.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {type.description}
                    </p>
                    {type.requiresPhone && !phone && type.enabled && (
                      <p className="text-xs text-destructive mt-1">
                        Phone number required
                      </p>
                    )}
                  </div>
                </div>
                <Switch
                  checked={type.enabled}
                  onCheckedChange={type.setEnabled}
                  disabled={type.requiresPhone && !phone && !type.enabled}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Reminder Timing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Reminder Timing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Send parking expiry reminder</Label>
              <Select value={reminderTime} onValueChange={setReminderTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes before</SelectItem>
                  <SelectItem value="30">30 minutes before</SelectItem>
                  <SelectItem value="45">45 minutes before</SelectItem>
                  <SelectItem value="60">1 hour before</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                We'll remind you before your parking reservation expires
              </p>
            </div>
          </CardContent>
        </Card>

        {/* What You'll Receive */}
        <Card>
          <CardHeader>
            <CardTitle>What You'll Receive</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[
                'Reservation confirmations',
                'Parking expiry reminders',
                'Payment receipts',
                'Fine notifications',
                'Loyalty rewards updates',
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button 
          className="w-full"
          size="lg"
          onClick={() => savePreferences.mutate()}
          disabled={savePreferences.isPending}
        >
          {savePreferences.isPending ? (
            'Saving...'
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Preferences
            </>
          )}
        </Button>
      </main>
    </div>
  );
}
