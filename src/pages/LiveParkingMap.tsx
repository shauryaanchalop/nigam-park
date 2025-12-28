import React, { useState, useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Clock, Car, ChevronLeft, Locate, Navigation } from 'lucide-react';
import { GovHeader } from '@/components/ui/GovHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useParkingLots } from '@/hooks/useParkingLots';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons based on occupancy
const createMarkerIcon = (occupancyPercent: number) => {
  const color = occupancyPercent >= 90 ? '#ef4444' : occupancyPercent >= 70 ? '#f59e0b' : '#22c55e';
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 40px;
        height: 40px;
        background: ${color};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
      ">
        ${Math.round(100 - occupancyPercent)}%
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

// User location marker
const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `
    <div style="
      width: 20px;
      height: 20px;
      background: #3b82f6;
      border-radius: 50%;
      border: 4px solid white;
      box-shadow: 0 0 0 2px #3b82f6, 0 2px 8px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function LocationMarker({ onLocationFound }: { onLocationFound: (latlng: L.LatLng) => void }) {
  const map = useMap();
  
  const handleLocate = () => {
    map.locate({ setView: true, maxZoom: 15 });
  };

  useEffect(() => {
    map.on('locationfound', (e) => {
      onLocationFound(e.latlng);
    });
  }, [map, onLocationFound]);

  return (
    <div className="leaflet-top leaflet-right" style={{ marginTop: '10px', marginRight: '10px' }}>
      <div className="leaflet-control leaflet-bar">
        <Button size="icon" variant="secondary" onClick={handleLocate} className="bg-background shadow-md">
          <Locate className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function FlyToMarker({ position }: { position: [number, number] | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, { duration: 1 });
    }
  }, [map, position]);
  
  return null;
}

export default function LiveParkingMap() {
  const { data: lots, isLoading } = useParkingLots();
  const [selectedLot, setSelectedLot] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<L.LatLng | null>(null);
  const [flyToPosition, setFlyToPosition] = useState<[number, number] | null>(null);

  // Default center (can be updated based on lots or user location)
  const defaultCenter: [number, number] = lots && lots.length > 0 
    ? [Number(lots[0].lat), Number(lots[0].lng)] 
    : [28.6139, 77.2090]; // Default to Delhi

  const getOccupancyColor = (occupancy: number, capacity: number) => {
    const percent = (occupancy / capacity) * 100;
    if (percent >= 90) return 'destructive';
    if (percent >= 70) return 'warning';
    return 'success';
  };

  const handleLotSelect = (lotId: string, lat: number, lng: number) => {
    setSelectedLot(lotId);
    setFlyToPosition([lat, lng]);
  };

  const openNavigation = (lat: number, lng: number, name: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(name)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <GovHeader 
        title="Live Parking Map" 
        subtitle="Real-time availability with navigation"
      />

      <main className="container mx-auto px-4 py-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/citizen">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Portal
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Interactive Map
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[500px] relative">
                  {!isLoading && lots && (
                    <MapContainer
                      center={defaultCenter}
                      zoom={13}
                      style={{ height: '100%', width: '100%' }}
                      className="z-0"
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      
                      <LocationMarker onLocationFound={setUserLocation} />
                      <FlyToMarker position={flyToPosition} />
                      
                      {/* User location marker */}
                      {userLocation && (
                        <Marker 
                          position={[userLocation.lat, userLocation.lng]} 
                          icon={userLocationIcon}
                        >
                          <Popup>
                            <div className="text-center font-medium">Your Location</div>
                          </Popup>
                        </Marker>
                      )}
                      
                      {/* Parking lot markers */}
                      {lots.map((lot) => {
                        const occupancyPercent = (lot.current_occupancy / lot.capacity) * 100;
                        const available = lot.capacity - lot.current_occupancy;
                        
                        return (
                          <Marker
                            key={lot.id}
                            position={[Number(lot.lat), Number(lot.lng)]}
                            icon={createMarkerIcon(occupancyPercent)}
                            eventHandlers={{
                              click: () => setSelectedLot(lot.id),
                            }}
                          >
                            <Popup>
                              <div className="min-w-[200px] p-2">
                                <h3 className="font-bold text-lg mb-1">{lot.name}</h3>
                                <p className="text-muted-foreground text-sm mb-2">{lot.zone}</p>
                                
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm">Available spots:</span>
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
                                    Navigate
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
                      <div className="text-muted-foreground">Loading map...</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Legend */}
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Availability Legend</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500" />
                  <span>Available (&lt;70%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-amber-500" />
                  <span>Filling (70-90%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500" />
                  <span>Full (&gt;90%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow" />
                  <span>Your Location</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lot List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Car className="w-5 h-5" />
                Parking Lots ({lots?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[560px] overflow-y-auto">
              {lots?.map((lot) => {
                const available = lot.capacity - lot.current_occupancy;
                const occupancyPercent = (lot.current_occupancy / lot.capacity) * 100;

                return (
                  <div
                    key={lot.id}
                    className={cn(
                      "p-4 rounded-lg border cursor-pointer transition-all hover:border-primary",
                      selectedLot === lot.id && "border-primary bg-primary/5"
                    )}
                    onClick={() => handleLotSelect(lot.id, Number(lot.lat), Number(lot.lng))}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{lot.name}</h4>
                        <p className="text-xs text-muted-foreground">{lot.zone}</p>
                      </div>
                      <Badge variant={getOccupancyColor(lot.current_occupancy, lot.capacity) as any}>
                        {available} spots
                      </Badge>
                    </div>
                    <Progress value={occupancyPercent} className="h-2 mb-2" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ₹{lot.hourly_rate}/hr
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {lot.zone}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-3">
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
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
