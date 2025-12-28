import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GovHeader } from '@/components/ui/GovHeader';
import { SEOHead } from '@/components/SEOHead';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, CreditCard, Car, Calendar, MapPin, Shield, Zap, Clock } from 'lucide-react';
import { useParkingLots } from '@/hooks/useParkingLots';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

const PASS_TYPES = [
  {
    id: 'basic',
    name: 'Basic Pass',
    nameHi: 'बेसिक पास',
    price: 1500,
    duration: 30,
    features: ['Single lot access', 'Standard hours (6 AM - 10 PM)', 'Basic support'],
    featuresHi: ['एक पार्किंग स्थल', 'स्टैंडर्ड घंटे (6 AM - 10 PM)', 'बेसिक सपोर्ट'],
  },
  {
    id: 'standard',
    name: 'Standard Pass',
    nameHi: 'स्टैंडर्ड पास',
    price: 2500,
    duration: 30,
    features: ['Single lot access', '24/7 parking', 'Priority support', '10% loyalty bonus'],
    featuresHi: ['एक पार्किंग स्थल', '24/7 पार्किंग', 'प्राथमिकता सपोर्ट', '10% लॉयल्टी बोनस'],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium Pass',
    nameHi: 'प्रीमियम पास',
    price: 4000,
    duration: 30,
    features: ['All lots access', '24/7 parking', 'Priority entry', 'EV charging included', '25% loyalty bonus'],
    featuresHi: ['सभी पार्किंग स्थल', '24/7 पार्किंग', 'प्राथमिकता प्रवेश', 'EV चार्जिंग शामिल', '25% लॉयल्टी बोनस'],
  },
];

