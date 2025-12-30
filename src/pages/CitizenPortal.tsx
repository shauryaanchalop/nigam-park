import React, { useState, useMemo, useCallback } from 'react';
import { Search, MapPin, Car, IndianRupee, Navigation, Leaf, Wind, Clock, CalendarPlus, RefreshCw, Map, Gift, History, Bell, AlertTriangle, BookOpen, Train, Zap, Umbrella, CreditCard, Users, Building2, Star, TrendingUp, Headphones } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSurgePricing, calculateSurgePrice } from '@/hooks/useSurgePricing';
import { SurgePricingBadge } from '@/components/SurgePricingBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GovHeader } from '@/components/ui/GovHeader';
import { ParkingLotSkeleton } from '@/components/ui/ParkingLotSkeleton';
import { useParkingLots } from '@/hooks/useParkingLots';
import { ReservationDialog } from '@/components/citizen/ReservationDialog';
import { PendingFinesBanner } from '@/components/citizen/PendingFinesBanner';
import { Footer } from '@/components/Footer';
import { ParkingFilters } from '@/components/ParkingFilters';
import { WeatherRecommendation } from '@/components/WeatherRecommendation';
import { VoiceSearch } from '@/components/VoiceSearch';
import { AdvertisingSlot } from '@/components/ads/AdvertisingSlot';
import { RatingBadge } from '@/components/reviews/RatingBadge';
import { QuickReviewCard } from '@/components/reviews/QuickReviewCard';
import { CustomerCareCard } from '@/components/CustomerCareCard';
import { TeamDialog } from '@/components/TeamDialog';
import { estimateTravelTime } from '@/lib/travelTime';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useNavigate, Link } from 'react-router-dom';

type ParkingLot = {
  id: string;
  name: string;
  zone: string;
  lat: number;
  lng: number;
  capacity: number;
  current_occupancy: number;
  hourly_rate: number;
  status: string;
  has_ev_charging?: boolean | null;
  has_covered_parking?: boolean | null;
  near_metro?: boolean | null;
  metro_station?: string | null;
  average_rating?: number | null;
  review_count?: number | null;
};

