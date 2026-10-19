import React, { useState } from 'react';
import { 
  Zap, 
  Battery, 
  BatteryCharging, 
  Clock, 
  MapPin, 
  Check, 
  Leaf, 
  Sparkles, 
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ChargingStation {
  id: string;
  name: string;
  lotName: string;
  type: 'fast' | 'standard' | 'slow';
  connector: string;
  powerKw: number;
  status: 'available' | 'charging' | 'occupied' | 'maintenance';
  currentCharge?: number;
  estimatedTime?: number;
  pricePerKwh: number;
}

const mockStations: ChargingStation[] = [
  { 
    id: '1', 
    name: 'EV-01', 
    lotName: 'Connaught Place', 
    type: 'fast', 
    connector: 'CCS-2', 
    powerKw: 50, 
    status: 'available', 
    pricePerKwh: 15 
  },
  { 
    id: '2', 
    name: 'EV-02', 
    lotName: 'Connaught Place', 
    type: 'fast', 
    connector: 'CCS-2 / CHAdeMO', 
    powerKw: 50, 
    status: 'charging', 
    currentCharge: 67, 
    estimatedTime: 25, 
    pricePerKwh: 15 
  },
  { 
    id: '3', 
    name: 'EV-03', 
    lotName: 'Karol Bagh Market', 
    type: 'standard', 
    connector: 'Type-2 AC', 
    powerKw: 22, 
    status: 'available', 
    pricePerKwh: 12 
  },
  { 
    id: '4', 
    name: 'EV-04', 
    lotName: 'Karol Bagh Market', 
    type: 'standard', 
    connector: 'Type-2 AC', 
    powerKw: 22, 
    status: 'occupied', 
    pricePerKwh: 12 
  },
  { 
    id: '5', 
    name: 'EV-05', 
    lotName: 'Lajpat Nagar Central', 
    type: 'slow', 
    connector: 'Bharat AC-001', 
    powerKw: 7, 
    status: 'maintenance', 
    pricePerKwh: 8 
  },
  { 
    id: '6', 
    name: 'EV-06', 
    lotName: 'Nehru Place IT Hub', 
    type: 'fast', 
    connector: 'CCS-2 Dual Gun', 
    powerKw: 60, 
    status: 'available', 
    pricePerKwh: 15 
  },
];

export function EVChargingReservation() {
  const { isHindi } = useLanguage();
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [duration, setDuration] = useState('60');
  const [filterType, setFilterType] = useState<'all' | 'fast' | 'standard' | 'slow'>('all');

  const filteredStations = filterType === 'all' 
    ? mockStations 
    : mockStations.filter(s => s.type === filterType);

  const getStatusBadge = (status: ChargingStation['status']) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">{isHindi ? 'उपलब्ध' : 'Available'}</Badge>;
      case 'charging':
        return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">{isHindi ? 'चार्जिंग' : 'Charging'}</Badge>;
      case 'occupied':
        return <Badge variant="secondary">{isHindi ? 'व्यस्त' : 'Occupied'}</Badge>;
      case 'maintenance':
        return <Badge variant="destructive">{isHindi ? 'रखरखाव' : 'Maintenance'}</Badge>;
    }
  };

  const getTypeLabel = (type: ChargingStation['type']) => {
    if (isHindi) {
      switch (type) {
        case 'fast': return 'फास्ट (50kW+)';
        case 'standard': return 'स्टैंडर्ड (22kW)';
        case 'slow': return 'स्लो (7kW)';
      }
    }
    switch (type) {
      case 'fast': return 'Fast (50kW+)';
      case 'standard': return 'Standard (22kW)';
      case 'slow': return 'Slow (7kW)';
    }
  };

  const handleReserve = () => {
    toast.success(isHindi ? 'ईवी चार्जिंग स्लॉट बुक हो गया!' : 'EV charging slot reserved!', {
      description: `${selectedStation?.name} (${selectedStation?.lotName}) - ${duration} ${isHindi ? 'मिनट' : 'mins'} reserved. Priority entry enabled.`,
    });
    setReserveOpen(false);
    setSelectedStation(null);
  };

  const availableCount = mockStations.filter(s => s.status === 'available').length;
  const chargingCount = mockStations.filter(s => s.status === 'charging' || s.status === 'occupied').length;
  const avgTariff = Math.round(mockStations.reduce((acc, s) => acc + s.pricePerKwh, 0) / mockStations.length);

  return (
    <Card className="w-full h-full flex flex-col justify-between">
      <div>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-500" />
              {isHindi ? 'ईवी चार्जिंग स्टेशन' : 'EV Charging Stations'}
            </CardTitle>
            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-medium">
              {availableCount} {isHindi ? 'उपलब्ध' : 'Available'}
            </Badge>
          </div>
          <CardDescription>
            {isHindi 
              ? `${availableCount} चार्जिंग स्लॉट उपलब्ध • फास्ट, स्टैंडर्ड एवं स्लो चार्जर्स`
              : `${availableCount} charging slots available across municipal parking lots`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Feature Description */}
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isHindi 
                ? '⚡ ईवी चार्जिंग स्टेशन पहले से बुक करें और चार्जिंग की प्रतीक्षा से बचें। फास्ट, स्टैंडर्ड और स्लो चार्जर उपलब्ध हैं।'
                : '⚡ Reserve EV charging stations in advance and skip the queue. High-power DC fast and standard AC chargers with touchless FASTag debit.'}
            </p>
          </div>

          {/* Quick Filter Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-muted-foreground mr-1 text-[11px] font-medium">Filter:</span>
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={cn(
                "px-2.5 py-1 rounded-md transition-colors font-medium border text-xs",
                filterType === 'all' 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-muted/50 text-muted-foreground border-border/50 hover:text-foreground"
              )}
            >
              All ({mockStations.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('fast')}
              className={cn(
                "px-2.5 py-1 rounded-md transition-colors font-medium border text-xs",
                filterType === 'fast' 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-muted/50 text-muted-foreground border-border/50 hover:text-foreground"
              )}
            >
              Fast 50kW+ (3)
            </button>
            <button
              type="button"
              onClick={() => setFilterType('standard')}
              className={cn(
                "px-2.5 py-1 rounded-md transition-colors font-medium border text-xs",
                filterType === 'standard' 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-muted/50 text-muted-foreground border-border/50 hover:text-foreground"
              )}
            >
              Standard 22kW (2)
            </button>
            <button
              type="button"
              onClick={() => setFilterType('slow')}
              className={cn(
                "px-2.5 py-1 rounded-md transition-colors font-medium border text-xs",
                filterType === 'slow' 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-muted/50 text-muted-foreground border-border/50 hover:text-foreground"
              )}
            >
              Slow 7kW (1)
            </button>
          </div>

          {/* Stations List */}
          <div className="space-y-2.5">
            {filteredStations.map(station => (
              <div 
                key={station.id}
                className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-card hover:bg-accent/40 transition-all hover:border-primary/20 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-full ${
                    station.status === 'charging' 
                      ? 'bg-amber-500/15 text-amber-500' 
                      : station.status === 'available'
                      ? 'bg-emerald-500/15 text-emerald-500'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {station.status === 'charging' ? (
                      <BatteryCharging className="w-5 h-5" />
                    ) : (
                      <Battery className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold flex items-center gap-2 text-sm text-foreground">
                      {station.name}
                      {getStatusBadge(station.status)}
                      <span className="text-[11px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                        {station.connector}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3 h-3 text-primary" />
                      <span>{station.lotName}</span>
                      <span>•</span>
                      <span className="font-medium text-foreground">{station.powerKw} kW</span>
                    </div>
                    {station.status === 'charging' && station.currentCharge && (
                      <div className="mt-2 w-36">
                        <div className="flex justify-between text-[11px] mb-1 text-muted-foreground">
                          <span className="font-medium text-foreground">{station.currentCharge}%</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-500" />
                            {station.estimatedTime} {isHindi ? 'मिनट' : 'min left'}
                          </span>
                        </div>
                        <Progress value={station.currentCharge} className="h-1.5 bg-muted" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="text-sm font-bold text-foreground">₹{station.pricePerKwh}<span className="text-xs font-normal text-muted-foreground">/kWh</span></div>
                  {station.status === 'available' ? (
                    <Button 
                      size="sm" 
                      className="mt-1 h-7 text-xs px-3 font-semibold shadow-xs"
                      onClick={() => {
                        setSelectedStation(station);
                        setReserveOpen(true);
                      }}
                    >
                      {isHindi ? 'बुक करें' : 'Reserve'}
                    </Button>
                  ) : station.status === 'charging' ? (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1">In Use</span>
                  ) : station.status === 'maintenance' ? (
                    <span className="text-[11px] text-rose-500 font-medium mt-1">Service</span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground font-medium mt-1">Occupied</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </div>

      {/* Footer Area - Reconciles Height with EVBatteryStatus */}
      <div className="px-6 pb-6 pt-2 space-y-3">
        {/* Summary Stats (Identical 3-column layout matching EVBatteryStatus) */}
        <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-muted/50 border border-border/40 text-center">
          <div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {availableCount} / {mockStations.length}
            </div>
            <div className="text-xs text-muted-foreground">
              {isHindi ? 'उपलब्ध स्लॉट' : 'Available Ports'}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">
              ₹{avgTariff}
            </div>
            <div className="text-xs text-muted-foreground">
              {isHindi ? 'औसत ₹/kWh' : 'Avg Rate/kWh'}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              100%
            </div>
            <div className="text-xs text-muted-foreground">
              {isHindi ? 'सोलर पावर्ड' : 'Solar-Backed'}
            </div>
          </div>
        </div>

        {/* Green Energy & Off-Peak Tariff Benefit Note */}
        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              {isHindi 
                ? 'नाइट टैरिफ छूट: रात 11 बजे से सुबह 6 बजे तक 20% की बचत।'
                : 'Night Owl Rebate: 20% discount on charging between 11 PM – 6 AM.'}
            </span>
          </div>
          <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-medium shrink-0">
            Off-Peak Active
          </Badge>
        </div>
      </div>

      {/* Reserve Dialog */}
      <Dialog open={reserveOpen} onOpenChange={setReserveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-500" />
              {isHindi ? 'ईवी चार्जिंग बुक करें' : 'Reserve EV Charging'}
            </DialogTitle>
          </DialogHeader>
          {selectedStation && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                <div className="font-semibold text-foreground text-base">{selectedStation.name}</div>
                <div className="text-sm text-muted-foreground">{selectedStation.lotName}</div>
                <div className="text-xs text-primary font-medium mt-1">
                  {getTypeLabel(selectedStation.type)} • {selectedStation.connector} ({selectedStation.powerKw} kW)
                </div>
              </div>

              <div className="space-y-2">
                <Label>{isHindi ? 'चार्जिंग समय' : 'Charging Duration'}</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 {isHindi ? 'मिनट' : 'minutes'}</SelectItem>
                    <SelectItem value="60">1 {isHindi ? 'घंटा' : 'hour'}</SelectItem>
                    <SelectItem value="120">2 {isHindi ? 'घंटे' : 'hours'}</SelectItem>
                    <SelectItem value="180">3 {isHindi ? 'घंटे' : 'hours'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex justify-between items-center">
                  <span className="text-sm">{isHindi ? 'अनुमानित लागत' : 'Estimated Cost'}</span>
                  <span className="font-bold text-base text-emerald-600 dark:text-emerald-400">
                    ₹{Math.round(selectedStation.pricePerKwh * (parseInt(duration) / 60) * (selectedStation.powerKw * 0.7))}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  {isHindi 
                    ? `(चार्जिंग दर ₹${selectedStation.pricePerKwh}/kWh • ${selectedStation.powerKw}kW ग्रिड कनेक्शन पर आधारित)` 
                    : `(Based on ₹${selectedStation.pricePerKwh}/kWh • ${selectedStation.powerKw} kW standard transfer capacity)`}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReserveOpen(false)}>
              {isHindi ? 'रद्द करें' : 'Cancel'}
            </Button>
            <Button onClick={handleReserve} className="gap-2 font-semibold">
              <Check className="w-4 h-4" />
              {isHindi ? 'बुक करें' : 'Confirm Reservation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
