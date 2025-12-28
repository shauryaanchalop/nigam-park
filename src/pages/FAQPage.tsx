import { Link } from 'react-router-dom';
import { GovHeader } from '@/components/ui/GovHeader';
import { SEOHead } from '@/components/SEOHead';
import { Footer } from '@/components/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, MapPin, CreditCard, Clock, Shield, Phone } from 'lucide-react';

const faqs = [
  {
    category: 'General',
    icon: HelpCircle,
    questions: [
      {
        question: 'What is NIGAM-Park?',
        answer: 'NIGAM-Park is the official smart parking system by Municipal Corporation of Delhi (MCD). It allows citizens to find, book, and pay for parking spots in real-time across Delhi. The platform offers live availability updates, online reservations, and digital payments.',
      },
      {
        question: 'Is NIGAM-Park free to use?',
        answer: 'The NIGAM-Park app is free to download and use. However, parking fees apply based on the hourly rates of each parking lot. Rates vary by location and are displayed before booking.',
      },
      {
        question: 'Which areas are covered by NIGAM-Park?',
        answer: 'NIGAM-Park covers major areas in Delhi including Connaught Place, Karol Bagh, Chandni Chowk, Lajpat Nagar, Nehru Place, and Sarojini Nagar. We are continuously expanding to more locations.',
      },
    ],
  },
  {
    category: 'Booking & Reservations',
    icon: Clock,
    questions: [
      {
        question: 'How do I reserve a parking spot?',
        answer: 'To reserve a parking spot: 1) Search for your destination or browse nearby lots, 2) Select a parking lot with available spots, 3) Choose your parking duration, 4) Complete payment via UPI, card, or other methods. You will receive a confirmation with a QR code.',
      },
      {
        question: 'Can I cancel my reservation?',
        answer: 'Yes, reservations can be cancelled up to 30 minutes before the scheduled start time for a full refund. Cancellations made within 30 minutes may be subject to a cancellation fee.',
      },
      {
        question: 'What happens if I overstay my parking time?',
        answer: 'Overstaying beyond your reserved time will result in additional charges at the standard hourly rate plus an overstay penalty. You will receive notifications before your parking time expires to help you avoid this.',
      },
      {
        question: 'Can I extend my parking duration?',
        answer: 'Yes, you can extend your parking duration through the app, subject to availability. It is recommended to extend at least 15 minutes before your current slot expires.',
      },
    ],
  },
  {
    category: 'Payments',
    icon: CreditCard,
    questions: [
      {
        question: 'What payment methods are accepted?',
        answer: 'NIGAM-Park accepts multiple payment methods including UPI (Google Pay, PhonePe, Paytm), debit/credit cards, net banking, and digital wallets. Cash payment is also available at attended parking lots.',
      },
      {
        question: 'Is my payment information secure?',
        answer: 'Yes, all payments are processed through secure, PCI-DSS compliant payment gateways. We do not store your card details. UPI transactions are processed directly through your bank.',
      },
      {
        question: 'How do I get a refund?',
        answer: 'Refunds for eligible cancellations are processed within 5-7 business days to your original payment method. For any refund queries, contact our support at 1800-XXX-XXXX.',
      },
    ],
  },
  {
    category: 'Parking Lots',
    icon: MapPin,
    questions: [
      {
        question: 'Are the parking lots safe?',
        answer: 'All MCD-managed parking lots feature 24/7 CCTV surveillance, trained attendants, and proper lighting. However, we recommend not leaving valuables in your vehicle.',
      },
      {
        question: 'What are the operating hours?',
        answer: 'Most NIGAM-Park locations operate 24/7. Some locations near markets may have specific operating hours aligned with market timings. Check the lot details for specific timings.',
      },
      {
        question: 'Is there EV charging available?',
        answer: 'Select parking locations offer EV charging facilities. Look for the EV charging icon when browsing parking lots. Charging rates are separate from parking fees.',
      },
    ],
  },
  {
    category: 'Account & Support',
    icon: Shield,
    questions: [
      {
        question: 'How do I create an account?',
        answer: 'You can create an account using your email address or phone number. Simply click on Sign Up, enter your details, and verify via OTP. You can also sign up using Google.',
      },
      {
        question: 'I forgot my password. How do I reset it?',
        answer: 'Click on "Forgot Password" on the login page, enter your registered email, and you will receive a password reset link. The link is valid for 24 hours.',
      },
      {
        question: 'How do I contact customer support?',
        answer: 'You can reach our 24/7 customer support at 1800-XXX-XXXX (toll-free) or email support@nigampark.in. For urgent issues at a parking location, contact the on-site attendant.',
      },
    ],
  },
];

export default function FAQPage() {
  const allQuestions = faqs.flatMap(cat => cat.questions);
  
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: allQuestions.map(q => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Frequently Asked Questions"
        description="Find answers to common questions about NIGAM-Park smart parking system. Learn about booking, payments, parking lots, and more."
        keywords="NIGAM-Park FAQ, parking questions Delhi, MCD parking help, how to book parking, parking payment methods"
        canonicalUrl="https://nigam-park.vercel.app/faq"
        structuredData={structuredData}
      />
      
      <GovHeader />
      
      <main className="container py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Badge variant="outline" className="mb-2">Help Center</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-muted-foreground">
              Find answers to common questions about NIGAM-Park smart parking.
            </p>
          </div>
          
          <div className="space-y-8">
            {faqs.map((category) => {
              const Icon = category.icon;
              return (
                <Card key={category.category}>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      {category.category}
                    </h2>
                    <Accordion type="single" collapsible className="w-full">
                      {category.questions.map((faq, index) => (
                        <AccordionItem key={index} value={`${category.category}-${index}`}>
                          <AccordionTrigger className="text-left">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {/* Contact CTA */}
          <Card className="mt-8 bg-primary/5 border-primary/20">
            <CardContent className="p-6 text-center">
              <Phone className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Still have questions?</h3>
              <p className="text-muted-foreground mb-4">
                Our support team is available 24/7 to help you.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild>
                  <Link to="/contact">Contact Us</Link>
                </Button>
                <Button variant="outline" asChild>
                  <a href="tel:1800XXXXXXX">Call 1800-XXX-XXXX</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
