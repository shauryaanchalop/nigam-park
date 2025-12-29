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
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-success">
          <Headphones className="w-5 h-5" />
          {isHindi ? 'ग्राहक सहायता' : 'Customer Support'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Demo Contact Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
            <div className="p-2 rounded-full bg-primary/10">
              <Phone className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                {isHindi ? '24/7 टोल-फ्री हेल्पलाइन' : '24/7 Toll-Free Helpline'}
              </p>
              <a href="tel:1800123456" className="font-semibold text-primary hover:underline">
                1800-123-4567
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
            <div className="p-2 rounded-full bg-primary/10">
              <Mail className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                {isHindi ? 'ईमेल सहायता' : 'Email Support'}
              </p>
              <a href="mailto:support@nigampark.in" className="font-semibold text-primary hover:underline">
                support@nigampark.in
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
            <div className="p-2 rounded-full bg-primary/10">
              <MessageCircle className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                {isHindi ? 'व्हाट्सएप सहायता' : 'WhatsApp Support'}
              </p>
              <a href="https://wa.me/911234567890" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">
                +91 12345 67890
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
            <div className="p-2 rounded-full bg-primary/10">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                {isHindi ? 'कार्यालय समय' : 'Office Hours'}
              </p>
              <p className="font-medium">
                {isHindi ? 'सोम-शनि: सुबह 10 - शाम 5' : 'Mon-Sat: 10 AM - 5 PM'}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Page Link */}
        <Button variant="outline" className="w-full gap-2" asChild>
          <Link to="/contact">
            <ExternalLink className="w-4 h-4" />
            {isHindi ? 'संपर्क पृष्ठ पर जाएं' : 'Visit Contact Page'}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
