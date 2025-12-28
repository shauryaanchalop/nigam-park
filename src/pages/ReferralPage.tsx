import { useState, useEffect } from 'react';
import { GovHeader } from '@/components/ui/GovHeader';
import { SEOHead } from '@/components/SEOHead';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Gift, Copy, Share2, Users, Award, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ReferralPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isHindi = language === 'hi';
  
  const [referralCode, setReferralCode] = useState('');
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    successfulReferrals: 0,
    pendingReferrals: 0,
    pointsEarned: 0,
  });

  useEffect(() => {
    if (user) {
      // Generate referral code from user ID
      const code = `NIGAM${user.id.slice(0, 6).toUpperCase()}`;
      setReferralCode(code);
      
      // Mock stats - in production, fetch from database
      setReferralStats({
        totalReferrals: 5,
        successfulReferrals: 3,
        pendingReferrals: 2,
        pointsEarned: 300,
      });
    }
  }, [user]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success(isHindi ? 'कोड कॉपी हो गया!' : 'Code copied!');
  };

  const shareReferral = async () => {
    const shareText = isHindi 
      ? `NIGAM-Park पर मेरे रेफरल कोड ${referralCode} का उपयोग करें और 100 पॉइंट्स पाएं!`
      : `Use my referral code ${referralCode} on NIGAM-Park and get 100 bonus points!`;
    
    const shareUrl = `https://nigam-park.vercel.app/auth?ref=${referralCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'NIGAM-Park Referral',
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast.success(isHindi ? 'शेयर लिंक कॉपी हो गया!' : 'Share link copied!');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <GovHeader />
        <main className="container py-8 flex-1 flex items-center justify-center">
          <Card className="max-w-md text-center">
            <CardContent className="pt-8">
              <Gift className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">
                {isHindi ? 'रेफरल प्रोग्राम में शामिल हों' : 'Join Referral Program'}
              </h2>
              <p className="text-muted-foreground mb-4">
                {isHindi 
                  ? 'दोस्तों को आमंत्रित करें और पॉइंट्स कमाएं'
                  : 'Invite friends and earn bonus points'}
              </p>
              <Button onClick={() => navigate('/auth')}>
                {isHindi ? 'लॉगिन करें' : 'Login to Continue'}
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title={isHindi ? 'रेफरल प्रोग्राम' : 'Referral Program'}
        description="Invite friends to NIGAM-Park and earn bonus points. Get 100 points for each successful referral. Redeem points for free parking."
        keywords="referral program, invite friends, earn points, free parking Delhi, NIGAM-Park referral"
        canonicalUrl="https://nigam-park.vercel.app/referral"
      />
      
      <GovHeader />
      
      <main className="container py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-2">
              <Gift className="h-3 w-3 mr-1" />
              {isHindi ? 'बोनस पॉइंट्स' : 'Bonus Points'}
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              {isHindi ? 'रेफरल प्रोग्राम' : 'Referral Program'}
            </h1>
            <p className="text-lg text-muted-foreground">
              {isHindi 
                ? 'दोस्तों को आमंत्रित करें, दोनों को 100 पॉइंट्स मिलेंगे!'
                : 'Invite friends, both of you get 100 points!'}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">{referralStats.totalReferrals}</div>
                <div className="text-sm text-muted-foreground">
                  {isHindi ? 'कुल रेफरल' : 'Total Referrals'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{referralStats.successfulReferrals}</div>
                <div className="text-sm text-muted-foreground">
                  {isHindi ? 'सफल' : 'Successful'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Gift className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{referralStats.pendingReferrals}</div>
                <div className="text-sm text-muted-foreground">
                  {isHindi ? 'लंबित' : 'Pending'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Award className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">{referralStats.pointsEarned}</div>
                <div className="text-sm text-muted-foreground">
                  {isHindi ? 'अर्जित पॉइंट्स' : 'Points Earned'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Referral Code Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {isHindi ? 'आपका रेफरल कोड' : 'Your Referral Code'}
              </CardTitle>
              <CardDescription>
                {isHindi 
                  ? 'यह कोड अपने दोस्तों के साथ साझा करें'
                  : 'Share this code with your friends'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={referralCode}
                  readOnly
                  className="text-center text-xl font-mono font-bold"
                />
                <Button variant="outline" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button onClick={shareReferral}>
                  <Share2 className="h-4 w-4 mr-2" />
                  {isHindi ? 'शेयर करें' : 'Share'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card>
            <CardHeader>
              <CardTitle>{isHindi ? 'कैसे काम करता है' : 'How It Works'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-primary">1</span>
                  </div>
                  <h4 className="font-medium mb-1">
                    {isHindi ? 'कोड शेयर करें' : 'Share Code'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {isHindi 
                      ? 'अपना रेफरल कोड दोस्तों को भेजें'
                      : 'Send your referral code to friends'}
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-primary">2</span>
                  </div>
                  <h4 className="font-medium mb-1">
                    {isHindi ? 'दोस्त साइन अप करे' : 'Friend Signs Up'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {isHindi 
                      ? 'दोस्त आपके कोड से रजिस्टर करे'
                      : 'Friend registers with your code'}
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-primary">3</span>
                  </div>
                  <h4 className="font-medium mb-1">
                    {isHindi ? 'पॉइंट्स पाएं' : 'Earn Points'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {isHindi 
                      ? 'दोनों को 100 पॉइंट्स मिलते हैं'
                      : 'Both of you get 100 points'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
