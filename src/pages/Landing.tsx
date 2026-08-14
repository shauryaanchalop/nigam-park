import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin, ShieldCheck, Wallet, Camera, BarChart3, Bell, Sparkles, ArrowRight,
  Smartphone, Clock, Users, IndianRupee, Leaf, Star, CheckCircle2, Shield, BadgeCheck, User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import logo from '@/assets/logo.png';
import { useAuth } from '@/contexts/AuthContext';

const features = [
  { icon: MapPin, title: 'Live Parking Map', desc: 'See real-time availability across every MCD zone with occupancy heat overlays and turn-by-turn navigation.' },
  { icon: Clock, title: 'Instant Slot Booking', desc: 'Reserve a verified slot in seconds, extend on the go and get expiry reminders before you are fined.' },
  { icon: Wallet, title: 'Prepaid Parking Wallet', desc: 'Top up once, auto-debit on every booking. Loyalty points, referrals and monthly passes built in.' },
  { icon: ShieldCheck, title: 'Revenue Assurance', desc: 'Sensor-to-payment reconciliation flags leakage within two minutes and escalates it to the Fraud Hunter desk.' },
  { icon: Camera, title: 'Vision AI & ANPR', desc: 'CCTV analytics with number-plate recognition for touchless entry, overstay detection and occupancy counts.' },
  { icon: BarChart3, title: 'Predictive Analytics', desc: 'Occupancy and revenue forecasting so operations teams can staff and price ahead of demand.' },
  { icon: Bell, title: 'Smart Alerts', desc: 'Availability alerts, surge notifications, overstay warnings and fine reminders across email and app.' },
  { icon: Leaf, title: 'EV & Sustainability', desc: 'EV charging bays, carbon savings tracking and carpool incentives for greener city commutes.' },
];

const stats = [
  { value: '250+', label: 'Parking lots mapped' },
  { value: '30 s', label: 'Average booking time' },
  { value: '24x7', label: 'Live monitoring' },
  { value: '99.9%', label: 'Payment reconciliation' },
];

const roles = [
  { icon: Shield, title: 'MCD Commissioner', color: 'text-primary', desc: 'Command centre with city-wide revenue, fraud cases, live map and zone performance.' },
  { icon: BadgeCheck, title: 'Parking Attendant', color: 'text-orange-500', desc: 'Offline-first POS, QR badge, shift check-in and collection performance tracking.' },
  { icon: User, title: 'Citizen', color: 'text-green-600', desc: 'Find, book and pay for parking, manage vehicles, fines, wallet and rewards.' },
];

