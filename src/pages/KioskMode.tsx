import React, { useEffect, useState } from 'react';
import { useParkingLots } from '@/hooks/useParkingLots';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Car, TrendingUp, TrendingDown, Maximize, X, Volume2, VolumeX, AlertTriangle, Camera, Eye, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png';

interface OccupancyChange {
  lotId: string;
  previousOccupancy: number;
  currentOccupancy: number;
  timestamp: Date;
}

// Sound notification for high occupancy
const playCapacityAlert = (muted: boolean) => {
  if (muted) return;
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Warning triple beep for capacity alert
    oscillator.frequency.value = 880;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.15);
    
    // Second beep
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.frequency.value = 988;
      osc2.type = 'sine';
      gain2.gain.value = 0.3;
      osc2.start();
      osc2.stop(audioContext.currentTime + 0.15);
    }, 180);
    
    // Third beep
    setTimeout(() => {
      const osc3 = audioContext.createOscillator();
      const gain3 = audioContext.createGain();
      osc3.connect(gain3);
      gain3.connect(audioContext.destination);
      osc3.frequency.value = 1108;
      osc3.type = 'sine';
      gain3.gain.value = 0.3;
      osc3.start();
      osc3.stop(audioContext.currentTime + 0.2);
    }, 360);
  } catch (e) {
    console.log('Audio not supported');
  }
};

