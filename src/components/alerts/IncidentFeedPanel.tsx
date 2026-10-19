import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncidentAlerts } from '@/hooks/useIncidentAlerts';
import { ParkingIncident, IncidentStatus } from '@/types/incidents';
import { 
  Flame, 
  Video, 
  CheckCircle, 
  Clock, 
  Car, 
  AlertTriangle, 
  Sparkles, 
  Filter, 
  Maximize2, 
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  AlertOctagon
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface IncidentFeedPanelProps {
  onFocusCamera?: (cameraId: string) => void;
  compact?: boolean;
}

export function IncidentFeedPanel({ onFocusCamera, compact = false }: IncidentFeedPanelProps) {
  const navigate = useNavigate();
  const {
    incidents,
    unresolvedIncidents,
    isLoading,
    refetch,
    updateIncidentStatus,
    acknowledgeIncident,
    resolveIncident,
    simulateIncident,
  } = useIncidentAlerts();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNRESOLVED' | 'INVESTIGATING' | 'RESOLVED'>('ALL');
  const [selectedIncident, setSelectedIncident] = useState<ParkingIncident | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const filteredIncidents = incidents.filter((incident) => {
    if (statusFilter === 'ALL') return true;
    return incident.status === statusFilter;
  });

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      await simulateIncident();
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCCTVClick = (cameraId: string, incidentId: string) => {
    if (onFocusCamera) {
      onFocusCamera(cameraId);
    } else {
      navigate(`/vision-dashboard?camera=${encodeURIComponent(cameraId)}&incident=${encodeURIComponent(incidentId)}`);
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return 'destructive';
      case 'HIGH':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UNRESOLVED':
        return <Badge variant="destructive" className="text-[10px] uppercase font-bold animate-pulse">Unresolved</Badge>;
      case 'INVESTIGATING':
        return <Badge variant="outline" className="text-[10px] text-yellow-500 border-yellow-500/50 uppercase font-semibold">Investigating</Badge>;
      case 'RESOLVED':
        return <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/50 uppercase font-semibold">Resolved</Badge>;
      case 'FALSE_ALARM':
        return <Badge variant="secondary" className="text-[10px] uppercase font-semibold">False Alarm</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  return (
    <Card className="overflow-hidden border-border/60 hover:border-primary/20 transition-colors shadow-sm">
      <CardHeader className="pb-3 border-b bg-card/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 rounded-lg bg-rose-500/10 text-rose-500">
              <AlertOctagon className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <span>Anomaly & Collision Feed</span>
                {unresolvedIncidents.length > 0 && (
                  <Badge variant="destructive" className="text-xs px-1.5 py-0">
                    {unresolvedIncidents.length} Active
                  </Badge>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Heuristic Tracking (YOLOv8 + ByteTrack + IoU + Motion Vectors)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Demo Simulation Button */}
            <Button
              variant="outline"
              size="sm"
              disabled={isSimulating}
              onClick={handleSimulate}
              className="h-8 gap-1.5 text-xs border-red-500/30 hover:bg-red-500/10 text-destructive font-medium"
              title="Trigger mock collision event with real-time alert and auto CCTV focus"
            >
              <Sparkles className="w-3.5 h-3.5 text-red-500 animate-spin" style={{ animationDuration: '4s' }} />
              {isSimulating ? 'Triggering...' : 'Simulate Crash (Demo)'}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => refetch()}
              title="Refresh incidents"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 pt-2 overflow-x-auto scrollbar-none">
          <Filter className="w-3 h-3 text-muted-foreground mr-1 shrink-0" />
          {(['ALL', 'UNRESOLVED', 'INVESTIGATING', 'RESOLVED'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                statusFilter === filter
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {filter === 'ALL' ? 'All Incidents' : filter.charAt(0) + filter.slice(1).toLowerCase()}
              {filter === 'UNRESOLVED' && unresolvedIncidents.length > 0 && (
                <span className="ml-1.5 px-1 rounded-full bg-red-600 text-white text-[10px]">
                  {unresolvedIncidents.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">
            Loading real-time incidents from Supabase...
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">No Incidents in this View</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Vision edge trackers are operating normally. Click "Simulate Crash (Demo)" above to test Commissioner alerts.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40 max-h-[460px] overflow-y-auto">
            {filteredIncidents.map((incident) => {
              const isUnresolved = incident.status === 'UNRESOLVED';
              const createdDate = new Date(incident.created_at);
              const timeString = createdDate.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={incident.id}
                  className={`p-3.5 sm:p-4 hover:bg-muted/40 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isUnresolved ? 'bg-red-500/5' : ''
                  }`}
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Thumbnail preview */}
                    <div 
                      onClick={() => setSelectedIncident(incident)}
                      className="relative w-16 h-12 rounded-md overflow-hidden bg-muted border border-border/60 flex-shrink-0 cursor-pointer group"
                      title="Inspect snapshot"
                    >
                      <img 
                        src={
                          incident.snapshot_url && !incident.snapshot_url.includes('unsplash')
                            ? incident.snapshot_url
                            : '/parking-crash.jpg'
                        } 
                        alt="Incident capture" 
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/parking-crash.jpg';
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform rounded" 
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent flex items-center justify-center">
                        <Maximize2 className="w-3 h-3 text-white opacity-70 group-hover:opacity-100" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        {getStatusBadge(incident.status)}
                        <Badge variant={getSeverityBadgeVariant(incident.severity)} className="text-[10px] uppercase font-bold">
                          {incident.severity}
                        </Badge>
                        <span className="text-xs font-mono font-medium text-foreground">
                          {incident.camera_id}
                        </span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1 ml-auto">
                          <Clock className="w-3 h-3" />
                          {timeString}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                        {incident.incident_type.replace(/_/g, ' ')} — {incident.lot_zone}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] text-muted-foreground font-mono">
                        {incident.iou_score && (
                          <span className="text-destructive font-semibold">
                            IoU: {(incident.iou_score * 100).toFixed(0)}%
                          </span>
                        )}
                        {incident.involved_track_ids && incident.involved_track_ids.length > 0 && (
                          <span>Tracks: #{incident.involved_track_ids.join(', #')}</span>
                        )}
                        {incident.involved_plates && incident.involved_plates.length > 0 && (
                          <span className="text-foreground/90 font-sans flex items-center gap-1">
                            <Car className="w-3 h-3 text-primary" />
                            {incident.involved_plates.join(' ↔ ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end shrink-0 pt-1 sm:pt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCCTVClick(incident.camera_id, incident.id)}
                      className="h-7 px-2.5 text-xs gap-1 border-primary/30 hover:border-primary text-primary"
                    >
                      <Video className="w-3.5 h-3.5" />
                      CCTV
                    </Button>

                    {incident.status !== 'INVESTIGATING' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateIncidentStatus(incident.id, 'INVESTIGATING')}
                        className="h-7 px-2 text-xs gap-1 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-500/10 border-yellow-500/30"
                        title="Mark Investigating"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">Investigate</span>
                      </Button>
                    )}

                    {incident.status !== 'RESOLVED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateIncidentStatus(incident.id, 'RESOLVED')}
                        className="h-7 px-2 text-xs gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 border-emerald-500/30"
                        title="Resolve"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">Resolve</span>
                      </Button>
                    )}

                    {incident.status !== 'FALSE_ALARM' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateIncidentStatus(incident.id, 'FALSE_ALARM')}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-orange-500"
                        title="False Alarm"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Snapshot Dialog */}
      <Dialog open={!!selectedIncident} onOpenChange={(open) => !open && setSelectedIncident(null)}>
        <DialogContent className="max-w-2xl bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-destructive" />
              Incident Details: {selectedIncident?.camera_id}
            </DialogTitle>
          </DialogHeader>

          {selectedIncident && (
            <div className="space-y-4">
              <div className="aspect-video rounded-lg overflow-hidden border bg-black flex items-center justify-center">
                <img
                  src={
                    selectedIncident.snapshot_url && !selectedIncident.snapshot_url.includes('unsplash')
                      ? selectedIncident.snapshot_url
                      : '/parking-crash.jpg'
                  }
                  alt={`Collision capture at ${selectedIncident.camera_id}`}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/parking-crash.jpg';
                  }}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-muted/50 border">
                  <span className="text-muted-foreground block">Zone</span>
                  <span className="font-semibold">{selectedIncident.lot_zone}</span>
                </div>
                <div className="p-2 rounded bg-muted/50 border">
                  <span className="text-muted-foreground block">Overlap IoU</span>
                  <span className="font-semibold text-destructive">
                    {selectedIncident.iou_score ? (selectedIncident.iou_score * 100).toFixed(1) + '%' : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={selectedIncident.status === 'INVESTIGATING'}
                    onClick={async () => {
                      const res = await updateIncidentStatus(selectedIncident.id, 'INVESTIGATING');
                      if (res) setSelectedIncident(res);
                    }}
                    className="text-xs h-8"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 mr-1 text-yellow-500" />
                    Mark Investigating
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={selectedIncident.status === 'RESOLVED'}
                    onClick={async () => {
                      const res = await updateIncidentStatus(selectedIncident.id, 'RESOLVED');
                      if (res) setSelectedIncident(res);
                    }}
                    className="text-xs h-8"
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                    Resolve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={selectedIncident.status === 'FALSE_ALARM'}
                    onClick={async () => {
                      const res = await updateIncidentStatus(selectedIncident.id, 'FALSE_ALARM');
                      if (res) setSelectedIncident(res);
                    }}
                    className="text-xs h-8"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 mr-1 text-orange-500" />
                    False Alarm
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedIncident(null)}>
                    Close
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => {
                      const cam = selectedIncident.camera_id;
                      const incId = selectedIncident.id;
                      setSelectedIncident(null);
                      handleCCTVClick(cam, incId);
                    }}
                  >
                    <Video className="w-3.5 h-3.5 mr-1" />
                    Open Camera View
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
