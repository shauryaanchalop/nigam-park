import React, { useState } from 'react';
import { Search, MapPin, Car, IndianRupee, Navigation, Leaf, Wind } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GovHeader } from '@/components/ui/GovHeader';
import { SimulationSidebar } from '@/components/simulation/SimulationSidebar';
import { useParkingLots } from '@/hooks/useParkingLots';
import { cn } from '@/lib/utils';

export default function CitizenPortal() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: lots, isLoading } = useParkingLots();

  const popularLocations = ['Connaught Place', 'Karol Bagh', 'Lajpat Nagar', 'Sarojini Nagar'];

  const filteredLots = lots?.filter(lot => 
    lot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lot.zone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAvailabilityStatus = (current: number, capacity: number) => {
    const percentage = (current / capacity) * 100;
    if (percentage >= 95) return { label: 'Full', color: 'destructive' as const, available: 0 };
    if (percentage >= 80) return { label: 'Limited', color: 'warning' as const, available: capacity - current };
    return { label: 'Available', color: 'success' as const, available: capacity - current };
  };

  return (
    <div className="min-h-screen bg-background">
      <GovHeader 
        title="NIGAM-Park" 
        subtitle="Find Parking in Delhi"
      />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
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
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-24 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLots?.map(lot => {
              const status = getAvailabilityStatus(lot.current_occupancy, lot.capacity);
              
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
                      
                      <div className="flex items-center justify-between mb-4">
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
                      
                      <Button 
                        className="w-full gap-2"
                        variant={status.color === 'destructive' ? 'secondary' : 'default'}
                        disabled={status.color === 'destructive'}
                        onClick={() => {
                          // Open Google Maps with directions to the parking lot
                          const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lot.lat},${lot.lng}&travelmode=driving`;
                          window.open(mapsUrl, '_blank', 'noopener,noreferrer');
                        }}
                      >
                        <Navigation className="w-4 h-4" />
                        {status.color === 'destructive' ? 'Lot Full' : 'Get Directions'}
                      </Button>
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

      <SimulationSidebar />
    </div>
  );
}
