import { useNavigate } from 'react-router-dom';
import { GovHeader } from '@/components/ui/GovHeader';
import { SEOHead } from '@/components/SEOHead';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Privacy Policy"
        description="NIGAM-Park privacy policy. Learn how we collect, use, and protect your personal information."
        canonicalUrl="https://nigam-park.vercel.app/privacy-policy"
      />
      
      <GovHeader />
      
      <main className="container py-8 flex-1">
        <div className="max-w-3xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Privacy Policy</CardTitle>
              <p className="text-muted-foreground">Last updated: January 1, 2025</p>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <h2>1. Introduction</h2>
              <p>
                NIGAM-Park (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is operated by the Municipal Corporation of Delhi (MCD). 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
                smart parking platform.
              </p>
              
              <h2>2. Information We Collect</h2>
              <h3>Personal Information</h3>
              <ul>
                <li>Name and contact details (email, phone number)</li>
                <li>Vehicle registration number</li>
                <li>Payment information (processed by secure third-party providers)</li>
                <li>Location data (when you use the app)</li>
              </ul>
              
              <h3>Usage Information</h3>
              <ul>
                <li>Parking history and preferences</li>
                <li>App usage patterns</li>
                <li>Device information and IP address</li>
              </ul>
              
              <h2>3. How We Use Your Information</h2>
              <ul>
                <li>To provide and improve parking services</li>
                <li>To process reservations and payments</li>
                <li>To send notifications about your bookings</li>
                <li>To prevent fraud and ensure security</li>
                <li>To analyze usage and improve our services</li>
              </ul>
              
              <h2>4. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal data against 
                unauthorized access, alteration, disclosure, or destruction. All payment transactions are encrypted 
                using SSL technology.
              </p>
              
              <h2>5. Data Sharing</h2>
              <p>
                We do not sell your personal information. We may share data with:
              </p>
              <ul>
                <li>Payment processors to complete transactions</li>
                <li>Law enforcement when required by law</li>
                <li>Service providers who assist in our operations</li>
              </ul>
              
              <h2>6. Your Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your data</li>
                <li>Opt-out of marketing communications</li>
              </ul>
              
              <h2>7. Contact Us</h2>
              <p>
                For privacy-related queries, contact us at:<br />
                Email: privacy@nigampark.in<br />
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