const steps = [
  { n: '01', title: 'Find', desc: 'Search by zone, landmark or voice. Compare rates, ratings and distance.' },
  { n: '02', title: 'Book', desc: 'Pick your slot and duration. Pay by wallet, UPI or card instantly.' },
  { n: '03', title: 'Park', desc: 'ANPR or attendant QR verifies you at the gate. No paper, no disputes.' },
  { n: '04', title: 'Track', desc: 'Reminders before expiry, digital receipts and loyalty points on every trip.' },
];

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="NIGAM-Park — Smart Parking & Revenue Assurance for Delhi"
        description="Book MCD parking in seconds, track live availability across Delhi, pay from a prepaid wallet and help the city stop parking revenue leakage with AI monitoring."
      />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="NIGAM-Park logo" className="w-9 h-9 rounded-full object-cover" />
            <div className="leading-tight">
              <p className="font-bold text-sm">NIGAM-Park</p>
              <p className="text-[10px] text-muted-foreground">Municipal Corporation of Delhi</p>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how" className="text-muted-foreground hover:text-foreground transition-colors">How it works</a>
            <a href="#roles" className="text-muted-foreground hover:text-foreground transition-colors">Roles</a>
            <Link to="/transparency" className="text-muted-foreground hover:text-foreground transition-colors">Transparency</Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild size="sm">
              <Link to={user ? '/dashboard' : '/auth'}>{user ? 'Go to dashboard' : 'Login'}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.18),transparent_60%)]" />
        <div className="container mx-auto px-4 py-20 md:py-28 text-center max-w-4xl">
          <Badge variant="secondary" className="mb-6 gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> MCD Smart Parking · Prototype
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Parking in Delhi,{' '}
            <span className="bg-gradient-to-r from-primary via-primary to-orange-500 bg-clip-text text-transparent">
              solved end to end
            </span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            NIGAM-Park connects citizens, attendants and the corporation on one platform — live availability,
            cashless booking, AI-powered revenue assurance and open data for every rupee collected.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link to={user ? '/dashboard' : '/auth'}>
                {user ? 'Open dashboard' : 'Login / Try demo modes'} <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/transparency">View public dashboard</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            One-click demo access for Commissioner, Attendant and Citizen views.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-14">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border bg-card/60 backdrop-blur p-4">
                <p className="text-2xl md:text-3xl font-bold text-primary">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 border-t bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Everything the city needs, in one app</h2>
            <p className="text-muted-foreground">
              Built for citizens who want a guaranteed slot and for the corporation that needs every transaction accounted for.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <Card key={f.title} className="border-border/60 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <CardContent className="p-6">
                  <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Four steps from search to receipt</h2>
            <p className="text-muted-foreground">No cash, no arguments at the gate, no lost revenue.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((s) => (
              <div key={s.n} className="relative rounded-xl border p-6 bg-card">
                <span className="text-4xl font-bold text-primary/15 absolute top-3 right-4">{s.n}</span>
                <h3 className="font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="py-20 border-t bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">One platform, three dedicated experiences</h2>
            <p className="text-muted-foreground">
              Sign in and pick a demo mode to explore any role instantly — data is pre-populated for every day.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {roles.map((r) => (
              <Card key={r.title} className="text-center">
                <CardContent className="p-8">
                  <r.icon className={`w-9 h-9 mx-auto mb-4 ${r.color}`} />
                  <h3 className="font-semibold mb-2">{r.title}</h3>
                  <p className="text-sm text-muted-foreground">{r.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button asChild size="lg" className="gap-2">
              <Link to="/auth">Continue to login <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-20">
        <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-10 items-center max-w-5xl">
          <div>
            <h2 className="text-3xl font-bold mb-4">Transparent by design</h2>
            <p className="text-muted-foreground mb-6">
              Every completed transaction feeds a public dashboard — daily collections, zone-wise occupancy and
              utilisation are open to citizens, auditors and the press.
            </p>
            <ul className="space-y-3">
              {[
                'Role-based access with row-level security on every record',
                'Sensor vs payment reconciliation with fraud severity levels',
                'Offline-first attendant POS that syncs when the network returns',
                'Works as an installable PWA on Android and iOS',
                'Hindi and English throughout, accessible and mobile-first',
              ].map((t) => (
                <li key={t} className="flex gap-3 text-sm">
                  <CheckCircle2 className="w-4.5 h-4.5 text-green-600 shrink-0 mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: IndianRupee, t: 'Cashless collections', d: 'UPI, cards and prepaid wallet' },
              { icon: Users, t: 'Multi-role access', d: 'Admin, attendant and citizen' },
              { icon: Smartphone, t: 'Installable PWA', d: 'Offline-ready on any phone' },
              { icon: Star, t: 'Rated lots', d: 'Verified reviews with photos' },
            ].map((c) => (
              <div key={c.t} className="rounded-xl border p-5 bg-card">
                <c.icon className="w-5 h-5 text-primary mb-3" />
                <p className="font-medium text-sm">{c.t}</p>
                <p className="text-xs text-muted-foreground mt-1">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t">
        <div className="container mx-auto px-4">
          <div className="rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-10 text-center text-primary-foreground">
            <h2 className="text-3xl font-bold mb-3">Ready to park the smarter way?</h2>
            <p className="opacity-90 mb-6">Create an account or jump straight into a demo mode.</p>
            <Button asChild size="lg" variant="secondary" className="gap-2">
              <Link to="/auth">Get started <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
