import React, { useState } from 'react';
import { MessageSquare, Phone, Send, Loader2, FlaskConical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useNotifications } from '@/hooks/useNotifications';
import { toast } from 'sonner';

interface NotificationPanelProps {
  defaultPhone?: string;
  defaultVehicle?: string;
  defaultLot?: string;
  reservationId?: string;
  userId?: string;
}

export function NotificationPanel({
  defaultPhone = '',
  defaultVehicle = '',
  defaultLot = '',
  reservationId,
  userId,
}: NotificationPanelProps) {
  const [phone, setPhone] = useState(defaultPhone);
  const [customMessage, setCustomMessage] = useState('');
  const [selectedType, setSelectedType] = useState<'sms' | 'whatsapp'>('sms');
  const [demoMode, setDemoMode] = useState(true);

  const { 
    sendParkingReminder, 
    sendPaymentReceipt, 
    sendReservationConfirmation,
    sendNotification,
    isSending,
  } = useNotifications();

  const handleSendReminder = async () => {
    if (!phone) {
      toast.error('Please enter a phone number');
      return;
    }

    await sendParkingReminder.mutateAsync({
      phone,
      vehicleNumber: defaultVehicle || 'N/A',
      lotName: defaultLot || 'N/A',
      endTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      type: selectedType,
      userId,
      reservationId,
      demoMode,
    });
  };

  const handleSendReceipt = async () => {
    if (!phone) {
      toast.error('Please enter a phone number');
      return;
    }

    await sendPaymentReceipt.mutateAsync({
      phone,
      vehicleNumber: defaultVehicle || 'N/A',
      lotName: defaultLot || 'N/A',
      amount: 50,
      transactionId: crypto.randomUUID(),
      type: selectedType,
      userId,
      demoMode,
    });
  };

  const handleSendCustom = async () => {
    if (!phone || !customMessage) {
      toast.error('Please enter phone number and message');
      return;
    }

    await sendNotification.mutateAsync({
      phone,
      message: customMessage,
      type: selectedType,
      user_id: userId,
      reservation_id: reservationId,
      demo_mode: demoMode,
    });
    setCustomMessage('');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Send Notification
          </CardTitle>
          {demoMode && (
            <Badge variant="secondary" className="gap-1">
              <FlaskConical className="w-3 h-3" />
              Demo
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Demo Mode Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
          <div className="space-y-0.5">
            <Label htmlFor="demo-mode" className="font-medium">Demo Mode</Label>
            <p className="text-xs text-muted-foreground">
              Log messages without sending (for testing)
            </p>
          </div>
          <Switch
            id="demo-mode"
            checked={demoMode}
            onCheckedChange={setDemoMode}
          />
        </div>

        {/* Channel Selection */}
        <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as 'sms' | 'whatsapp')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sms" className="gap-2">
              <Phone className="w-4 h-4" />
              SMS
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              WhatsApp
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Phone Input */}
        <div className="space-y-2">
          <Label>Phone Number</Label>
          <Input
            type="tel"
            placeholder="+91 9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <Label>Quick Actions</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendReminder}
              disabled={isSending || !phone}
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Parking Reminder
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendReceipt}
              disabled={isSending || !phone}
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Payment Receipt
            </Button>
          </div>
        </div>

        {/* Custom Message */}
        <div className="space-y-2">
          <Label>Custom Message</Label>
          <Textarea
            placeholder="Enter your message..."
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows={3}
          />
          <Button
            className="w-full"
            onClick={handleSendCustom}
            disabled={isSending || !phone || !customMessage}
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {demoMode ? 'Log' : 'Send'} {selectedType === 'whatsapp' ? 'WhatsApp' : 'SMS'}
          </Button>
        </div>

        {/* Info */}
        <p className="text-xs text-muted-foreground text-center">
          {demoMode 
            ? 'Demo mode: Messages are logged but not sent. Check edge function logs to see messages.'
            : 'Messages are sent via Twilio. Standard rates apply.'
          }
        </p>
      </CardContent>
    </Card>
  );
}
