import React, { useState, useMemo, useCallback } from 'react';
import { Search, MapPin, Car, IndianRupee, Navigation, Leaf, Wind, Clock, CalendarPlus, RefreshCw, Map, Gift, History, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GovHeader } from '@/components/ui/GovHeader';
import { ParkingLotSkeleton } from '@/components/ui/ParkingLotSkeleton';
import { useParkingLots } from '@/hooks/useParkingLots';
import { ReservationDialog } from '@/components/citizen/ReservationDialog';
import { PendingFinesBanner } from '@/components/citizen/PendingFinesBanner';
import { estimateTravelTime } from '@/lib/travelTime';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useNavigate, Link } from 'react-router-dom';

interface ParkingLot {
  id: string;
  name: string;
  zone: string;
  lat: number;
  lng: number;
  capacity: number;
  current_occupancy: number;
  hourly_rate: number;
  status: string;
}

export default function CitizenPortal() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(null);
  const [reservationOpen, setReservationOpen] = useState(false);
  const { data: lots, isLoading, refetch, isFetching } = useParkingLots();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setTouchStart(e.touches[0].clientY);
    }
  }, []);

  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'success') => {
    if ('vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(20);
          break;
        case 'success':
          navigator.vibrate([30, 50, 30]);
          break;
      }
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStart === null) return;
    const currentTouch = e.touches[0].clientY;
    const distance = currentTouch - touchStart;
    if (distance > 0 && window.scrollY === 0) {
      const newDistance = Math.min(distance, 100);
      // Trigger haptic when crossing the threshold
      if (pullDistance <= 60 && newDistance > 60) {
        triggerHapticFeedback('medium');
      }
      setPullDistance(newDistance);
    }
  }, [touchStart, pullDistance, triggerHapticFeedback]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > 60) {
      triggerHapticFeedback('success');
      setIsRefreshing(true);
      await refetch();
      setIsRefreshing(false);
    }
    setTouchStart(null);
    setPullDistance(0);
  }, [pullDistance, refetch, triggerHapticFeedback]);

  const popularLocations = ['Connaught Place', 'Karol Bagh', 'Lajpat Nagar', 'Sarojini Nagar'];

  const filteredLots = lots?.filter(lot => 
    lot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lot.zone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Memoize travel times so they don't change on every render
  const travelTimes = useMemo(() => {
    if (!lots) return {};
    const times: Record<string, ReturnType<typeof estimateTravelTime>> = {};
    lots.forEach(lot => {
      times[lot.id] = estimateTravelTime(lot.lat, lot.lng);
    });
    return times;
  }, [lots]);

  const getAvailabilityStatus = (current: number, capacity: number) => {
    const percentage = (current / capacity) * 100;
    if (percentage >= 95) return { label: 'Full', color: 'destructive' as const, available: 0 };
    if (percentage >= 80) return { label: 'Limited', color: 'warning' as const, available: capacity - current };
    return { label: 'Available', color: 'success' as const, available: capacity - current };
  };

  const handleReserve = (lot: ParkingLot) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setSelectedLot(lot);
    setReservationOpen(true);
  };

  const getTrafficColor = (traffic: 'light' | 'moderate' | 'heavy') => {
    switch (traffic) {
      case 'light': return 'text-success';
      case 'moderate': return 'text-warning';
      case 'heavy': return 'text-destructive';
    }
  };

  return (
    <div 
      className="min-h-screen bg-background"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to Refresh Indicator */}
      <div 
        className="flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{ height: pullDistance > 0 ? pullDistance : 0 }}
      >
        <RefreshCw 
          className={cn(
            "w-6 h-6 text-primary transition-transform",
            (isRefreshing || isFetching) && "animate-spin",
            pullDistance > 60 && "text-success"
          )} 
        />
        {pullDistance > 0 && (
          <span className="ml-2 text-sm text-muted-foreground">
            {pullDistance > 60 ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        )}
      </div>

      <GovHeader 
        title="NIGAM-Park" 
        subtitle="Find Parking in Delhi"
      />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Pending Fines Banner */}
        {user && (
          <div className="mb-6">
            <PendingFinesBanner />
          </div>
        )}

        {/* Quick Actions for Citizens */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link to="/live-map">
              <Map className="w-4 h-4 mr-2" />
              Live Map
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/loyalty">
              <Gift className="w-4 h-4 mr-2" />
              Loyalty Rewards
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/my-reservations">
              <History className="w-4 h-4 mr-2" />
              My Reservations
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/notifications">
              <Bell className="w-4 h-4 mr-2" />
              Alerts Settings
            </Link>
          </Button>
        </div>

        {/* AQI Banner */}
        <Card className="mb-6 bg-success/10 border-success/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-success/20">
                <Leaf className="w-5 h-5 text-success" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-success">Park Smartly, Reduce AQI</p>
                <p className="text-sm text-muted-foreground">
                  Efficient parking reduces vehicle idling and helps improve Delhi's air quality
                </p>
              </div>
              <div className="text-right hidden sm:block">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Wind className="w-4 h-4" />
                  <span>Current AQI: </span>
                  <Badge variant="outline" className="border-warning text-warning">156</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Section */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Find parking near..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
          
          {/* Quick Select */}
          <div className="flex flex-wrap gap-2 mt-3">
            {popularLocations.map(location => (
              <Button
                key={location}
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery(location)}
                className="text-sm"
              >
                <MapPin className="w-3 h-3 mr-1" />
                {location}
              </Button>
            ))}
          </div>
        </div>

        {/* Parking Lots Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <ParkingLotSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLots?.map(lot => {
              const status = getAvailabilityStatus(lot.current_occupancy, lot.capacity);
              const travelTime = travelTimes[lot.id];
              
              return (
                <Card key={lot.id} className="data-card overflow-hidden">
                  <CardContent className="p-0">
                    {/* Status Bar */}
                    <div className={cn(
                      'h-2',
                      status.color === 'success' && 'bg-success',
                      status.color === 'warning' && 'bg-warning',
                      status.color === 'destructive' && 'bg-destructive',
                    )} />
                    
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-foreground">{lot.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {lot.zone}
                          </p>
                        </div>
                        <Badge 
                          variant={status.color === 'success' ? 'default' : 'outline'}
                          className={cn(
                            status.color === 'success' && 'bg-success text-success-foreground',
                            status.color === 'warning' && 'border-warning text-warning',
                            status.color === 'destructive' && 'border-destructive text-destructive',
                          )}
                        >
                          {status.label}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-sm">
                            <Car className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {status.available} spots
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <IndianRupee className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              ₹{lot.hourly_rate}/hr
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Travel Time Display */}
                      {travelTime && (
                        <div className="flex items-center gap-2 mb-3 p-2 rounded-md bg-muted/50">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            <span className="font-medium">{travelTime.minutes} min</span>
                            <span className="text-muted-foreground"> • {travelTime.distance}</span>
                          </span>
                          <Badge 
                            variant="outline" 
                            className={cn('ml-auto text-xs capitalize', getTrafficColor(travelTime.traffic))}
                          >
                            {travelTime.traffic} traffic
                          </Badge>
                        </div>
                      )}
                      
                      {/* Capacity Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Occupancy</span>
                          <span>{lot.current_occupancy}/{lot.capacity}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              'h-full rounded-full transition-all',
                              status.color === 'success' && 'bg-success',
                              status.color === 'warning' && 'bg-warning',
                              status.color === 'destructive' && 'bg-destructive',
                            )}
                            style={{ width: `${(lot.current_occupancy / lot.capacity) * 100}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1 gap-2"
                          variant="outline"
                          onClick={() => {
                            const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lot.lat},${lot.lng}&travelmode=driving`;
                            window.open(mapsUrl, '_blank', 'noopener,noreferrer');
                          }}
                        >
                          <Navigation className="w-4 h-4" />
                          Directions
                        </Button>
                        <Button 
                          className="flex-1 gap-2"
                          variant={status.color === 'destructive' ? 'secondary' : 'default'}
                          disabled={status.color === 'destructive'}
                          onClick={() => handleReserve(lot)}
                        >
                          <CalendarPlus className="w-4 h-4" />
                          {status.color === 'destructive' ? 'Full' : 'Reserve'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {filteredLots?.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">No parking lots found</p>
            <p className="text-muted-foreground">Try searching for a different location</p>
          </div>
        )}
      </main>

      <ReservationDialog
        open={reservationOpen}
        onOpenChange={setReservationOpen}
        parkingLot={selectedLot}
      />
    </div>
  );
}
