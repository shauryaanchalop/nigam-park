import React from 'react';
import { Phone, Mail, MessageCircle, Clock, Headphones, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';

export function CustomerCareCard() {
  const { isHindi } = useLanguage();

  return (
    <Card className="border-success/30 bg-success/5">
      <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-success">
          <Headphones className="w-4 h-4 sm:w-5 sm:h-5" />
          {isHindi ? 'ग्राहक सहायता' : 'Customer Support'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
        {/* Demo Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-background/50">
            <div className="p-1.5 sm:p-2 rounded-full bg-primary/10 flex-shrink-0">
              <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {isHindi ? '24/7 टोल-फ्री' : '24/7 Toll-Free'}
              </p>
              <a href="tel:1800123456" className="font-semibold text-primary hover:underline text-sm sm:text-base">
                1800-123-4567
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-background/50">
            <div className="p-1.5 sm:p-2 rounded-full bg-primary/10 flex-shrink-0">
              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {isHindi ? 'ईमेल' : 'Email'}
              </p>
              <a href="mailto:support@nigampark.in" className="font-semibold text-primary hover:underline text-sm sm:text-base truncate block">
                support@nigampark.in
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-background/50">
            <div className="p-1.5 sm:p-2 rounded-full bg-primary/10 flex-shrink-0">
              <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {isHindi ? 'व्हाट्सएप' : 'WhatsApp'}
              </p>
              <a href="https://wa.me/911234567890" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline text-sm sm:text-base">
                +91 12345 67890
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-background/50">
            <div className="p-1.5 sm:p-2 rounded-full bg-primary/10 flex-shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {isHindi ? 'कार्यालय समय' : 'Office Hours'}
              </p>
              <p className="font-medium text-sm sm:text-base">
                {isHindi ? 'सोम-शनि: 10-5' : 'Mon-Sat: 10-5'}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Page Link */}
        <Button variant="outline" className="w-full gap-2 h-9 sm:h-10 text-sm" asChild>
          <Link to="/contact">
            <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {isHindi ? 'संपर्क पृष्ठ' : 'Contact Page'}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
