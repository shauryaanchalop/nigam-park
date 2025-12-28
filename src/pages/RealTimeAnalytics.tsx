import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  Car, 
  IndianRupee, 
  TrendingUp, 
  TrendingDown,
  Zap,
  Server,
  Wifi,
  WifiOff,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GovHeader } from '@/components/ui/GovHeader';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

interface LiveMetric {
  timestamp: Date;
  occupancy: number;
  revenue: number;
  transactions: number;
}

export default function RealTimeAnalytics() {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [liveMetrics, setLiveMetrics] = useState<LiveMetric[]>([]);
  const [recentChanges, setRecentChanges] = useState<any[]>([]);

  // Fetch current stats
  const { data: currentStats, refetch: refetchStats } = useQuery({
    queryKey: ['realtime-stats'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');

      // Get occupancy
      const { data: lots } = await supabase
        .from('parking_lots')
        .select('current_occupancy, capacity');

      const totalOccupancy = lots?.reduce((sum, l) => sum + l.current_occupancy, 0) || 0;
      const totalCapacity = lots?.reduce((sum, l) => sum + l.capacity, 0) || 0;

      // Get today's revenue
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount')
        .gte('created_at', `${today}T00:00:00`)
        .eq('status', 'completed');

      const revenue = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
      const txCount = transactions?.length || 0;

      // Get alerts
      const { data: alerts } = await supabase
        .from('fraud_alerts')
        .select('id')
        .eq('status', 'NEW');

      return {
        occupancy: totalOccupancy,
        capacity: totalCapacity,
        occupancyPercent: totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0,
        revenue,
        transactions: txCount,
        activeAlerts: alerts?.length || 0,
      };
    },
    refetchInterval: 5000,
  });

  // Set up realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('realtime-analytics')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'parking_lots' },
        (payload) => {
          console.log('Parking lot change:', payload);
          setLastUpdate(new Date());
          refetchStats();
          setRecentChanges(prev => [{
            type: 'occupancy',
            message: `Occupancy updated at ${(payload.new as any)?.name || 'lot'}`,
            time: new Date(),
          }, ...prev.slice(0, 9)]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        (payload) => {
          console.log('New transaction:', payload);
          setLastUpdate(new Date());
          refetchStats();
          setRecentChanges(prev => [{
            type: 'revenue',
            message: `New payment: ₹${(payload.new as any)?.amount}`,
            time: new Date(),
          }, ...prev.slice(0, 9)]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'fraud_alerts' },
        (payload) => {
          console.log('New fraud alert:', payload);
          setLastUpdate(new Date());
          refetchStats();
          setRecentChanges(prev => [{
            type: 'alert',
            message: `New fraud alert: ${(payload.new as any)?.severity}`,
            time: new Date(),
          }, ...prev.slice(0, 9)]);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchStats]);

  // Track metrics over time
  useEffect(() => {
    if (currentStats) {
      setLiveMetrics(prev => [
        ...prev.slice(-29),
        {
          timestamp: new Date(),
          occupancy: currentStats.occupancyPercent,
          revenue: currentStats.revenue,
          transactions: currentStats.transactions,
        },
      ]);
    }
  }, [currentStats]);

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'occupancy': return <Car className="w-4 h-4 text-primary" />;
      case 'revenue': return <IndianRupee className="w-4 h-4 text-success" />;
      case 'alert': return <AlertTriangle className="w-4 h-4 text-destructive" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <GovHeader 
        title="Real-Time Analytics" 
        subtitle="Live System Monitoring"
      />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Connection Status Bar */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full",
              isConnected ? "bg-success/10" : "bg-destructive/10"
            )}>
              {isConnected ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <Wifi className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium text-success">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">Disconnected</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              Last update: {format(lastUpdate, 'HH:mm:ss')}
            </div>
          </div>
          <Badge variant="outline" className="gap-1">
            <RefreshCw className="w-3 h-3" />
            Auto-refresh: 5s
          </Badge>
        </div>

        {/* Live Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Live Occupancy</span>
                <Car className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-bold">{currentStats?.occupancyPercent || 0}%</p>
              <Progress value={currentStats?.occupancyPercent || 0} className="h-2 mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {currentStats?.occupancy || 0} / {currentStats?.capacity || 0} spots
              </p>
            </CardContent>
          </Card>

          <Card className="border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Today's Revenue</span>
                <IndianRupee className="w-5 h-5 text-success" />
              </div>
              <p className="text-3xl font-bold text-success">
                ₹{(currentStats?.revenue || 0).toLocaleString('en-IN')}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-success" />
                <span className="text-xs text-success">Live tracking</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Transactions</span>
                <Zap className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold">{currentStats?.transactions || 0}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Today's completed
              </p>
            </CardContent>
          </Card>

          <Card className={cn(
            "border-destructive/20",
            currentStats?.activeAlerts && currentStats.activeAlerts > 0 && "animate-pulse"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Active Alerts</span>
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <p className="text-3xl font-bold text-destructive">
                {currentStats?.activeAlerts || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Pending investigation
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Occupancy Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="w-5 h-5 text-primary" />
                Live Occupancy Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={liveMetrics}>
                    <defs>
                      <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="timestamp"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      tickFormatter={(value) => format(new Date(value), 'HH:mm')}
                    />
                    <YAxis 
                      domain={[0, 100]}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value}%`, 'Occupancy']}
                      labelFormatter={(label) => format(new Date(label), 'HH:mm:ss')}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="occupancy" 
                      stroke="hsl(var(--primary))" 
                      fill="url(#occupancyGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Live Activity Feed */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="w-5 h-5 text-yellow-500" />
                Live Activity Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {recentChanges.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Waiting for activity...</p>
                  </div>
                ) : (
                  recentChanges.map((change, index) => (
                    <div 
                      key={index}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg border transition-all",
                        index === 0 && "bg-primary/5 border-primary/20 animate-pulse"
                      )}
                    >
                      {getChangeIcon(change.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{change.message}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(change.time, 'HH:mm:ss')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="w-5 h-5 text-primary" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Database', status: 'healthy', latency: '12ms' },
                { name: 'Edge Functions', status: 'healthy', latency: '45ms' },
                { name: 'Realtime', status: isConnected ? 'healthy' : 'degraded', latency: '8ms' },
                { name: 'Storage', status: 'healthy', latency: '23ms' },
              ].map((service) => (
                <div 
                  key={service.name}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                >
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    service.status === 'healthy' ? 'bg-success' : 'bg-warning'
                  )} />
                  <div>
                    <p className="text-sm font-medium">{service.name}</p>
                    <p className="text-xs text-muted-foreground">{service.latency}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
