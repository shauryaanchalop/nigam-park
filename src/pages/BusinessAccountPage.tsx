import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GovHeader } from '@/components/ui/GovHeader';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  Users, 
  CreditCard, 
  BarChart3, 
  FileText, 
  Shield, 
  Clock, 
  MapPin,
  Check,
  ArrowRight,
  Phone,
  Mail,
  Briefcase
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const features = [
  {
    icon: Users,
    title: 'Employee Management',
    titleHi: 'कर्मचारी प्रबंधन',
    description: 'Add and manage employee parking allocations',
    descriptionHi: 'कर्मचारी पार्किंग आवंटन जोड़ें और प्रबंधित करें',
  },
  {
    icon: CreditCard,
    title: 'Centralized Billing',
    titleHi: 'केंद्रीकृत बिलिंग',
    description: 'Single invoice for all company parking expenses',
    descriptionHi: 'सभी कंपनी पार्किंग खर्चों के लिए एकल चालान',
  },
  {
    icon: BarChart3,
    title: 'Usage Analytics',
    titleHi: 'उपयोग विश्लेषण',
    description: 'Detailed reports on parking usage and costs',
    descriptionHi: 'पार्किंग उपयोग और लागत पर विस्तृत रिपोर्ट',
  },
  {
    icon: FileText,
    title: 'GST Invoicing',
    titleHi: 'GST चालान',
    description: 'Automatic GST-compliant invoices for tax benefits',
    descriptionHi: 'कर लाभ के लिए स्वचालित GST-अनुपालन चालान',
  },
  {
    icon: Shield,
    title: 'Priority Support',
    titleHi: 'प्राथमिकता सहायता',
    description: 'Dedicated account manager and 24/7 support',
    descriptionHi: 'समर्पित खाता प्रबंधक और 24/7 सहायता',
  },
  {
    icon: Clock,
    title: 'Flexible Booking',
    titleHi: 'लचीली बुकिंग',
    description: 'Book for days, weeks, or months in advance',
    descriptionHi: 'दिनों, सप्ताहों या महीनों पहले बुक करें',
  },
];

const plans = [
  {
    name: 'Starter',
    nameHi: 'स्टार्टर',
    price: 9999,
    employees: '1-10',
    features: ['10 employee accounts', 'Basic analytics', 'Email support', 'Monthly invoicing'],
    featuresHi: ['10 कर्मचारी खाते', 'बुनियादी विश्लेषण', 'ईमेल सहायता', 'मासिक चालान'],
    popular: false,
  },
  {
    name: 'Business',
    nameHi: 'बिज़नेस',
    price: 24999,
    employees: '11-50',
    features: ['50 employee accounts', 'Advanced analytics', 'Priority support', 'Weekly invoicing', 'Dedicated manager'],
    featuresHi: ['50 कर्मचारी खाते', 'उन्नत विश्लेषण', 'प्राथमिकता सहायता', 'साप्ताहिक चालान', 'समर्पित प्रबंधक'],
    popular: true,
  },
  {
    name: 'Enterprise',
    nameHi: 'एंटरप्राइज़',
    price: null,
    employees: '50+',
    features: ['Unlimited employees', 'Custom analytics', '24/7 support', 'Custom billing', 'API access', 'SLA guarantee'],
    featuresHi: ['असीमित कर्मचारी', 'कस्टम विश्लेषण', '24/7 सहायता', 'कस्टम बिलिंग', 'API एक्सेस', 'SLA गारंटी'],
    popular: false,
  },
];

