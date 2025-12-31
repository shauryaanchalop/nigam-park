import React from 'react';
import { Leaf, Zap, Users, TrendingUp, Car, TreePine, Wind, Droplets, Award, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';

interface SustainabilityStats {
  co2Saved: number;
  treesEquivalent: number;
  evCharges: number;
  evKwhUsed: number;
  carpoolTrips: number;
  sharedRides: number;
  fuelSaved: number;
  monthlyGoal: number;
  currentProgress: number;
}

const mockStats: SustainabilityStats = {
  co2Saved: 127.5,
  treesEquivalent: 6,
  evCharges: 23,
  evKwhUsed: 345,
  carpoolTrips: 12,
  sharedRides: 8,
  fuelSaved: 45,
  monthlyGoal: 200,
  currentProgress: 127.5,
};

const monthlyData = [
  { month: 'Jan', co2: 85 },
  { month: 'Feb', co2: 92 },
  { month: 'Mar', co2: 110 },
  { month: 'Apr', co2: 105 },
  { month: 'May', co2: 127 },
];

export function SustainabilityDashboard() {
  const { isHindi } = useLanguage();
  const goalProgress = (mockStats.currentProgress / mockStats.monthlyGoal) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-success" />
          {isHindi ? 'सस्टेनेबिलिटी डैशबोर्ड' : 'Sustainability Dashboard'}
        </CardTitle>
        <CardDescription>
          {isHindi 
            ? 'आपका पर्यावरण प्रभाव और हरित योगदान'
            : 'Your environmental impact and green contribution'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Feature Description */}
        <div className="p-3 rounded-lg bg-success/5 border border-success/20 mb-4">
          <p className="text-xs text-muted-foreground">
            {isHindi 
              ? '🌱 कारपूलिंग और ईवी चार्जिंग के माध्यम से आपने कितना कार्बन फुटप्रिंट बचाया है, यहां देखें। हर छोटा कदम मायने रखता है!'
              : '🌱 Track your carbon footprint savings from carpooling and EV charging. Every small step counts!'}
          </p>
        </div>

        {/* Monthly Goal */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-success/10 to-primary/10 border border-success/20 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-success" />
              <span className="font-medium">{isHindi ? 'मासिक लक्ष्य' : 'Monthly Goal'}</span>
            </div>
            <Badge className="bg-success">{Math.round(goalProgress)}%</Badge>
          </div>
          <Progress value={goalProgress} className="h-3 mb-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{mockStats.currentProgress} kg CO₂ {isHindi ? 'बचाया' : 'saved'}</span>
            <span>{isHindi ? 'लक्ष्य' : 'Goal'}: {mockStats.monthlyGoal} kg</span>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-4 rounded-lg bg-success/10 border border-success/20">
            <div className="flex items-center gap-2 mb-2">
              <Wind className="w-5 h-5 text-success" />
              <span className="text-sm font-medium">CO₂ {isHindi ? 'बचत' : 'Saved'}</span>
            </div>
            <div className="text-2xl font-bold text-success">{mockStats.co2Saved} kg</div>
            <div className="text-xs text-muted-foreground mt-1">
              {isHindi ? 'इस महीने' : 'This month'}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <TreePine className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">{isHindi ? 'पेड़ समतुल्य' : 'Trees Equivalent'}</span>
            </div>
            <div className="text-2xl font-bold text-primary">{mockStats.treesEquivalent}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {isHindi ? 'सालाना बचत' : 'Yearly savings'}
            </div>
          </div>
        </div>

        {/* EV & Carpool Stats */}
        <div className="space-y-3 mb-4">
          <div className="p-3 rounded-lg border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Zap className="w-5 h-5 text-warning" />
              </div>
              <div>
                <div className="font-medium text-sm">{isHindi ? 'ईवी चार्जिंग' : 'EV Charging'}</div>
                <div className="text-xs text-muted-foreground">
                  {mockStats.evCharges} {isHindi ? 'सत्र' : 'sessions'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold">{mockStats.evKwhUsed} kWh</div>
              <div className="text-xs text-success">~{Math.round(mockStats.evKwhUsed * 0.4)} kg CO₂ {isHindi ? 'बचाया' : 'saved'}</div>
            </div>
          </div>

          <div className="p-3 rounded-lg border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="font-medium text-sm">{isHindi ? 'कारपूलिंग' : 'Carpooling'}</div>
                <div className="text-xs text-muted-foreground">
                  {mockStats.carpoolTrips} {isHindi ? 'यात्राएं' : 'trips'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold">{mockStats.sharedRides} {isHindi ? 'सवारियां' : 'rides'}</div>
              <div className="text-xs text-success">{mockStats.fuelSaved}L {isHindi ? 'ईंधन बचाया' : 'fuel saved'}</div>
            </div>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="mb-4">
          <div className="text-sm font-medium mb-3">{isHindi ? 'मासिक प्रवृत्ति' : 'Monthly Trend'}</div>
          <div className="flex items-end justify-between gap-2 h-24">
            {monthlyData.map((data, index) => (
              <div key={data.month} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full rounded-t transition-all bg-success/80 hover:bg-success"
                  style={{ height: `${(data.co2 / 150) * 100}%` }}
                />
                <span className="text-xs text-muted-foreground mt-1">{data.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Achievement Badges */}
        <div className="space-y-2">
          <div className="text-sm font-medium">{isHindi ? 'उपलब्धियां' : 'Achievements'}</div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1 py-1">
              <Award className="w-3 h-3 text-warning" />
              {isHindi ? 'ईवी चैंपियन' : 'EV Champion'}
            </Badge>
            <Badge variant="outline" className="gap-1 py-1">
              <Users className="w-3 h-3 text-blue-500" />
              {isHindi ? 'कारपूल किंग' : 'Carpool King'}
            </Badge>
            <Badge variant="outline" className="gap-1 py-1">
              <Leaf className="w-3 h-3 text-success" />
              {isHindi ? 'हरित योद्धा' : 'Green Warrior'}
            </Badge>
          </div>
        </div>

        {/* Impact Summary */}
        <div className="mt-4 p-3 rounded-lg bg-muted/50 text-center">
          <p className="text-sm text-muted-foreground">
            {isHindi 
              ? '🎉 आपने इस साल ' 
              : '🎉 You\'ve saved the equivalent of '}
            <span className="font-bold text-foreground">
              {isHindi ? `${mockStats.treesEquivalent} पेड़ों के बराबर CO₂ बचाई!` : `${mockStats.treesEquivalent} trees this year!`}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
