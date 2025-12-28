import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Ad {
  id: string;
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  imageUrl?: string;
  linkUrl?: string;
  sponsor: string;
  type: 'banner' | 'card' | 'inline';
}

// Demo ads for local businesses
const demoAds: Ad[] = [
  {
    id: '1',
    title: 'Delhi Metro Passes Available',
    titleHi: 'दिल्ली मेट्रो पास उपलब्ध',
    description: 'Get monthly metro passes with 20% discount for NIGAM-Park users',
    descriptionHi: 'निगम-पार्क उपयोगकर्ताओं के लिए 20% छूट के साथ मासिक मेट्रो पास प्राप्त करें',
    sponsor: 'Delhi Metro Rail Corporation',
    type: 'banner',
    linkUrl: 'https://www.delhimetrorail.com',
  },
  {
    id: '2',
    title: 'Car Wash & Detailing',
    titleHi: 'कार धुलाई और डिटेलिंग',
    description: 'Professional car wash while you park. Starting ₹199',
    descriptionHi: 'पार्किंग के दौरान पेशेवर कार धुलाई। ₹199 से शुरू',
    sponsor: 'SparkleWash Delhi',
    type: 'card',
  },
  {
    id: '3',
    title: 'EV Charging Discount',
    titleHi: 'EV चार्जिंग छूट',
    description: 'First 3 charging sessions free for new users',
    descriptionHi: 'नए उपयोगकर्ताओं के लिए पहले 3 चार्जिंग सत्र मुफ्त',
    sponsor: 'Tata Power EZ Charge',
    type: 'inline',
    linkUrl: 'https://www.tatapower.com',
  },
  {
    id: '4',
    title: 'Safe Driving Insurance',
    titleHi: 'सुरक्षित ड्राइविंग बीमा',
    description: 'Get motor insurance starting at ₹2,094/year',
    descriptionHi: '₹2,094/वर्ष से शुरू होने वाला मोटर बीमा प्राप्त करें',
    sponsor: 'Bajaj Allianz',
    type: 'card',
  },
];

interface AdvertisingSlotProps {
  type?: 'banner' | 'card' | 'inline';
  className?: string;
}

export function AdvertisingSlot({ type = 'banner', className }: AdvertisingSlotProps) {
  const { isHindi } = useLanguage();
  
  // Filter ads by type
  const filteredAds = demoAds.filter(ad => ad.type === type);
  const ad = filteredAds[Math.floor(Math.random() * filteredAds.length)] || demoAds[0];
  
  if (type === 'banner') {
    return (
      <div className={`relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 ${className}`}>
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="text-[10px] bg-background/80">
            <Sparkles className="w-3 h-3 mr-1" />
            {isHindi ? 'प्रायोजित' : 'Sponsored'}
          </Badge>
        </div>
        <div className="p-4 pr-24">
          <p className="font-semibold text-sm mb-1">
            {isHindi ? ad.titleHi : ad.title}
          </p>
          <p className="text-xs text-muted-foreground mb-2">
            {isHindi ? ad.descriptionHi : ad.description}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {isHindi ? 'प्रायोजक:' : 'By:'} {ad.sponsor}
          </p>
        </div>
        {ad.linkUrl && (
          <a
            href={ad.linkUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="absolute inset-0"
            aria-label={isHindi ? ad.titleHi : ad.title}
          />
        )}
      </div>
    );
  }
  
  if (type === 'card') {
    return (
      <Card className={`relative overflow-hidden border-primary/20 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <Badge variant="outline" className="text-[10px]">
              <Sparkles className="w-3 h-3 mr-1" />
              {isHindi ? 'प्रायोजित' : 'Ad'}
            </Badge>
            {ad.linkUrl && (
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            )}
          </div>
          <h4 className="font-semibold text-sm mb-1">
            {isHindi ? ad.titleHi : ad.title}
          </h4>
          <p className="text-xs text-muted-foreground mb-2">
            {isHindi ? ad.descriptionHi : ad.description}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {ad.sponsor}
          </p>
        </CardContent>
        {ad.linkUrl && (
          <a
            href={ad.linkUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="absolute inset-0"
            aria-label={isHindi ? ad.titleHi : ad.title}
          />
        )}
      </Card>
    );
  }
  
  // Inline type
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg bg-muted/50 border ${className}`}>
      <Badge variant="outline" className="text-[10px] shrink-0">
        {isHindi ? 'विज्ञापन' : 'Ad'}
      </Badge>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {isHindi ? ad.titleHi : ad.title}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {isHindi ? ad.descriptionHi : ad.description}
        </p>
      </div>
      {ad.linkUrl && (
        <a
          href={ad.linkUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="shrink-0"
        >
          <ExternalLink className="w-4 h-4 text-primary" />
        </a>
      )}
    </div>
  );
}
