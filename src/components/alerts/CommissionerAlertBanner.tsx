import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ParkingIncident, IncidentStatus } from '@/types/incidents';
import { toast } from 'sonner';
import { 
  AlertTriangle, 
  Video, 
  CheckCircle, 
  Clock, 
  ShieldAlert, 
  X, 
  Maximize2, 
  Flame, 
  Car,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface CommissionerAlertBannerProps {
  incident: ParkingIncident | null;
  onAcknowledge?: (id: string) => void;
  onResolve?: (id: string) => void;
  onDismiss: () => void;
  onFocusCamera?: (cameraId: string) => void;
  onStatusChange?: (id: string, newStatus: IncidentStatus) => void;
}

export function CommissionerAlertBanner({
  incident,
  onAcknowledge,
  onResolve,
  onDismiss,
  onFocusCamera,
  onStatusChange,
}: CommissionerAlertBannerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [snapshotDialogOpen, setSnapshotDialogOpen] = useState(false);
  const [currentIncident, setCurrentIncident] = useState<ParkingIncident | null>(incident);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Synchronize internal state whenever the incoming incident prop changes
  useEffect(() => {
    setCurrentIncident(incident);
    setIsDismissed(false);
  }, [incident]);

  const handleDismiss = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setIsDismissed(true);
    setCurrentIncident(null);
    onDismiss?.();
  };

  if (!currentIncident || isDismissed) return null;

  /**
   * Async handler to update incident status in Supabase and immediately reflect in local UI state
   */
  const handleUpdateStatus = async (newStatus: IncidentStatus) => {
    if (!currentIncident) return;
    const incidentId = currentIncident.id;

    setIsUpdating(true);
    try {
      // 1. Call Supabase to update status in parking_incidents
      const { error } = await supabase
        .from('parking_incidents')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', incidentId);

      if (error) {
        console.error('[CommissionerAlertBanner] Supabase update error:', error);
        // Fallback for mock/simulation records in dev/test mode
        if (incidentId.startsWith('mock-')) {
          console.warn('[CommissionerAlertBanner] Handled mock incident locally:', incidentId);
        } else {
          throw error;
        }
      }

      // 2. Immediately update local component state so the UI reflects the change
      setCurrentIncident((prev) => (prev ? { ...prev, status: newStatus } : null));

      // 3. Trigger parent callbacks if wired
      onStatusChange?.(incidentId, newStatus);
      if (newStatus === 'INVESTIGATING') {
        onAcknowledge?.(incidentId);
      } else if (newStatus === 'RESOLVED') {
        onResolve?.(incidentId);
      }

      const statusLabels: Record<IncidentStatus, string> = {
        UNRESOLVED: 'Unresolved',
        INVESTIGATING: 'Investigating',
        RESOLVED: 'Resolved',
        FALSE_ALARM: 'False Alarm',
      };

      toast.success(`Incident status updated to ${statusLabels[newStatus] || newStatus}`);
    } catch (err: unknown) {
      console.error('[CommissionerAlertBanner] Failed to update incident status:', err);
      const errorMessage = err instanceof Error ? err.message : 'Database update failed';
      toast.error('Failed to update incident status', {
        description: errorMessage,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAccessCCTV = () => {
    if (onFocusCamera) {
      onFocusCamera(currentIncident.camera_id);
    }
    // Navigate to vision dashboard with deep-link query params if not already there
    if (!location.pathname.includes('/vision-dashboard')) {
      navigate(`/vision-dashboard?camera=${encodeURIComponent(currentIncident.camera_id)}&incident=${encodeURIComponent(currentIncident.id)}`);
    }
  };

  const formattedTime = new Date(currentIncident.created_at).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const getBannerGradient = () => {
    switch (currentIncident.status) {
      case 'INVESTIGATING':
        return 'from-amber-950/95 via-yellow-950/90 to-amber-900/95 border-yellow-500';
      case 'RESOLVED':
        return 'from-emerald-950/95 via-teal-950/90 to-emerald-900/95 border-emerald-500';
      case 'FALSE_ALARM':
        return 'from-zinc-950/95 via-zinc-900/90 to-zinc-950/95 border-zinc-500';
      case 'UNRESOLVED':
      default:
        return 'from-red-950/95 via-destructive/95 to-red-900/95 border-red-500';
    }
  };

  const renderStatusBadge = () => {
    switch (currentIncident.status) {
      case 'INVESTIGATING':
        return (
          <Badge className="bg-yellow-500 text-black border-yellow-400 font-bold uppercase tracking-wider text-[11px] px-2 py-0.5">
            INVESTIGATING: {currentIncident.incident_type.replace(/_/g, ' ')}
          </Badge>
        );
      case 'RESOLVED':
        return (
          <Badge className="bg-emerald-600 text-white border-emerald-400 font-bold uppercase tracking-wider text-[11px] px-2 py-0.5">
            RESOLVED: {currentIncident.incident_type.replace(/_/g, ' ')}
          </Badge>
        );
      case 'FALSE_ALARM':
        return (
          <Badge className="bg-zinc-600 text-white border-zinc-400 font-bold uppercase tracking-wider text-[11px] px-2 py-0.5">
            FALSE ALARM: {currentIncident.incident_type.replace(/_/g, ' ')}
          </Badge>
        );
      case 'UNRESOLVED':
      default:
        return (
          <Badge variant="destructive" className="bg-red-600 text-white border-red-400 font-bold uppercase tracking-wider text-[11px] px-2 py-0.5 animate-pulse">
            CRITICAL: {currentIncident.incident_type.replace(/_/g, ' ')}
          </Badge>
        );
    }
  };

  return (
    <>
      {/* Sticky top pulsing critical alert banner */}
      <aside 
        aria-label="Critical Incident Alert"
        className={`sticky top-0 z-[100] w-full bg-gradient-to-r ${getBannerGradient()} backdrop-blur-md border-b-2 shadow-2xl text-white px-3 sm:px-6 py-3 transition-all duration-300 animate-in slide-in-from-top-4 relative`}
      >
        {/* Floating Close Button for Mobile Accessibility */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 sm:hidden text-white/80 hover:text-white p-1.5 rounded-full bg-black/40 hover:bg-black/60 transition-colors z-30"
          title="Dismiss banner"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="container mx-auto flex flex-col lg:flex-row items-center justify-between gap-3 pr-6 sm:pr-0">
          
          {/* Left: Icon + Main Alert Information */}
          <div className="flex items-start sm:items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-shrink-0 mt-0.5 sm:mt-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentIncident.status === 'INVESTIGATING'
                  ? 'bg-yellow-600/90 border-2 border-yellow-400'
                  : currentIncident.status === 'RESOLVED'
                  ? 'bg-emerald-600/90 border-2 border-emerald-400'
                  : currentIncident.status === 'FALSE_ALARM'
                  ? 'bg-zinc-700/90 border-2 border-zinc-400'
                  : 'bg-red-600/90 border-2 border-red-400 animate-pulse'
              }`}>
                {currentIncident.status === 'INVESTIGATING' ? (
                  <ShieldAlert className="w-5 h-5 text-white" />
                ) : currentIncident.status === 'RESOLVED' ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : currentIncident.status === 'FALSE_ALARM' ? (
                  <AlertTriangle className="w-5 h-5 text-zinc-200" />
                ) : (
                  <Flame className="w-6 h-6 text-white" />
                )}
              </div>
              {currentIncident.status === 'UNRESOLVED' && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {renderStatusBadge()}
                <span className="text-xs bg-black/40 border border-white/20 px-2 py-0.5 rounded font-mono text-white/90">
                  {currentIncident.camera_id}
                </span>
                <span className="text-xs text-white/80 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  {formattedTime}
                </span>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-white/90 font-medium">
                <span className="font-semibold text-white truncate max-w-[280px] sm:max-w-none">
                  {currentIncident.lot_zone}
                </span>
                {currentIncident.iou_score && (
                  <span className="text-white/80 font-mono">
                    Overlap IoU: {(currentIncident.iou_score * 100).toFixed(0)}%
                  </span>
                )}
                {currentIncident.involved_plates && currentIncident.involved_plates.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-yellow-300 font-mono text-xs bg-black/30 px-1.5 py-0.5 rounded">
                    <Car className="w-3 h-3" />
                    {currentIncident.involved_plates.join(' ↔ ')}
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail preview on desktop */}
            {currentIncident.snapshot_url && (
              <div 
                onClick={() => setSnapshotDialogOpen(true)}
                className="hidden xl:block relative w-16 h-11 rounded border border-white/30 overflow-hidden cursor-pointer group flex-shrink-0"
                title="Click to view full collision snapshot"
              >
                <img 
                  src={
                    currentIncident.snapshot_url && !currentIncident.snapshot_url.includes('unsplash')
                      ? currentIncident.snapshot_url
                      : '/parking-crash.jpg'
                  } 
                  alt="Incident snapshot" 
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/parking-crash.jpg';
                  }}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 rounded"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition-colors flex items-center justify-center">
                  <Maximize2 className="w-3.5 h-3.5 text-white/80 drop-shadow" />
                </div>
              </div>
            )}
          </div>

          {/* Right: Commissioner Actions */}
          {/* Right: Commissioner Actions */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full lg:w-auto justify-end">
            {currentIncident.snapshot_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSnapshotDialogOpen(true)}
                className="bg-black/30 hover:bg-black/50 text-white border-white/20 text-xs h-9 sm:h-8 px-2 sm:px-3 w-full sm:w-auto"
              >
                <Maximize2 className="w-3.5 h-3.5 mr-1" />
                Snapshot
              </Button>
            )}

            <Button
              variant="default"
              size="sm"
              onClick={handleAccessCCTV}
              className="col-span-2 sm:col-span-1 bg-white hover:bg-neutral-100 text-neutral-900 font-bold border border-white/40 text-xs sm:text-sm h-9 sm:h-8 px-3 shadow-md w-full sm:w-auto"
            >
              <Video className="w-4 h-4 mr-1.5 text-red-600 animate-pulse" />
              Access Live CCTV Feed
            </Button>

            {/* 1. Mark Investigating Button */}
            <Button
              id="btn-mark-investigating"
              variant="outline"
              size="sm"
              disabled={isUpdating || currentIncident.status === 'INVESTIGATING'}
              onClick={() => handleUpdateStatus('INVESTIGATING')}
              className={`text-xs h-9 sm:h-8 px-2 sm:px-3 font-semibold transition-all w-full sm:w-auto ${
                currentIncident.status === 'INVESTIGATING'
                  ? 'bg-yellow-500/30 text-yellow-200 border-yellow-400 cursor-default ring-1 ring-yellow-400/50'
                  : 'bg-red-900/60 hover:bg-yellow-950/80 hover:border-yellow-400/70 text-white border-red-500/50'
              }`}
            >
              {isUpdating ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-yellow-400" />
              )}
              {currentIncident.status === 'INVESTIGATING' ? 'Under Investigation' : 'Mark Investigating'}
            </Button>

            {/* 2. Resolve Button */}
            <Button
              id="btn-mark-resolved"
              variant="outline"
              size="sm"
              disabled={isUpdating || currentIncident.status === 'RESOLVED'}
              onClick={() => handleUpdateStatus('RESOLVED')}
              className={`text-xs h-9 sm:h-8 px-2 sm:px-3 font-semibold transition-all w-full sm:w-auto ${
                currentIncident.status === 'RESOLVED'
                  ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400 cursor-default ring-1 ring-emerald-400/50'
                  : 'bg-red-900/40 hover:bg-emerald-950/80 hover:border-emerald-400/70 text-white border-red-500/30'
              }`}
            >
              {isUpdating ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              )}
              {currentIncident.status === 'RESOLVED' ? 'Resolved' : 'Resolve'}
            </Button>

            {/* 3. False Alarm Button */}
            <Button
              id="btn-mark-false-alarm"
              variant="outline"
              size="sm"
              disabled={isUpdating || currentIncident.status === 'FALSE_ALARM'}
              onClick={() => handleUpdateStatus('FALSE_ALARM')}
              className={`col-span-2 sm:col-span-1 text-xs h-9 sm:h-8 px-2 sm:px-3 font-semibold transition-all w-full sm:w-auto ${
                currentIncident.status === 'FALSE_ALARM'
                  ? 'bg-zinc-700/60 text-zinc-300 border-zinc-400 cursor-default ring-1 ring-zinc-400/50'
                  : 'bg-red-900/30 hover:bg-zinc-900/80 hover:border-zinc-400/70 text-white border-red-500/20'
              }`}
            >
              {isUpdating ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-orange-400" />
              )}
              {currentIncident.status === 'FALSE_ALARM' ? 'Marked False Alarm' : 'False Alarm'}
            </Button>

            <button
              onClick={handleDismiss}
              className="text-white/70 hover:text-white p-1 rounded-md hover:bg-black/30 transition-colors ml-1"
              title="Dismiss banner"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Full Resolution Snapshot Modal */}
      <Dialog open={snapshotDialogOpen} onOpenChange={setSnapshotDialogOpen}>
        <DialogContent className="max-w-3xl bg-card border-red-500/50 p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Collision Frame Snapshot — {currentIncident.camera_id}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-red-500/60 bg-black">
              <img
                src={
                  currentIncident.snapshot_url && !currentIncident.snapshot_url.includes('unsplash')
                    ? currentIncident.snapshot_url
                    : '/parking-crash.jpg'
                }
                alt={`Collision capture at ${currentIncident.lot_zone}`}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/parking-crash.jpg';
                }}
                className="w-full h-full object-cover rounded-md"
              />
              <div className="absolute top-2 left-2 bg-black/80 text-red-400 text-xs font-mono px-2 py-1 rounded border border-red-500/40">
                REC • {currentIncident.camera_id} • {formattedTime}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded bg-muted/60 border">
                <span className="text-muted-foreground block">Incident Type</span>
                <span className="font-semibold">{currentIncident.incident_type}</span>
              </div>
              <div className="p-2.5 rounded bg-muted/60 border">
                <span className="text-muted-foreground block">Zone</span>
                <span className="font-semibold truncate">{currentIncident.lot_zone}</span>
              </div>
              <div className="p-2.5 rounded bg-muted/60 border">
                <span className="text-muted-foreground block">IoU Overlap</span>
                <span className="font-semibold font-mono text-destructive">
                  {currentIncident.iou_score ? (currentIncident.iou_score * 100).toFixed(1) + '%' : 'N/A'}
                </span>
              </div>
              <div className="p-2.5 rounded bg-muted/60 border">
                <span className="text-muted-foreground block">Status</span>
                <span className="font-semibold">{currentIncident.status}</span>
              </div>
            </div>

            {currentIncident.notes && (
              <p className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded border italic">
                "{currentIncident.notes}"
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isUpdating || currentIncident.status === 'INVESTIGATING'}
                  onClick={() => handleUpdateStatus('INVESTIGATING')}
                  className="text-xs h-8"
                >
                  <ShieldAlert className="w-3.5 h-3.5 mr-1 text-yellow-500" />
                  Mark Investigating
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isUpdating || currentIncident.status === 'RESOLVED'}
                  onClick={() => handleUpdateStatus('RESOLVED')}
                  className="text-xs h-8"
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                  Resolve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isUpdating || currentIncident.status === 'FALSE_ALARM'}
                  onClick={() => handleUpdateStatus('FALSE_ALARM')}
                  className="text-xs h-8"
                >
                  <AlertTriangle className="w-3.5 h-3.5 mr-1 text-orange-500" />
                  False Alarm
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSnapshotDialogOpen(false)}>
                  Close
                </Button>
                <Button size="sm" variant="destructive" onClick={() => { setSnapshotDialogOpen(false); handleAccessCCTV(); }}>
                  <Video className="w-4 h-4 mr-1.5" />
                  Focus Camera Feed
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
