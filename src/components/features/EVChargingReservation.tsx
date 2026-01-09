import React, { useState } from 'react';
import { Zap, Battery, BatteryCharging, Clock, MapPin, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface ChargingStation {
  id: string;
  name: string;
  lotName: string;
  type: 'fast' | 'standard' | 'slow';
  status: 'available' | 'charging' | 'occupied' | 'maintenance';
  currentCharge?: number;
  estimatedTime?: number;
  pricePerKwh: number;
}

const mockStations: ChargingStation[] = [
  { id: '1', name: 'EV-01', lotName: 'Connaught Place', type: 'fast', status: 'available', pricePerKwh: 15 },
  { id: '2', name: 'EV-02', lotName: 'Connaught Place', type: 'fast', status: 'charging', currentCharge: 67, estimatedTime: 25, pricePerKwh: 15 },
  { id: '3', name: 'EV-03', lotName: 'Karol Bagh', type: 'standard', status: 'available', pricePerKwh: 12 },
  { id: '4', name: 'EV-04', lotName: 'Karol Bagh', type: 'standard', status: 'occupied', pricePerKwh: 12 },
  { id: '5', name: 'EV-05', lotName: 'Lajpat Nagar', type: 'slow', status: 'maintenance', pricePerKwh: 8 },
  { id: '6', name: 'EV-06', lotName: 'Nehru Place', type: 'fast', status: 'available', pricePerKwh: 15 },
];

export function EVChargingReservation() {
  const { isHindi } = useLanguage();
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [duration, setDuration] = useState('60');

  const getStatusBadge = (status: ChargingStation['status']) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-success">{isHindi ? 'उपलब्ध' : 'Available'}</Badge>;
      case 'charging':
        return <Badge className="bg-warning">{isHindi ? 'चार्जिंग' : 'Charging'}</Badge>;
      case 'occupied':
        return <Badge variant="secondary">{isHindi ? 'व्यस्त' : 'Occupied'}</Badge>;
      case 'maintenance':
        return <Badge variant="destructive">{isHindi ? 'रखरखाव' : 'Maintenance'}</Badge>;
    }
  };

  const getTypeLabel = (type: ChargingStation['type']) => {
    if (isHindi) {
      switch (type) {
        case 'fast': return 'फास्ट (50kW)';
        case 'standard': return 'स्टैंडर्ड (22kW)';
        case 'slow': return 'स्लो (7kW)';
      }
    }
    switch (type) {
      case 'fast': return 'Fast (50kW)';
      case 'standard': return 'Standard (22kW)';
      case 'slow': return 'Slow (7kW)';
    }
  };

  const handleReserve = () => {
    toast.success(isHindi ? 'ईवी चार्जिंग स्लॉट बुक हो गया!' : 'EV charging slot reserved!', {
      description: `${selectedStation?.name} - ${duration} ${isHindi ? 'मिनट' : 'mins'}`,
    });
    setReserveOpen(false);
    setSelectedStation(null);
  };

  const availableCount = mockStations.filter(s => s.status === 'available').length;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-success" />
          {isHindi ? 'ईवी चार्जिंग स्टेशन' : 'EV Charging Stations'}
        </CardTitle>
        <CardDescription>
          {isHindi 
            ? `${availableCount} चार्जिंग स्लॉट उपलब्ध`
            : `${availableCount} charging slots available`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Feature Description */}
        <div className="p-3 rounded-lg bg-success/5 border border-success/20 mb-4">
          <p className="text-xs text-muted-foreground">
            {isHindi 
              ? '⚡ ईवी चार्जिंग स्टेशन पहले से बुक करें और चार्जिंग की प्रतीक्षा से बचें। फास्ट, स्टैंडर्ड और स्लो चार्जर उपलब्ध हैं।'
              : '⚡ Reserve EV charging stations in advance and skip the wait. Fast, Standard, and Slow chargers available across parking lots.'}
          </p>
        </div>

        <div className="space-y-3">
          {mockStations.map(station => (
            <div 
              key={station.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${station.status === 'charging' ? 'bg-warning/20' : 'bg-success/20'}`}>
                  {station.status === 'charging' ? (
                    <BatteryCharging className="w-5 h-5 text-warning" />
                  ) : (
                    <Battery className="w-5 h-5 text-success" />
                  )}
                </div>
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {station.name}
                    {getStatusBadge(station.status)}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {station.lotName} • {getTypeLabel(station.type)}
                  </div>
                  {station.status === 'charging' && station.currentCharge && (
                    <div className="mt-2 w-32">
                      <div className="flex justify-between text-xs mb-1">
                        <span>{station.currentCharge}%</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {station.estimatedTime} {isHindi ? 'मिनट' : 'min'}
                        </span>
                      </div>
                      <Progress value={station.currentCharge} className="h-1.5" />
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">₹{station.pricePerKwh}/kWh</div>
                {station.status === 'available' && (
                  <Button 
                    size="sm" 
                    className="mt-1"
                    onClick={() => {
                      setSelectedStation(station);
                      setReserveOpen(true);
                    }}
                  >
                    {isHindi ? 'बुक करें' : 'Reserve'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Reserve Dialog */}
        <Dialog open={reserveOpen} onOpenChange={setReserveOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-success" />
                {isHindi ? 'ईवी चार्जिंग बुक करें' : 'Reserve EV Charging'}
              </DialogTitle>
            </DialogHeader>
            {selectedStation && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="font-medium">{selectedStation.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedStation.lotName}</div>
                  <div className="text-sm">{getTypeLabel(selectedStation.type)}</div>
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

                <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                  <div className="flex justify-between">
                    <span>{isHindi ? 'अनुमानित लागत' : 'Estimated Cost'}</span>
                    <span className="font-bold">₹{Math.round(selectedStation.pricePerKwh * (parseInt(duration) / 60) * 7)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {isHindi ? '(औसत 7 kWh/घंटा पर आधारित)' : '(Based on avg 7 kWh/hour)'}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setReserveOpen(false)}>
                {isHindi ? 'रद्द करें' : 'Cancel'}
              </Button>
              <Button onClick={handleReserve} className="gap-2">
                <Check className="w-4 h-4" />
                {isHindi ? 'बुक करें' : 'Confirm Reservation'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
