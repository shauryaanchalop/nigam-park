import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Zap, 
  ShieldAlert, 
  Car,
  Radio,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAlerts } from '@/hooks/useAlerts';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export interface LiveTelemetryEvent {
  id: string;
  type: 'entry' | 'exit' | 'ev' | 'alert' | 'sync';
  title: string;
  vehiclePlate?: string;
  location: string;
  detail: string;
  amount?: number;
  timestamp: Date;
  status?: string;
}

const INITIAL_EVENTS: LiveTelemetryEvent[] = [
  {
    id: 'evt-1',
    type: 'entry',
    title: 'Vehicle Entry',
    vehiclePlate: 'DL 01 AB 1234',
    location: 'Connaught Place - Block A',
    detail: 'FASTag RFID Auto-Assigned • Bay 14',
    timestamp: new Date(Date.now() - 8 * 1000),
  },
  {
    id: 'evt-2',
    type: 'exit',
    title: 'Vehicle Exit & Paid',
    vehiclePlate: 'HR 26 DQ 5678',
    location: 'Karol Bagh Market',
    detail: 'Gate 2 Barrier Cleared • 1h 45m',
    amount: 60,
    timestamp: new Date(Date.now() - 24 * 1000),
  },
  {
    id: 'evt-3',
    type: 'ev',
    title: 'EV Fast Charging Initiated',
    vehiclePlate: 'DL 3C CE 8812',
    location: 'Lajpat Nagar Central',
    detail: '60kW DC Fast Charger #3 Active',
    timestamp: new Date(Date.now() - 65 * 1000),
  },
  {
    id: 'evt-4',
    type: 'entry',
    title: 'Vehicle Entry',
    vehiclePlate: 'UP 16 BD 9001',
    location: 'Nehru Place Outer',
    detail: 'QR Reservation Scanned • Slot P-42',
    timestamp: new Date(Date.now() - 110 * 1000),
  },
  {
    id: 'evt-5',
    type: 'exit',
    title: 'Vehicle Exit & Paid',
    vehiclePlate: 'DL 10 CK 4402',
    location: 'Chandni Chowk Multilevel',
    detail: 'UPI Instant Settlement • ₹100',
    amount: 100,
    timestamp: new Date(Date.now() - 180 * 1000),
  },
  {
    id: 'evt-6',
    type: 'sync',
    title: 'MCD Sensor Network Sync',
    location: 'Sarojini Nagar Lot',
    detail: '14 IoT Magnetometer Nodes Telemetry OK',
    timestamp: new Date(Date.now() - 250 * 1000),
  },
];

const SIMULATED_STREAM_POOL = [
  {
    type: 'entry' as const,
    title: 'Vehicle Entry',
    plates: ['DL 04 XY 7711', 'HR 51 AX 3192', 'DL 08 CC 3322', 'UP 14 EF 5566'],
    locations: ['Connaught Place - Block A', 'Karol Bagh Market', 'Lajpat Nagar Central', 'Nehru Place Outer'],
    details: ['FASTag RFID detected • Barrier Up', 'Optical ANPR matched • Bay allocated', 'Reserved Passholder entry'],
  },
  {
    type: 'exit' as const,
    title: 'Vehicle Exit & Paid',
    plates: ['DL 02 BC 4433', 'HR 29 MN 8821', 'DL 07 KL 9900', 'DL 11 ZX 2049'],
    locations: ['Connaught Place - Block A', 'Chandni Chowk Multilevel', 'Karol Bagh Market', 'Sarojini Nagar Lot'],
    details: ['FASTag auto-deducted', 'UPI QR receipt issued', 'Prepaid wallet clearance'],
    amounts: [40, 60, 80, 120],
  },
  {
    type: 'ev' as const,
    title: 'EV Fast Charging Session',
    plates: ['DL 3C CE 8812', 'DL 01 EV 9900', 'HR 26 EV 1024'],
    locations: ['Connaught Place - Block A', 'Lajpat Nagar Central', 'Chandni Chowk Multilevel'],
    details: ['CCS2 60kW dispensing • 84% SoC', 'AC Type-2 connected • 7.4kW', 'Charging completed • Unplugged'],
  },
];