export default function KioskMode() {
  const { data: lots, isLoading } = useParkingLots();
  const [recentChanges, setRecentChanges] = useState<OccupancyChange[]>([]);
  const [previousData, setPreviousData] = useState<Record<string, number>>({});
  const [pulsingLots, setPulsingLots] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [alertedHighCapacity, setAlertedHighCapacity] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Track changes when lots data updates
  useEffect(() => {
    if (!lots) return;

    const newChanges: OccupancyChange[] = [];
    const newPulsingLots = new Set<string>();
    const newHighCapacityAlerts = new Set<string>();

    lots.forEach((lot) => {
      const prev = previousData[lot.id];
      const percentage = (lot.current_occupancy / lot.capacity) * 100;
      
      // Check for high capacity
      if (percentage >= 90 && !alertedHighCapacity.has(lot.id)) {
        newHighCapacityAlerts.add(lot.id);
        playCapacityAlert(audioMuted);
      }
      
      if (prev !== undefined && prev !== lot.current_occupancy) {
        newChanges.push({
          lotId: lot.id,
          previousOccupancy: prev,
          currentOccupancy: lot.current_occupancy,
          timestamp: new Date(),
        });
        newPulsingLots.add(lot.id);
      }
    });

    if (newHighCapacityAlerts.size > 0) {
      setAlertedHighCapacity(prev => new Set([...prev, ...newHighCapacityAlerts]));
    }

    if (newChanges.length > 0) {
      setRecentChanges((prev) => [...newChanges, ...prev].slice(0, 10));
      setPulsingLots(newPulsingLots);

      setTimeout(() => {
        setPulsingLots(new Set());
      }, 2000);
    }

    const newPrevData: Record<string, number> = {};
    lots.forEach((lot) => {
      newPrevData[lot.id] = lot.current_occupancy;
    });
    setPreviousData(newPrevData);
  }, [lots, audioMuted]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const getOccupancyStatus = (occupancy: number, capacity: number) => {
    const percentage = (occupancy / capacity) * 100;
    if (percentage >= 90) return { label: 'FULL', color: 'bg-destructive', textColor: 'text-destructive', glow: 'shadow-destructive/50' };
    if (percentage >= 70) return { label: 'BUSY', color: 'bg-warning', textColor: 'text-warning', glow: 'shadow-warning/50' };
    return { label: 'AVAILABLE', color: 'bg-success', textColor: 'text-success', glow: 'shadow-success/50' };
  };

  const totalCapacity = lots?.reduce((sum, lot) => sum + lot.capacity, 0) || 0;
  const totalOccupancy = lots?.reduce((sum, lot) => sum + lot.current_occupancy, 0) || 0;
  const overallPercentage = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

  const fullLots = lots?.filter(lot => (lot.current_occupancy / lot.capacity) * 100 >= 90).length || 0;
  const busyLots = lots?.filter(lot => {
    const pct = (lot.current_occupancy / lot.capacity) * 100;
    return pct >= 70 && pct < 90;
  }).length || 0;
  const availableLots = (lots?.length || 0) - fullLots - busyLots;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <img src={logo} alt="NIGAM-Park" className="w-24 h-24 mx-auto mb-4 rounded-full" />
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <img src={logo} alt="NIGAM-Park" className="w-16 h-16 rounded-full border-2 border-primary/30" />
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">NIGAM-Park Control Center</h1>
            <p className="text-muted-foreground">Real-Time Parking Occupancy Monitor</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right mr-4">
            <p className="text-2xl lg:text-3xl font-mono font-bold text-foreground">
              {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-sm text-muted-foreground">
              {currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-success/10 border border-success/20">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
            </span>
            <span className="text-sm font-medium text-success">LIVE</span>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setAudioMuted(!audioMuted)}
            className="h-10 w-10"
          >
            {audioMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
            className="h-10 w-10"
          >
            {isFullscreen ? <X className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </Button>
          
          <Button variant="outline" size="sm" asChild>
            <Link to="/">Exit Kiosk</Link>
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card className="col-span-2 bg-card/80 backdrop-blur border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold">System Occupancy</span>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {totalOccupancy}/{totalCapacity}
              </Badge>
            </div>
            <Progress value={overallPercentage} className="h-4 mb-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{overallPercentage}% utilized</span>
              <span>{totalCapacity - totalOccupancy} spots available</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-success/10 border-success/30">
          <CardContent className="p-4 text-center">
            <Car className="h-8 w-8 mx-auto mb-2 text-success" />
            <p className="text-3xl font-bold text-success">{availableLots}</p>
            <p className="text-sm text-muted-foreground">Available</p>
          </CardContent>
        </Card>
        
        <Card className="bg-warning/10 border-warning/30">
          <CardContent className="p-4 text-center">
            <Activity className="h-8 w-8 mx-auto mb-2 text-warning" />
            <p className="text-3xl font-bold text-warning">{busyLots}</p>
            <p className="text-sm text-muted-foreground">Busy</p>
          </CardContent>
        </Card>
        
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-destructive" />
            <p className="text-3xl font-bold text-destructive">{fullLots}</p>
            <p className="text-sm text-muted-foreground">Full</p>
          </CardContent>
        </Card>
      </div>

      {/* Camera Feed Section for Kiosk */}
      <Card className="mb-6 bg-card/80 backdrop-blur border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Live Camera Feeds
            </h3>
            <Badge variant="outline" className="text-xs">
              <span className="w-2 h-2 rounded-full bg-success mr-1.5 animate-pulse inline-block"></span>
              MONITORING
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['Entry Gate A', 'Exit Gate B', 'Zone C Overview', 'VIP Area'].map((name, idx) => (
              <div key={name} className="relative aspect-video bg-muted rounded-lg overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-muted-foreground/50" />
                </div>
                {/* Simulated feed overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(transparent_0,transparent_2px,rgba(0,0,0,0.1)_3px)] bg-[length:100%_4px] opacity-50" />
                {/* Status indicator */}
                <div className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-success/90 text-success-foreground text-[10px] px-1.5 py-0.5 rounded">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  LIVE
                </div>
                {/* Camera name */}
                <div className="absolute bottom-1.5 left-1.5 bg-background/80 backdrop-blur-sm text-[10px] px-1.5 py-0.5 rounded font-medium">
                  {name}
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Maximize className="w-6 h-6 text-primary" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Parking Lots Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
        {lots?.map((lot) => {
          const percentage = Math.round((lot.current_occupancy / lot.capacity) * 100);
          const status = getOccupancyStatus(lot.current_occupancy, lot.capacity);
          const isPulsing = pulsingLots.has(lot.id);
          const recentChange = recentChanges.find((c) => c.lotId === lot.id);

          return (
            <Card
              key={lot.id}
              className={`relative overflow-hidden transition-all duration-500 ${
                isPulsing 
                  ? 'ring-4 ring-primary/50 scale-[1.02]' 
                  : ''
              } ${percentage >= 90 ? 'border-destructive/50 bg-destructive/5' : 'border-border/50'}`}
            >
              {/* Status indicator bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${status.color}`} />
              
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm truncate flex-1">{lot.name}</h3>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${status.textColor} ml-2`}
                  >
                    {status.label}
                  </Badge>
                </div>
                
                <div className="text-center py-4">
                  <p className={`text-4xl lg:text-5xl font-bold ${status.textColor}`}>
                    {percentage}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {lot.current_occupancy}/{lot.capacity} spots
                  </p>
                </div>
                
                <Progress value={percentage} className="h-2" />
                
                {recentChange && (
                  <div className={`mt-2 text-xs flex items-center justify-center gap-1 ${
                    recentChange.currentOccupancy > recentChange.previousOccupancy 
                      ? 'text-destructive' 
                      : 'text-success'
                  }`}>
                    {recentChange.currentOccupancy > recentChange.previousOccupancy ? (
                      <>
                        <TrendingUp className="h-3 w-3" />
                        +{recentChange.currentOccupancy - recentChange.previousOccupancy}
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-3 w-3" />
                        {recentChange.currentOccupancy - recentChange.previousOccupancy}
                      </>
                    )}
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground text-center mt-2">{lot.zone}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Activity Log */}
      {recentChanges.length > 0 && (
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Recent Activity
            </h3>
            <div className="flex flex-wrap gap-2">
              {recentChanges.slice(0, 8).map((change, idx) => {
                const lot = lots?.find((l) => l.id === change.lotId);
                const isIncrease = change.currentOccupancy > change.previousOccupancy;
                return (
                  <Badge 
                    key={idx} 
                    variant="outline"
                    className={`${isIncrease ? 'border-destructive/50 text-destructive' : 'border-success/50 text-success'}`}
                  >
                    {lot?.name}: {change.previousOccupancy} → {change.currentOccupancy}
                    {isIncrease ? <TrendingUp className="h-3 w-3 ml-1" /> : <TrendingDown className="h-3 w-3 ml-1" />}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