export default function BusinessAccountPage() {
  const { isHindi } = useLanguage();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    employees: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(
      isHindi 
        ? 'धन्यवाद! हमारी टीम जल्द ही संपर्क करेगी।' 
        : 'Thank you! Our team will contact you shortly.'
    );
    setFormData({ companyName: '', contactName: '', email: '', phone: '', employees: '' });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title={isHindi ? 'व्यापार खाते' : 'Business Accounts'}
        description={isHindi 
          ? 'निगम-पार्क के साथ कॉर्पोरेट पार्किंग प्रबंधन। कर्मचारी पार्किंग, केंद्रीकृत बिलिंग, और विश्लेषण।'
          : 'Corporate parking management with NIGAM-Park. Employee parking, centralized billing, and analytics.'}
        keywords="corporate parking Delhi, business parking account, employee parking management, MCD corporate parking"
      />
      
      <GovHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-background py-16">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <Badge className="mb-4">
                <Building2 className="w-3 h-3 mr-1" />
                {isHindi ? 'व्यापार समाधान' : 'Business Solutions'}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {isHindi ? 'कॉर्पोरेट पार्किंग प्रबंधन' : 'Corporate Parking Management'}
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                {isHindi 
                  ? 'अपनी कंपनी की पार्किंग को सरल बनाएं। कर्मचारी पार्किंग आवंटन, केंद्रीकृत बिलिंग, और विस्तृत रिपोर्टिंग एक ही स्थान पर।'
                  : 'Simplify your company\'s parking. Employee parking allocations, centralized billing, and detailed reporting all in one place.'}
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button size="lg" asChild>
                  <a href="#contact">
                    {isHindi ? 'संपर्क करें' : 'Contact Sales'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#plans">
                    {isHindi ? 'प्लान देखें' : 'View Plans'}
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <div className="container">
            <h2 className="text-2xl font-bold text-center mb-8">
              {isHindi ? 'व्यापार खाते की विशेषताएं' : 'Business Account Features'}
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <Card key={index} className="border-primary/10 hover:border-primary/30 transition-colors">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">
                      {isHindi ? feature.titleHi : feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isHindi ? feature.descriptionHi : feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Plans Section */}
        <section id="plans" className="py-16 bg-muted/30">
          <div className="container">
            <h2 className="text-2xl font-bold text-center mb-2">
              {isHindi ? 'व्यापार प्लान' : 'Business Plans'}
            </h2>
            <p className="text-center text-muted-foreground mb-8">
              {isHindi ? 'अपनी कंपनी के आकार के अनुसार चुनें' : 'Choose based on your company size'}
            </p>
            <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
              {plans.map((plan, index) => (
                <Card 
                  key={index} 
                  className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      {isHindi ? 'सबसे लोकप्रिय' : 'Most Popular'}
                    </Badge>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle>{isHindi ? plan.nameHi : plan.name}</CardTitle>
                    <CardDescription>
                      {plan.employees} {isHindi ? 'कर्मचारी' : 'employees'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="mb-4">
                      {plan.price ? (
                        <>
                          <span className="text-3xl font-bold">₹{plan.price.toLocaleString('en-IN')}</span>
                          <span className="text-muted-foreground">/{isHindi ? 'माह' : 'month'}</span>
                        </>
                      ) : (
                        <span className="text-2xl font-bold">{isHindi ? 'कस्टम मूल्य' : 'Custom Pricing'}</span>
                      )}
                    </div>
                    <ul className="space-y-2 text-sm text-left mb-6">
                      {(isHindi ? plan.featuresHi : plan.features).map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                      {plan.price 
                        ? (isHindi ? 'शुरू करें' : 'Get Started')
                        : (isHindi ? 'संपर्क करें' : 'Contact Us')}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section id="contact" className="py-16">
          <div className="container">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    {isHindi ? 'व्यापार खाते के लिए संपर्क करें' : 'Contact for Business Account'}
                  </CardTitle>
                  <CardDescription>
                    {isHindi 
                      ? 'अपनी जानकारी भरें और हमारी टीम 24 घंटे में संपर्क करेगी'
                      : 'Fill in your details and our team will contact you within 24 hours'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="companyName">
                          {isHindi ? 'कंपनी का नाम' : 'Company Name'}
                        </Label>
                        <Input
                          id="companyName"
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="contactName">
                          {isHindi ? 'संपर्क व्यक्ति' : 'Contact Person'}
                        </Label>
                        <Input
                          id="contactName"
                          value={formData.contactName}
                          onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="email">
                          {isHindi ? 'ईमेल' : 'Email'}
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">
                          {isHindi ? 'फ़ोन' : 'Phone'}
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="employees">
                        {isHindi ? 'कर्मचारियों की संख्या' : 'Number of Employees'}
                      </Label>
                      <Input
                        id="employees"
                        value={formData.employees}
                        onChange={(e) => setFormData({ ...formData, employees: e.target.value })}
                        placeholder={isHindi ? 'जैसे: 50-100' : 'e.g., 50-100'}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      {isHindi ? 'अनुरोध भेजें' : 'Submit Request'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Trusted By Section */}
        <section className="py-12 bg-muted/30">
          <div className="container text-center">
            <p className="text-sm text-muted-foreground mb-4">
              {isHindi ? 'इनके द्वारा विश्वसनीय' : 'Trusted by leading organizations'}
            </p>
            <div className="flex flex-wrap justify-center gap-8 opacity-60">
              <div className="text-xl font-bold">TCS</div>
              <div className="text-xl font-bold">Infosys</div>
              <div className="text-xl font-bold">Wipro</div>
              <div className="text-xl font-bold">HCL</div>
              <div className="text-xl font-bold">Delhi Metro</div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