export function VigilanceFeed() {
  const { data: alerts, isLoading, resolveAlert } = useAlerts();
  const [activeTab, setActiveTab] = useState<'stream' | 'alerts'>('stream');
  const [events, setEvents] = useState<LiveTelemetryEvent[]>(INITIAL_EVENTS);
  const [isLive, setIsLive] = useState(true);

  // Periodically inject realistic live parking telemetry events
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const template = SIMULATED_STREAM_POOL[Math.floor(Math.random() * SIMULATED_STREAM_POOL.length)];
      const randomPlate = template.plates[Math.floor(Math.random() * template.plates.length)];
      const randomLocation = template.locations[Math.floor(Math.random() * template.locations.length)];
      const randomDetail = template.details[Math.floor(Math.random() * template.details.length)];
      const randomAmount = 'amounts' in template ? template.amounts[Math.floor(Math.random() * template.amounts.length)] : undefined;

      const newEvent: LiveTelemetryEvent = {
        id: `evt-${Date.now()}`,
        type: template.type,
        title: template.title,
        vehiclePlate: randomPlate,
        location: randomLocation,
        detail: randomDetail,
        amount: randomAmount,
        timestamp: new Date(),
      };

      setEvents((prev) => [newEvent, ...prev.slice(0, 19)]);
    }, 6000);

    return () => clearInterval(interval);
  }, [isLive]);

  const unresolvedAlertsCount = alerts?.filter((a) => !a.is_resolved).length || 0;

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Feed Filter Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('stream')}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5',
              activeTab === 'stream'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Live Stream</span>
            <span className="text-[10px] bg-black/20 px-1 rounded-full font-mono">
              {events.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5',
              activeTab === 'alerts'
                ? 'bg-destructive text-destructive-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            <ShieldAlert className="w-3 h-3" />
            <span>Vigilance</span>
            {unresolvedAlertsCount > 0 && (
              <span className="text-[10px] bg-destructive text-white px-1.5 py-0.2 rounded-full font-bold">
                {unresolvedAlertsCount}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={() => setIsLive(!isLive)}
          className="text-[10px] font-mono text-muted-foreground hover:text-foreground flex items-center gap-1 px-1.5 py-0.5 rounded border border-border/40"
          title="Toggle live telemetry simulation stream"
        >
          <span className={cn('w-1.5 h-1.5 rounded-full', isLive ? 'bg-emerald-500 animate-ping' : 'bg-slate-400')} />
          {isLive ? 'LIVE TICK' : 'PAUSED'}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden min-h-0 relative">
        <ScrollArea className="h-full custom-scrollbar">
          <div className="p-2.5 space-y-2">
            {activeTab === 'stream' ? (
              // Live Activity Telemetry Stream
              events.map((evt, idx) => (
                <div
                  key={evt.id}
                  className={cn(
                    'p-2.5 rounded-lg border transition-all text-xs bg-card/90 hover:bg-accent/5',
                    idx === 0 ? 'border-primary/40 bg-primary/5 animate-in fade-in-50 duration-300' : 'border-border/50'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      {/* Event Type Icon Badge */}
                      <div className="mt-0.5 flex-shrink-0">
                        {evt.type === 'entry' ? (
                          <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          </div>
                        ) : evt.type === 'exit' ? (
                          <div className="w-6 h-6 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-500 flex items-center justify-center">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </div>
                        ) : evt.type === 'ev' ? (
                          <div className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                            <Zap className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center">
                            <Radio className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-foreground text-xs">{evt.title}</span>
                          {evt.vehiclePlate && (
                            <span className="font-mono text-[10px] bg-muted px-1.5 py-0.2 rounded border border-border/60 text-foreground font-medium">
                              {evt.vehiclePlate}
                            </span>
                          )}
                          {evt.amount && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                              +₹{evt.amount}
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                          {evt.detail}
                        </div>

                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground">
                          <span className="font-medium text-foreground/80">{evt.location}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 font-mono">
                            <Clock className="w-2.5 h-2.5" />
                            {formatDistanceToNow(evt.timestamp, { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Vigilance & Security Alerts Tab
              alerts?.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'p-2.5 rounded-lg border transition-all text-xs',
                    alert.is_resolved 
                      ? 'bg-muted/40 border-border opacity-70' 
                      : alert.alert_type === 'fraud'
                      ? 'bg-destructive/10 border-destructive/40'
                      : 'bg-amber-500/10 border-amber-500/40'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        {alert.alert_type === 'fraud' ? (
                          <XCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        )}
                        <Badge 
                          variant="outline" 
                          className={cn(
                            'text-[10px] px-1.5 py-0 uppercase font-semibold',
                            alert.severity === 'critical' && 'border-destructive text-destructive',
                            alert.severity === 'high' && 'border-destructive/70 text-destructive',
                            alert.severity === 'medium' && 'border-amber-500 text-amber-600 dark:text-amber-400',
                            alert.severity === 'low' && 'border-muted-foreground text-muted-foreground',
                          )}
                        >
                          {alert.severity}
                        </Badge>
                        {alert.is_resolved && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold">
                            RESOLVED
                          </Badge>
                        )}
                      </div>

                      <p className={cn(
                        'text-xs font-medium leading-snug',
                        alert.alert_type === 'fraud' && !alert.is_resolved && 'text-destructive font-semibold'
                      )}>
                        {alert.message}
                      </p>

                      <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-muted-foreground">
                        <Clock className="w-2.5 h-2.5 shrink-0" />
                        <span>{formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}</span>
                        {alert.parking_lots && (
                          <>
                            <span>•</span>
                            <span className="truncate">{alert.parking_lots.name}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {!alert.is_resolved && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-shrink-0 h-6 text-[11px] px-2 bg-card hover:bg-accent border-border/60"
                        onClick={() => resolveAlert.mutate(alert.id)}
                      >
                        <Check className="w-3 h-3 mr-1 text-emerald-500" />
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
