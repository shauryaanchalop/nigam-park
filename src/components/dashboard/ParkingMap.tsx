import React, { useEffect, useRef, useMemo, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Car, Wifi } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useParkingLots } from '@/hooks/useParkingLots';

// Fix default marker icon
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

export function ParkingMap() {
  const { data: lots, isLoading } = useParkingLots();
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (lots) setLastUpdate(new Date());
  }, [lots?.map(l => l.current_occupancy).join(',')]);

  const center = useMemo<[number, number]>(() => {
    if (!lots?.length) return [28.6139, 77.2090]; // Delhi
    const avgLat = lots.reduce((sum, l) => sum + Number(l.lat), 0) / lots.length;
    const avgLng = lots.reduce((sum, l) => sum + Number(l.lng), 0) / lots.length;
    return [avgLat, avgLng];
  }, [lots]);

  const getOccupancyStatus = (current: number, capacity: number) => {
    const pct = (current / capacity) * 100;
    if (pct >= 90) return { label: 'Full', color: 'red' };
    if (pct >= 70) return { label: 'Busy', color: 'orange' };
    return { label: 'Available', color: 'green' };
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = L.map(mapRef.current, {
      center,
      zoom: 12,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when lots change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !lots) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    lots.forEach((lot) => {
      const lat = Number(lot.lat);
      const lng = Number(lot.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const status = getOccupancyStatus(lot.current_occupancy, lot.capacity);

      const marker = L.marker([lat, lng]).addTo(map);

      marker.bindPopup(`
        <div style="min-width: 150px;">
          <strong>${lot.name}</strong><br/>
          <span style="color: #666; font-size: 12px;">${lot.zone}</span><br/>
          <span style="color: ${status.color}; font-weight: 600;">${status.label}</span> - 
          ${lot.current_occupancy}/${lot.capacity} spots<br/>
          <a href="https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}" 
             target="_blank" rel="noopener noreferrer"
             style="color: #2563eb; font-size: 12px;">
            Open in OSM →
          </a>
        </div>
      `);

      markersRef.current.push(marker);
    });

    // Fit bounds if we have markers
    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }, [lots]);

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border p-4 h-[400px] animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
        <div className="h-full bg-muted rounded"></div>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[300px] bg-muted rounded-lg overflow-hidden">
      <div ref={mapRef} className="h-full w-full z-0" />

      {/* Overlays for realism */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,hsl(var(--background)/0.15)_100%)]" />

      <div className="absolute bottom-2 right-2 bg-card/90 backdrop-blur-sm border border-border rounded-md px-2 py-1 text-[10px] text-muted-foreground font-mono z-[1000]">
        {lastUpdate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="absolute top-2 left-2 bg-card/90 backdrop-blur-sm border border-border rounded-md px-2 py-1 text-[10px] text-muted-foreground font-mono flex items-center gap-1.5 z-[1000]">
        <div className="relative">
          <Wifi className="w-3 h-3 text-success" />
          <div className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-success rounded-full live-indicator" />
        </div>
        <span className="hidden sm:inline">LIVE</span>
      </div>
    </div>
  );
}
