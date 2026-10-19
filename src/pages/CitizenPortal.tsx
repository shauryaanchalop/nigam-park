import React, { useState, useMemo, useCallback } from 'react';
import { Search, MapPin, Car, IndianRupee, Navigation, Leaf, Wind, Clock, CalendarPlus, RefreshCw, Map, Gift, History, Bell, AlertTriangle, BookOpen, Train, Zap, Umbrella, CreditCard, Users, Building2, Star, TrendingUp, Headphones, ChevronRight, Wallet as WalletIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSurgePricing, calculateSurgePrice } from '@/hooks/useSurgePricing';
import { SurgePricingBadge } from '@/components/SurgePricingBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GovHeader } from '@/components/ui/GovHeader';
import { BackButton } from '@/components/ui/BackButton';
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
import { CustomerCareCard } from '@/components/CustomerCareCard';
import { EVChargingReservation } from '@/components/features/EVChargingReservation';
import { EVBatteryStatus } from '@/components/features/EVBatteryStatus';
import { VehicleSizeDetection } from '@/components/features/VehicleSizeDetection';
import { MultiLevelFloorSelector } from '@/components/features/MultiLevelFloorSelector';

import { EmergencyVehiclePriority } from '@/components/features/EmergencyVehiclePriority';
import { VoiceNavigation } from '@/components/features/VoiceNavigation';
import { SmartParkingRecommendations } from '@/components/features/SmartParkingRecommendations';
import { SustainabilityDashboard } from '@/components/features/SustainabilityDashboard';
import { ParkingSlot3DMap } from '@/components/features/ParkingSlot3DMap';
import { ParkingLotComparison } from '@/components/features/ParkingLotComparison';
import { estimateTravelTime } from '@/lib/travelTime';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useNavigate, Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ParkingReviews } from '@/components/reviews/ParkingReviews';

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
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
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

  const handleLotClick = (lot: ParkingLot) => {
    setSelectedLot(lot);
    setDetailsDialogOpen(true);
  };

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

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl pb-28 md:pb-8">
        <BackButton inline to="/" label={isHindi ? 'होम पर वापस' : 'Back to Home'} />
        {/* Pending Fines Banner */}
        {user && (
          <div className="mb-4 sm:mb-6">
            <PendingFinesBanner />
          </div>
        )}

        {/* Weather Recommendation */}
        <WeatherRecommendation />

        {/* Quick Civic Services & Navigation */}
        <div className="mb-6 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-1.5">
              <Car className="w-4 h-4 text-primary" />
              {isHindi ? 'नागरिक सेवाएं और त्वरित पहुंच' : 'Citizen Smart Services'}
            </h2>
            <Link to="/live-map" className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
              <Map className="w-3.5 h-3.5" />
              {isHindi ? 'पूरा दिल्ली मैप देखें' : 'View Full Delhi Map'}
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
            <Link
              to="/live-map"
              className="group p-3 rounded-xl border border-border/70 bg-card/60 hover:bg-card hover:border-primary/40 hover:shadow-xs transition-all flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Map className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{isHindi ? 'लाइव मैप' : 'Live Map'}</p>
                <p className="text-[10px] text-muted-foreground truncate">{isHindi ? 'सजीव उपलब्धता' : 'Real-time slots'}</p>
              </div>
            </Link>

            <Link
              to="/wallet"
              className="group p-3 rounded-xl border border-border/70 bg-card/60 hover:bg-card hover:border-primary/40 hover:shadow-xs transition-all flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <WalletIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{isHindi ? 'वॉलेट' : 'FASTag Wallet'}</p>
                <p className="text-[10px] text-muted-foreground truncate">{isHindi ? 'ऑटो डेबिट' : '₹1,450 balance'}</p>
              </div>
            </Link>

            <Link
              to="/my-reservations"
              className="group p-3 rounded-xl border border-border/70 bg-card/60 hover:bg-card hover:border-primary/40 hover:shadow-xs transition-all flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <History className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{isHindi ? 'मेरी बुकिंग' : 'Bookings'}</p>
                <p className="text-[10px] text-muted-foreground truncate">{isHindi ? 'सक्रिय स्लॉट' : 'Active & past'}</p>
              </div>
            </Link>

            <Link
              to="/monthly-pass"
              className="group p-3 rounded-xl border border-border/70 bg-card/60 hover:bg-card hover:border-primary/40 hover:shadow-xs transition-all flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{isHindi ? 'मासिक पास' : 'Monthly Pass'}</p>
                <p className="text-[10px] text-muted-foreground truncate">{isHindi ? 'असीमित प्रवेश' : 'Central Zone'}</p>
              </div>
            </Link>

            <Link
              to="/loyalty"
              className="group p-3 rounded-xl border border-border/70 bg-card/60 hover:bg-card hover:border-primary/40 hover:shadow-xs transition-all flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Gift className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{isHindi ? 'रिवॉर्ड्स' : 'Rewards'}</p>
                <p className="text-[10px] text-muted-foreground truncate">{isHindi ? 'कैशबैक अंक' : '670 points'}</p>
              </div>
            </Link>

            <Link
              to="/referral"
              className="group p-3 rounded-xl border border-border/70 bg-card/60 hover:bg-card hover:border-primary/40 hover:shadow-xs transition-all flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{isHindi ? 'रेफरल' : 'Referral'}</p>
                <p className="text-[10px] text-muted-foreground truncate">{isHindi ? '100 अंक पाएं' : 'Get +100 pts'}</p>
              </div>
            </Link>

            <Link
              to="/notifications"
              className="group p-3 rounded-xl border border-border/70 bg-card/60 hover:bg-card hover:border-primary/40 hover:shadow-xs transition-all flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Bell className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{isHindi ? 'अधिसूचना' : 'Alerts'}</p>
                <p className="text-[10px] text-muted-foreground truncate">{isHindi ? 'अलर्ट लॉग' : 'Expiry & receipts'}</p>
              </div>
            </Link>

            <Link
              to="/business"
              className="group p-3 rounded-xl border border-border/70 bg-card/60 hover:bg-card hover:border-primary/40 hover:shadow-xs transition-all flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{isHindi ? 'व्यापार' : 'Corporate Fleet'}</p>
                <p className="text-[10px] text-muted-foreground truncate">{isHindi ? 'कंपनी पार्किंग' : 'GST Billing'}</p>
              </div>
            </Link>

            <Link
              to="/contact"
              className="group p-3 rounded-xl border border-border/70 bg-card/60 hover:bg-card hover:border-primary/40 hover:shadow-xs transition-all flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Headphones className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{isHindi ? 'सहायता' : '24x7 Help'}</p>
                <p className="text-[10px] text-muted-foreground truncate">{isHindi ? 'MCD हेल्पलाइन' : 'Toll-free 155304'}</p>
              </div>
            </Link>

            <Link
              to="/report-violation"
              className="group p-3 rounded-xl border border-destructive/40 bg-destructive/5 hover:bg-destructive/15 hover:border-destructive/60 transition-all flex items-center gap-2.5 col-span-2 sm:col-span-1"
            >
              <div className="w-8 h-8 rounded-lg bg-destructive/15 text-destructive flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-destructive truncate">{isHindi ? 'उल्लंघन रिपोर्ट' : 'Report Issue'}</p>
                <p className="text-[10px] text-destructive/80 truncate">{isHindi ? 'ट्रैफिक मार्शल' : 'Encroachment / fine'}</p>
              </div>
            </Link>
          </div>
        </div>

        {/* AQI Banner */}
        <Card className="mb-4 sm:mb-6 bg-success/10 border-success/30">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-full bg-success/20 flex-shrink-0">
                <Leaf className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-success text-sm sm:text-base">
                  {isHindi ? 'स्मार्ट पार्किंग, AQI कम करें' : 'Park Smartly, Reduce AQI'}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                  {isHindi 
                    ? 'कुशल पार्किंग वाहनों के इंतजार को कम करती है'
                    : 'Efficient parking reduces vehicle idling and improves air quality'}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                  <Wind className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <Badge variant="outline" className="border-warning text-warning text-xs">156</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Section */}
        <div className="mb-4 sm:mb-6 animate-fade-in duration-300 ease-claude">
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              <Input
                placeholder={isHindi ? 'पास में पार्किंग खोजें...' : 'Find parking near...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 sm:pl-11 h-11 sm:h-12 text-sm sm:text-base rounded-2xl border-border/80 bg-card/80 backdrop-blur-md focus-visible:ring-2 focus-visible:ring-primary/25 transition-all duration-200 shadow-sm"
              />
            </div>
            <VoiceSearch 
              onResult={(transcript) => setSearchQuery(transcript)} 
              className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl transition-transform active:scale-95 duration-200 shadow-sm"
            />
          </div>
          
          {/* Quick Select */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2.5 sm:mt-3">
            {popularLocations.map((location, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery(location)}
                className="text-xs sm:text-sm h-7 sm:h-8 px-3 rounded-full border-border/70 bg-card/60 backdrop-blur-sm hover:bg-muted/80 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 ease-claude"
              >
                <MapPin className="w-3 h-3 mr-1 text-primary" />
                {location}
              </Button>
            ))}
          </div>
        </div>

        {/* Advertising Slot */}
        <div className="mb-4 sm:mb-6">
          <AdvertisingSlot type="banner" />
        </div>

        {/* Parking Filters */}
        <ParkingFilters filters={filters} onChange={setFilters} />

        {/* Parking Lots Grid */}
        <h2 className="text-lg sm:text-xl font-semibold mt-4 sm:mt-6 mb-3 tracking-tight">Nearby Parking</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <ParkingLotSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
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
                <Card 
                  key={lot.id} 
                  className="claude-card group overflow-hidden cursor-pointer border border-border/70 hover:border-primary/30 transition-all duration-300 ease-claude hover:-translate-y-1 hover:shadow-xl p-0" 
                  onClick={() => handleLotClick(lot)}
                >
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
                      
                      {/* View Details Link */}
                      <div className="flex items-center justify-center text-primary text-sm font-medium">
                        <span>{isHindi ? 'विवरण देखें' : 'View Details'}</span>
                        <ChevronRight className="w-4 h-4 ml-1" />
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
        
        {/* Customer Care Card Only (Removed Write Review from main page) */}
        <div className="mt-6 sm:mt-8">
          <CustomerCareCard />
        </div>

        {/* New Features Section */}
        <div className="mt-6 sm:mt-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            {isHindi ? 'नई सुविधाएं' : 'New Features'}
          </h2>
          
          {/* 3D Map & Comparison - Full Width */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
            <ParkingSlot3DMap />
            <ParkingLotComparison />
          </div>
          
          {/* Smart Recommendations & Voice Navigation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
            <SmartParkingRecommendations />
            <VoiceNavigation />
          </div>

          {/* EV Features */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4 items-start">
            <EVChargingReservation />
            <EVBatteryStatus />
          </div>

          {/* Vehicle Size & Sustainability - side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4 items-start">
            <VehicleSizeDetection />
            <SustainabilityDashboard />
          </div>

          {/* Floor Selector */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 items-start">
            <MultiLevelFloorSelector />
            <EmergencyVehiclePriority />
          </div>
        </div>

        {/* Bottom Advertising Slot */}
        <div className="mt-6 sm:mt-8 mb-4 sm:mb-6">
          <AdvertisingSlot type="card" />
        </div>
      </main>

      <Footer />

      <ReservationDialog
        open={reservationOpen}
        onOpenChange={setReservationOpen}
        parkingLot={selectedLot}
      />

      {/* Parking Lot Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedLot && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedLot.name}</DialogTitle>
                <DialogDescription className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {selectedLot.zone}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 pt-2">
                {/* Quick Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <Car className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">{isHindi ? 'उपलब्ध' : 'Available'}</p>
                      <p className="font-semibold">{selectedLot.capacity - selectedLot.current_occupancy} {isHindi ? 'स्थान' : 'spots'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <IndianRupee className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">{isHindi ? 'प्रति घंटा' : 'Per Hour'}</p>
                      <p className="font-semibold">₹{selectedLot.hourly_rate}</p>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-2">
                  {selectedLot.has_ev_charging && (
                    <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-600">
                      <Zap className="w-3 h-3 mr-1" />
                      {isHindi ? 'EV चार्जिंग' : 'EV Charging'}
                    </Badge>
                  )}
                  {selectedLot.has_covered_parking && (
                    <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-600">
                      <Umbrella className="w-3 h-3 mr-1" />
                      {isHindi ? 'ढकी पार्किंग' : 'Covered'}
                    </Badge>
                  )}
                  {selectedLot.near_metro && selectedLot.metro_station && (
                    <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary">
                      <Train className="w-3 h-3 mr-1" />
                      {selectedLot.metro_station}
                    </Badge>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <RatingBadge 
                    rating={selectedLot.average_rating ? Number(selectedLot.average_rating) : null} 
                    reviewCount={selectedLot.review_count || 0}
                    size="md"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    className="flex-1 gap-2"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${selectedLot.lat},${selectedLot.lng}&travelmode=driving`;
                      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    <Navigation className="w-4 h-4" />
                    {isHindi ? 'दिशा' : 'Navigate'}
                  </Button>
                  <Button 
                    className="flex-1 gap-2"
                    disabled={(selectedLot.capacity - selectedLot.current_occupancy) === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailsDialogOpen(false);
                      handleReserve(selectedLot);
                    }}
                  >
                    <CalendarPlus className="w-4 h-4" />
                    {(selectedLot.capacity - selectedLot.current_occupancy) === 0 
                      ? (isHindi ? 'भरा हुआ' : 'Full') 
                      : (isHindi ? 'बुक करें' : 'Reserve')}
                  </Button>
                </div>

                {/* Reviews Section */}
                <div className="pt-4 border-t">
                  <ParkingReviews lotId={selectedLot.id} lotName={selectedLot.name} canReply={false} />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}