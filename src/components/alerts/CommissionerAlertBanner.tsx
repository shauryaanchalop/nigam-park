import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ParkingIncident, IncidentStatus } from '@/types/incidents';
import { toast } from 'sonner';
import { isIncidentDismissed, saveDismissedIncidentId, setBannerDismissedForSession } from '@/lib/incidentAlertSession';
import { 
  ShieldAlert, 
  Video, 
  CheckCircle, 
  Clock, 
  X, 
  Maximize2, 
  Car,
  Loader2,
  AlertOctagon,
  HelpCircle,
  Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const [currentIncident, setCurrentIncident] = useState<ParkingIncident | null>(() => {
    if (incident && !isIncidentDismissed(incident.id)) {
      return incident;
    }
    return null;
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    return incident ? isIncidentDismissed(incident.id) : false;
  });

  // Synchronize internal state whenever the incoming incident prop changes
  useEffect(() => {
    if (!incident || isIncidentDismissed(incident.id)) {
      setIsDismissed(true);
      setCurrentIncident(null);
    } else {
      setCurrentIncident(incident);
      setIsDismissed(false);
    }
  }, [incident]);

  const handleDismiss = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (currentIncident?.id) {
      saveDismissedIncidentId(currentIncident.id);
    }
    setBannerDismissedForSession(true);
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
      const { error } = await supabase
        .from('parking_incidents')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', incidentId);

      if (error) {
        console.error('[CommissionerAlertBanner] Supabase update error:', error);
        if (incidentId.startsWith('mock-')) {
          console.warn('[CommissionerAlertBanner] Handled mock incident locally:', incidentId);
        } else {
          throw error;
        }
      }

      setCurrentIncident((prev) => (prev ? { ...prev, status: newStatus } : null));

      if (newStatus === 'RESOLVED' || newStatus === 'FALSE_ALARM') {
        saveDismissedIncidentId(incidentId);
      }

      onStatusChange?.(incidentId, newStatus);
      if (newStatus === 'INVESTIGATING') {
        onAcknowledge?.(incidentId);
      } else if (newStatus === 'RESOLVED') {
        onResolve?.(incidentId);
      }

      const statusLabels: Record<IncidentStatus, string> = {
        UNRESOLVED: 'Unresolved',
        INVESTIGATING: 'Under Investigation',
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
    if (!location.pathname.includes('/vision-dashboard')) {
      navigate(`/vision-dashboard?camera=${encodeURIComponent(currentIncident.camera_id)}&incident=${encodeURIComponent(currentIncident.id)}`);
    }
  };

  const formattedTime = new Date(currentIncident.created_at).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const getThemeStyles = () => {
    switch (currentIncident.status) {
      case 'INVESTIGATING':
        return {
          wrapperBorder: 'border-t-2 border-t-amber-500 border-b border-b-amber-500/20',
          glow: 'bg-[radial-gradient(ellipse_60%_80%_at_20%_-10%,rgba(245,158,11,0.08),transparent_70%)]',
          badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          dotColor: 'bg-amber-500',
          iconColor: 'text-amber-400',
          statusLabel: 'INVESTIGATING',
        };
      case 'RESOLVED':
        return {
          wrapperBorder: 'border-t-2 border-t-emerald-500 border-b border-b-emerald-500/20',
          glow: 'bg-[radial-gradient(ellipse_60%_80%_at_20%_-10%,rgba(16,185,129,0.08),transparent_70%)]',
          badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          dotColor: 'bg-emerald-500',
          iconColor: 'text-emerald-400',
          statusLabel: 'RESOLVED',
        };
      case 'FALSE_ALARM':
        return {
          wrapperBorder: 'border-t-2 border-t-slate-500 border-b border-b-slate-700/40',
          glow: 'bg-[radial-gradient(ellipse_60%_80%_at_20%_-10%,rgba(148,163,184,0.05),transparent_70%)]',
          badgeBg: 'bg-slate-800/80 border-slate-700 text-slate-300',
          dotColor: 'bg-slate-400',
          iconColor: 'text-slate-400',
          statusLabel: 'FALSE ALARM',
        };
      case 'UNRESOLVED':
      default:
        return {
          wrapperBorder: 'border-t-2 border-t-rose-500 border-b border-b-rose-500/20',
          glow: 'bg-[radial-gradient(ellipse_60%_80%_at_20%_-10%,rgba(244,63,94,0.10),transparent_70%)]',
          badgeBg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          dotColor: 'bg-rose-500',
          iconColor: 'text-rose-400',
          statusLabel: 'CRITICAL ALERT',
        };
    }
  };

  const theme = getThemeStyles();
  const incidentTypeName = currentIncident.incident_type.replace(/_/g, ' ');

  return (
    <>
      <aside 
        aria-label="Incident Alert Banner"
        className={`sticky top-0 z-[100] w-full bg-slate-950/95 dark:bg-slate-950/95 backdrop-blur-xl ${theme.wrapperBorder} shadow-lg shadow-black/20 text-slate-100 transition-all duration-300 animate-in slide-in-from-top-2 relative`}
      >
        {/* Subtle Ambient Radial Highlight */}
        <div className={`pointer-events-none absolute inset-0 ${theme.glow}`} />

        <div className="container mx-auto px-3 sm:px-6 py-2.5 sm:py-3 relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4">
            
            {/* Left Column: Severity, Details, Metadata */}
            <div className="flex items-start sm:items-center gap-3 w-full lg:w-auto min-w-0">
              
              {/* Status Indicator Icon */}
              <div className="relative flex-shrink-0 mt-0.5 sm:mt-0">
                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner">
                  {currentIncident.status === 'INVESTIGATING' ? (
                    <ShieldAlert className={`w-4 h-4 ${theme.iconColor}`} />
                  ) : currentIncident.status === 'RESOLVED' ? (
                    <CheckCircle className={`w-4 h-4 ${theme.iconColor}`} />
                  ) : currentIncident.status === 'FALSE_ALARM' ? (
                    <HelpCircle className={`w-4 h-4 ${theme.iconColor}`} />
                  ) : (
                    <AlertOctagon className={`w-4 h-4 ${theme.iconColor}`} />
                  )}
                </div>
                {currentIncident.status === 'UNRESOLVED' && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                  </span>
                )}
              </div>

              {/* Information Text */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {/* Status & Type Pill */}
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${theme.badgeBg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${theme.dotColor}`} />
                    {theme.statusLabel} • {incidentTypeName}
                  </span>

                  {/* Camera ID */}
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-300 bg-slate-900/90 border border-slate-800 px-1.5 py-0.5 rounded">
                    <Camera className="w-3 h-3 text-slate-400" />
                    {currentIncident.camera_id}
                  </span>

                  {/* Timestamp */}
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {formattedTime}
                  </span>
                </div>

                {/* Subtitle with Zone, Overlap, Plates */}
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-300">
                  <span className="font-semibold text-slate-100 truncate max-w-[240px] sm:max-w-none">
                    {currentIncident.lot_zone}
                  </span>

                  {currentIncident.iou_score && (
                    <span className="text-slate-400 text-[11px] font-mono">
                      Overlap: <span className="text-rose-300 font-semibold">{(currentIncident.iou_score * 100).toFixed(0)}% IoU</span>
                    </span>
                  )}

                  {currentIncident.involved_plates && currentIncident.involved_plates.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-amber-300 font-mono text-[11px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                      <Car className="w-3 h-3 text-amber-400/80" />
                      {currentIncident.involved_plates.join(' ↔ ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Clickable Snapshot Thumbnail on Desktop */}
              {currentIncident.snapshot_url && (
                <div 
                  onClick={() => setSnapshotDialogOpen(true)}
                  className="hidden md:flex relative w-12 h-8 rounded border border-slate-800 hover:border-slate-600 overflow-hidden cursor-pointer group flex-shrink-0 transition-colors shadow-sm"
                  title="Click to view collision frame snapshot"
                >
                  <img 
                    src={
                      currentIncident.snapshot_url && !currentIncident.snapshot_url.includes('unsplash')
                        ? currentIncident.snapshot_url
                        : '/parking-crash.jpg'
                    } 
                    alt="Incident snapshot thumbnail" 
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/parking-crash.jpg';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors flex items-center justify-center">
                    <Maximize2 className="w-3 h-3 text-white/90" />
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: High-Value Actions */}
            <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto justify-end pt-1 lg:pt-0 border-t border-slate-800/80 lg:border-t-0">
              
              {/* Snapshot Button (Mobile/Tablet) */}
              {currentIncident.snapshot_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSnapshotDialogOpen(true)}
                  className="h-8 px-2.5 text-xs font-medium bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800 md:hidden"
                >
                  <Maximize2 className="w-3 h-3 mr-1" />
                  Snapshot
                </Button>
              )}

              {/* Primary Call-to-Action: Live CCTV Feed */}
              <Button
                variant="default"
                size="sm"
                onClick={handleAccessCCTV}
                className="h-8 px-3 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-sm border border-rose-500/50 gap-1.5"
              >
                <Video className="w-3.5 h-3.5 text-white" />
                Live CCTV Feed
              </Button>

              {/* Workflow Action 1: Mark Investigating */}
              <Button
                id="btn-mark-investigating"
                variant="outline"
                size="sm"
                disabled={isUpdating || currentIncident.status === 'INVESTIGATING'}
                onClick={() => handleUpdateStatus('INVESTIGATING')}
                className={`h-8 px-2.5 text-xs font-medium border transition-colors gap-1.5 ${
                  currentIncident.status === 'INVESTIGATING'
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 cursor-default'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {isUpdating ? (
                  <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                ) : (
                  <ShieldAlert className="w-3 h-3 text-amber-400" />
                )}
                <span>{currentIncident.status === 'INVESTIGATING' ? 'Investigating' : 'Investigate'}</span>
              </Button>

              {/* Workflow Action 2: Resolve */}
              <Button
                id="btn-mark-resolved"
                variant="outline"
                size="sm"
                disabled={isUpdating || currentIncident.status === 'RESOLVED'}
                onClick={() => handleUpdateStatus('RESOLVED')}
                className={`h-8 px-2.5 text-xs font-medium border transition-colors gap-1.5 ${
                  currentIncident.status === 'RESOLVED'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 cursor-default'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {isUpdating ? (
                  <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                ) : (
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                )}
                <span>{currentIncident.status === 'RESOLVED' ? 'Resolved' : 'Resolve'}</span>
              </Button>

              {/* Workflow Action 3: False Alarm */}
              <Button
                id="btn-mark-false-alarm"
                variant="outline"
                size="sm"
                disabled={isUpdating || currentIncident.status === 'FALSE_ALARM'}
                onClick={() => handleUpdateStatus('FALSE_ALARM')}
                className={`h-8 px-2.5 text-xs font-medium border transition-colors gap-1.5 ${
                  currentIncident.status === 'FALSE_ALARM'
                    ? 'bg-slate-800 text-slate-300 border-slate-700 cursor-default'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
                }`}
              >
                {isUpdating ? (
                  <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                ) : (
                  <HelpCircle className="w-3 h-3 text-slate-400" />
                )}
                <span className="hidden sm:inline">False Alarm</span>
                <span className="sm:hidden">False</span>
              </Button>

              {/* Dismiss Action */}
              <button
                onClick={handleDismiss}
                className="text-slate-400 hover:text-slate-100 p-1.5 rounded-md hover:bg-slate-800/80 transition-colors ml-0.5"
                title="Dismiss alert banner"
                aria-label="Dismiss alert banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* High-Resolution Snapshot Inspection Dialog */}
      <Dialog open={snapshotDialogOpen} onOpenChange={setSnapshotDialogOpen}>
        <DialogContent className="max-w-2xl bg-slate-950 border-slate-800 text-slate-100 p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Camera className="w-4 h-4 text-rose-400" />
              Incident Frame Evidence — {currentIncident.camera_id}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 mt-1">
            <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-800 bg-black shadow-inner">
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
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 bg-slate-950/90 text-rose-400 text-[11px] font-mono px-2 py-0.5 rounded border border-rose-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                EVIDENCE CAPTURE • {currentIncident.camera_id} • {formattedTime}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Type</span>
                <span className="font-semibold text-slate-200">{incidentTypeName}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Zone</span>
                <span className="font-semibold text-slate-200 truncate block">{currentIncident.lot_zone}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">IoU Overlap</span>
                <span className="font-semibold font-mono text-rose-400">
                  {currentIncident.iou_score ? (currentIncident.iou_score * 100).toFixed(1) + '%' : 'N/A'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Status</span>
                <span className="font-semibold text-slate-200">{currentIncident.status}</span>
              </div>
            </div>

            {currentIncident.notes && (
              <p className="text-xs text-slate-400 bg-slate-900 p-2.5 rounded-lg border border-slate-800 italic">
                "{currentIncident.notes}"
              </p>
            )}

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isUpdating || currentIncident.status === 'INVESTIGATING'}
                  onClick={() => handleUpdateStatus('INVESTIGATING')}
                  className="text-xs h-7.5 bg-slate-900 border-slate-800 text-slate-300"
                >
                  <ShieldAlert className="w-3 h-3 mr-1 text-amber-400" />
                  Investigate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isUpdating || currentIncident.status === 'RESOLVED'}
                  onClick={() => handleUpdateStatus('RESOLVED')}
                  className="text-xs h-7.5 bg-slate-900 border-slate-800 text-slate-300"
                >
                  <CheckCircle className="w-3 h-3 mr-1 text-emerald-400" />
                  Resolve
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSnapshotDialogOpen(false)} className="text-xs h-7.5 text-slate-400">
                  Close
                </Button>
                <Button size="sm" onClick={() => { setSnapshotDialogOpen(false); handleAccessCCTV(); }} className="text-xs h-7.5 bg-rose-600 hover:bg-rose-500 text-white">
                  <Video className="w-3.5 h-3.5 mr-1" />
                  Live CCTV
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
