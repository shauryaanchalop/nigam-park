import React, { useState } from 'react';
import { Target, TrendingUp, Calendar, DollarSign, ChevronRight, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRevenueTargets } from '@/hooks/useRevenueTargets';
import { format, startOfWeek, startOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export function RevenueTargetWidget() {
  const { progress, trend, isLoading, setTarget } = useRevenueTargets();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [targetType, setTargetType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [targetAmount, setTargetAmount] = useState('');

  const handleSetTarget = async () => {
    if (!targetAmount) return;

    let date = format(new Date(), 'yyyy-MM-dd');
    if (targetType === 'weekly') {
      date = format(startOfWeek(new Date()), 'yyyy-MM-dd');
    } else if (targetType === 'monthly') {
      date = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    }

    await setTarget.mutateAsync({
      targetType,
      amount: parseFloat(targetAmount),
      date,
    });
    setSettingsOpen(false);
    setTargetAmount('');
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-success';
    if (percentage >= 75) return 'bg-primary';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-destructive';
  };

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Revenue Targets
        </CardTitle>
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-1" />
              Set Targets
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Revenue Target</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Target Period</Label>
                <Select value={targetType} onValueChange={(v) => setTargetType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target Amount (₹)</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleSetTarget} 
                className="w-full"
                disabled={!targetAmount || setTarget.isPending}
              >
                {setTarget.isPending ? 'Saving...' : 'Save Target'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Daily */}
          <div className="space-y-2 p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Today</span>
              <Badge 
                variant="outline"
                className={cn(
                  progress?.daily.percentage >= 100 && 'bg-success text-success-foreground border-success'
                )}
              >
                {progress?.daily.percentage.toFixed(0) || 0}%
              </Badge>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">
                ₹{(progress?.daily.actual || 0).toLocaleString('en-IN')}
              </span>
              <span className="text-sm text-muted-foreground">
                / ₹{(progress?.daily.target || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <Progress 
              value={progress?.daily.percentage || 0} 
              className={cn("h-2", getProgressColor(progress?.daily.percentage || 0))}
            />
          </div>

          {/* Weekly */}
          <div className="space-y-2 p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">This Week</span>
              <Badge 
                variant="outline"
                className={cn(
                  progress?.weekly.percentage >= 100 && 'bg-success text-success-foreground border-success'
                )}
              >
                {progress?.weekly.percentage.toFixed(0) || 0}%
              </Badge>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">
                ₹{(progress?.weekly.actual || 0).toLocaleString('en-IN')}
              </span>
              <span className="text-sm text-muted-foreground">
                / ₹{(progress?.weekly.target || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <Progress 
              value={progress?.weekly.percentage || 0} 
              className={cn("h-2", getProgressColor(progress?.weekly.percentage || 0))}
            />
          </div>

          {/* Monthly */}
          <div className="space-y-2 p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">This Month</span>
              <Badge 
                variant="outline"
                className={cn(
                  progress?.monthly.percentage >= 100 && 'bg-success text-success-foreground border-success'
                )}
              >
                {progress?.monthly.percentage.toFixed(0) || 0}%
              </Badge>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">
                ₹{(progress?.monthly.actual || 0).toLocaleString('en-IN')}
              </span>
              <span className="text-sm text-muted-foreground">
                / ₹{(progress?.monthly.target || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <Progress 
              value={progress?.monthly.percentage || 0} 
              className={cn("h-2", getProgressColor(progress?.monthly.percentage || 0))}
            />
          </div>
        </div>

        {/* Revenue Trend Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                tickFormatter={(value) => format(new Date(value), 'dd')}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                width={50}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                labelFormatter={(label) => format(new Date(label), 'dd MMM yyyy')}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="hsl(var(--primary))" 
                fillOpacity={1}
                fill="url(#colorRevenue)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
