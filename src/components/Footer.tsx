import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, ExternalLink, ArrowUp, Facebook, Instagram } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import logo from '@/assets/logo.png';

export function Footer(props: React.HTMLAttributes<HTMLElement>) {
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
      { name: 'Parking Wallet', nameHi: 'पार्किंग वॉलेट', path: '/wallet' },
      { name: 'Monthly Pass', nameHi: 'मासिक पास', path: '/monthly-pass' },
      { name: 'Referral Program', nameHi: 'रेफरल प्रोग्राम', path: '/referral' },
    ];

    const resourceLinks = [
      { name: 'Parking Tips', nameHi: 'पार्किंग टिप्स', path: '/blog' },
      { name: 'Avoid Fines Guide', nameHi: 'जुर्माने से बचें', path: '/blog/avoid-parking-fines' },
      { name: 'FAQ', nameHi: 'अक्सर पूछे जाने वाले प्रश्न', path: '/faq' },
      { name: 'Open Data & Transparency', nameHi: 'ओपन डेटा एवं पारदर्शिता', path: '/transparency' },
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
      <footer className="bg-muted/50 border-t mt-auto" {...props}>
        <div className="container py-10 md:py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 md:gap-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-4 lg:col-span-2 lg:pr-8">

              <Link to="/" className="flex items-center gap-3 mb-4" onClick={scrollToTop}>
                <img 
                  src={logo} 
                  alt="NIGAM-Park logo" 
                  className="w-10 h-10 rounded-full object-cover border-2 border-primary/20" 
                />
                <span className="font-bold text-lg">{isHindi ? 'निगम-पार्क' : 'NIGAM-Park'}</span>
              </Link>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                {isHindi 
                  ? 'दिल्ली नगर निगम का आधिकारिक स्मार्ट पार्किंग सिस्टम। रियल-टाइम में पार्किंग खोजें, बुक करें और भुगतान करें।'
                  : 'Smart parking system for MCD parking zones. Find, book, and pay for parking in real-time.'}
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
              </ul>
            </div>
          </div>

          <Separator className="my-8" />

          <p className="text-xs text-muted-foreground text-center mb-6">
            {isHindi
              ? 'यह एक प्रोटोटाइप है और दिल्ली नगर निगम से आधिकारिक रूप से संबद्ध नहीं है।'
              : 'This is a prototype demonstration and is not officially affiliated with the Municipal Corporation of Delhi.'}
          </p>

          <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground text-center md:text-left">
            <p>© {currentYear} {isHindi ? 'निगम-पार्क। एक प्रोटोटाइप।' : 'NIGAM-Park. A smart parking prototype.'}</p>
            <div className="flex items-center gap-4">
              <p className="flex items-center gap-1">
                {isHindi ? 'एक' : 'A'} <span className="text-primary font-medium">{isHindi ? 'डिजिटल इंडिया' : 'Digital India'}</span> {isHindi ? 'पहल' : 'Initiative'}
              </p>
              <Button variant="outline" size="sm" onClick={scrollToTop} className="gap-2">
                <ArrowUp className="w-4 h-4" />
                {isHindi ? 'ऊपर जाएं' : 'Back to Top'}
              </Button>
            </div>
          </div>

        </div>
      </footer>
    );
}
