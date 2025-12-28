import React from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { useAvailabilityAlerts } from '@/hooks/useAvailabilityAlerts';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AvailabilityAlertButtonProps {
  lotId: string;
  lotName: string;
  isFull: boolean;
  className?: string;
}

export function AvailabilityAlertButton({ 
  lotId, 
  lotName, 
  isFull,
  className = '' 
}: AvailabilityAlertButtonProps) {
  const { user } = useAuth();
  const { 
    isSubscribed, 
    subscribeLot, 
    unsubscribeLot,
    notificationPermission,
    requestNotificationPermission,
  } = useAvailabilityAlerts();

  const subscribed = isSubscribed(lotId);

  const handleToggleAlert = async () => {
    if (!user) {
      toast.error('Please login to set alerts');
      return;
    }

    // Request notification permission if not granted
    if (notificationPermission !== 'granted') {
      const permission = await requestNotificationPermission();
      if (permission !== 'granted') {
        toast.error('Please enable notifications to receive alerts');
        return;
      }
    }

    try {
      if (subscribed) {
        await unsubscribeLot.mutateAsync(lotId);
        toast.success(`Alerts disabled for ${lotName}`);
      } else {
        await subscribeLot.mutateAsync({ lotId });
        toast.success(`You'll be notified when ${lotName} has spots available`);
      }
    } catch (error) {
      toast.error('Failed to update alert preferences');
    }
  };

  if (!isFull && !subscribed) {
    return null; // Don't show button if lot has spots and user isn't subscribed
  }

  return (
    <Button
      variant={subscribed ? "secondary" : "outline"}
      size="sm"
      onClick={handleToggleAlert}
      disabled={subscribeLot.isPending || unsubscribeLot.isPending}
      className={`gap-2 ${className}`}
    >
      {subscribed ? (
        <>
          <BellRing className="w-4 h-4 text-primary animate-pulse" />
          <span className="hidden sm:inline">Alert On</span>
        </>
      ) : (
        <>
          <Bell className="w-4 h-4" />
          <span className="hidden sm:inline">Notify Me</span>
        </>
      )}
    </Button>
  );
}
