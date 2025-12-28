import React, { useEffect } from 'react';
import { Bell, BellOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAlertNotifications } from '@/hooks/useAlertNotifications';
import { useFraudAlertsRealtime } from '@/hooks/useFraudAlertsRealtime';
import { toast } from 'sonner';

export function FraudAlertNotificationControl() {
  const { 
    isMuted, 
    toggleMute, 
    notificationPermission, 
    requestNotificationPermission 
  } = useAlertNotifications();
  
  // Initialize realtime subscription
  useFraudAlertsRealtime();

  const handleNotificationRequest = async () => {
    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
      toast.success('Notifications enabled', {
        description: 'You will receive browser notifications for fraud alerts',
      });
    } else if (permission === 'denied') {
      toast.error('Notifications blocked', {
        description: 'Please enable notifications in your browser settings',
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Sound Toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className={isMuted ? 'text-muted-foreground' : 'text-primary'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isMuted ? 'Enable alert sounds' : 'Mute alert sounds'}
        </TooltipContent>
      </Tooltip>

      {/* Browser Notification Toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNotificationRequest}
            className={notificationPermission === 'granted' ? 'text-primary' : 'text-muted-foreground'}
          >
            {notificationPermission === 'granted' ? (
              <Bell className="w-4 h-4" />
            ) : (
              <BellOff className="w-4 h-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {notificationPermission === 'granted' 
            ? 'Browser notifications enabled' 
            : 'Enable browser notifications'}
        </TooltipContent>
      </Tooltip>

      {/* Status indicator */}
      <Badge variant="outline" className="text-xs hidden sm:inline-flex">
        {!isMuted && notificationPermission === 'granted' ? (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Live
          </span>
        ) : (
          'Alerts muted'
        )}
      </Badge>
    </div>
  );
}
