import React, { useState } from 'react';
import { MessageSquare, Phone, Send, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
    });
    setCustomMessage('');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Send Notification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Channel Selection */}
        <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as any)}>
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
            Send {selectedType === 'whatsapp' ? 'WhatsApp' : 'SMS'}
          </Button>
        </div>

        {/* Info */}
        <p className="text-xs text-muted-foreground text-center">
          Messages are sent via Twilio. Standard rates apply.
        </p>
      </CardContent>
    </Card>
  );
}
