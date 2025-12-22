import { useCallback, useRef } from 'react';

// Web Audio API for generating alert sound
export function useCriticalAlertSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playAlertSound = useCallback(() => {
    try {
      // Create or reuse AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      
      // Resume context if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      
      // Create oscillator for alert tone
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Urgent alert pattern: two-tone siren effect
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, now); // A5
      oscillator.frequency.setValueAtTime(660, now + 0.15); // E5
      oscillator.frequency.setValueAtTime(880, now + 0.3); // A5
      oscillator.frequency.setValueAtTime(660, now + 0.45); // E5
      
      // Volume envelope
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
  }, []);

  return { playAlertSound };
}
