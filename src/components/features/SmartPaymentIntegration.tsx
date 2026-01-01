import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CreditCard, Smartphone, Wallet, IndianRupee, QrCode, CheckCircle2, Shield, Zap, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface PaymentMethod {
  id: string;
  name: string;
  nameHi: string;
  icon: React.ReactNode;
  type: 'upi' | 'card' | 'wallet';
  popular?: boolean;
}

const paymentMethods: PaymentMethod[] = [
  { id: 'gpay', name: 'Google Pay', nameHi: 'गूगल पे', icon: <Smartphone className="w-5 h-5" />, type: 'upi', popular: true },
  { id: 'phonepe', name: 'PhonePe', nameHi: 'फोन पे', icon: <Smartphone className="w-5 h-5" />, type: 'upi', popular: true },
  { id: 'paytm', name: 'Paytm', nameHi: 'पेटीएम', icon: <Wallet className="w-5 h-5" />, type: 'wallet', popular: true },
  { id: 'card', name: 'Debit/Credit Card', nameHi: 'डेबिट/क्रेडिट कार्ड', icon: <CreditCard className="w-5 h-5" />, type: 'card' },
  { id: 'upi', name: 'UPI ID', nameHi: 'UPI आईडी', icon: <QrCode className="w-5 h-5" />, type: 'upi' },
];

export function SmartPaymentIntegration() {
  const { isHindi } = useLanguage();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [upiId, setUpiId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const amount = 120;

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast.error(isHindi ? 'कृपया भुगतान विधि चुनें' : 'Please select a payment method');
      return;
    }

    setProcessing(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setProcessing(false);
    setPaymentComplete(true);
    toast.success(isHindi ? 'भुगतान सफल!' : 'Payment successful!');
  };

  const resetPayment = () => {
    setSelectedMethod(null);
    setPaymentComplete(false);
    setUpiId('');
  };

  if (paymentComplete) {
    return (
      <Card className="border-success/30 bg-success/5">
        <CardContent className="pt-6 text-center">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <h3 className="text-xl font-bold text-success mb-2">
            {isHindi ? 'भुगतान सफल!' : 'Payment Successful!'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {isHindi ? 'आपके खाते से ₹' : 'Amount debited: ₹'}{amount}
          </p>
          <div className="bg-muted/50 rounded-lg p-4 mb-4 text-left">
            <p className="text-sm text-muted-foreground">{isHindi ? 'लेनदेन आईडी' : 'Transaction ID'}</p>
            <p className="font-mono text-sm">TXN{Date.now().toString().slice(-10)}</p>
          </div>
          <Button onClick={resetPayment} variant="outline" className="w-full">
            {isHindi ? 'नया भुगतान करें' : 'Make Another Payment'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IndianRupee className="w-5 h-5 text-primary" />
          {isHindi ? 'स्मार्ट भुगतान' : 'Smart Payment'}
        </CardTitle>
        <CardDescription>
          {isHindi 
            ? 'सुरक्षित UPI, कार्ड या वॉलेट से तुरंत भुगतान करें'
            : 'Instant secure payment via UPI, Card, or Wallet'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Feature highlights */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="text-xs gap-1">
            <Shield className="w-3 h-3" />
            {isHindi ? 'सुरक्षित' : 'Secure'}
          </Badge>
          <Badge variant="outline" className="text-xs gap-1">
            <Zap className="w-3 h-3" />
            {isHindi ? 'तुरंत' : 'Instant'}
          </Badge>
          <Badge variant="outline" className="text-xs gap-1">
            <Clock className="w-3 h-3" />
            {isHindi ? 'रिफंड <24घंटे' : 'Refund <24hr'}
          </Badge>
        </div>

        {/* Amount display */}
        <div className="bg-primary/10 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">{isHindi ? 'भुगतान राशि' : 'Amount to Pay'}</p>
          <p className="text-3xl font-bold text-primary">₹{amount}</p>
        </div>

        {/* Payment methods */}
        <div className="space-y-2">
          <p className="text-sm font-medium">{isHindi ? 'भुगतान विधि चुनें' : 'Select Payment Method'}</p>
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                  selectedMethod === method.id 
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/20' 
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                {method.icon}
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">{isHindi ? method.nameHi : method.name}</p>
                  {method.popular && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">
                      {isHindi ? 'लोकप्रिय' : 'Popular'}
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* UPI ID input for UPI method */}
        {selectedMethod === 'upi' && (
          <div>
            <p className="text-sm font-medium mb-2">{isHindi ? 'UPI आईडी दर्ज करें' : 'Enter UPI ID'}</p>
            <Input 
              placeholder="yourname@upi" 
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
            />
          </div>
        )}

        {/* Pay button */}
        <Button 
          className="w-full gap-2" 
          size="lg"
          onClick={handlePayment}
          disabled={!selectedMethod || processing}
        >
          {processing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {isHindi ? 'प्रोसेसिंग...' : 'Processing...'}
            </>
          ) : (
            <>
              <IndianRupee className="w-4 h-4" />
              {isHindi ? `₹${amount} भुगतान करें` : `Pay ₹${amount}`}
            </>
          )}
        </Button>

        {/* Info text */}
        <p className="text-xs text-center text-muted-foreground">
          {isHindi 
            ? '🔒 आपका भुगतान 256-बिट SSL एन्क्रिप्शन द्वारा सुरक्षित है'
            : '🔒 Your payment is secured with 256-bit SSL encryption'}
        </p>
      </CardContent>
    </Card>
  );
}
