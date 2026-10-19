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

import { streamChatResponse } from '@/services/aiAssistantService';

export function ParkingAssistant() {
  const { user } = useAuth();
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
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    try {
      await streamChatResponse(
        newMessages,
        userRole || 'citizen',
        language || 'en',
        (chunkText) => {
          assistantContent = chunkText;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === 'assistant') {
              return prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, content: assistantContent } : m
              );
            }
            return [...prev, { role: 'assistant', content: assistantContent }];
          });
        }
      );
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            language === 'hi'
              ? 'क्षमा करें, कुछ गड़बड़ हो गई। कृपया पुनः प्रयास करें।'
              : 'Sorry, something went wrong. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, userRole, language]);

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

  const quickSuggestions = [
    { en: 'Find parking near Connaught Place', hi: 'कनॉट प्लेस के पास पार्किंग खोजें' },
    { en: 'How to pay a parking fine?', hi: 'पार्किंग चालान कैसे भरें?' },
    { en: 'Where can I find EV charging slots?', hi: 'ईवी चार्जिंग स्लॉट कहाँ मिलेंगे?' },
    { en: 'How does parking wallet work?', hi: 'पार्किंग वॉलेट कैसे काम करता है?' },
  ];

  const handleSuggestionClick = (prompt: string) => {
    setInput(prompt);
  };

  // Always show assistant with role fallback
  return (
    <>
      {/* Floating Button with ambient pulse ring */}
      <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 flex items-center gap-2.5">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full border border-border/80 bg-card/90 backdrop-blur-xl shadow-lg text-xs font-semibold text-foreground hover:border-primary/40 hover:shadow-xl transition-all duration-200 ease-claude hover:-translate-y-0.5 active:scale-95 group"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="group-hover:text-primary transition-colors">Ask NIGAM-Park AI</span>
            <span className="text-primary text-xs font-bold">✦</span>
          </button>
        )}
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "relative h-14 w-14 rounded-full shadow-xl transition-all duration-300 ease-claude",
            "hover:scale-105 active:scale-95 group shrink-0",
            isOpen 
              ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground rotate-90" 
              : "bg-primary hover:bg-primary/95 text-primary-foreground"
          )}
          size="icon"
          aria-label={isOpen ? "Close Assistant" : "Open Assistant"}
        >
          {/* Subtle ambient breathing halo when closed */}
          {!isOpen && (
            <span className="absolute -inset-1 rounded-full bg-primary/25 animate-ping opacity-75 pointer-events-none" />
          )}
          {isOpen ? (
            <X className="h-6 w-6 transition-transform duration-200" />
          ) : (
            <MessageCircle className="h-6 w-6 transition-transform duration-200 group-hover:scale-110" />
          )}
        </Button>
      </div>

      {/* Claude-style Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-36 right-4 md:bottom-24 md:right-6 z-50 w-[calc(100vw-2rem)] max-w-md shadow-2xl rounded-3xl border border-border/70 bg-card/95 backdrop-blur-xl animate-scale-in origin-bottom-right overflow-hidden transition-all duration-300 ease-claude">
          <CardHeader className={cn("p-4 pb-3.5 text-primary-foreground border-b border-white/10", roleInfo.color)}>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Bot className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span>{roleInfo.label}</span>
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <p className="text-[11px] font-normal text-white/80">AI Assistant · Fast & Responsive</p>
                </div>
              </CardTitle>
              <div className="flex items-center gap-1.5">
                <span className="text-xs bg-white/15 px-2 py-0.5 rounded-full text-white/90 font-medium">
                  {roleInfo.icon}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-7 w-7 rounded-full text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex flex-col h-[420px]">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messages.length === 0 && (
                <div className="py-4 space-y-4 animate-fade-in">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Bot className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      {language === 'hi' ? 'नमस्ते! मैं आपकी कैसे मदद कर सकता हूं?' : 'How can I help you today?'}
                    </p>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                      {roleInfo.welcome}
                    </p>
                  </div>

                  {/* Claude-style Quick Prompt Pills */}
                  <div className="space-y-1.5 pt-2">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-1">
                      {language === 'hi' ? 'सुझाए गए प्रश्न' : 'Suggested prompts'}
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {quickSuggestions.map((s, idx) => {
                        const text = language === 'hi' ? s.hi : s.en;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleSuggestionClick(text)}
                            className="text-left text-xs px-3 py-2 rounded-xl border border-border/70 bg-muted/40 hover:bg-muted hover:border-primary/30 hover:text-foreground text-muted-foreground transition-all duration-200 ease-claude active:scale-[0.99] flex items-center justify-between group"
                          >
                            <span>{text}</span>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary text-xs">→</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3.5 pt-1">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-2.5 animate-fade-in-up duration-300 ease-claude",
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="h-3.5 w-3.5 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[82%] px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed transition-all shadow-sm",
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm font-normal'
                          : 'bg-muted/80 border border-border/60 text-foreground rounded-2xl rounded-tl-sm'
                      )}
                    >
                      {msg.content}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-semibold">
                        <User className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Claude-style Thinking Bubble */}
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex gap-2.5 justify-start animate-fade-in items-center">
                    <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="bg-muted/80 border border-border/60 rounded-2xl rounded-tl-sm px-3.5 py-2.5 flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/80 animate-claude-dot-1" />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/80 animate-claude-dot-2" />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/80 animate-claude-dot-3" />
                      <span className="text-xs text-muted-foreground ml-1.5 font-medium">
                        {language === 'hi' ? 'सोच रहा हूं...' : 'Thinking...'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Bar */}
            <div className="p-3 border-t border-border/60 bg-card/60 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 bg-background border border-border/80 rounded-full px-2 py-1 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all duration-200">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleListening}
                  className={cn(
                    "h-8 w-8 rounded-full transition-all duration-200",
                    isListening && "bg-destructive text-destructive-foreground animate-pulse"
                  )}
                  disabled={!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)}
                  title="Voice input"
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4 text-muted-foreground" />}
                </Button>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={language === 'hi' ? 'अपना सवाल पूछें...' : 'Ask NIGAM-Park AI...'}
                  disabled={isLoading}
                  className="flex-1 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-xs sm:text-sm px-1 h-9"
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={isLoading || !input.trim()} 
                  size="icon"
                  className="h-8 w-8 rounded-full transition-all duration-200 ease-claude shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
