import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { MapPin, Car, Activity, Wifi } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useParkingLots } from '@/hooks/useParkingLots';
import { cn } from '@/lib/utils';
import '@/lib/leaflet';

type LatLngTuple = [number, number];

export function ParkingMap() {
  const { data: lots, isLoading } = useParkingLots();
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (lots) setLastUpdate(new Date());
  }, [lots?.map(l => l.current_occupancy).join(',')]);

  const center = useMemo<LatLngTuple>(() => {
    if (!lots?.length) return [28.6139, 77.2090]; // Delhi
    const avgLat = lots.reduce((sum, l) => sum + Number(l.lat), 0) / lots.length;
    const avgLng = lots.reduce((sum, l) => sum + Number(l.lng), 0) / lots.length;
    return [avgLat, avgLng];
  }, [lots]);

  const getOccupancyStatus = (current: number, capacity: number) => {
    const pct = (current / capacity) * 100;
    if (pct >= 90) return { label: 'Full', cls: 'border-destructive text-destructive' };
    if (pct >= 70) return { label: 'Busy', cls: 'border-warning text-warning' };
    return { label: 'Available', cls: 'border-success text-success' };
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border p-4 h-[400px] animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
        <div className="h-full bg-muted rounded"></div>
      </div>
    );
  }

  return (
    <section className="bg-card rounded-lg border border-border overflow-hidden">
      <header className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Live Parking Map (OSM)</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="relative">
              <Wifi className="w-3.5 h-3.5 text-success" />
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-success rounded-full live-indicator" />
            </div>
            <span>Live</span>
          </div>
          <Badge variant="outline">{lots?.length ?? 0} Lots</Badge>
        </div>
      </header>

      <div className="relative h-[350px] bg-muted">
        <MapContainer center={center} zoom={12} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {lots?.map((lot) => {
            const lat = Number(lot.lat);
            const lng = Number(lot.lng);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

            const status = getOccupancyStatus(lot.current_occupancy, lot.capacity);

            return (
              <Marker key={lot.id} position={[lat, lng]}>
                <Popup>
                  <div className="space-y-2">
                    <div>
                      <p className="font-semibold text-foreground">{lot.name}</p>
                      <p className="text-xs text-muted-foreground">{lot.zone}</p>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className={cn('text-xs', status.cls)}>
                        {status.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {lot.current_occupancy}/{lot.capacity}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        const url = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;
                        window.open(url, '_blank', 'noopener,noreferrer');
                      }}
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      Open in OSM
                    </Button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* subtle “real” overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--background)/0)_40%,hsl(var(--background)/0.35)_100%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-25 mix-blend-multiply bg-[linear-gradient(transparent_0,transparent_2px,hsl(var(--foreground)/0.04)_3px)] bg-[length:100%_6px]" />

        <div className="absolute bottom-3 right-3 bg-card/90 backdrop-blur-sm border border-border rounded-md px-2 py-1 text-[10px] text-muted-foreground font-mono">
          Updated: {lastUpdate.toLocaleTimeString('en-IN')}
        </div>
        <div className="absolute top-3 left-3 bg-card/90 backdrop-blur-sm border border-border rounded-md px-2 py-1 text-[10px] text-muted-foreground font-mono flex items-center gap-2">
          <Car className="w-3.5 h-3.5" />
          LIVE MAP FEED
        </div>
      </div>
    </section>
  );
}
