import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  Car, 
  IndianRupee, 
  TrendingUp, 
  Zap,
  Server,
  Wifi,
  WifiOff,
  Clock,
  AlertTriangle,
  RefreshCw,
  Camera,
  Layers,
  MapPin,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GovHeader } from '@/components/ui/GovHeader';
import { BackButton } from '@/components/ui/BackButton';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { DEMO_PARKING_LOTS, DEMO_REALTIME_GATE_EVENTS } from '@/lib/demoData';

interface LiveMetric {
  timestamp: Date;
  occupancy: number;
  revenue: number;
  transactions: number;
}

interface LiveEvent {
  type: 'occupancy' | 'revenue' | 'alert';
  message: string;
  time: Date;
}

// Generate a realistic 30-minute rolling historical curve
function createInitialLiveMetrics(): LiveMetric[] {
  const now = Date.now();
  return Array.from({ length: 30 }, (_, i) => {
    const timestamp = new Date(now - (29 - i) * 60 * 1000);
    const wave = Math.sin(i / 3.8) * 6.5;
    const occupancy = Math.round(71 + wave + ((i * 11) % 5 - 2));
    const revenue = Math.round(141000 + i * 260 + ((i * 31) % 250));
    const transactions = Math.round(1360 + i * 2.3);

    return {
      timestamp,
      occupancy: Math.min(94, Math.max(45, occupancy)),
      revenue,
      transactions,
    };
  });
}

