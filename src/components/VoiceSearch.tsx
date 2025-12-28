import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface VoiceSearchProps {
  onResult: (transcript: string) => void;
  className?: string;
}

export function VoiceSearch({ onResult, className }: VoiceSearchProps) {
  const { isHindi, language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionConstructor) {
      setIsSupported(false);
      return;
    }

    // Initialize speech recognition
    const recognition = new SpeechRecognitionConstructor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);

      if (finalTranscript) {
        onResult(finalTranscript);
        setIsListening(false);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      if (event.error === 'not-allowed') {
        toast.error(isHindi ? 'माइक्रोफोन की अनुमति नहीं है' : 'Microphone permission denied');
      } else if (event.error !== 'aborted') {
        toast.error(isHindi ? 'आवाज़ पहचान में त्रुटि' : 'Voice recognition error');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore abort errors
        }
      }
    };
  }, [language, isHindi, onResult]);

  // Update language when it changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    }
  }, [language]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;

    try {
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
      toast.info(
        isHindi 
          ? 'बोलना शुरू करें... उदाहरण: "इंडिया गेट के पास पार्किंग खोजें"' 
          : 'Start speaking... e.g., "Find parking near India Gate"'
      );
    } catch (error) {
      console.error('Failed to start recognition:', error);
      toast.error(isHindi ? 'माइक्रोफोन शुरू नहीं हुआ' : 'Failed to start microphone');
    }
  }, [isHindi]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore stop errors
      }
      setIsListening(false);
    }
  }, []);

  if (!isSupported) {
    return (
      <Button
        variant="outline"
        size="icon"
        className={cn("opacity-50 cursor-not-allowed", className)}
        disabled
        title={isHindi ? 'आवाज़ खोज उपलब्ध नहीं है' : 'Voice search not available'}
      >
        <MicOff className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        variant={isListening ? "destructive" : "outline"}
        size="icon"
        className={cn(
          "transition-all duration-200",
          isListening && "animate-pulse",
          className
        )}
        onClick={isListening ? stopListening : startListening}
        title={isHindi ? (isListening ? 'रोकें' : 'आवाज़ से खोजें') : (isListening ? 'Stop' : 'Voice search')}
      >
        {isListening ? (
          <div className="relative">
            <Mic className="h-4 w-4 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
            </span>
          </div>
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>

      {/* Listening indicator with transcript */}
      {isListening && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 min-w-[200px] max-w-[300px]">
          <div className="bg-background border rounded-lg shadow-lg p-3 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex gap-1">
                <span className="w-1 h-4 bg-primary rounded animate-pulse" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1 h-6 bg-primary rounded animate-pulse" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1 h-3 bg-primary rounded animate-pulse" style={{ animationDelay: '300ms' }}></span>
                <span className="w-1 h-5 bg-primary rounded animate-pulse" style={{ animationDelay: '450ms' }}></span>
              </div>
              <span className="text-xs text-muted-foreground flex-1">
                {isHindi ? 'सुन रहा हूँ...' : 'Listening...'}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={stopListening}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            {transcript && (
              <p className="text-sm text-foreground bg-muted/50 rounded px-2 py-1">
                "{transcript}"
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
