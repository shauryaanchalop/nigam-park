import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Bot, Send, Mic, MicOff, Sparkles, HelpCircle, MessageSquare, Volume2, User } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const quickQuestions = [
  { en: 'Where can I park?', hi: 'मैं कहाँ पार्क कर सकता हूँ?' },
  { en: 'How do I pay?', hi: 'मैं भुगतान कैसे करूं?' },
  { en: 'Find EV charging', hi: 'EV चार्जिंग खोजें' },
  { en: 'Cancel booking', hi: 'बुकिंग रद्द करें' },
];

const botResponses: Record<string, { en: string; hi: string }> = {
  'where can i park': {
    en: 'I found 5 nearby parking spots! The closest one is at Connaught Place with 23 available spots. Would you like me to reserve a spot for you?',
    hi: 'मुझे 5 नज़दीकी पार्किंग स्थान मिले! सबसे करीब कनॉट प्लेस में है जहां 23 स्थान उपलब्ध हैं। क्या आप चाहते हैं कि मैं आपके लिए एक स्थान आरक्षित करूं?'
  },
  'how do i pay': {
    en: 'You can pay using UPI (Google Pay, PhonePe, Paytm), Debit/Credit cards, or your NIGAM-Park wallet. All payments are 100% secure and instant!',
    hi: 'आप UPI (Google Pay, PhonePe, Paytm), डेबिट/क्रेडिट कार्ड, या अपने NIGAM-Park वॉलेट से भुगतान कर सकते हैं। सभी भुगतान 100% सुरक्षित और तुरंत हैं!'
  },
  'find ev charging': {
    en: 'There are 3 EV charging stations nearby. Karol Bagh has 2 Type-2 chargers available right now. Charging rate is ₹5/kWh. Want me to navigate you there?',
    hi: 'नज़दीक में 3 EV चार्जिंग स्टेशन हैं। करोल बाग में अभी 2 Type-2 चार्जर उपलब्ध हैं। चार्जिंग दर ₹5/kWh है। क्या मैं आपको वहां नेविगेट करूं?'
  },
  'cancel booking': {
    en: 'To cancel a booking, go to "My Reservations" and tap on the booking you want to cancel. You\'ll get a full refund if cancelled 30 minutes before start time.',
    hi: 'बुकिंग रद्द करने के लिए, "मेरी बुकिंग" पर जाएं और जिस बुकिंग को रद्द करना है उस पर टैप करें। शुरू होने से 30 मिनट पहले रद्द करने पर पूरा रिफंड मिलेगा।'
  },
  'default': {
    en: 'I\'m here to help! You can ask me about parking availability, payments, EV charging, bookings, and more. How can I assist you today?',
    hi: 'मैं मदद के लिए यहाँ हूँ! आप मुझसे पार्किंग उपलब्धता, भुगतान, EV चार्जिंग, बुकिंग और अधिक के बारे में पूछ सकते हैं। आज मैं आपकी कैसे सहायता कर सकता हूँ?'
  }
};

export function AIAttendantAssistant() {
  const { isHindi } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: isHindi 
        ? 'नमस्ते! 👋 मैं आपका AI पार्किंग सहायक हूँ। मैं आपकी पार्किंग खोजने, भुगतान करने, या किसी भी सवाल में मदद कर सकता हूँ!'
        : 'Hello! 👋 I\'m your AI Parking Assistant. I can help you find parking, make payments, or answer any questions!',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const getBotResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase().trim();
    
    for (const [key, response] of Object.entries(botResponses)) {
      if (key !== 'default' && lowerQuery.includes(key)) {
        return isHindi ? response.hi : response.en;
      }
    }
    
    return isHindi ? botResponses.default.hi : botResponses.default.en;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: getBotResponse(input),
      sender: 'bot',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMessage]);
    setIsTyping(false);
  };

  const handleQuickQuestion = (question: { en: string; hi: string }) => {
    setInput(isHindi ? question.hi : question.en);
  };

  const toggleVoice = () => {
    setIsListening(!isListening);
    if (!isListening) {
      toast.info(isHindi ? 'सुन रहा हूँ...' : 'Listening...');
      // Simulate voice input
      setTimeout(() => {
        setInput(isHindi ? 'मुझे पार्किंग चाहिए' : 'I need parking');
        setIsListening(false);
      }, 2000);
    }
  };

  return (
    <Card className="flex flex-col h-[500px]">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 to-primary/5">
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          {isHindi ? 'AI पार्किंग सहायक' : 'AI Parking Assistant'}
          <Badge variant="outline" className="ml-auto text-xs gap-1">
            <Sparkles className="w-3 h-3" />
            {isHindi ? 'स्मार्ट' : 'Smart'}
          </Badge>
        </CardTitle>
        <CardDescription className="text-xs">
          {isHindi 
            ? 'पार्किंग, भुगतान, बुकिंग के बारे में कुछ भी पूछें'
            : 'Ask anything about parking, payments, bookings'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.sender === 'bot' && (
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                message.sender === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-br-sm' 
                  : 'bg-muted rounded-bl-sm'
              }`}>
                {message.content}
              </div>
              {message.sender === 'user' && (
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-2 items-center">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick questions */}
        <div className="px-4 py-2 border-t flex gap-2 overflow-x-auto">
          {quickQuestions.map((q, idx) => (
            <Button 
              key={idx} 
              variant="outline" 
              size="sm" 
              className="text-xs whitespace-nowrap flex-shrink-0"
              onClick={() => handleQuickQuestion(q)}
            >
              <HelpCircle className="w-3 h-3 mr-1" />
              {isHindi ? q.hi : q.en}
            </Button>
          ))}
        </div>

        {/* Input */}
        <div className="p-3 border-t bg-muted/30">
          <div className="flex gap-2">
            <Button 
              variant={isListening ? "destructive" : "outline"} 
              size="icon"
              onClick={toggleVoice}
              className="flex-shrink-0"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Input 
              placeholder={isHindi ? 'अपना सवाल टाइप करें...' : 'Type your question...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={!input.trim()} className="flex-shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
