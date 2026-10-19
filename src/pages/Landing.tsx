import React, { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
import { cn } from '@/lib/utils';

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
  const { user, loginAsDemo } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [promptInput, setPromptInput] = React.useState('');
  const [activeRoleTab, setActiveRoleTab] = React.useState<'citizen' | 'attendant' | 'admin'>('citizen');
  const [launchingRole, setLaunchingRole] = React.useState<string | null>(null);

  useEffect(() => {
    const cameraParam = searchParams.get('camera');
    const incidentParam = searchParams.get('incident');
    if (cameraParam || incidentParam) {
      navigate(`/vision-dashboard?${searchParams.toString()}`, { replace: true });
    }
  }, [searchParams, navigate]);

  const handlePromptSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptInput.trim()) return;
    navigate(`/citizen?search=${encodeURIComponent(promptInput.trim())}`);
  };

  const handleLaunchRole = async (role: 'citizen' | 'attendant' | 'admin') => {
    setLaunchingRole(role);
    try {
      if (loginAsDemo) {
        await loginAsDemo(role);
      }
      navigate('/dashboard');
    } catch (err) {
      navigate('/auth');
    } finally {
      setLaunchingRole(null);
    }
  };

  const promptSuggestions = [
    { label: '✨ Live parking near Connaught Place', query: 'Connaught Place' },
    { label: '⚡ EV charging bays in Delhi', query: 'EV' },
    { label: '💳 MCD prepaid wallet', url: '/wallet' },
    { label: '⚠️ Pay parking challan / fine', url: '/report-violation' },
  ];

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20 selection:text-foreground">
      <SEOHead
        title="NIGAM-Park — Smart Parking & Revenue Assurance for Delhi"
        description="Book MCD parking in seconds, track live availability across Delhi, pay from a prepaid wallet and help the city stop parking revenue leakage with AI monitoring."
      />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl transition-all">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img src={logo} alt="NIGAM-Park logo" className="w-9 h-9 rounded-full object-cover shadow-sm transition-transform duration-200 group-hover:scale-105" />
            <div className="leading-tight">
              <p className="font-bold text-sm tracking-tight">NIGAM-Park</p>
              <p className="text-[10px] text-muted-foreground font-mono">MCD Smart Parking · Live</p>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#prompt-box" className="text-muted-foreground hover:text-foreground transition-colors">Ask AI</a>
            <a href="#canvas" className="text-muted-foreground hover:text-foreground transition-colors">Role Demos</a>
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how" className="text-muted-foreground hover:text-foreground transition-colors">How it works</a>
            <Link to="/transparency" className="text-muted-foreground hover:text-foreground transition-colors">Transparency</Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild size="sm" className="rounded-full px-4 shadow-sm hover:shadow-md transition-all ease-claude">
              <Link to={user ? '/dashboard' : '/auth'}>{user ? 'Go to dashboard' : 'Login'}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-8 pb-16 md:pt-16 md:pb-24">
        {/* Ambient warm gradient orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-primary/12 via-accent/8 to-transparent blur-3xl pointer-events-none rounded-full" />

        <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
          <div className="inline-block animate-float-gentle">
            <Badge variant="outline" className="mb-6 gap-2 px-4 py-1.5 rounded-full border-primary/25 bg-card/80 text-foreground shadow-sm backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground">Municipal Corporation of Delhi</span>
              <span className="text-border">|</span>
              <span className="text-xs font-semibold text-primary">Smart Parking System</span>
            </Badge>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-normal tracking-tight mb-5 leading-[1.08] text-foreground animate-fade-in-up duration-500 ease-claude">
            Parking in Delhi,{' '}
            <span className="italic font-serif text-primary underline decoration-primary/30 decoration-wavy underline-offset-8">
              reimagined
            </span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in-up stagger-1 ease-claude">
            Connect citizens, attendants, and the corporation on a single intelligent platform — verified live slots, cashless payments, and automated revenue assurance.
          </p>

          {/* Claude Signature Centerpiece: Interactive Prompt Box */}
          <div id="prompt-box" className="max-w-2xl mx-auto mb-10 animate-fade-in-up stagger-2 ease-claude">
            <form onSubmit={handlePromptSubmit} className="relative rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl p-2.5 shadow-xl transition-all duration-300 hover:border-primary/40 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15">
              <div className="flex items-center gap-2 px-3">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <input
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="Where do you want to park in Delhi today? (e.g. Connaught Place, Lajpat Nagar...)"
                  className="w-full bg-transparent border-0 text-sm sm:text-base placeholder:text-muted-foreground/70 focus:outline-none py-2 text-foreground"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="rounded-full h-10 w-10 shrink-0 bg-primary hover:bg-primary/95 text-primary-foreground shadow-md transition-transform active:scale-95 ease-claude"
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Prompt Suggestions */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2.5 mt-2 border-t border-border/50 px-2 text-left">
                {promptSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (item.url) {
                        navigate(item.url);
                      } else {
                        setPromptInput(item.query);
                        navigate(`/citizen?search=${encodeURIComponent(item.query)}`);
                      }
                    }}
                    className="text-xs px-2.5 py-1 rounded-full border border-border/60 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-150 ease-claude hover:-translate-y-0.5 active:scale-95"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </form>
          </div>

          {/* Claude-style Interactive Role Showcase (Artifacts Preview Canvas) */}
          <div id="canvas" className="max-w-3xl mx-auto mb-14 text-left animate-fade-in-up stagger-3 ease-claude">
            <div className="text-center mb-4">
              <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Interactive Experience Switcher</p>
            </div>

            {/* Role Tabs */}
            <div className="flex items-center justify-center gap-1.5 p-1 bg-muted/70 backdrop-blur-md rounded-2xl border border-border/60 max-w-md mx-auto mb-4">
              <button
                type="button"
                onClick={() => setActiveRoleTab('citizen')}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ease-claude",
                  activeRoleTab === 'citizen'
                    ? "bg-card text-foreground shadow-sm font-semibold scale-102"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>Citizen</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveRoleTab('attendant')}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ease-claude",
                  activeRoleTab === 'attendant'
                    ? "bg-card text-foreground shadow-sm font-semibold scale-102"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <BadgeCheck className="w-3.5 h-3.5 text-orange-500" />
                <span>Attendant</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveRoleTab('admin')}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ease-claude",
                  activeRoleTab === 'admin'
                    ? "bg-card text-foreground shadow-sm font-semibold scale-102"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span>Commissioner</span>
              </button>
            </div>

            {/* Interactive Preview Canvas */}
            <div className="claude-card p-6 border border-border/70 rounded-3xl shadow-xl bg-card/95 transition-all duration-300 ease-claude">
              {activeRoleTab === 'citizen' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Citizen Portal & Booking Engine</h4>
                        <p className="text-xs text-muted-foreground">Find slots, navigate, and pay seamlessly</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/5">Instant Booking</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center py-1">
                    <div className="p-3 rounded-2xl bg-muted/40 border border-border/50">
                      <p className="text-xs text-muted-foreground">Live Available</p>
                      <p className="text-lg font-bold text-foreground">1,420 spots</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-muted/40 border border-border/50">
                      <p className="text-xs text-muted-foreground">Wallet Balance</p>
                      <p className="text-lg font-bold text-emerald-600">₹850</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-muted/40 border border-border/50">
                      <p className="text-xs text-muted-foreground">EV Stations</p>
                      <p className="text-lg font-bold text-primary">38 active</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-muted-foreground">Pre-populated with live demo vehicle and active bookings.</span>
                    <Button 
                      onClick={() => handleLaunchRole('citizen')}
                      disabled={launchingRole !== null}
                      size="sm" 
                      className="rounded-full gap-1.5 shadow-md"
                    >
                      {launchingRole === 'citizen' ? 'Launching...' : 'Try Citizen View'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}

              {activeRoleTab === 'attendant' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
                        <BadgeCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Offline-First Attendant POS</h4>
                        <p className="text-xs text-muted-foreground">Fast QR check-in, cash/UPI receipt printing, shift tracking</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-orange-500/30 text-orange-500 bg-orange-500/5">Offline Ready</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center py-1">
                    <div className="p-3 rounded-2xl bg-muted/40 border border-border/50">
                      <p className="text-xs text-muted-foreground">Shift Collection</p>
                      <p className="text-lg font-bold text-foreground">₹14,250</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-muted/40 border border-border/50">
                      <p className="text-xs text-muted-foreground">Cars Checked In</p>
                      <p className="text-lg font-bold text-orange-500">76 vehicles</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-muted/40 border border-border/50">
                      <p className="text-xs text-muted-foreground">Sync Status</p>
                      <p className="text-lg font-bold text-emerald-600">Synced ✓</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-muted-foreground">Features digital thermal receipt generation and ANPR scan demo.</span>
                    <Button 
                      onClick={() => handleLaunchRole('attendant')}
                      disabled={launchingRole !== null}
                      size="sm" 
                      className="rounded-full gap-1.5 shadow-md bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      {launchingRole === 'attendant' ? 'Launching...' : 'Try Attendant POS'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}

              {activeRoleTab === 'admin' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">MCD Commissioner Command Centre</h4>
                        <p className="text-xs text-muted-foreground">City-wide revenue assurance, vision AI alerts, and fraud detection</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">24x7 AI Vigilance</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center py-1">
                    <div className="p-3 rounded-2xl bg-muted/40 border border-border/50">
                      <p className="text-xs text-muted-foreground">Daily Revenue</p>
                      <p className="text-lg font-bold text-foreground">₹4,82,450</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-muted/40 border border-border/50">
                      <p className="text-xs text-muted-foreground">Reconciliation</p>
                      <p className="text-lg font-bold text-emerald-600">99.8%</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-muted/40 border border-border/50">
                      <p className="text-xs text-muted-foreground">Fraud Hunter</p>
                      <p className="text-lg font-bold text-destructive">2 cases</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-muted-foreground">Full analytics, vision dashboard, shift schedules, and surge rules.</span>
                    <Button 
                      onClick={() => handleLaunchRole('admin')}
                      disabled={launchingRole !== null}
                      size="sm" 
                      className="rounded-full gap-1.5 shadow-md"
                    >
                      {launchingRole === 'admin' ? 'Launching...' : 'Try Commissioner View'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {stats.map((s, idx) => (
              <div 
                key={s.label} 
                className={cn(
                  "claude-card p-5 group text-left sm:text-center",
                  `stagger-${idx + 1}`
                )}
              >
                <p className="text-3xl md:text-4xl font-serif font-normal text-primary tracking-tight transition-transform duration-200 group-hover:scale-105">
                  {s.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1.5 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 border-t border-border/60 bg-muted/20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="outline" className="mb-3 text-xs font-semibold px-3 py-1">Capabilities</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">Everything the city needs, in one app</h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Built for citizens who want a guaranteed slot and for the corporation that needs every transaction accounted for.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <Card key={f.title} className="claude-card group border-border/60 hover:border-primary/30 p-1">
                <CardContent className="p-5">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 transition-all duration-300 ease-claude group-hover:scale-110 group-hover:bg-primary/20">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-base mb-2 group-hover:text-primary transition-colors duration-200">{f.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="outline" className="mb-3 text-xs font-semibold px-3 py-1">Process</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">Four steps from search to receipt</h2>
            <p className="text-muted-foreground text-sm sm:text-base">No cash, no arguments at the gate, no lost revenue.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((s) => (
              <div key={s.n} className="claude-card group relative p-6 bg-card/90">
                <span className="text-4xl font-black text-primary/15 absolute top-3 right-4 select-none group-hover:text-primary/30 transition-colors duration-200">
                  {s.n}
                </span>
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mb-4">
                  {s.n}
                </div>
                <h3 className="font-semibold text-base mb-2">{s.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Trust */}
      <section className="py-20">
        <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center max-w-5xl">
          <div>
            <Badge variant="outline" className="mb-3 text-xs font-semibold px-3 py-1">Open Governance</Badge>
            <h2 className="text-3xl font-bold mb-4 tracking-tight">Transparent by design</h2>
            <p className="text-muted-foreground mb-6 text-sm sm:text-base leading-relaxed">
              Every completed transaction feeds a public dashboard — daily collections, zone-wise occupancy and
              utilisation are open to citizens, auditors and the press.
            </p>
            <ul className="space-y-3.5">
              {[
                'Role-based access with row-level security on every record',
                'Sensor vs payment reconciliation with fraud severity levels',
                'Offline-first attendant POS that syncs when the network returns',
                'Works as an installable PWA on Android and iOS',
                'Hindi and English throughout, accessible and mobile-first',
              ].map((t) => (
                <li key={t} className="flex gap-3 text-sm items-start">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-foreground/90">{t}</span>
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
              <div key={c.t} className="claude-card p-5 group hover:border-primary/30">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-110">
                  <c.icon className="w-4.5 h-4.5 text-primary" />
                </div>
                <p className="font-semibold text-sm">{c.t}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-border/60">
        <div className="container mx-auto px-4">
          <div className="rounded-3xl bg-gradient-to-r from-primary via-primary to-orange-500 p-8 sm:p-12 text-center text-primary-foreground shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.15),transparent_70%)] pointer-events-none" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 tracking-tight">Ready to park the smarter way?</h2>
            <p className="opacity-95 mb-8 max-w-xl mx-auto text-sm sm:text-base">
              Create an account or jump straight into a demo mode to experience Delhi's smart parking ecosystem.
            </p>
            <Button asChild size="lg" variant="secondary" className="gap-2 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 ease-claude font-semibold">
              <Link to="/auth">Get started <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
