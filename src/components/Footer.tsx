import React, { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, ExternalLink, ArrowUp, Facebook, Instagram, Users } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { TeamDialog } from '@/components/TeamDialog';
import logo from '@/assets/logo.png';

export const Footer = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  function Footer(props, ref) {
    const currentYear = 2026;
    const { isHindi } = useLanguage();

    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

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

    // Custom X (Twitter) icon component
    const XIcon = () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );

    const socialLinks = [
      { name: 'Facebook', icon: Facebook, url: 'https://www.facebook.com/off.MCD/' },
      { name: 'X', icon: XIcon, url: 'https://x.com/MCD_Delhi', isCustom: true },
      { name: 'Instagram', icon: Instagram, url: 'https://www.instagram.com/mcd_delhi' },
    ];

    return (
      <footer ref={ref} className="bg-muted/50 border-t mt-auto" {...props}>
        {/* Scroll to Top Button */}
        <div className="container pt-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={scrollToTop}
            className="w-full sm:w-auto gap-2"
          >
            <ArrowUp className="w-4 h-4" />
            {isHindi ? 'ऊपर जाएं' : 'Back to Top'}
          </Button>
        </div>

        <div className="container py-8 md:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-4 lg:col-span-1">
              <Link to="/" className="flex items-center gap-3 mb-4" onClick={scrollToTop}>
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
              <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-4">
                <a href="tel:1800123456" className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <span>1800-123-4567 ({isHindi ? 'टोल फ्री' : 'Toll Free'})</span>
                </a>
                <a href="mailto:support@nigampark.in" className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span>support@nigampark.in</span>
                </a>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-2">
                {socialLinks.map(link => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-background hover:bg-accent transition-colors"
                      title={link.name}
                    >
                      {'isCustom' in link && link.isCustom ? <Icon /> : <Icon className="w-4 h-4" />}
                    </a>
                  );
                })}
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
                      onClick={scrollToTop}
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
                      onClick={scrollToTop}
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
                      onClick={scrollToTop}
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
                      onClick={scrollToTop}
                    >
                      {isHindi ? link.nameHi : link.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <TeamDialog 
                    trigger={
                      <button className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-sm">
                        <Users className="h-3 w-3" />
                        {isHindi ? 'हमारी टीम' : 'Our Team'}
                      </button>
                    }
                  />
                </li>
              </ul>
            </div>
          </div>

          <Separator className="my-8" />

          {/* Hackathon Badge */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6 p-4 bg-gradient-to-r from-primary/5 to-success/5 rounded-lg border border-primary/10">
            <div className="text-center sm:text-left">
              <p className="font-semibold text-primary">
                {isHindi ? 'Hack4Delhi हैकाथॉन प्रोजेक्ट' : 'Hack4Delhi Hackathon Project'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isHindi 
                  ? 'दिल्ली के लिए स्मार्ट पार्किंग समाधान'
                  : 'Smart Parking Solution for Delhi'}
              </p>
            </div>
            <TeamDialog />
          </div>

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