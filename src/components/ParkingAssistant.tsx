import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X, Send, Bot, User, Loader2, Mic, MicOff, Shield, Briefcase, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parking-assistant`;

export function ParkingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const { language } = useLanguage();
  const { userRole } = useAuth();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      recognitionRef.current = new SpeechRecognitionClass();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [language]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening, language]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
          userRole: userRole || 'citizen'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => 
                    i === prev.length - 1 ? { ...m, content: assistantContent } : m
                  );
                }
                return [...prev, { role: 'assistant', content: assistantContent }];
              });
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: language === 'hi' 
          ? 'क्षमा करें, कुछ गड़बड़ हो गई। कृपया पुनः प्रयास करें।'
          : 'Sorry, something went wrong. Please try again.' 
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, isLoading, language, userRole]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getRoleInfo = () => {
    switch (userRole) {
      case 'admin':
        return {
          icon: <Shield className="w-4 h-4" />,
          label: language === 'hi' ? 'व्यवस्थापक सहायक' : 'Admin Assistant',
          color: 'bg-destructive',
          welcome: language === 'hi'
            ? 'नमस्ते व्यवस्थापक! मैं राजस्व विश्लेषण, स्टाफ प्रबंधन, और सिस्टम कॉन्फ़िगरेशन में आपकी मदद कर सकता हूं।'
            : "Hello Admin! I can help you with revenue analytics, staff management, and system configuration."
        };
      case 'attendant':
        return {
          icon: <Briefcase className="w-4 h-4" />,
          label: language === 'hi' ? 'परिचारक सहायक' : 'Attendant Assistant',
          color: 'bg-warning',
          welcome: language === 'hi'
            ? 'नमस्ते! मैं चेक-इन/आउट, भुगतान, और शिफ्ट संबंधी प्रश्नों में आपकी मदद कर सकता हूं।'
            : "Hello! I can help you with check-in/out procedures, payments, and shift-related questions."
        };
      default:
        return {
          icon: <UserCircle className="w-4 h-4" />,
          label: language === 'hi' ? 'NIGAM-Park सहायक' : 'NIGAM-Park Assistant',
          color: 'bg-primary',
          welcome: language === 'hi'
            ? 'नमस्ते! मैं NIGAM-Park AI सहायक हूं। पार्किंग खोजने, बुकिंग, या किसी भी सवाल में मैं आपकी मदद कर सकता हूं।'
            : "Hello! I'm NIGAM-Park AI Assistant. I can help you find parking, make bookings, or answer any questions."
        };
    }
  };

  const roleInfo = getRoleInfo();

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 h-14 w-14 rounded-full shadow-lg",
          isOpen && "bg-destructive hover:bg-destructive/90"
        )}
        size="icon"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-36 right-4 md:bottom-24 md:right-6 z-50 w-[calc(100vw-2rem)] max-w-md shadow-2xl">
          <CardHeader className={cn("pb-3 text-primary-foreground rounded-t-lg", roleInfo.color)}>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="h-5 w-5" />
              {roleInfo.label}
              <span className="ml-auto flex items-center gap-1 text-xs opacity-80">
                {roleInfo.icon}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-80 p-4" ref={scrollRef}>
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  <Bot className="h-12 w-12 mx-auto mb-2 text-primary/50" />
                  <p className="text-sm">{roleInfo.welcome}</p>
                </div>
              )}
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-2",
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      {msg.content}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 text-primary animate-spin" />
                    </div>
                    <div className="bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground">
                      {language === 'hi' ? 'टाइप कर रहा हूं...' : 'Typing...'}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="p-3 border-t flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleListening}
                className={cn(isListening && "bg-destructive text-destructive-foreground")}
                disabled={!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={language === 'hi' ? 'अपना सवाल पूछें...' : 'Ask a question...'}
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={isLoading || !input.trim()} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
