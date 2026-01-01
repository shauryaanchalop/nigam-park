import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Zap, Target, Gift, Medal, Crown, Flame, Award, TrendingUp, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface Achievement {
  id: string;
  name: string;
  nameHi: string;
  description: string;
  descriptionHi: string;
  icon: React.ReactNode;
  progress: number;
  maxProgress: number;
  reward: number;
  unlocked: boolean;
}

interface Challenge {
  id: string;
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  points: number;
  deadline: string;
  progress: number;
  type: 'daily' | 'weekly' | 'special';
}

const achievements: Achievement[] = [
  { 
    id: 'first_park', 
    name: 'First Timer', 
    nameHi: 'पहला पार्क', 
    description: 'Complete your first parking', 
    descriptionHi: 'अपनी पहली पार्किंग पूरी करें',
    icon: <Star className="w-5 h-5" />, 
    progress: 1, 
    maxProgress: 1, 
    reward: 50,
    unlocked: true 
  },
  { 
    id: 'early_bird', 
    name: 'Early Bird', 
    nameHi: 'जल्दी उठने वाला', 
    description: 'Park before 7 AM 5 times', 
    descriptionHi: '5 बार सुबह 7 बजे से पहले पार्क करें',
    icon: <Zap className="w-5 h-5" />, 
    progress: 3, 
    maxProgress: 5, 
    reward: 100,
    unlocked: false 
  },
  { 
    id: 'loyal', 
    name: 'Loyal Parker', 
    nameHi: 'वफादार पार्कर', 
    description: 'Park 20 times in a month', 
    descriptionHi: 'एक महीने में 20 बार पार्क करें',
    icon: <Medal className="w-5 h-5" />, 
    progress: 15, 
    maxProgress: 20, 
    reward: 200,
    unlocked: false 
  },
  { 
    id: 'eco_warrior', 
    name: 'Eco Warrior', 
    nameHi: 'इको योद्धा', 
    description: 'Use EV charging 10 times', 
    descriptionHi: 'EV चार्जिंग 10 बार उपयोग करें',
    icon: <Flame className="w-5 h-5" />, 
    progress: 4, 
    maxProgress: 10, 
    reward: 300,
    unlocked: false 
  },
];

const challenges: Challenge[] = [
  { 
    id: 'daily1', 
    title: 'Quick Parker', 
    titleHi: 'तेज़ पार्कर', 
    description: 'Complete a parking session under 2 hours', 
    descriptionHi: '2 घंटे से कम में पार्किंग सेशन पूरा करें',
    points: 25, 
    deadline: 'Today', 
    progress: 0,
    type: 'daily' 
  },
  { 
    id: 'weekly1', 
    title: 'Multi-Lot Explorer', 
    titleHi: 'मल्टी-लॉट एक्सप्लोरर', 
    description: 'Park at 3 different locations', 
    descriptionHi: '3 अलग-अलग स्थानों पर पार्क करें',
    points: 75, 
    deadline: '5 days left', 
    progress: 1,
    type: 'weekly' 
  },
  { 
    id: 'special1', 
    title: 'New Year Bonus', 
    titleHi: 'नए साल का बोनस', 
    description: 'Park 5 times in January', 
    descriptionHi: 'जनवरी में 5 बार पार्क करें',
    points: 200, 
    deadline: '30 days', 
    progress: 2,
    type: 'special' 
  },
];

export function ParkingGamification() {
  const { isHindi } = useLanguage();
  const [userPoints, setUserPoints] = useState(1250);
  const [currentLevel, setCurrentLevel] = useState(3);
  const [levelProgress, setLevelProgress] = useState(65);

  const getLevelName = (level: number) => {
    const levels = isHindi 
      ? ['नौसिखिया', 'ब्रॉन्ज़', 'सिल्वर', 'गोल्ड', 'प्लैटिनम', 'डायमंड']
      : ['Rookie', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    return levels[Math.min(level - 1, levels.length - 1)];
  };

  const getTypeColor = (type: Challenge['type']) => {
    switch (type) {
      case 'daily': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'weekly': return 'bg-purple-500/10 text-purple-500 border-purple-500/30';
      case 'special': return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
    }
  };

  const claimReward = (achievement: Achievement) => {
    if (achievement.unlocked) {
      setUserPoints(prev => prev + achievement.reward);
      toast.success(isHindi ? `${achievement.reward} पॉइंट्स मिले!` : `Claimed ${achievement.reward} points!`);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          {isHindi ? 'पार्किंग गेम्स' : 'Parking Gamification'}
        </CardTitle>
        <CardDescription>
          {isHindi 
            ? 'पार्क करें, अंक अर्जित करें और पुरस्कार जीतें!'
            : 'Park, earn points, and win rewards!'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        {/* User Stats */}
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-lg">{getLevelName(currentLevel)}</span>
              <Badge variant="outline" className="text-xs">
                {isHindi ? 'स्तर' : 'Level'} {currentLevel}
              </Badge>
            </div>
            <Progress value={levelProgress} className="h-2 mb-1" />
            <p className="text-xs text-muted-foreground">
              {isHindi ? 'अगले स्तर तक' : 'To next level'}: {100 - levelProgress}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{userPoints.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{isHindi ? 'पॉइंट्स' : 'Points'}</p>
          </div>
        </div>

        {/* Active Challenges */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              {isHindi ? 'सक्रिय चुनौतियां' : 'Active Challenges'}
            </h3>
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              {isHindi ? 'सभी देखें' : 'View All'}
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
          <div className="space-y-2">
            {challenges.map((challenge) => (
              <div key={challenge.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor(challenge.type)}`}>
                  <Zap className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{isHindi ? challenge.titleHi : challenge.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{isHindi ? challenge.descriptionHi : challenge.description}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="mb-1">+{challenge.points}</Badge>
                  <p className="text-[10px] text-muted-foreground">{challenge.deadline}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              {isHindi ? 'उपलब्धियां' : 'Achievements'}
            </h3>
            <span className="text-xs text-muted-foreground">
              {achievements.filter(a => a.unlocked).length}/{achievements.length} {isHindi ? 'अनलॉक' : 'Unlocked'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {achievements.map((achievement) => (
              <div 
                key={achievement.id} 
                className={`p-3 rounded-lg border transition-all ${
                  achievement.unlocked 
                    ? 'bg-success/10 border-success/30' 
                    : 'bg-muted/30 border-border'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    achievement.unlocked ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                  }`}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs truncate">{isHindi ? achievement.nameHi : achievement.name}</p>
                    <p className="text-[10px] text-muted-foreground">+{achievement.reward} pts</p>
                  </div>
                </div>
                <Progress value={(achievement.progress / achievement.maxProgress) * 100} className="h-1.5" />
                <p className="text-[10px] text-muted-foreground mt-1">
                  {achievement.progress}/{achievement.maxProgress}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-success mx-auto mb-1" />
            <p className="text-lg font-bold">42</p>
            <p className="text-[10px] text-muted-foreground">{isHindi ? 'कुल पार्किंग' : 'Total Parks'}</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <Flame className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold">7</p>
            <p className="text-[10px] text-muted-foreground">{isHindi ? 'दैनिक स्ट्रीक' : 'Day Streak'}</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <Gift className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold">₹450</p>
            <p className="text-[10px] text-muted-foreground">{isHindi ? 'बचत' : 'Saved'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
