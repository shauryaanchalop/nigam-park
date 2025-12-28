import { GovHeader } from '@/components/ui/GovHeader';
import { SEOHead } from '@/components/SEOHead';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Terms of Service"
        description="NIGAM-Park terms of service. Read the terms and conditions for using our smart parking platform."
        canonicalUrl="https://nigam-park.vercel.app/terms"
      />
      
      <GovHeader />
      
      <main className="container py-8 flex-1">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Terms of Service</CardTitle>
              <p className="text-muted-foreground">Last updated: January 1, 2025</p>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing or using NIGAM-Park services, you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our services.
              </p>
              
              <h2>2. Services</h2>
              <p>
                NIGAM-Park provides a digital platform for finding, reserving, and paying for parking spots 
                at Municipal Corporation of Delhi (MCD) managed parking facilities.
              </p>
              
              <h2>3. User Registration</h2>
              <ul>
                <li>You must provide accurate and complete information during registration</li>
                <li>You are responsible for maintaining the confidentiality of your account</li>
                <li>You must be at least 18 years old to create an account</li>
                <li>One account per person; multiple accounts may be terminated</li>
              </ul>
              
              <h2>4. Parking Rules</h2>
              <ul>
                <li>Park only in designated spots</li>
                <li>Respect the reserved time duration</li>
                <li>Follow all MCD parking regulations</li>
                <li>Overstaying will result in additional charges and penalties</li>
              </ul>
              
              <h2>5. Payments & Refunds</h2>
              <ul>
                <li>All prices are in Indian Rupees (INR)</li>
                <li>Payments are processed through secure third-party providers</li>
                <li>Refunds for cancellations are subject to our refund policy</li>
                <li>No refund for no-shows without prior cancellation</li>
              </ul>
              
              <h2>6. Liability</h2>
              <p>
                NIGAM-Park and MCD are not liable for:
              </p>
              <ul>
                <li>Loss, theft, or damage to vehicles or belongings</li>
                <li>Service interruptions due to technical issues</li>
                <li>Accuracy of real-time availability information</li>
              </ul>
              
              <h2>7. Prohibited Activities</h2>
              <ul>
                <li>Misusing the platform or creating fraudulent bookings</li>
                <li>Attempting to hack or compromise the system</li>
                <li>Reselling parking spots to third parties</li>
                <li>Violating any applicable laws or regulations</li>
              </ul>
              
              <h2>8. Termination</h2>
              <p>
                We reserve the right to suspend or terminate accounts that violate these terms 
                or engage in fraudulent activities.
              </p>
              
              <h2>9. Changes to Terms</h2>
              <p>
                We may update these terms periodically. Continued use of the service after changes 
                constitutes acceptance of the new terms.
              </p>
              
              <h2>10. Contact</h2>
              <p>
                For questions about these terms:<br />
                Email: legal@nigampark.in<br />
                Phone: 1800-XXX-XXXX
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