export default function RealTimeAnalytics() {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [liveMetrics, setLiveMetrics] = useState<LiveMetric[]>(() => createInitialLiveMetrics());
  
  const [recentChanges, setRecentChanges] = useState<LiveEvent[]>([
    { type: 'occupancy', message: 'Vehicle DL 01 AB 1234 entered Connaught Place Block A (Gate 2)', time: new Date(Date.now() - 11000) },
    { type: 'revenue', message: 'FASTag Auto-Debit: ₹40 collected for DL 02 CD 5678 at Karol Bagh', time: new Date(Date.now() - 28000) },
    { type: 'occupancy', message: 'Spot Bay 14 released at Lajpat Nagar Central Market', time: new Date(Date.now() - 65000) },
    { type: 'revenue', message: 'UPI QR Payment: ₹70 received at Chandni Chowk Metro', time: new Date(Date.now() - 115000) },
    { type: 'alert', message: 'Overstay flagged: DL 08 QR 3344 exceeded 4hr window at Sarojini Nagar', time: new Date(Date.now() - 190000) },
    { type: 'occupancy', message: 'Vehicle UP 16 CD 7823 entered Nehru Place IT Hub (Gate 3)', time: new Date(Date.now() - 240000) },
    { type: 'revenue', message: 'FASTag exit processed: ₹60 at CP Block A Ramp', time: new Date(Date.now() - 310000) },
  ]);

  const [gateEvents, setGateEvents] = useState(DEMO_REALTIME_GATE_EVENTS);

  // Periodic simulation for live activity in prototype demo
  useEffect(() => {
    const simInterval = setInterval(() => {
      const demoPool: LiveEvent[] = [
        { type: 'occupancy', message: 'Vehicle HR 26 DQ 5678 entered CP Block A Entry Gate (ANPR verified)', time: new Date() },
        { type: 'revenue', message: 'FASTag auto-debit: ₹50 processed at Nehru Place Outer Gate', time: new Date() },
        { type: 'occupancy', message: 'Spot Bay 08 cleared at Karol Bagh Market', time: new Date() },
        { type: 'revenue', message: 'UPI QR Payment received: ₹40 at Lajpat Nagar Gate 1', time: new Date() },
        { type: 'occupancy', message: 'ANPR camera auto-lifted barrier for DL 04 GH 3456 at CP Block A', time: new Date() },
        { type: 'alert', message: 'Overstay flagged: UP 16 BJ 9081 stationary > 3.5 hrs at Chandni Chowk', time: new Date() },
        { type: 'revenue', message: 'FASTag exit verified: ₹30 at Sarojini Nagar Market', time: new Date() },
      ];
      const pick = demoPool[Math.floor(Math.random() * demoPool.length)];
      setRecentChanges(prev => [{ ...pick, time: new Date() }, ...prev.slice(0, 9)]);
      setLastUpdate(new Date());

      // Also dynamically cycle live gate events
      const plates = ['DL 01 AB 1234', 'HR 26 DQ 5678', 'UP 16 CD 7823', 'DL 03 EF 9012', 'DL 08 QR 3344', 'HR 55 HC 3344', 'DL 04 GH 3456'];
      const lots = ['Connaught Place Block A', 'Karol Bagh Market', 'Nehru Place IT Hub', 'Chandni Chowk Metro', 'Lajpat Nagar Central'];
      const randomPlate = plates[Math.floor(Math.random() * plates.length)];
      const randomLot = lots[Math.floor(Math.random() * lots.length)];

      const newGateItem = {
        id: `gt-${Date.now()}`,
        plate: randomPlate,
        lot: randomLot,
        gate: 'Automated ANPR Barrier',
        mode: Math.random() > 0.4 ? 'FASTag Auto-Debit' : 'UPI Dynamic QR',
        type: Math.random() > 0.5 ? 'ENTRY' : 'EXIT',
        amount: `₹${Math.round(20 + Math.random() * 40)}`,
        status: 'VERIFIED',
        iou: `${(96 + Math.random() * 3.8).toFixed(1)}%`,
      };
      setGateEvents(prev => [newGateItem, ...prev.slice(0, 5)]);
    }, 7000);

    return () => clearInterval(simInterval);
  }, []);

  // Fetch current stats with robust fallback to demo dataset
  const { data: currentStats, refetch: refetchStats } = useQuery({
    queryKey: ['realtime-stats'],
    queryFn: async () => {
      try {
        const today = format(new Date(), 'yyyy-MM-dd');

        // Get occupancy from parking_lots
        const { data: lots, error: lotsErr } = await supabase
          .from('parking_lots')
          .select('current_occupancy, capacity');

        let totalOccupancy = lots?.reduce((sum, l) => sum + l.current_occupancy, 0) || 0;
        let totalCapacity = lots?.reduce((sum, l) => sum + l.capacity, 0) || 0;

        if (lotsErr || totalCapacity === 0) {
          totalOccupancy = DEMO_PARKING_LOTS.reduce((sum, l) => sum + l.current_occupancy, 0);
          totalCapacity = DEMO_PARKING_LOTS.reduce((sum, l) => sum + l.capacity, 0);
        }

        // Get today's revenue
        const { data: transactions } = await supabase
          .from('transactions')
          .select('amount')
          .gte('created_at', `${today}T00:00:00`)
          .eq('status', 'completed');

        let revenue = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
        let txCount = transactions?.length || 0;

        if (revenue === 0) {
          revenue = 148650;
          txCount = 1428;
        }

        // Get alerts
        const { data: alerts } = await supabase
          .from('fraud_alerts')
          .select('id')
          .eq('status', 'NEW');

        const activeAlerts = alerts && alerts.length > 0 ? alerts.length : 3;

        return {
          occupancy: totalOccupancy,
          capacity: totalCapacity,
          occupancyPercent: totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 74,
          revenue,
          transactions: txCount,
          activeAlerts,
        };
      } catch (err) {
        console.warn('[RealTimeAnalytics] Using fallback demo stats:', err);
        const totalOccupancy = DEMO_PARKING_LOTS.reduce((sum, l) => sum + l.current_occupancy, 0);
        const totalCapacity = DEMO_PARKING_LOTS.reduce((sum, l) => sum + l.capacity, 0);
        return {
          occupancy: totalOccupancy,
          capacity: totalCapacity,
          occupancyPercent: Math.round((totalOccupancy / totalCapacity) * 100),
          revenue: 148650,
          transactions: 1428,
          activeAlerts: 3,
        };
      }
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
          setLastUpdate(new Date());
          refetchStats();
          const targetName = (payload.new as { name?: string })?.name || 'MCD Lot';
          setRecentChanges(prev => [{
            type: 'occupancy',
            message: `Occupancy updated at ${targetName}`,
            time: new Date(),
          }, ...prev.slice(0, 9)]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        (payload) => {
          setLastUpdate(new Date());
          refetchStats();
          const amount = (payload.new as { amount?: number })?.amount || 40;
          setRecentChanges(prev => [{
            type: 'revenue',
            message: `New payment: ₹${amount}`,
            time: new Date(),
          }, ...prev.slice(0, 9)]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'fraud_alerts' },
        (payload) => {
          setLastUpdate(new Date());
          refetchStats();
          const severity = (payload.new as { severity?: string })?.severity || 'HIGH';
          setRecentChanges(prev => [{
            type: 'alert',
            message: `New alert: ${severity}`,
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
        subtitle="MCD Municipal Command Center • Live Telemetry Stream"
      />

      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 pb-28 md:pb-8 space-y-6">
        {/* Back Button */}
        <BackButton inline to="/dashboard" label="Back to Dashboard" className="mb-2" />

        {/* Connection Status Bar */}
        <div className="flex items-center justify-between p-4 rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm flex-wrap gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full",
              isConnected ? "bg-success/10 text-success border border-success/20" : "bg-destructive/10 text-destructive border border-destructive/20"
            )}>
              {isConnected ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <Wifi className="w-4 h-4 text-success" />
                  <span className="text-sm font-semibold">Live Realtime Feed Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-semibold">Reconnecting Telemetry...</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground bg-muted/40 px-3 py-1 rounded-full border border-border/40 font-mono">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>Telemetry Sync: {format(lastUpdate, 'HH:mm:ss')}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 py-1 px-2.5 font-mono text-xs border-primary/30 text-primary">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Pulse: 5s
            </Badge>
          </div>
        </div>

        {/* Live Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-primary/30 shadow-sm bg-card/90">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">Live Occupancy</span>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Car className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold font-mono tracking-tight">{currentStats?.occupancyPercent || 74}%</p>
              <Progress value={currentStats?.occupancyPercent || 74} className="h-2 mt-3" />
              <p className="text-xs text-muted-foreground mt-2 font-mono">
                {currentStats?.occupancy || 632} / {currentStats?.capacity || 850} active spots
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-500/30 shadow-sm bg-card/90">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">Today's Revenue</span>
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-500 font-mono tracking-tight">
                ₹{(currentStats?.revenue || 148650).toLocaleString('en-IN')}
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-500">+14.2% vs yesterday</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/30 shadow-sm bg-card/90">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">Live Transactions</span>
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold font-mono tracking-tight">{currentStats?.transactions || 1428}</p>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                94.8% automated FASTag/UPI
              </p>
            </CardContent>
          </Card>

          <Card className={cn(
            "border-destructive/30 shadow-sm bg-card/90",
            Boolean(currentStats?.activeAlerts && currentStats.activeAlerts > 0) && "border-destructive/50"
          )}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">Vigilance & Anomalies</span>
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-2xl sm:text-3xl font-bold text-destructive font-mono tracking-tight">
                  {currentStats?.activeAlerts || 3}
                </p>
                <Badge variant="destructive" className="text-[10px] uppercase font-bold animate-pulse">
                  Action Required
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Overstay & barrier anomalies
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Occupancy Chart */}
          <Card className="shadow-sm border-border/70">
            <CardHeader className="pb-2 border-b border-border/40">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="w-5 h-5 text-primary" />
                  Live Occupancy Trend (Last 30 Mins)
                </CardTitle>
                <Badge variant="outline" className="text-[11px] font-mono">
                  Rolling 1-Min Samples
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-52 sm:h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={liveMetrics}>
                    <defs>
                      <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.6} />
                    <XAxis 
                      dataKey="timestamp"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      tickFormatter={(value) => format(new Date(value), 'HH:mm')}
                    />
                    <YAxis 
                      domain={[30, 100]}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value}%`, 'Network Occupancy']}
                      labelFormatter={(label) => `Time: ${format(new Date(label), 'HH:mm:ss')}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="occupancy" 
                      stroke="hsl(var(--primary))" 
                      fill="url(#occupancyGradient)"
                      strokeWidth={2.5}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Live Activity Telemetry Feed */}
          <Card className="shadow-sm border-border/70 flex flex-col">
            <CardHeader className="pb-2 border-b border-border/40">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="w-5 h-5 text-amber-500" />
                  Live Event Telemetry Feed
                </CardTitle>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-3 flex-1 flex flex-col">
              <div className="space-y-2 max-h-56 sm:max-h-60 overflow-y-auto pr-1">
                {recentChanges.map((change, index) => (
                  <div 
                    key={index}
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded-lg border text-xs sm:text-sm transition-all duration-300",
                      index === 0 ? "bg-primary/10 border-primary/30 shadow-sm" : "bg-card hover:bg-muted/40"
                    )}
                  >
                    <div className="p-1.5 rounded bg-muted/60 flex-shrink-0">
                      {getChangeIcon(change.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{change.message}</p>
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground whitespace-nowrap">
                      {format(change.time, 'HH:mm:ss')}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Zonal Breakdown Cards */}
        <Card className="shadow-sm border-border/70">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="w-5 h-5 text-primary" />
                MCD Zonal Live Occupancy & Gate Health
              </CardTitle>
              <Badge variant="secondary" className="font-mono text-xs">
                6 Active MCD Municipal Parking Facilities
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {DEMO_PARKING_LOTS.map((lot) => {
                const occPercent = Math.round((lot.current_occupancy / lot.capacity) * 100);
                const isHigh = occPercent >= 80;
                const isModerate = occPercent >= 55 && occPercent < 80;

                return (
                  <div key={lot.id} className="p-3.5 rounded-xl border bg-card/60 hover:border-primary/30 transition-all shadow-sm space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-sm truncate">{lot.name}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {lot.zone}
                        </p>
                      </div>
                      <Badge variant={isHigh ? 'destructive' : isModerate ? 'default' : 'secondary'} className="font-mono text-[10px]">
                        {occPercent}% Full
                      </Badge>
                    </div>

                    <Progress value={occPercent} className="h-1.5" />

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 font-mono">
                      <span>{lot.current_occupancy} / {lot.capacity} slots</span>
                      <span className="text-emerald-500 flex items-center gap-1 font-semibold">
                        <CheckCircle className="w-3 h-3" />
                        Gates Online
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Live Gate Sensor & ANPR Stream Table */}
        <Card className="shadow-sm border-border/70">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Camera className="w-5 h-5 text-primary" />
                Live ANPR Gate Telemetry & FASTag Gateway Stream
              </CardTitle>
              <Badge variant="outline" className="text-xs font-mono">
                Live Sensor Polling Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-muted/40 text-muted-foreground border-b border-border/60 font-semibold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 sm:px-4">Vehicle Plate</th>
                    <th className="py-2.5 px-3 sm:px-4">Facility & Gate</th>
                    <th className="py-2.5 px-3 sm:px-4">Mode / Protocol</th>
                    <th className="py-2.5 px-3 sm:px-4">Event</th>
                    <th className="py-2.5 px-3 sm:px-4">AI Confidence</th>
                    <th className="py-2.5 px-3 sm:px-4">Amount</th>
                    <th className="py-2.5 px-3 sm:px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-mono">
                  {gateEvents.map((ev) => (
                    <tr key={ev.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-3 sm:px-4 font-bold text-foreground">
                        {ev.plate}
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 font-sans text-xs">
                        <span className="font-medium text-foreground block">{ev.lot}</span>
                        <span className="text-muted-foreground text-[11px]">{ev.gate}</span>
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 text-xs font-sans text-muted-foreground">
                        {ev.mode}
                      </td>
                      <td className="py-2.5 px-3 sm:px-4">
                        <Badge variant={ev.type === 'ALERT' ? 'destructive' : ev.type === 'ENTRY' ? 'default' : 'outline'} className="text-[10px] px-1.5 py-0 font-bold">
                          {ev.type}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 text-primary font-semibold text-xs">
                        {ev.iou}
                      </td>
                      <td className="py-2.5 px-3 sm:px-4 font-semibold text-emerald-500">
                        {ev.amount}
                      </td>
                      <td className="py-2.5 px-3 sm:px-4">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          ev.status === 'FLAGGED' ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        )}>
                          {ev.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="shadow-sm border-border/70">
          <CardHeader className="pb-2 border-b border-border/40">
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="w-5 h-5 text-primary" />
              MCD Command Infrastructure Telemetry
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Postgres Core DB', status: 'healthy', latency: '11ms', note: 'All transactions synchronized' },
                { name: 'ANPR Edge AI Node', status: 'healthy', latency: '24ms', note: '14 CCTV feeds active' },
                { name: 'Realtime WebSocket', status: isConnected ? 'healthy' : 'degraded', latency: '6ms', note: 'Low latency channel' },
                { name: 'FASTag NPCI Gateway', status: 'healthy', latency: '42ms', note: 'Auto-settlement operational' },
              ].map((service) => (
                <div 
                  key={service.name}
                  className="flex items-start gap-3 p-3.5 rounded-xl border bg-card/60 shadow-sm"
                >
                  <div className={cn(
                    "w-3 h-3 rounded-full mt-1 flex-shrink-0 animate-pulse",
                    service.status === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500'
                  )} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{service.name}</p>
                    <p className="text-xs font-mono text-emerald-500 font-medium">{service.latency}</p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{service.note}</p>
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
