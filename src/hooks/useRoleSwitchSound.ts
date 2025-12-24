import { useCallback } from 'react';

export function useRoleSwitchSound() {
  const playRoleSwitchSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a pleasant "whoosh" + chime sound for role switching
      const now = audioContext.currentTime;
      
      // Whoosh sound (filtered noise sweep)
      const bufferSize = audioContext.sampleRate * 0.3;
      const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      
      const noise = audioContext.createBufferSource();
      noise.buffer = noiseBuffer;
      
      const noiseFilter = audioContext.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(2000, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(500, now + 0.3);
      noiseFilter.Q.value = 2;
      
      const noiseGain = audioContext.createGain();
      noiseGain.gain.setValueAtTime(0.15, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(audioContext.destination);
      
      // Chime sound (two harmonious tones)
      const frequencies = [523.25, 659.25]; // C5 and E5
      
      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, now);
        
        const startTime = now + 0.1 + index * 0.08;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start(now);
        oscillator.stop(startTime + 0.5);
      });
      
      noise.start(now);
      noise.stop(now + 0.3);
      
      // Cleanup
      setTimeout(() => {
        audioContext.close();
      }, 1000);
    } catch (error) {
      console.log('Audio not supported');
    }
  }, []);

  return { playRoleSwitchSound };
}
