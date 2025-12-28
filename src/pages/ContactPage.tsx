import { GovHeader } from '@/components/ui/GovHeader';
import { SEOHead } from '@/components/SEOHead';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success('Message sent!', {
      description: 'We will get back to you within 24-48 hours.',
    });
    
    (e.target as HTMLFormElement).reset();
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Contact Us"
        description="Contact NIGAM-Park support team. Get help with parking reservations, payments, or report issues. 24/7 customer support available."
        keywords="contact NIGAM-Park, MCD parking support, parking helpline Delhi, customer service"
        canonicalUrl="https://nigam-park.vercel.app/contact"
      />
      
      <GovHeader />
      
      <main className="container py-8 flex-1">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Contact Us</h1>
            <p className="text-lg text-muted-foreground">
              We&apos;re here to help. Reach out to us through any of the channels below.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <Phone className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Phone</h3>
                <p className="text-muted-foreground text-sm mb-2">24/7 Toll-Free Helpline</p>
                <a href="tel:1800XXXXXXX" className="text-primary font-medium">
                  1800-XXX-XXXX
                </a>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Mail className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Email</h3>
                <p className="text-muted-foreground text-sm mb-2">Response within 24-48 hours</p>
                <a href="mailto:support@nigampark.in" className="text-primary font-medium">
                  support@nigampark.in
                </a>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Office Hours</h3>
                <p className="text-muted-foreground text-sm mb-2">For in-person visits</p>
                <p className="font-medium">Mon-Sat: 10 AM - 5 PM</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" placeholder="Your name" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" type="tel" placeholder="Your phone" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="your@email.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" placeholder="How can we help?" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Describe your issue or query in detail..." 
                      rows={4}
                      required 
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Head Office
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-1">Municipal Corporation of Delhi</h4>
                    <p className="text-muted-foreground text-sm">
                      NIGAM-Park Division<br />
                      Dr. S.P. Mukherjee Civic Centre<br />
                      JLN Marg, New Delhi - 110002
                    </p>
                  </div>
                  
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <iframe
                      title="MCD Office Location"
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3501.9454785731367!2d77.23076931508248!3d28.632376682418594!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfd37b741d057%3A0xcdee88e47393c3f1!2sMCD%20Civic%20Centre!5e0!3m2!1sen!2sin!4v1640000000000!5m2!1sen!2sin"
                      className="w-full h-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                  
                  <Button variant="outline" className="w-full" asChild>
                    <a 
                      href="https://www.google.com/maps/dir/?api=1&destination=28.632376,77.233544"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Get Directions
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