export default function MonthlyPassPage() {
  const [selectedPass, setSelectedPass] = useState('standard');
  const [selectedLot, setSelectedLot] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const { data: parkingLots } = useParkingLots();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isHindi = language === 'hi';

  const handlePurchase = () => {
    if (!user) {
      toast.error(isHindi ? 'कृपया पहले लॉगिन करें' : 'Please login first');
      navigate('/auth');
      return;
    }

    if (selectedPass !== 'premium' && !selectedLot) {
      toast.error(isHindi ? 'कृपया पार्किंग स्थल चुनें' : 'Please select a parking lot');
      return;
    }

    if (!vehicleNumber) {
      toast.error(isHindi ? 'कृपया वाहन नंबर दर्ज करें' : 'Please enter vehicle number');
      return;
    }

    // Simulate purchase - in production, integrate with payment gateway
    toast.success(isHindi ? 'पास खरीदी सफल!' : 'Pass purchased successfully!', {
      description: isHindi ? 'आपका मासिक पास सक्रिय हो गया है' : 'Your monthly pass is now active',
    });
  };

  const selectedPassData = PASS_TYPES.find(p => p.id === selectedPass);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title={isHindi ? 'मासिक पार्किंग पास' : 'Monthly Parking Pass'}
        description="Save money with NIGAM-Park monthly parking passes. Unlimited parking access, priority entry, and exclusive benefits for regular commuters in Delhi."
        keywords="monthly parking pass Delhi, parking subscription, unlimited parking, commuter parking pass, MCD parking pass"
        canonicalUrl="https://nigam-park.vercel.app/monthly-pass"
      />
      
      <GovHeader />
      
      <main className="container py-8 flex-1">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-2">
              {isHindi ? 'बचत करें' : 'Save More'}
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              {isHindi ? 'मासिक पार्किंग पास' : 'Monthly Parking Pass'}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {isHindi 
                ? 'नियमित यात्रियों के लिए असीमित पार्किंग और विशेष लाभ' 
                : 'Unlimited parking and exclusive benefits for regular commuters'}
            </p>
          </div>

          {/* Pass Selection */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {PASS_TYPES.map((pass) => (
              <Card 
                key={pass.id}
                className={`relative cursor-pointer transition-all ${
                  selectedPass === pass.id 
                    ? 'border-primary ring-2 ring-primary/20' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedPass(pass.id)}
              >
                {pass.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    {isHindi ? 'लोकप्रिय' : 'Popular'}
                  </Badge>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle>{isHindi ? pass.nameHi : pass.name}</CardTitle>
                  <div className="text-3xl font-bold text-primary">
                    ₹{pass.price}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{isHindi ? 'महीना' : 'month'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(isHindi ? pass.featuresHi : pass.features).map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4">
                    <RadioGroup value={selectedPass}>
                      <div className="flex items-center justify-center">
                        <RadioGroupItem value={pass.id} id={pass.id} />
                        <Label htmlFor={pass.id} className="ml-2 text-sm">
                          {isHindi ? 'चुनें' : 'Select'}
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Purchase Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                {isHindi ? 'पास विवरण' : 'Pass Details'}
              </CardTitle>
              <CardDescription>
                {isHindi 
                  ? 'अपने मासिक पास के लिए विवरण दर्ज करें'
                  : 'Enter details for your monthly pass'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle">
                    <Car className="h-4 w-4 inline mr-1" />
                    {isHindi ? 'वाहन नंबर' : 'Vehicle Number'}
                  </Label>
                  <Input
                    id="vehicle"
                    placeholder="DL 01 AB 1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  />
                </div>

                {selectedPass !== 'premium' && (
                  <div className="space-y-2">
                    <Label>
                      <MapPin className="h-4 w-4 inline mr-1" />
                      {isHindi ? 'पार्किंग स्थल' : 'Parking Lot'}
                    </Label>
                    <Select value={selectedLot} onValueChange={setSelectedLot}>
                      <SelectTrigger>
                        <SelectValue placeholder={isHindi ? 'स्थल चुनें' : 'Select lot'} />
                      </SelectTrigger>
                      <SelectContent>
                        {parkingLots?.map(lot => (
                          <SelectItem key={lot.id} value={lot.id}>
                            {lot.name} - {lot.zone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="bg-muted/50 rounded-lg p-4 mt-6">
                <h4 className="font-medium mb-3">
                  {isHindi ? 'ऑर्डर सारांश' : 'Order Summary'}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{isHindi ? selectedPassData?.nameHi : selectedPassData?.name}</span>
                    <span>₹{selectedPassData?.price}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{isHindi ? 'अवधि' : 'Duration'}</span>
                    <span>{selectedPassData?.duration} {isHindi ? 'दिन' : 'days'}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>GST (18%)</span>
                    <span>₹{Math.round((selectedPassData?.price || 0) * 0.18)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>{isHindi ? 'कुल' : 'Total'}</span>
                    <span className="text-primary">
                      ₹{Math.round((selectedPassData?.price || 0) * 1.18)}
                    </span>
                  </div>
                </div>
              </div>

              <Button onClick={handlePurchase} className="w-full" size="lg">
                <Zap className="h-4 w-4 mr-2" />
                {isHindi ? 'अभी खरीदें' : 'Purchase Now'}
              </Button>
            </CardContent>
          </Card>

          {/* Benefits */}
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="h-8 w-8 text-primary" />
                <div>
                  <h4 className="font-medium">{isHindi ? 'समय बचाएं' : 'Save Time'}</h4>
                  <p className="text-sm text-muted-foreground">
                    {isHindi ? 'हर बार बुकिंग की जरूरत नहीं' : 'No booking needed each time'}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <h4 className="font-medium">{isHindi ? 'गारंटीड स्पॉट' : 'Guaranteed Spot'}</h4>
                  <p className="text-sm text-muted-foreground">
                    {isHindi ? 'आपका स्थान सुरक्षित' : 'Your spot is reserved'}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <CreditCard className="h-8 w-8 text-primary" />
                <div>
                  <h4 className="font-medium">{isHindi ? '30% तक बचत' : 'Save up to 30%'}</h4>
                  <p className="text-sm text-muted-foreground">
                    {isHindi ? 'दैनिक दरों की तुलना में' : 'Compared to daily rates'}
                  </p>
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
