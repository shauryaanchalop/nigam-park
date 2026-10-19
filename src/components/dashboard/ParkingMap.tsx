import React, { useEffect, useRef, useMemo, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Car, Wifi, Navigation, ExternalLink, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useParkingLots } from '@/hooks/useParkingLots';
import { Link } from 'react-router-dom';

export function ParkingMap() {
  const { data: lots, isLoading, refetch } = useParkingLots();
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (lots && lots.length > 0) {
      setLastUpdate(new Date());
    }
  }, [lots]);

  const center = useMemo<[number, number]>(() => {
    if (!lots?.length) return [28.6139, 77.2090]; // Central Delhi
    const avgLat = lots.reduce((sum, l) => sum + Number(l.lat || 28.6139), 0) / lots.length;
    const avgLng = lots.reduce((sum, l) => sum + Number(l.lng || 77.2090), 0) / lots.length;
    return [avgLat, avgLng];
  }, [lots]);

  const getOccupancyStatus = (current: number, capacity: number) => {
    const pct = capacity > 0 ? (current / capacity) * 100 : 0;
    if (pct >= 90) return { label: 'Full', color: '#ef4444', bg: 'bg-destructive', text: 'text-destructive' };
    if (pct >= 70) return { label: 'Busy', color: '#f59e0b', bg: 'bg-amber-500', text: 'text-amber-500' };
    return { label: 'Available', color: '#10b981', bg: 'bg-emerald-500', text: 'text-emerald-500' };
  };

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        center,
        zoom: 12,
        scrollWheelZoom: false,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Force size invalidation for flex/grid parents & mobile resize
      const handleResize = () => map.invalidateSize();
      window.addEventListener('resize', handleResize);
      setTimeout(handleResize, 150);
      setTimeout(handleResize, 500);
    }

    return () => {
      // Keep instance intact across minor re-renders, clean up on component unmount
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Update Markers when lots change or load
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !lots || lots.length === 0) return;

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    const group = L.featureGroup();

    lots.forEach((lot) => {
      const lat = Number(lot.lat);
      const lng = Number(lot.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const pct = Math.round((lot.current_occupancy / lot.capacity) * 100);
      const status = getOccupancyStatus(lot.current_occupancy, lot.capacity);
      const isSelected = selectedLotId === lot.id;

      // Modern CSS DivIcon with live occupancy badge
      const customIcon = L.divIcon({
        className: 'parking-lot-marker',
        html: `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${status.color};
            color: #ffffff;
            width: ${isSelected ? 42 : 36}px;
            height: ${isSelected ? 42 : 36}px;
            border-radius: 50%;
            border: 3px solid #ffffff;
            box-shadow: 0 4px 14px rgba(0,0,0,0.4);
            font-size: 11px;
            font-weight: 700;
            font-family: system-ui, -apple-system, sans-serif;
            cursor: pointer;
            transition: all 0.2s ease;
          ">
            ${pct}%
          </div>
        `,
        iconSize: [isSelected ? 42 : 36, isSelected ? 42 : 36],
        iconAnchor: [isSelected ? 21 : 18, isSelected ? 21 : 18],
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 180px; padding: 2px;">
          <div style="font-weight: 700; font-size: 14px; color: #0f172a; margin-bottom: 2px;">${lot.name}</div>
          <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">${lot.zone}</div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; background: ${status.color}20; color: ${status.color}; font-size: 11px; font-weight: 700;">
              ${status.label} (${pct}%)
            </span>
            <span style="font-size: 12px; font-weight: 600; color: #0f172a;">
              ${lot.capacity - lot.current_occupancy} spots left
            </span>
          </div>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 6px; font-size: 11px; color: #64748b;">
            Rate: ₹${lot.hourly_rate}/hr • ${lot.has_ev_charging ? '⚡ EV Charging' : 'Standard'}
          </div>
        </div>
      `);

      marker.on('click', () => {
        setSelectedLotId(lot.id);
      });

      markersRef.current.set(lot.id, marker);
      group.addLayer(marker);
    });

    if (group.getLayers().length > 0) {
      map.fitBounds(group.getBounds().pad(0.12));
    }

    setTimeout(() => map.invalidateSize(), 150);
  }, [lots, selectedLotId]);

  const handleSelectLot = (lot: typeof lots[0]) => {
    setSelectedLotId(lot.id);
    const map = mapInstanceRef.current;
    if (map && Number.isFinite(lot.lat) && Number.isFinite(lot.lng)) {
      map.flyTo([Number(lot.lat), Number(lot.lng)], 15, { duration: 0.8 });
      const marker = markersRef.current.get(lot.id);
      if (marker) {
        marker.openPopup();
      }
    }
  };

  return (
    <div className="relative h-full min-h-[320px] sm:min-h-[350px] lg:min-h-[400px] bg-muted rounded-xl overflow-hidden flex flex-col border border-border/40 shadow-inner">
      {/* Map Canvas - ALWAYS rendered in DOM to prevent Leaflet mount failure */}
      <div ref={mapRef} className="h-full w-full flex-1 z-0 min-h-[250px]" />

      {/* Loading overlay if fetching */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium text-muted-foreground">Loading Delhi Parking Network...</span>
        </div>
      )}

      {/* Top Left Live Status Pill */}
      <div className="absolute top-2.5 left-2.5 bg-card/95 backdrop-blur-md border border-border/80 rounded-full px-3 py-1 text-xs text-foreground font-mono flex items-center gap-2 z-[1000] shadow-sm">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-semibold text-[11px] tracking-wide">MCD IOT NETWORK</span>
        <span className="text-[10px] text-muted-foreground hidden sm:inline">
          ({lots?.length || 6} NODES ONLINE)
        </span>
      </div>

      {/* Top Right Actions */}
      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-[1000]">
        <Button
          variant="secondary"
          size="sm"
          asChild
          className="h-7 text-xs px-2.5 bg-card/90 hover:bg-card border border-border/80 shadow-sm gap-1"
        >
          <Link to="/live-map">
            <span className="hidden sm:inline">Open Live Map</span>
            <span className="sm:hidden">Map</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </Link>
        </Button>
      </div>

      {/* Bottom Horizontal Lot Selector Pills for Touch & Desktop */}
      <div className="absolute bottom-2 inset-x-2 z-[1000] flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1.5 bg-background/90 backdrop-blur-md rounded-xl border border-border/60 shadow-lg">
        {lots?.map((lot) => {
          const status = getOccupancyStatus(lot.current_occupancy, lot.capacity);
          const isSelected = selectedLotId === lot.id;
          const available = lot.capacity - lot.current_occupancy;

          return (
            <button
              key={lot.id}
              onClick={() => handleSelectLot(lot)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-sm ring-1 ring-primary'
                  : 'bg-card/80 hover:bg-card text-foreground hover:border-primary/40 border border-border/40'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${status.bg}`} />
              <span className="truncate max-w-[110px] sm:max-w-[140px] font-semibold">{lot.name.split(' ')[0]}</span>
              <span className={`text-[10px] font-mono ${isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
                {available}p
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
