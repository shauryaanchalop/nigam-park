import React, { useState } from 'react';
import { Users, MapPin, Clock, DollarSign, Car, UserPlus, Check, Share2, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface CarpoolRide {
  id: string;
  driver: { name: string; rating: number; trips: number };
  from: string;
  to: string;
  departureTime: string;
  seatsAvailable: number;
  seatsTotal: number;
  pricePerSeat: number;
  parkingLot: string;
  status: 'open' | 'filling' | 'full';
}

const mockRides: CarpoolRide[] = [
  { 
    id: '1', 
    driver: { name: 'Rajesh K.', rating: 4.8, trips: 156 },
    from: 'Dwarka Sec-21', 
    to: 'Connaught Place', 
    departureTime: '09:00 AM',
    seatsAvailable: 2, 
    seatsTotal: 3, 
    pricePerSeat: 50,
    parkingLot: 'CP Central Parking',
    status: 'open'
  },
  { 
    id: '2', 
    driver: { name: 'Priya S.', rating: 4.9, trips: 89 },
    from: 'Noida Sec-62', 
    to: 'Nehru Place', 
    departureTime: '08:30 AM',
    seatsAvailable: 1, 
    seatsTotal: 3, 
    pricePerSeat: 60,
    parkingLot: 'Nehru Place Parking',
    status: 'filling'
  },
  { 
    id: '3', 
    driver: { name: 'Amit V.', rating: 4.7, trips: 234 },
    from: 'Gurugram DLF', 
    to: 'Karol Bagh', 
    departureTime: '09:30 AM',
    seatsAvailable: 0, 
    seatsTotal: 4, 
    pricePerSeat: 70,
    parkingLot: 'Karol Bagh Municipal',
    status: 'full'
  },
];

export function CarpoolingIntegration() {
  const { isHindi } = useLanguage();
  const [selectedRide, setSelectedRide] = useState<CarpoolRide | null>(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const getStatusBadge = (status: CarpoolRide['status']) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-success">{isHindi ? 'उपलब्ध' : 'Open'}</Badge>;
      case 'filling':
        return <Badge className="bg-warning">{isHindi ? 'भर रहा है' : 'Filling'}</Badge>;
      case 'full':
        return <Badge variant="secondary">{isHindi ? 'भरा हुआ' : 'Full'}</Badge>;
    }
  };

  const handleJoinRide = () => {
    toast.success(isHindi ? 'राइड में शामिल हो गए!' : 'Joined the ride!', {
      description: isHindi 
        ? `₹${selectedRide?.pricePerSeat} में ${selectedRide?.to} तक` 
        : `To ${selectedRide?.to} for ₹${selectedRide?.pricePerSeat}`,
    });
    setJoinOpen(false);
    setSelectedRide(null);
  };

  const handleCreateRide = () => {
    toast.success(isHindi ? 'राइड बनाई गई!' : 'Ride created!', {
      description: isHindi ? 'अन्य यात्री अब आपकी राइड में शामिल हो सकते हैं' : 'Other commuters can now join your ride',
    });
    setCreateOpen(false);
  };

  const availableRides = mockRides.filter(r => r.status !== 'full').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          {isHindi ? 'कारपूलिंग' : 'Carpooling'}
        </CardTitle>
        <CardDescription>
          {isHindi 
            ? 'पार्किंग खर्च साझा करें और यातायात कम करें'
            : 'Share parking costs and reduce traffic congestion'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Feature Description */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
          <p className="text-xs text-muted-foreground">
            {isHindi 
              ? '🚗 कारपूलिंग से आप अन्य यात्रियों के साथ राइड और पार्किंग शुल्क साझा कर सकते हैं। यह पर्यावरण के लिए भी अच्छा है!'
              : '🚗 Carpooling lets you share rides and parking fees with fellow commuters. Great for the environment too!'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="p-2 rounded-lg bg-success/10 border border-success/20 text-center">
            <div className="text-lg font-bold text-success">{availableRides}</div>
            <div className="text-xs text-muted-foreground">{isHindi ? 'उपलब्ध राइड्स' : 'Available'}</div>
          </div>
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-center">
            <div className="text-lg font-bold text-primary">₹60</div>
            <div className="text-xs text-muted-foreground">{isHindi ? 'औसत बचत' : 'Avg Savings'}</div>
          </div>
          <div className="p-2 rounded-lg bg-muted text-center">
            <div className="text-lg font-bold">2.5kg</div>
            <div className="text-xs text-muted-foreground">CO₂ {isHindi ? 'बचत' : 'Saved'}</div>
          </div>
        </div>

        {/* Create Ride Button */}
        <Button className="w-full mb-4 gap-2" onClick={() => setCreateOpen(true)}>
          <Car className="w-4 h-4" />
          {isHindi ? 'राइड ऑफर करें' : 'Offer a Ride'}
        </Button>

        {/* Available Rides */}
        <div className="space-y-3">
          {mockRides.map(ride => (
            <div 
              key={ride.id}
              className={`p-3 rounded-lg border transition-colors ${
                ride.status === 'full' ? 'opacity-60' : 'hover:bg-accent/50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs">{ride.driver.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-sm">{ride.driver.name}</div>
                    <div className="text-xs text-muted-foreground">⭐ {ride.driver.rating} • {ride.driver.trips} {isHindi ? 'ट्रिप्स' : 'trips'}</div>
                  </div>
                </div>
                {getStatusBadge(ride.status)}
              </div>

              <div className="space-y-1 mb-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-3 h-3 text-success" />
                  <span className="text-muted-foreground">{ride.from}</span>
                  <span className="text-xs">→</span>
                  <MapPin className="w-3 h-3 text-destructive" />
                  <span>{ride.to}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {ride.departureTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <Car className="w-3 h-3" />
                    {ride.parkingLot}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1">
                    {Array.from({ length: ride.seatsTotal }).map((_, i) => (
                      <div 
                        key={i}
                        className={`w-5 h-5 rounded-full border-2 border-background flex items-center justify-center text-xs ${
                          i < ride.seatsTotal - ride.seatsAvailable ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}
                      >
                        {i < ride.seatsTotal - ride.seatsAvailable ? '✓' : ''}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {ride.seatsAvailable}/{ride.seatsTotal} {isHindi ? 'सीटें खाली' : 'seats free'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-success">₹{ride.pricePerSeat}</span>
                  <span className="text-xs text-muted-foreground">/{isHindi ? 'सीट' : 'seat'}</span>
                </div>
              </div>

              {ride.status !== 'full' && (
                <Button 
                  size="sm" 
                  className="w-full mt-2 gap-1"
                  onClick={() => {
                    setSelectedRide(ride);
                    setJoinOpen(true);
                  }}
                >
                  <UserPlus className="w-3 h-3" />
                  {isHindi ? 'शामिल हों' : 'Join Ride'}
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Join Ride Dialog */}
        <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                {isHindi ? 'राइड में शामिल हों' : 'Join Carpool Ride'}
              </DialogTitle>
            </DialogHeader>
            {selectedRide && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>{selectedRide.driver.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{selectedRide.driver.name}</div>
                      <div className="text-xs text-muted-foreground">⭐ {selectedRide.driver.rating}</div>
                    </div>
                  </div>
                  <div className="text-sm">
                    <strong>{selectedRide.from}</strong> → <strong>{selectedRide.to}</strong>
                  </div>
                  <div className="text-sm text-muted-foreground">{selectedRide.departureTime}</div>
                </div>

                <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                  <div className="flex justify-between items-center">
                    <span>{isHindi ? 'प्रति सीट लागत' : 'Cost per Seat'}</span>
                    <span className="font-bold text-lg">₹{selectedRide.pricePerSeat}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isHindi ? 'इसमें पार्किंग शुल्क शामिल है' : 'Includes shared parking fee'}
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setJoinOpen(false)}>
                {isHindi ? 'रद्द करें' : 'Cancel'}
              </Button>
              <Button onClick={handleJoinRide} className="gap-2">
                <Check className="w-4 h-4" />
                {isHindi ? 'राइड बुक करें' : 'Confirm Booking'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Ride Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Car className="w-5 h-5 text-primary" />
                {isHindi ? 'राइड ऑफर करें' : 'Offer a Ride'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{isHindi ? 'शुरुआत का स्थान' : 'Starting Point'}</Label>
                <Input placeholder={isHindi ? 'जैसे: द्वारका सेक्टर 21' : 'e.g., Dwarka Sector 21'} />
              </div>
              <div className="space-y-2">
                <Label>{isHindi ? 'गंतव्य पार्किंग' : 'Destination Parking'}</Label>
                <Input placeholder={isHindi ? 'जैसे: कनॉट प्लेस' : 'e.g., Connaught Place'} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isHindi ? 'प्रस्थान समय' : 'Departure Time'}</Label>
                  <Input type="time" defaultValue="09:00" />
                </div>
                <div className="space-y-2">
                  <Label>{isHindi ? 'उपलब्ध सीटें' : 'Available Seats'}</Label>
                  <Input type="number" min="1" max="4" defaultValue="3" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{isHindi ? 'प्रति सीट मूल्य (₹)' : 'Price per Seat (₹)'}</Label>
                <Input type="number" min="20" max="200" defaultValue="50" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                {isHindi ? 'रद्द करें' : 'Cancel'}
              </Button>
              <Button onClick={handleCreateRide} className="gap-2">
                <Share2 className="w-4 h-4" />
                {isHindi ? 'राइड प्रकाशित करें' : 'Publish Ride'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