export default function CitizenPortal() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(null);
  const [reservationOpen, setReservationOpen] = useState(false);
  const { data: lots, isLoading, refetch, isFetching } = useParkingLots();
  const { data: surgePricingRules } = useSurgePricing();
  const { user } = useAuth();
  const { isHindi, t } = useLanguage();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [filters, setFilters] = useState({
    evCharging: false,
    coveredParking: false,
    nearMetro: false,
  });

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

  const popularLocations = isHindi 
    ? ['कनॉट प्लेस', 'करोल बाग', 'लाजपत नगर', 'सरोजिनी नगर']
    : ['Connaught Place', 'Karol Bagh', 'Lajpat Nagar', 'Sarojini Nagar'];

  const filteredLots = useMemo(() => {
    let result = (lots as ParkingLot[] | undefined)?.filter(lot => 
      lot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lot.zone.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Apply feature filters
    if (filters.evCharging) {
      result = result?.filter(lot => lot.has_ev_charging);
    }
    if (filters.coveredParking) {
      result = result?.filter(lot => lot.has_covered_parking);
    }
    if (filters.nearMetro) {
      result = result?.filter(lot => lot.near_metro);
    }
    
    return result;
  }, [lots, searchQuery, filters]);

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
    if (percentage >= 95) return { label: isHindi ? 'भरा हुआ' : 'Full', color: 'destructive' as const, available: 0 };
    if (percentage >= 80) return { label: isHindi ? 'सीमित' : 'Limited', color: 'warning' as const, available: capacity - current };
    return { label: isHindi ? 'उपलब्ध' : 'Available', color: 'success' as const, available: capacity - current };
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

  const getTrafficLabel = (traffic: 'light' | 'moderate' | 'heavy') => {
    if (isHindi) {
      switch (traffic) {
        case 'light': return 'हल्का ट्रैफ़िक';
        case 'moderate': return 'मध्यम ट्रैफ़िक';
        case 'heavy': return 'भारी ट्रैफ़िक';
      }
    }
    return `${traffic} traffic`;
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
            {pullDistance > 60 
              ? (isHindi ? 'रिफ्रेश करने के लिए छोड़ें' : 'Release to refresh') 
              : (isHindi ? 'रिफ्रेश करने के लिए खींचें' : 'Pull to refresh')}
          </span>
        )}
      </div>

      <GovHeader 
        title={isHindi ? 'निगम-पार्क' : 'NIGAM-Park'} 
        subtitle={isHindi ? 'दिल्ली में पार्किंग खोजें' : 'Find Parking in Delhi'}
      />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Pending Fines Banner */}
        {user && (
          <div className="mb-6">
            <PendingFinesBanner />
          </div>
        )}

        {/* Weather Recommendation */}
        <WeatherRecommendation />

        {/* Spacer for better visual separation */}
        <div className="h-4" />

        {/* Quick Actions for Citizens */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Button variant="outline" size="sm" asChild>
            <Link to="/live-map">
              <Map className="w-4 h-4 mr-2" />
              {isHindi ? 'लाइव मैप' : 'Live Map'}
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/loyalty">
              <Gift className="w-4 h-4 mr-2" />
              {isHindi ? 'लॉयल्टी पुरस्कार' : 'Loyalty Rewards'}
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/my-reservations">
              <History className="w-4 h-4 mr-2" />
              {isHindi ? 'मेरी बुकिंग' : 'My Reservations'}
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/monthly-pass">
              <CreditCard className="w-4 h-4 mr-2" />
              {isHindi ? 'मासिक पास' : 'Monthly Pass'}
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/referral">
              <Users className="w-4 h-4 mr-2" />
              {isHindi ? 'रेफरल' : 'Referral'}
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/notifications">
              <Bell className="w-4 h-4 mr-2" />
              {isHindi ? 'अलर्ट सेटिंग्स' : 'Alerts Settings'}
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="border-destructive/50 text-destructive hover:bg-destructive/10">
            <Link to="/report-violation">
              <AlertTriangle className="w-4 h-4 mr-2" />
              {isHindi ? 'उल्लंघन रिपोर्ट करें' : 'Report Violation'}
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/blog">
              <BookOpen className="w-4 h-4 mr-2" />
              {isHindi ? 'पार्किंग टिप्स' : 'Parking Tips'}
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/business">
              <Building2 className="w-4 h-4 mr-2" />
              {isHindi ? 'व्यापार खाते' : 'Business Accounts'}
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/contact">
              <Headphones className="w-4 h-4 mr-2" />
              {isHindi ? 'ग्राहक सहायता' : 'Customer Care'}
            </Link>
          </Button>
        </div>

        {/* Team Info Button */}
        <div className="mb-4">
          <TeamDialog />
        </div>

        {/* Zone Links for SEO */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-2">
            {isHindi ? 'क्षेत्र के अनुसार पार्किंग खोजें:' : 'Find parking by area:'}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/parking/connaught-place">{isHindi ? 'सीपी' : 'CP'}</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/parking/karol-bagh">{isHindi ? 'करोल बाग' : 'Karol Bagh'}</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/parking/chandni-chowk">{isHindi ? 'चांदनी चौक' : 'Chandni Chowk'}</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/parking/lajpat-nagar">{isHindi ? 'लाजपत नगर' : 'Lajpat Nagar'}</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/parking/nehru-place">{isHindi ? 'नेहरू प्लेस' : 'Nehru Place'}</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/parking/sarojini-nagar">{isHindi ? 'सरोजिनी नगर' : 'Sarojini Nagar'}</Link>
            </Button>
          </div>
        </div>

        {/* AQI Banner */}
        <Card className="mb-6 bg-success/10 border-success/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-success/20">
                <Leaf className="w-5 h-5 text-success" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-success">
                  {isHindi ? 'स्मार्ट पार्किंग, AQI कम करें' : 'Park Smartly, Reduce AQI'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isHindi 
                    ? 'कुशल पार्किंग वाहनों के इंतजार को कम करती है और दिल्ली की वायु गुणवत्ता में सुधार करती है'
                    : 'Efficient parking reduces vehicle idling and helps improve Delhi\'s air quality'}
                </p>
              </div>
              <div className="text-right hidden sm:block">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Wind className="w-4 h-4" />
                  <span>{isHindi ? 'वर्तमान AQI:' : 'Current AQI:'} </span>
                  <Badge variant="outline" className="border-warning text-warning">156</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Section */}
        <div className="mb-6">
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder={isHindi ? 'पास में पार्किंग खोजें...' : 'Find parking near...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
            <VoiceSearch 
              onResult={(transcript) => setSearchQuery(transcript)} 
              className="h-12 w-12"
            />
          </div>
          
          {/* Quick Select */}
          <div className="flex flex-wrap gap-2 mt-3">
            {popularLocations.map((location, index) => (
              <Button
                key={index}
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

        {/* Advertising Slot */}
        <div className="mb-6">
          <AdvertisingSlot type="banner" />
        </div>

        {/* Parking Filters */}
        <ParkingFilters filters={filters} onChange={setFilters} />

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
              const surgeInfo = calculateSurgePrice(
                lot.hourly_rate,
                lot.current_occupancy,
                lot.capacity,
                surgePricingRules,
                lot.id
              );
              
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
                          {/* Rating */}
                          <div className="mt-1">
                            <RatingBadge 
                              rating={lot.average_rating ? Number(lot.average_rating) : null} 
                              reviewCount={lot.review_count || 0}
                            />
                          </div>
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

                      {/* Feature Badges */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {lot.has_ev_charging && (
                          <Badge variant="outline" className="text-xs bg-green-500/10 border-green-500/30 text-green-600">
                            <Zap className="w-3 h-3 mr-1" />
                            {isHindi ? 'EV चार्जिंग' : 'EV Charging'}
                          </Badge>
                        )}
                        {lot.has_covered_parking && (
                          <Badge variant="outline" className="text-xs bg-blue-500/10 border-blue-500/30 text-blue-600">
                            <Umbrella className="w-3 h-3 mr-1" />
                            {isHindi ? 'ढकी पार्किंग' : 'Covered'}
                          </Badge>
                        )}
                        {lot.near_metro && lot.metro_station && (
                          <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30 text-primary">
                            <Train className="w-3 h-3 mr-1" />
                            {lot.metro_station}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-sm">
                            <Car className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {status.available} {isHindi ? 'स्थान' : 'spots'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <IndianRupee className="w-4 h-4 text-muted-foreground" />
                            {surgeInfo.isSurge ? (
                              <span className="flex items-center gap-1">
                                <span className="text-muted-foreground line-through text-xs">₹{lot.hourly_rate}</span>
                                <span className="text-warning font-medium">₹{surgeInfo.price}/{isHindi ? 'घंटा' : 'hr'}</span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                ₹{lot.hourly_rate}/{isHindi ? 'घंटा' : 'hr'}
                              </span>
                            )}
                          </div>
                        </div>
                        <SurgePricingBadge 
                          multiplier={surgeInfo.multiplier}
                          isSurge={surgeInfo.isSurge}
                          originalPrice={lot.hourly_rate}
                          surgePrice={surgeInfo.price}
                        />
                      </div>

                      {/* Travel Time Display */}
                      {travelTime && (
                        <div className="flex items-center gap-2 mb-3 p-2 rounded-md bg-muted/50">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            <span className="font-medium">{travelTime.minutes} {isHindi ? 'मिनट' : 'min'}</span>
                            <span className="text-muted-foreground"> • {travelTime.distance}</span>
                          </span>
                          <Badge 
                            variant="outline" 
                            className={cn('ml-auto text-xs capitalize', getTrafficColor(travelTime.traffic))}
                          >
                            {getTrafficLabel(travelTime.traffic)}
                          </Badge>
                        </div>
                      )}
                      
                      {/* Capacity Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{isHindi ? 'अधिभोग' : 'Occupancy'}</span>
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
                          {isHindi ? 'दिशा' : 'Directions'}
                        </Button>
                        <Button 
                          className="flex-1 gap-2"
                          variant={status.color === 'destructive' ? 'secondary' : 'default'}
                          disabled={status.color === 'destructive'}
                          onClick={() => handleReserve(lot)}
                        >
                          <CalendarPlus className="w-4 h-4" />
                          {status.color === 'destructive' 
                            ? (isHindi ? 'भरा हुआ' : 'Full') 
                            : (isHindi ? 'बुक करें' : 'Reserve')}
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
            <p className="text-lg font-medium text-foreground">
              {isHindi ? 'कोई पार्किंग स्थल नहीं मिला' : 'No parking lots found'}
            </p>
            <p className="text-muted-foreground">
              {isHindi ? 'किसी अन्य स्थान की खोज करें' : 'Try searching for a different location'}
            </p>
          </div>
        )}
        {/* Review & Customer Care Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <QuickReviewCard />
          <CustomerCareCard />
        </div>

        {/* Bottom Advertising Slot */}
        <div className="mt-8 mb-6">
          <AdvertisingSlot type="card" />
        </div>
      </main>

      <Footer />

      <ReservationDialog
        open={reservationOpen}
        onOpenChange={setReservationOpen}
        parkingLot={selectedLot}
      />
    </div>
  );
}