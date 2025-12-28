import React, { useState, useEffect, useCallback } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, Clock, Car, ChevronLeft, Locate, Navigation, 
  RefreshCw, Filter, SortAsc, Compass, Phone, X 
} from 'lucide-react';
import { GovHeader } from '@/components/ui/GovHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useParkingLots } from '@/hooks/useParkingLots';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons based on occupancy
const createMarkerIcon = (occupancyPercent: number, isSelected: boolean = false) => {
  const color = occupancyPercent >= 90 ? '#ef4444' : occupancyPercent >= 70 ? '#f59e0b' : '#22c55e';
  const size = isSelected ? 48 : 40;
  const fontSize = isSelected ? 14 : 12;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        border: ${isSelected ? '4px' : '3px'} solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,${isSelected ? '0.5' : '0.3'});
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${fontSize}px;
        transform: ${isSelected ? 'scale(1.1)' : 'scale(1)'};
        transition: transform 0.2s ease;
      ">
        ${Math.round(100 - occupancyPercent)}%
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
};

// User location marker
const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `
    <div style="
      width: 24px;
      height: 24px;
      background: #3b82f6;
      border-radius: 50%;
      border: 4px solid white;
      box-shadow: 0 0 0 2px #3b82f6, 0 2px 8px rgba(0,0,0,0.3);
      animation: pulse 2s ease-in-out infinite;
    "></div>
    <style>
      @keyframes pulse {
        0%, 100% { box-shadow: 0 0 0 2px #3b82f6, 0 2px 8px rgba(0,0,0,0.3); }
        50% { box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.3), 0 2px 8px rgba(0,0,0,0.3); }
      }
    </style>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function LocationControl({ onLocationFound, onLocating }: { 
  onLocationFound: (latlng: L.LatLng) => void;
  onLocating: (locating: boolean) => void;
}) {
  const map = useMap();
  const [isLocating, setIsLocating] = useState(false);
  
  const handleLocate = useCallback(() => {
    setIsLocating(true);
    onLocating(true);
    
    map.locate({ setView: true, maxZoom: 15, enableHighAccuracy: true });
    
    map.once('locationfound', (e) => {
      setIsLocating(false);
      onLocating(false);
      onLocationFound(e.latlng);
      toast.success('Location found!');
    });
    
    map.once('locationerror', (e) => {
      setIsLocating(false);
      onLocating(false);
      toast.error('Could not get your location', {
        description: 'Please enable location services',
      });
    });
  }, [map, onLocationFound, onLocating]);

  return (
    <Button
      size="icon"
      variant="secondary"
      onClick={handleLocate}
      disabled={isLocating}
      className="absolute top-4 right-4 z-[1000] bg-background shadow-lg"
    >
      {isLocating ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : (
        <Locate className="w-4 h-4" />
      )}
    </Button>
  );
}

function FlyToMarker({ position }: { position: [number, number] | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, { duration: 0.5 });
    }
  }, [map, position]);
  
  return null;
}

// Calculate distance between two points
function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function LiveParkingMap() {
  const { data: lots, isLoading, refetch } = useParkingLots();
  const [selectedLot, setSelectedLot] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<L.LatLng | null>(null);
  const [flyToPosition, setFlyToPosition] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'availability'>('availability');
  const [showListSheet, setShowListSheet] = useState(false);

  // Default center
  const defaultCenter: [number, number] = lots && lots.length > 0 
    ? [Number(lots[0].lat), Number(lots[0].lng)] 
    : [28.6139, 77.2090];

  const getOccupancyColor = (occupancy: number, capacity: number) => {
    const percent = (occupancy / capacity) * 100;
    if (percent >= 90) return 'destructive';
    if (percent >= 70) return 'warning';
    return 'success';
  };

  // Sort lots by distance or availability
  const sortedLots = React.useMemo(() => {
    if (!lots) return [];
    
    return [...lots].sort((a, b) => {
      if (sortBy === 'distance' && userLocation) {
        const distA = getDistance(userLocation.lat, userLocation.lng, Number(a.lat), Number(a.lng));
        const distB = getDistance(userLocation.lat, userLocation.lng, Number(b.lat), Number(b.lng));
        return distA - distB;
      } else {
        // Sort by availability (most available first)
        const availA = a.capacity - a.current_occupancy;
        const availB = b.capacity - b.current_occupancy;
        return availB - availA;
      }
    });
  }, [lots, sortBy, userLocation]);

  const handleLotSelect = (lotId: string, lat: number, lng: number) => {
    setSelectedLot(lotId);
    setFlyToPosition([lat, lng]);
    setShowListSheet(false);
  };

  const openNavigation = (lat: number, lng: number, name: string) => {
    // Check if on mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Try to open native maps app
      const iosUrl = `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
      const androidUrl = `google.navigation:q=${lat},${lng}`;
      const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
      
      // Try iOS first, then Android, then fallback
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        window.location.href = iosUrl;
        setTimeout(() => {
          window.open(fallbackUrl, '_blank');
        }, 1000);
      } else {
        window.location.href = androidUrl;
        setTimeout(() => {
          window.open(fallbackUrl, '_blank');
        }, 1000);
      }
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, '_blank');
    }
  };

  const selectedLotData = lots?.find(l => l.id === selectedLot);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Compact Header for Mobile */}
      <div className="md:hidden bg-card border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="-ml-2">
            <Link to="/citizen">
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-semibold text-sm">Live Parking Map</h1>
            <p className="text-xs text-muted-foreground">{lots?.length || 0} lots available</p>
          </div>
        </div>
        <Sheet open={showListSheet} onOpenChange={setShowListSheet}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <Car className="w-4 h-4 mr-1" />
              List
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh] rounded-t-xl">
            <SheetHeader className="pb-2">
              <SheetTitle className="flex items-center justify-between">
                <span>Parking Lots</span>
                <div className="flex gap-2">
                  <Button
                    variant={sortBy === 'availability' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortBy('availability')}
                  >
                    Available
                  </Button>
                  <Button
                    variant={sortBy === 'distance' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortBy('distance')}
                    disabled={!userLocation}
                  >
                    Nearest
                  </Button>
                </div>
              </SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto h-full pb-20">
              {sortedLots.map((lot) => {
                const available = lot.capacity - lot.current_occupancy;
                const occupancyPercent = (lot.current_occupancy / lot.capacity) * 100;
                const distance = userLocation 
                  ? getDistance(userLocation.lat, userLocation.lng, Number(lot.lat), Number(lot.lng))
                  : null;

                return (
                  <div
                    key={lot.id}
                    className={cn(
                      "p-4 border-b cursor-pointer active:bg-muted/50 transition-colors",
                      selectedLot === lot.id && "bg-primary/5"
                    )}
                    onClick={() => handleLotSelect(lot.id, Number(lot.lat), Number(lot.lng))}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{lot.name}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <MapPin className="w-3 h-3" />
                          {lot.zone}
                          {distance !== null && (
                            <span className="text-primary">• {distance.toFixed(1)} km</span>
                          )}
                        </p>
                      </div>
                      <Badge variant={getOccupancyColor(lot.current_occupancy, lot.capacity) as any}>
                        {available} spots
                      </Badge>
                    </div>
                    <Progress value={occupancyPercent} className="h-1.5 mb-2" />
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          openNavigation(Number(lot.lat), Number(lot.lng), lot.name);
                        }}
                      >
                        <Navigation className="w-3 h-3 mr-1" />
                        Navigate
                      </Button>
                      <Button size="sm" className="flex-1 h-8" asChild>
                        <Link to={`/citizen?lot=${lot.id}`}>
                          Reserve
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <GovHeader 
          title="Live Parking Map" 
          subtitle="Real-time availability with navigation"
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Map - Full screen on mobile */}
        <div className="flex-1 relative">
          {!isLoading && lots && (
            <MapContainer
              center={defaultCenter}
              zoom={13}
              style={{ height: '100%', width: '100%', minHeight: '400px' }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <LocationControl 
                onLocationFound={setUserLocation} 
                onLocating={setIsLocating}
              />
              <FlyToMarker position={flyToPosition} />
              
              {/* User location with accuracy circle */}
              {userLocation && (
                <>
                  <Circle
                    center={[userLocation.lat, userLocation.lng]}
                    radius={100}
                    pathOptions={{ 
                      color: '#3b82f6', 
                      fillColor: '#3b82f6', 
                      fillOpacity: 0.1,
                      weight: 1
                    }}
                  />
                  <Marker 
                    position={[userLocation.lat, userLocation.lng]} 
                    icon={userLocationIcon}
                  >
                    <Popup>
                      <div className="text-center font-medium">Your Location</div>
                    </Popup>
                  </Marker>
                </>
              )}
              
              {/* Parking lot markers */}
              {lots.map((lot) => {
                const occupancyPercent = (lot.current_occupancy / lot.capacity) * 100;
                const available = lot.capacity - lot.current_occupancy;
                const isSelected = selectedLot === lot.id;
                const distance = userLocation 
                  ? getDistance(userLocation.lat, userLocation.lng, Number(lot.lat), Number(lot.lng))
                  : null;
                
                return (
                  <Marker
                    key={lot.id}
                    position={[Number(lot.lat), Number(lot.lng)]}
                    icon={createMarkerIcon(occupancyPercent, isSelected)}
                    eventHandlers={{
                      click: () => setSelectedLot(lot.id),
                    }}
                  >
                    <Popup>
                      <div className="min-w-[220px] p-1">
                        <h3 className="font-bold text-base mb-1">{lot.name}</h3>
                        <p className="text-muted-foreground text-sm mb-2 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {lot.zone}
                          {distance !== null && (
                            <span className="text-primary ml-1">({distance.toFixed(1)} km)</span>
                          )}
                        </p>
                        
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm">Available:</span>
                          <Badge variant={getOccupancyColor(lot.current_occupancy, lot.capacity) as any}>
                            {available} / {lot.capacity}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm">Rate:</span>
                          <span className="font-medium">₹{lot.hourly_rate}/hr</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex-1"
                            onClick={() => openNavigation(Number(lot.lat), Number(lot.lng), lot.name)}
                          >
                            <Navigation className="w-3 h-3 mr-1" />
                            Go
                          </Button>
                          <Button size="sm" className="flex-1" asChild>
                            <Link to={`/citizen?lot=${lot.id}`}>
                              Reserve
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          )}
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Mobile Bottom Card for Selected Lot */}
          {selectedLotData && (
            <div className="md:hidden absolute bottom-4 left-4 right-4 z-[1000]">
              <Card className="shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{selectedLotData.name}</h3>
                      <p className="text-xs text-muted-foreground">{selectedLotData.zone}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="-mt-1 -mr-2"
                      onClick={() => setSelectedLot(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 mb-3 text-sm">
                    <Badge variant={getOccupancyColor(selectedLotData.current_occupancy, selectedLotData.capacity) as any}>
                      {selectedLotData.capacity - selectedLotData.current_occupancy} spots
                    </Badge>
                    <span>₹{selectedLotData.hourly_rate}/hr</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => openNavigation(Number(selectedLotData.lat), Number(selectedLotData.lng), selectedLotData.name)}
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Navigate
                    </Button>
                    <Button className="flex-1" asChild>
                      <Link to={`/citizen?lot=${selectedLotData.id}`}>
                        Reserve Now
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:block w-96 border-l overflow-hidden">
          <div className="p-4 border-b">
            <Button variant="ghost" asChild className="mb-2">
              <Link to="/citizen">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Portal
              </Link>
            </Button>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Parking Lots</h2>
              <div className="flex gap-1">
                <Button
                  variant={sortBy === 'availability' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('availability')}
                >
                  <SortAsc className="w-3 h-3 mr-1" />
                  Available
                </Button>
                <Button
                  variant={sortBy === 'distance' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('distance')}
                  disabled={!userLocation}
                >
                  <Compass className="w-3 h-3 mr-1" />
                  Nearest
                </Button>
              </div>
            </div>
          </div>
          <div className="overflow-y-auto h-[calc(100vh-200px)]">
            {sortedLots.map((lot) => {
              const available = lot.capacity - lot.current_occupancy;
              const occupancyPercent = (lot.current_occupancy / lot.capacity) * 100;
              const distance = userLocation 
                ? getDistance(userLocation.lat, userLocation.lng, Number(lot.lat), Number(lot.lng))
                : null;

              return (
                <div
                  key={lot.id}
                  className={cn(
                    "p-4 border-b cursor-pointer transition-all hover:bg-muted/50",
                    selectedLot === lot.id && "bg-primary/5 border-l-4 border-l-primary"
                  )}
                  onClick={() => handleLotSelect(lot.id, Number(lot.lat), Number(lot.lng))}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{lot.name}</h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {lot.zone}
                        {distance !== null && (
                          <span className="text-primary ml-1">• {distance.toFixed(1)} km</span>
                        )}
                      </p>
                    </div>
                    <Badge variant={getOccupancyColor(lot.current_occupancy, lot.capacity) as any}>
                      {available} spots
                    </Badge>
                  </div>
                  <Progress value={occupancyPercent} className="h-1.5 mb-2" />
                  <div className="flex justify-between text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      ₹{lot.hourly_rate}/hr
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        openNavigation(Number(lot.lat), Number(lot.lng), lot.name);
                      }}
                    >
                      <Navigation className="w-3 h-3 mr-1" />
                      Navigate
                    </Button>
                    <Button size="sm" className="flex-1" asChild>
                      <Link to={`/citizen?lot=${lot.id}`}>
                        Reserve
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="p-4 border-t bg-muted/30">
            <p className="text-xs font-medium mb-2">Availability Legend</p>
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>&lt;70%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span>70-90%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>&gt;90%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white" />
                <span>You</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
