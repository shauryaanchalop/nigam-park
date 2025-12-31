import React, { useState } from 'react';
import { Siren, Shield, Clock, MapPin, Check, AlertTriangle, Radio, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface EmergencySpot {
  id: string;
  lotName: string;
  spotNumber: string;
  type: 'ambulance' | 'fire' | 'police' | 'vip';
  status: 'available' | 'reserved' | 'occupied';
  reservedFor?: string;
}

const mockSpots: EmergencySpot[] = [
  { id: '1', lotName: 'Connaught Place', spotNumber: 'E-01', type: 'ambulance', status: 'available' },
  { id: '2', lotName: 'Connaught Place', spotNumber: 'E-02', type: 'fire', status: 'reserved', reservedFor: 'Delhi Fire Services' },
  { id: '3', lotName: 'Karol Bagh', spotNumber: 'E-01', type: 'police', status: 'available' },
  { id: '4', lotName: 'Karol Bagh', spotNumber: 'E-02', type: 'ambulance', status: 'occupied' },
  { id: '5', lotName: 'Nehru Place', spotNumber: 'V-01', type: 'vip', status: 'available' },
  { id: '6', lotName: 'Lajpat Nagar', spotNumber: 'E-01', type: 'ambulance', status: 'available' },
];

export function EmergencyVehiclePriority() {
  const { isHindi } = useLanguage();
  const [reserveOpen, setReserveOpen] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<EmergencySpot | null>(null);
  const [vehicleType, setVehicleType] = useState<string>('');

  const getTypeInfo = (type: EmergencySpot['type']) => {
    switch (type) {
      case 'ambulance':
        return { 
          icon: <Siren className="w-4 h-4" />, 
          label: isHindi ? 'एम्बुलेंस' : 'Ambulance',
          color: 'bg-destructive/10 text-destructive border-destructive/20'
        };
      case 'fire':
        return { 
          icon: <Zap className="w-4 h-4" />, 
          label: isHindi ? 'दमकल' : 'Fire Brigade',
          color: 'bg-orange-500/10 text-orange-500 border-orange-500/20'
        };
      case 'police':
        return { 
          icon: <Shield className="w-4 h-4" />, 
          label: isHindi ? 'पुलिस' : 'Police',
          color: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
        };
      case 'vip':
        return { 
          icon: <Shield className="w-4 h-4" />, 
          label: isHindi ? 'वीआईपी' : 'VIP',
          color: 'bg-purple-500/10 text-purple-500 border-purple-500/20'
        };
    }
  };

  const getStatusBadge = (status: EmergencySpot['status']) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-success">{isHindi ? 'उपलब्ध' : 'Available'}</Badge>;
      case 'reserved':
        return <Badge className="bg-warning">{isHindi ? 'आरक्षित' : 'Reserved'}</Badge>;
      case 'occupied':
        return <Badge variant="secondary">{isHindi ? 'व्यस्त' : 'Occupied'}</Badge>;
    }
  };

  const handleReserve = () => {
    toast.success(isHindi ? 'आपातकालीन स्लॉट आरक्षित!' : 'Emergency spot reserved!', {
      description: `${selectedSpot?.spotNumber} @ ${selectedSpot?.lotName}`,
    });
    setReserveOpen(false);
    setSelectedSpot(null);
  };

  const availableSpots = mockSpots.filter(s => s.status === 'available').length;
  const ambulanceSpots = mockSpots.filter(s => s.type === 'ambulance' && s.status === 'available').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Siren className="w-5 h-5 text-destructive" />
          {isHindi ? 'आपातकालीन वाहन प्राथमिकता' : 'Emergency Vehicle Priority'}
        </CardTitle>
        <CardDescription>
          {isHindi 
            ? 'आपातकालीन वाहनों के लिए तेज़ प्रवेश और समर्पित पार्किंग'
            : 'Fast-track entry and dedicated parking for emergency vehicles'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Feature Description */}
        <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
            <p className="text-xs text-muted-foreground">
              {isHindi 
                ? '🚨 आपातकालीन वाहनों (एम्बुलेंस, दमकल, पुलिस) को प्राथमिकता प्रवेश और समर्पित पार्किंग स्थान मिलता है। सभी बैरियर स्वचालित रूप से खुल जाते हैं।'
                : '🚨 Emergency vehicles (ambulance, fire, police) get priority entry and dedicated parking spots. All barriers open automatically.'}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-success/10 border border-success/20">
            <div className="flex items-center gap-2 mb-1">
              <Radio className="w-4 h-4 text-success" />
              <span className="text-sm font-medium">{isHindi ? 'उपलब्ध स्लॉट' : 'Available Spots'}</span>
            </div>
            <div className="text-2xl font-bold text-success">{availableSpots}</div>
          </div>
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-2 mb-1">
              <Siren className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium">{isHindi ? 'एम्बुलेंस स्लॉट' : 'Ambulance Spots'}</span>
            </div>
            <div className="text-2xl font-bold text-destructive">{ambulanceSpots}</div>
          </div>
        </div>

        {/* Fast Track Entry */}
        <div className="p-3 rounded-lg border border-dashed border-primary/50 bg-primary/5 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="font-medium">{isHindi ? 'फास्ट ट्रैक एंट्री' : 'Fast Track Entry'}</span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            {isHindi 
              ? 'आपातकालीन वाहन पहचान से सभी बैरियर स्वचालित रूप से खुलते हैं'
              : 'All barriers open automatically upon emergency vehicle detection'}
          </p>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1 text-success">
              <Check className="w-3 h-3" />
              <span>{isHindi ? 'ANPR सक्रिय' : 'ANPR Active'}</span>
            </div>
            <div className="flex items-center gap-1 text-success">
              <Check className="w-3 h-3" />
              <span>{isHindi ? 'बीकन डिटेक्शन' : 'Beacon Detection'}</span>
            </div>
          </div>
        </div>

        {/* Spot List */}
        <div className="space-y-2">
          {mockSpots.map(spot => {
            const typeInfo = getTypeInfo(spot.type);
            return (
              <div 
                key={spot.id}
                className={`p-3 rounded-lg border transition-colors ${
                  spot.status === 'available' ? 'hover:bg-accent/50 cursor-pointer' : 'opacity-60'
                }`}
                onClick={() => {
                  if (spot.status === 'available') {
                    setSelectedSpot(spot);
                    setReserveOpen(true);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border ${typeInfo.color}`}>
                      {typeInfo.icon}
                    </div>
                    <div>
                      <div className="font-medium text-sm flex items-center gap-2">
                        {spot.spotNumber}
                        <Badge variant="outline" className="text-xs">{typeInfo.label}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {spot.lotName}
                        {spot.reservedFor && (
                          <span className="ml-2">• {spot.reservedFor}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(spot.status)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Reserve Dialog */}
        <Dialog open={reserveOpen} onOpenChange={setReserveOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Siren className="w-5 h-5 text-destructive" />
                {isHindi ? 'आपातकालीन स्लॉट आरक्षित करें' : 'Reserve Emergency Spot'}
              </DialogTitle>
            </DialogHeader>
            {selectedSpot && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="font-medium">{selectedSpot.spotNumber}</div>
                  <div className="text-sm text-muted-foreground">{selectedSpot.lotName}</div>
                </div>

                <div className="space-y-2">
                  <Label>{isHindi ? 'वाहन प्रकार' : 'Vehicle Type'}</Label>
                  <Select value={vehicleType} onValueChange={setVehicleType}>
                    <SelectTrigger>
                      <SelectValue placeholder={isHindi ? 'चुनें' : 'Select'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ambulance">{isHindi ? 'एम्बुलेंस' : 'Ambulance'}</SelectItem>
                      <SelectItem value="fire">{isHindi ? 'दमकल' : 'Fire Brigade'}</SelectItem>
                      <SelectItem value="police">{isHindi ? 'पुलिस' : 'Police'}</SelectItem>
                      <SelectItem value="vip">{isHindi ? 'वीआईपी एस्कॉर्ट' : 'VIP Escort'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{isHindi ? 'वाहन नंबर' : 'Vehicle Number'}</Label>
                  <Input placeholder={isHindi ? 'जैसे: DL 01 AB 1234' : 'e.g., DL 01 AB 1234'} />
                </div>

                <div className="space-y-2">
                  <Label>{isHindi ? 'विभाग/संस्था' : 'Department/Organization'}</Label>
                  <Input placeholder={isHindi ? 'जैसे: AIIMS Hospital' : 'e.g., AIIMS Hospital'} />
                </div>

                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">{isHindi ? 'नोट:' : 'Note:'}</strong>{' '}
                    {isHindi 
                      ? 'इस स्लॉट का उपयोग केवल आधिकारिक आपातकालीन वाहनों के लिए है। दुरुपयोग पर कार्रवाई होगी।'
                      : 'This spot is for official emergency vehicles only. Misuse will result in penalties.'}
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setReserveOpen(false)}>
                {isHindi ? 'रद्द करें' : 'Cancel'}
              </Button>
              <Button onClick={handleReserve} className="gap-2 bg-destructive hover:bg-destructive/90">
                <Siren className="w-4 h-4" />
                {isHindi ? 'आरक्षित करें' : 'Reserve Now'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
