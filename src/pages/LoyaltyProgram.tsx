import React from 'react';
import { Award, Crown, Gem, Star, TrendingUp, ChevronLeft, Gift } from 'lucide-react';
import { GovHeader } from '@/components/ui/GovHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StatCard } from '@/components/ui/StatCard';
import { useLoyaltyTiers, useMyLoyaltyAccount, useMyLoyaltyTransactions } from '@/hooks/useLoyalty';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const tierIcons: Record<string, React.ReactNode> = {
  award: <Award className="w-6 h-6" />,
  crown: <Crown className="w-6 h-6" />,
  gem: <Gem className="w-6 h-6" />,
  star: <Star className="w-6 h-6" />,
};

const tierColors: Record<string, string> = {
  amber: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  slate: 'bg-slate-400/10 text-slate-500 border-slate-400/30',
  yellow: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  purple: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
};

export default function LoyaltyProgram() {
  const { data: tiers, isLoading: tiersLoading } = useLoyaltyTiers();
  const { data: account, isLoading: accountLoading } = useMyLoyaltyAccount();
  const { data: transactions, isLoading: txLoading } = useMyLoyaltyTransactions();

  const isLoading = tiersLoading || accountLoading;

  const currentTier = account?.loyalty_tiers;
  const nextTier = tiers?.find(t => t.min_points > (account?.lifetime_points || 0));
  const progressToNext = nextTier 
    ? ((account?.lifetime_points || 0) / nextTier.min_points) * 100 
    : 100;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <GovHeader title="Loyalty Program" subtitle="Loading..." />
        <main className="container mx-auto px-4 py-6">
          <Skeleton className="h-96" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GovHeader 
        title="Loyalty Program" 
        subtitle="Earn points and unlock rewards"
      />

      <main className="container mx-auto px-4 py-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/citizen">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Portal
          </Link>
        </Button>

        {/* Current Status */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Your Loyalty Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {account ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center border-2",
                      tierColors[currentTier?.color || 'amber']
                    )}>
                      {tierIcons[currentTier?.icon || 'award']}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{currentTier?.name || 'Bronze'}</h3>
                      <p className="text-muted-foreground">
                        {currentTier?.discount_percentage || 0}% discount on all parking
                      </p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Available Points</p>
                      <p className="text-3xl font-bold">{account.total_points.toLocaleString()}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Lifetime Points</p>
                      <p className="text-3xl font-bold">{account.lifetime_points.toLocaleString()}</p>
                    </div>
                  </div>

                  {nextTier && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress to {nextTier.name}</span>
                        <span>{account.lifetime_points} / {nextTier.min_points}</span>
                      </div>
                      <Progress value={progressToNext} className="h-3" />
                      <p className="text-sm text-muted-foreground">
                        {nextTier.min_points - account.lifetime_points} more points to unlock {nextTier.discount_percentage}% discount
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Start Earning Rewards</h3>
                  <p className="text-muted-foreground mb-4">
                    Make your first parking reservation to join the loyalty program
                  </p>
                  <Button asChild>
                    <Link to="/citizen">Book Parking</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How to Earn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium">Park & Pay</p>
                  <p className="text-sm text-muted-foreground">Earn 1 point per ₹10 spent</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium">Reserve Ahead</p>
                  <p className="text-sm text-muted-foreground">+5 bonus points per reservation</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold">3</span>
                </div>
                <div>
                  <p className="font-medium">Check-in on Time</p>
                  <p className="text-sm text-muted-foreground">+10 bonus for punctuality</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tiers */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Membership Tiers</CardTitle>
            <CardDescription>Unlock more rewards as you progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {tiers?.map((tier) => (
                <div
                  key={tier.id}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all",
                    currentTier?.id === tier.id 
                      ? "ring-2 ring-primary ring-offset-2" 
                      : "",
                    tierColors[tier.color || 'amber']
                  )}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {tierIcons[tier.icon || 'award']}
                    <h4 className="font-semibold">{tier.name}</h4>
                  </div>
                  <p className="text-2xl font-bold mb-1">{tier.discount_percentage}%</p>
                  <p className="text-sm opacity-80">discount on parking</p>
                  <p className="text-xs mt-2 opacity-60">
                    {tier.min_points.toLocaleString()} points required
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        {transactions && transactions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.slice(0, 10).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(tx.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge variant={tx.points > 0 ? 'default' : 'secondary'}>
                      {tx.points > 0 ? '+' : ''}{tx.points} pts
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}