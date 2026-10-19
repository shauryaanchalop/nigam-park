import React, { useState, useEffect } from 'react';
import { 
  Battery, 
  BatteryCharging, 
  BatteryFull, 
  BatteryLow, 
  BatteryMedium,
  Zap,
  Clock,
  TrendingUp,
  Car,
  Thermometer,
  PlugZap,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ChargingSession {
  id: string;
  vehicleNumber: string;
  vehicleName: string;
  stationId: string;
  stationName: string;
  batteryLevel: number;
  targetLevel: number;
  chargingRate: number; // kW
  estimatedTimeRemaining: number; // minutes
  energyDelivered: number; // kWh
  cost: number;
  startTime: Date;
  status: 'charging' | 'paused' | 'completed' | 'error';
  temperature: number;
  chargerType: 'fast' | 'standard' | 'slow';
}

const mockSessions: ChargingSession[] = [
  {
    id: '1',
    vehicleNumber: 'DL 01 EV 1234',
    vehicleName: 'Tata Nexon EV',
    stationId: 'EV-01',
    stationName: 'Connaught Place - Station 1',
    batteryLevel: 67,
    targetLevel: 100,
    chargingRate: 45,
    estimatedTimeRemaining: 28,
    energyDelivered: 18.5,
    cost: 277,
    startTime: new Date(Date.now() - 45 * 60 * 1000),
    status: 'charging',
    temperature: 32,
    chargerType: 'fast'
  },
  {
    id: '2',
    vehicleNumber: 'DL 02 EV 5678',
    vehicleName: 'MG ZS EV',
    stationId: 'EV-03',
    stationName: 'Karol Bagh - Station 3',
    batteryLevel: 95,
    targetLevel: 100,
    chargingRate: 18,
    estimatedTimeRemaining: 8,
    energyDelivered: 32.1,
    cost: 385,
    startTime: new Date(Date.now() - 120 * 60 * 1000),
    status: 'charging',
    temperature: 28,
    chargerType: 'standard'
  },
  {
    id: '3',
    vehicleNumber: 'DL 03 EV 9012',
    vehicleName: 'Hyundai Kona',
    stationId: 'EV-06',
    stationName: 'Nehru Place - Station 6',
    batteryLevel: 100,
    targetLevel: 100,
    chargingRate: 0,
    estimatedTimeRemaining: 0,
    energyDelivered: 45.2,
    cost: 678,
    startTime: new Date(Date.now() - 180 * 60 * 1000),
    status: 'completed',
    temperature: 25,
    chargerType: 'fast'
  }
];

export function EVBatteryStatus() {
  const { isHindi } = useLanguage();
  const [sessions, setSessions] = useState<ChargingSession[]>(mockSessions);
  const [selectedSessionId, setSelectedSessionId] = useState<string>(mockSessions[0].id);
  const session = sessions.find(s => s.id === selectedSessionId) || sessions[0];

  // Simulate real-time battery updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSessions(prev => prev.map(session => {
        if (session.status === 'charging' && session.batteryLevel < session.targetLevel) {
          const newLevel = Math.min(session.batteryLevel + 0.5, session.targetLevel);
          const newTimeRemaining = Math.max(0, session.estimatedTimeRemaining - 0.5);
          const newEnergyDelivered = session.energyDelivered + (session.chargingRate / 120);
          
          return {
            ...session,
            batteryLevel: Math.round(newLevel * 10) / 10,
            estimatedTimeRemaining: Math.round(newTimeRemaining),
            energyDelivered: Math.round(newEnergyDelivered * 10) / 10,
            cost: Math.round(newEnergyDelivered * 15),
            status: newLevel >= session.targetLevel ? 'completed' : 'charging'
          };
        }
        return session;
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getBatteryIcon = (level: number, isCharging: boolean) => {
    if (isCharging) return <BatteryCharging className="w-6 h-6 text-warning animate-pulse" />;
    if (level >= 80) return <BatteryFull className="w-6 h-6 text-success" />;
    if (level >= 40) return <BatteryMedium className="w-6 h-6 text-warning" />;
    return <BatteryLow className="w-6 h-6 text-destructive" />;
  };

  const getBatteryColor = (level: number) => {
    if (level >= 80) return 'bg-success';
    if (level >= 40) return 'bg-warning';
    return 'bg-destructive';
  };

  const getStatusBadge = (status: ChargingSession['status']) => {
    switch (status) {
      case 'charging':
        return <Badge className="bg-warning animate-pulse">{isHindi ? 'चार्जिंग' : 'Charging'}</Badge>;
      case 'paused':
        return <Badge variant="secondary">{isHindi ? 'रुका हुआ' : 'Paused'}</Badge>;
      case 'completed':
        return <Badge className="bg-success">{isHindi ? 'पूर्ण' : 'Completed'}</Badge>;
      case 'error':
        return <Badge variant="destructive">{isHindi ? 'त्रुटि' : 'Error'}</Badge>;
    }
  };

  const getChargerTypeBadge = (type: ChargingSession['chargerType']) => {
    const labels = {
      fast: isHindi ? 'फास्ट 50kW' : 'Fast 50kW',
      standard: isHindi ? 'स्टैंडर्ड 22kW' : 'Standard 22kW',
      slow: isHindi ? 'स्लो 7kW' : 'Slow 7kW'
    };
    return <Badge variant="outline" className="text-xs">{labels[type]}</Badge>;
  };

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
      return isHindi ? `${hrs} घं ${mins} मि` : `${hrs}h ${mins}m`;
    }
    return isHindi ? `${mins} मिनट` : `${mins} min`;
  };

  const handleStopCharging = (sessionId: string) => {
    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, status: 'completed' as const, chargingRate: 0 } : s
    ));
    toast.success(isHindi ? 'चार्जिंग बंद हो गई' : 'Charging stopped', {
      description: isHindi ? 'कृपया अपना वाहन हटाएं' : 'Please remove your vehicle'
    });
  };

  const activeCount = sessions.filter(s => s.status === 'charging').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BatteryCharging className="w-5 h-5 text-success" />
          {isHindi ? 'ईवी बैटरी स्थिति' : 'EV Battery Status'}
        </CardTitle>
        <CardDescription>
          {isHindi 
            ? `${activeCount} वाहन वर्तमान में चार्ज हो रहे हैं`
            : `${activeCount} vehicles currently charging`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Feature Description */}
        <div className="p-3 rounded-lg bg-success/5 border border-success/20">
          <p className="text-xs text-muted-foreground">
            {isHindi 
              ? '🔋 अपने ईवी की चार्जिंग प्रगति को रियल-टाइम में ट्रैक करें। बैटरी स्तर, शेष समय, ऊर्जा खपत और लागत देखें।'
              : '🔋 Track your EV charging progress in real-time. View battery level, remaining time, energy consumption, and cost.'}
          </p>
        </div>

        {/* Vehicle Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-muted-foreground mr-1 text-[11px] font-medium">Vehicle:</span>
          {sessions.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedSessionId(s.id)}
              className={cn(
                "px-2.5 py-1 rounded-md transition-all font-medium border text-xs flex items-center gap-1.5 whitespace-nowrap",
                s.id === selectedSessionId 
                  ? "bg-primary text-primary-foreground border-primary shadow-xs" 
                  : "bg-muted/50 text-muted-foreground border-border/50 hover:text-foreground"
              )}
            >
              <Car className="w-3 h-3" />
              <span>{s.vehicleName}</span>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[10px] py-0 px-1 h-3.5 leading-none", 
                  s.id === selectedSessionId
                    ? "border-primary-foreground/30 text-primary-foreground"
                    : s.status === 'charging' 
                    ? 'border-amber-500/40 text-amber-500' 
                    : 'border-emerald-500/40 text-emerald-500'
                )}
              >
                {Math.round(s.batteryLevel)}%
              </Badge>
            </button>
          ))}
        </div>

        {/* Selected Charging Session */}
        <div 
          className={`p-4 rounded-xl border-2 transition-all ${
            session.status === 'charging' 
              ? 'border-warning/50 bg-warning/5' 
              : session.status === 'completed'
                ? 'border-success/50 bg-success/5'
                : 'border-border bg-card'
          }`}
        >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    session.status === 'charging' ? 'bg-warning/20' : 'bg-success/20'
                  }`}>
                    {getBatteryIcon(session.batteryLevel, session.status === 'charging')}
                  </div>
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      {session.vehicleName}
                      {getStatusBadge(session.status)}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Car className="w-3 h-3" />
                      {session.vehicleNumber}
                    </div>
                  </div>
                </div>
                {getChargerTypeBadge(session.chargerType)}
              </div>

              {/* Battery Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {isHindi ? 'बैटरी स्तर' : 'Battery Level'}
                  </span>
                  <span className="text-2xl font-bold">
                    {Math.round(session.batteryLevel)}%
                  </span>
                </div>
                <div className="relative h-6 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`absolute left-0 top-0 h-full transition-all duration-500 ${getBatteryColor(session.batteryLevel)}`}
                    style={{ width: `${session.batteryLevel}%` }}
                  >
                    {session.status === 'charging' && (
                      <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-r from-transparent to-white/30 animate-pulse" />
                    )}
                  </div>
                  {session.targetLevel < 100 && (
                    <div 
                      className="absolute top-0 h-full w-0.5 bg-foreground/50"
                      style={{ left: `${session.targetLevel}%` }}
                    />
                  )}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0%</span>
                  <span>{isHindi ? 'लक्ष्य' : 'Target'}: {session.targetLevel}%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Charging Rate */}
                <div className="p-2 rounded-lg bg-background/50">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <Zap className="w-3 h-3" />
                    {isHindi ? 'चार्जिंग दर' : 'Charging Rate'}
                  </div>
                  <div className="font-semibold">
                    {session.chargingRate} kW
                  </div>
                </div>

                {/* Time Remaining */}
                <div className="p-2 rounded-lg bg-background/50">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <Clock className="w-3 h-3" />
                    {isHindi ? 'शेष समय' : 'Time Left'}
                  </div>
                  <div className="font-semibold">
                    {session.status === 'completed' 
                      ? (isHindi ? 'पूर्ण' : 'Done')
                      : formatDuration(session.estimatedTimeRemaining)
                    }
                  </div>
                </div>

                {/* Energy Delivered */}
                <div className="p-2 rounded-lg bg-background/50">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <TrendingUp className="w-3 h-3" />
                    {isHindi ? 'ऊर्जा' : 'Energy'}
                  </div>
                  <div className="font-semibold">
                    {session.energyDelivered} kWh
                  </div>
                </div>

                {/* Temperature */}
                <div className="p-2 rounded-lg bg-background/50">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <Thermometer className="w-3 h-3" />
                    {isHindi ? 'तापमान' : 'Temp'}
                  </div>
                  <div className="font-semibold flex items-center gap-1">
                    {session.temperature}°C
                    {session.temperature > 35 && (
                      <AlertTriangle className="w-3 h-3 text-warning" />
                    )}
                  </div>
                </div>
              </div>

              {/* Station Info & Cost */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <div className="text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <PlugZap className="w-3 h-3" />
                    {session.stationName}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">
                    {isHindi ? 'वर्तमान लागत' : 'Current Cost'}
                  </div>
                  <div className="text-lg font-bold text-success">₹{session.cost}</div>
                </div>
              </div>

              {/* Actions */}
              {session.status === 'charging' && (
                <div className="flex gap-2 mt-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleStopCharging(session.id)}
                  >
                    {isHindi ? 'चार्जिंग रोकें' : 'Stop Charging'}
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 gap-1"
                    onClick={() => toast.info(isHindi ? 'अधिसूचना सक्षम' : 'Notification enabled')}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isHindi ? 'पूर्ण होने पर सूचित करें' : 'Notify on Complete'}
                  </Button>
                </div>
              )}

              {session.status === 'completed' && (
                <div className="mt-3 p-3 rounded-lg bg-success/10 border border-success/20">
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">
                      {isHindi ? 'चार्जिंग पूर्ण!' : 'Charging Complete!'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isHindi 
                      ? `कुल ${session.energyDelivered} kWh चार्ज हुई। कृपया भुगतान करें।`
                      : `Total ${session.energyDelivered} kWh charged. Please complete payment.`
                    }
                  </p>
                </div>
              )}
            </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-muted/50">
          <div className="text-center">
            <div className="text-2xl font-bold text-success">
              {sessions.reduce((acc, s) => acc + s.energyDelivered, 0).toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">
              {isHindi ? 'कुल kWh' : 'Total kWh'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              ₹{sessions.reduce((acc, s) => acc + s.cost, 0)}
            </div>
            <div className="text-xs text-muted-foreground">
              {isHindi ? 'कुल लागत' : 'Total Cost'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">
              {Math.round(sessions.reduce((acc, s) => acc + s.energyDelivered, 0) * 0.4)}
            </div>
            <div className="text-xs text-muted-foreground">
              {isHindi ? 'kg CO₂ बचाया' : 'kg CO₂ Saved'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
