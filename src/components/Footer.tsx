import React, { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, ExternalLink } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import logo from '@/assets/logo.png';

export const Footer = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  function Footer(props, ref) {
    const currentYear = new Date().getFullYear();
    const { isHindi } = useLanguage();

    const zoneLinks = [
      { name: 'Connaught Place', nameHi: 'कनॉट प्लेस', slug: 'connaught-place' },
      { name: 'Karol Bagh', nameHi: 'करोल बाग', slug: 'karol-bagh' },
      { name: 'Chandni Chowk', nameHi: 'चांदनी चौक', slug: 'chandni-chowk' },
      { name: 'Lajpat Nagar', nameHi: 'लाजपत नगर', slug: 'lajpat-nagar' },
      { name: 'Nehru Place', nameHi: 'नेहरू प्लेस', slug: 'nehru-place' },
      { name: 'Sarojini Nagar', nameHi: 'सरोजिनी नगर', slug: 'sarojini-nagar' },
    ];

    const quickLinks = [
      { name: 'Find Parking', nameHi: 'पार्किंग खोजें', path: '/citizen' },
      { name: 'Live Map', nameHi: 'लाइव मैप', path: '/live-map' },
      { name: 'My Reservations', nameHi: 'मेरी बुकिंग', path: '/my-reservations' },
      { name: 'Loyalty Program', nameHi: 'लॉयल्टी प्रोग्राम', path: '/loyalty' },
      { name: 'Monthly Pass', nameHi: 'मासिक पास', path: '/monthly-pass' },
      { name: 'Referral Program', nameHi: 'रेफरल प्रोग्राम', path: '/referral' },
    ];

    const resourceLinks = [
      { name: 'Parking Tips', nameHi: 'पार्किंग टिप्स', path: '/blog' },
      { name: 'Avoid Fines Guide', nameHi: 'जुर्माने से बचें', path: '/blog/avoid-parking-fines' },
      { name: 'FAQ', nameHi: 'अक्सर पूछे जाने वाले प्रश्न', path: '/faq' },
    ];

    const legalLinks = [
      { name: 'Privacy Policy', nameHi: 'गोपनीयता नीति', path: '/privacy-policy' },
      { name: 'Terms of Service', nameHi: 'सेवा की शर्तें', path: '/terms' },
      { name: 'Contact Us', nameHi: 'संपर्क करें', path: '/contact' },
    ];

    return (
      <footer ref={ref} className="bg-muted/50 border-t mt-auto" {...props}>
        <div className="container py-8 md:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-4 lg:col-span-1">
              <Link to="/" className="flex items-center gap-3 mb-4">
                <img 
                  src={logo} 
                  alt="NIGAM-Park Logo" 
                  className="w-10 h-10 rounded-full object-cover border-2 border-primary/20" 
                />
                <span className="font-bold text-lg">{isHindi ? 'निगम-पार्क' : 'NIGAM-Park'}</span>
              </Link>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                {isHindi 
                  ? 'दिल्ली नगर निगम का आधिकारिक स्मार्ट पार्किंग सिस्टम। रियल-टाइम में पार्किंग खोजें, बुक करें और भुगतान करें।'
                  : 'Official smart parking system by Municipal Corporation of Delhi. Find, book, and pay for parking in real-time.'}
              </p>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <a href="tel:1800XXXXXXX" className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <span>1800-XXX-XXXX ({isHindi ? 'टोल फ्री' : 'Toll Free'})</span>
                </a>
                <a href="mailto:support@nigampark.in" className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span>support@nigampark.in</span>
                </a>
              </div>
            </div>

            {/* Parking Zones */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                {isHindi ? 'पार्किंग ज़ोन' : 'Parking Zones'}
              </h3>
              <ul className="space-y-2 text-sm">
                {zoneLinks.map(zone => (
                  <li key={zone.slug}>
                    <Link 
                      to={`/parking/${zone.slug}`} 
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isHindi ? zone.nameHi : zone.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4">{isHindi ? 'त्वरित लिंक' : 'Quick Links'}</h3>
              <ul className="space-y-2 text-sm">
                {quickLinks.map(link => (
                  <li key={link.path}>
                    <Link 
                      to={link.path} 
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isHindi ? link.nameHi : link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-semibold mb-4">{isHindi ? 'संसाधन' : 'Resources'}</h3>
              <ul className="space-y-2 text-sm">
                {resourceLinks.map(link => (
                  <li key={link.path}>
                    <Link 
                      to={link.path} 
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isHindi ? link.nameHi : link.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <a 
                    href="https://mcdonline.nic.in" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    {isHindi ? 'MCD पोर्टल' : 'MCD Portal'}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold mb-4">{isHindi ? 'कानूनी' : 'Legal'}</h3>
              <ul className="space-y-2 text-sm">
                {legalLinks.map(link => (
                  <li key={link.path}>
                    <Link 
                      to={link.path} 
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isHindi ? link.nameHi : link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© {currentYear} {isHindi ? 'निगम-पार्क। दिल्ली नगर निगम। सर्वाधिकार सुरक्षित।' : 'NIGAM-Park. Municipal Corporation of Delhi. All rights reserved.'}</p>
            <p className="flex items-center gap-1">
              {isHindi ? 'एक' : 'A'} <span className="text-primary font-medium">{isHindi ? 'डिजिटल इंडिया' : 'Digital India'}</span> {isHindi ? 'पहल' : 'Initiative'}
            </p>
          </div>
        </div>
      </footer>
    );
  }
);