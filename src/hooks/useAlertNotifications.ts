import { useState, useEffect, useCallback } from 'react';

const MUTE_STORAGE_KEY = 'fraud-alerts-muted';

export function useAlertNotifications() {
  const [isMuted, setIsMuted] = useState(() => {
    const stored = localStorage.getItem(MUTE_STORAGE_KEY);
    return stored === 'true';
  });
  
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  // Persist mute state
  useEffect(() => {
    localStorage.setItem(MUTE_STORAGE_KEY, String(isMuted));
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    return permission;
  }, []);

  const playAlertSound = useCallback(() => {
    if (isMuted) return;
    
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, now);
      oscillator.frequency.setValueAtTime(660, now + 0.15);
      oscillator.frequency.setValueAtTime(880, now + 0.3);
      oscillator.frequency.setValueAtTime(660, now + 0.45);
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.02);
      gainNode.gain.setValueAtTime(0.3, now + 0.13);
      gainNode.gain.linearRampToValueAtTime(0.1, now + 0.15);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.17);
      gainNode.gain.setValueAtTime(0.3, now + 0.28);
      gainNode.gain.linearRampToValueAtTime(0.1, now + 0.3);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.32);
      gainNode.gain.setValueAtTime(0.3, now + 0.43);
      gainNode.gain.linearRampToValueAtTime(0.1, now + 0.45);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.47);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.6);
      
      oscillator.start(now);
      oscillator.stop(now + 0.6);
    } catch (error) {
      console.warn('Could not play alert sound:', error);
    }
  }, [isMuted]);

  const sendBrowserNotification = useCallback((title: string, body: string, tag?: string) => {
    if (typeof Notification === 'undefined') return;
    if (notificationPermission !== 'granted') return;
    if (document.hasFocus()) return; // Only notify when tab is not focused
    
    try {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.png',
        tag: tag || 'fraud-alert',
        requireInteraction: true,
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
      // Auto close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    } catch (error) {
      console.warn('Could not send browser notification:', error);
    }
  }, [notificationPermission]);

  return {
    isMuted,
    toggleMute,
    playAlertSound,
    sendBrowserNotification,
    notificationPermission,
    requestNotificationPermission,
  };
}
