import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, ExternalLink } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const zoneLinks = [
    { name: 'Connaught Place', slug: 'connaught-place' },
    { name: 'Karol Bagh', slug: 'karol-bagh' },
    { name: 'Chandni Chowk', slug: 'chandni-chowk' },
    { name: 'Lajpat Nagar', slug: 'lajpat-nagar' },
    { name: 'Nehru Place', slug: 'nehru-place' },
    { name: 'Sarojini Nagar', slug: 'sarojini-nagar' },
  ];

  const quickLinks = [
    { name: 'Find Parking', path: '/citizen' },
    { name: 'Live Map', path: '/live-map' },
    { name: 'My Reservations', path: '/my-reservations' },
    { name: 'Loyalty Program', path: '/loyalty' },
    { name: 'Report Violation', path: '/report-violation' },
  ];

  const resourceLinks = [
    { name: 'Parking Tips', path: '/blog' },
    { name: 'Avoid Fines Guide', path: '/blog/avoid-parking-fines' },
    { name: 'FAQ', path: '/faq' },
  ];

  const legalLinks = [
    { name: 'Privacy Policy', path: '/privacy-policy' },
    { name: 'Terms of Service', path: '/terms' },
    { name: 'Contact Us', path: '/contact' },
  ];

  return (
    <footer className="bg-muted/50 border-t mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">NP</span>
              </div>
              <span className="font-bold text-lg">NIGAM-Park</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Official smart parking system by Municipal Corporation of Delhi. 
              Find, book, and pay for parking in real-time.
            </p>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <a href="tel:1800XXXXXXX" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Phone className="h-4 w-4" />
                1800-XXX-XXXX (Toll Free)
              </a>
              <a href="mailto:support@nigampark.in" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Mail className="h-4 w-4" />
                support@nigampark.in
              </a>
            </div>
          </div>

          {/* Parking Zones */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Parking Zones
            </h3>
            <ul className="space-y-2 text-sm">
              {zoneLinks.map(zone => (
                <li key={zone.slug}>
                  <Link 
                    to={`/parking/${zone.slug}`} 
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {zone.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {quickLinks.map(link => (
                <li key={link.path}>
                  <Link 
                    to={link.path} 
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              {resourceLinks.map(link => (
                <li key={link.path}>
                  <Link 
                    to={link.path} 
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
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
                  MCD Portal
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              {legalLinks.map(link => (
                <li key={link.path}>
                  <Link 
                    to={link.path} 
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {currentYear} NIGAM-Park. Municipal Corporation of Delhi. All rights reserved.</p>
          <p className="flex items-center gap-1">
            A <span className="text-primary font-medium">Digital India</span> Initiative
          </p>
        </div>
      </div>
    </footer>
  );
}
