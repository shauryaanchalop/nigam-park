import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Zap, IndianRupee, BarChart3 } from 'lucide-react';
import { useSurgeRevenueImpact } from '@/hooks/useSurgeRevenueImpact';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';

export function SurgeRevenueWidget() {
  const { data, isLoading } = useSurgeRevenueImpact(30);

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <div className="p-2 rounded-lg bg-warning/10">
              <Zap className="w-5 h-5 text-warning" />
            </div>
            Surge Pricing Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data?.dailyData.slice(-14).map(d => ({
    ...d,
    date: format(parseISO(d.date), 'MMM dd'),
  })) || [];

  return (
    <Card className="border-border/50 hover:border-primary/20 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <div className="p-2 rounded-lg bg-warning/10">
              <Zap className="w-5 h-5 text-warning" />
            </div>
            Surge Pricing Impact
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            Last 30 days
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <IndianRupee className="w-3 h-3" />
              Total Revenue
            </div>
            <div className="text-lg font-bold">
              ₹{(data?.totals.actualRevenue || 0).toLocaleString('en-IN')}
            </div>
          </div>
          
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <BarChart3 className="w-3 h-3" />
              Base Revenue
            </div>
            <div className="text-lg font-bold">
              ₹{(data?.totals.baseRevenue || 0).toLocaleString('en-IN')}
            </div>
          </div>
          
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
            <div className="flex items-center gap-2 text-warning text-xs mb-1">
              <Zap className="w-3 h-3" />
              Surge Revenue
            </div>
            <div className="text-lg font-bold text-warning">
              +₹{(data?.totals.surgeRevenue || 0).toLocaleString('en-IN')}
            </div>
          </div>
          
          <div className="p-3 rounded-lg bg-success/10 border border-success/20">
            <div className="flex items-center gap-2 text-success text-xs mb-1">
              <TrendingUp className="w-3 h-3" />
              Surge Uplift
            </div>
            <div className="text-lg font-bold text-success">
              +{data?.surgePercentage}%
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="baseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="surgeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10 }} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, '']}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="baseRevenue"
                name="Base Revenue"
                stroke="hsl(var(--primary))"
                fill="url(#baseGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="surgeRevenue"
                name="Surge Revenue"
                stroke="hsl(var(--warning))"
                fill="url(#surgeGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>Avg Multiplier: {data?.avgSurgeMultiplier}x</span>
          <span>{data?.activeSurgeRules} active surge rules</span>
        </div>
      </CardContent>
    </Card>
  );
}
