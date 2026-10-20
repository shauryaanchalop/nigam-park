import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ParkingIncident, IncidentStatus, NewIncidentPayload } from '@/types/incidents';
import { toast } from 'sonner';
import {
  DEFAULT_MOCK_INCIDENTS,
  getDismissedIncidentIds,
  saveDismissedIncidentId,
  isBannerDismissedForSession,
  setBannerDismissedForSession,
  playEmergencyChime,
} from '@/lib/incidentAlertSession';

export interface IncidentAlertContextType {
  incidents: ParkingIncident[];
  unresolvedIncidents: ParkingIncident[];
  investigatingIncidents: ParkingIncident[];
  activeIncident: ParkingIncident | null;
  setActiveIncident: React.Dispatch<React.SetStateAction<ParkingIncident | null>>;
  dismissIncident: (id?: string) => void;
  dismissedIds: Set<string>;
  isLoading: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
  updateIncidentStatus: (incidentId: string, newStatus: IncidentStatus, notes?: string) => Promise<ParkingIncident | null>;
  acknowledgeIncident: UseMutationResult<ParkingIncident, unknown, string, unknown>;
  resolveIncident: UseMutationResult<ParkingIncident, unknown, { id: string; status: IncidentStatus; notes?: string }, unknown>;
  simulateIncident: (override?: Partial<NewIncidentPayload>) => Promise<ParkingIncident | undefined>;
  playEmergencyChime: () => void;
  toggleAudio: () => boolean;
}

const IncidentAlertContext = createContext<IncidentAlertContextType | null>(null);

export function IncidentAlertProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [activeIncident, setActiveIncident] = useState<ParkingIncident | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => getDismissedIncidentIds());
  const audioEnabledRef = useRef(true);
  const initialCheckDoneRef = useRef(false);

  // Fetch recent incidents
  const { data: incidents = DEFAULT_MOCK_INCIDENTS, isLoading, error, refetch } = useQuery({
    queryKey: ['parking-incidents'],
    queryFn: async () => {
      try {
        const { data, error: fetchErr } = await supabase
          .from('parking_incidents')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (fetchErr) {
          console.warn('Failed to fetch parking incidents:', fetchErr);
          return DEFAULT_MOCK_INCIDENTS;
        }
        if (data && data.length > 0) return data as ParkingIncident[];
        return DEFAULT_MOCK_INCIDENTS;
      } catch (err) {
        console.warn('Using offline mock incidents:', err);
        return DEFAULT_MOCK_INCIDENTS;
      }
    },
    staleTime: 5000,
  });

  // Dismiss an incident so it does not auto-reopen across any navigation cycle or view switch
  const dismissIncident = useCallback((id?: string) => {
    const targetId = id || activeIncident?.id;
    if (targetId) {
      saveDismissedIncidentId(targetId);
      setDismissedIds((prev) => {
        const updated = new Set(prev);
        updated.add(targetId);
        return updated;
      });
    }
    setBannerDismissedForSession(true);
    setActiveIncident(null);
  }, [activeIncident]);

  // Initial load check: only auto-select first unresolved incident if NOT already dismissed this session
  useEffect(() => {
    if (initialCheckDoneRef.current) return;
    
    // If the banner or session was already dismissed, do not auto-open on load
    if (isBannerDismissedForSession()) {
      initialCheckDoneRef.current = true;
      return;
    }

    if (!activeIncident && incidents.length > 0) {
      initialCheckDoneRef.current = true;
      const firstUnresolved = incidents.find(
        (i) => i.status === 'UNRESOLVED' && !dismissedIds.has(i.id)
      );
      if (firstUnresolved) {
        setActiveIncident(firstUnresolved);
      }
    }
  }, [incidents, activeIncident, dismissedIds]);

  // Subscribe to real-time events on parking_incidents
  useEffect(() => {
    const channel = supabase
      .channel('parking-incidents-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'parking_incidents',
        },
        (payload) => {
          const newIncident = payload.new as ParkingIncident;
          console.log('[Realtime] New incident detected:', newIncident);

          queryClient.setQueryData<ParkingIncident[]>(['parking-incidents'], (old = []) => {
            const exists = old.some((inc) => inc.id === newIncident.id);
            if (exists) return old;
            return [newIncident, ...old];
          });

          // Play emergency audio synthesizer chime for critical/high incidents
          if (audioEnabledRef.current && (newIncident.severity === 'CRITICAL' || newIncident.severity === 'HIGH')) {
            playEmergencyChime();
          }

          // Genuine new critical event always breaks through to notify the user
          if (newIncident.status === 'UNRESOLVED') {
            setActiveIncident(newIncident);
            // Reset session dismissal flag so the genuine new emergency is highlighted
            setBannerDismissedForSession(false);
          }

          toast.error(`CRITICAL: ${newIncident.incident_type.replace(/_/g, ' ')} DETECTED`, {
            description: `Camera ${newIncident.camera_id} (${newIncident.lot_zone}) - IoU: ${newIncident.iou_score?.toFixed(2) || '0.30'}`,
            duration: 8000,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'parking_incidents',
        },
        (payload) => {
          const updated = payload.new as ParkingIncident;
          queryClient.setQueryData<ParkingIncident[]>(['parking-incidents'], (old = []) =>
            old.map((item) => (item.id === updated.id ? updated : item))
          );

          // If current active incident was resolved or marked investigating, sync state
          setActiveIncident((prev) => (prev?.id === updated.id ? updated : prev));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Unified async status update handler that calls Supabase and updates local cache immediately
  const updateIncidentStatus = useCallback(
    async (incidentId: string, newStatus: IncidentStatus, notes?: string) => {
      try {
        if (newStatus === 'RESOLVED' || newStatus === 'FALSE_ALARM') {
          saveDismissedIncidentId(incidentId);
          setDismissedIds((prev) => {
            const next = new Set(prev);
            next.add(incidentId);
            return next;
          });
        }

        if (incidentId.startsWith('mock-')) {
          const fallbackUpdated: ParkingIncident = {
            ...(activeIncident?.id === incidentId ? activeIncident : incidents.find((i) => i.id === incidentId))!,
            status: newStatus,
            notes: notes !== undefined ? notes : activeIncident?.notes,
            updated_at: new Date().toISOString(),
          };

          queryClient.setQueryData<ParkingIncident[]>(['parking-incidents'], (old = []) =>
            old.map((item) => (item.id === incidentId ? { ...item, status: newStatus } : item))
          );
          setActiveIncident((prev) => (prev?.id === incidentId ? { ...prev, status: newStatus } : prev));
          toast.success(`Incident status updated to ${newStatus.replace('_', ' ')}`);
          return fallbackUpdated;
        }

        const { data, error: updateErr } = await supabase
          .from('parking_incidents')
          .update({ 
            status: newStatus, 
            notes: notes !== undefined ? notes : undefined,
            updated_at: new Date().toISOString() 
          })
          .eq('id', incidentId)
          .select()
          .single();

        if (updateErr) throw updateErr;

        const updated = data as ParkingIncident;
        queryClient.setQueryData<ParkingIncident[]>(['parking-incidents'], (old = []) =>
          old.map((item) => (item.id === updated.id ? updated : item))
        );
        setActiveIncident((prev) => (prev?.id === updated.id ? updated : prev));
        queryClient.invalidateQueries({ queryKey: ['parking-incidents'] });

        toast.success(`Incident status updated to ${newStatus.replace('_', ' ')}`);
        return updated;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Database update failed';
        console.error('Failed to update incident status:', err);
        toast.error('Failed to update status', { description: message });
        return null;
      }
    },
    [activeIncident, incidents, queryClient]
  );

  // Acknowledge incident (mark INVESTIGATING)
  const acknowledgeIncident = useMutation({
    mutationFn: async (incidentId: string) => {
      if (incidentId.startsWith('mock-')) {
        return {
          ...(activeIncident?.id === incidentId ? activeIncident : incidents.find((i) => i.id === incidentId))!,
          id: incidentId,
          status: 'INVESTIGATING' as IncidentStatus,
          updated_at: new Date().toISOString(),
        } as ParkingIncident;
      }

      const { data, error: ackErr } = await supabase
        .from('parking_incidents')
        .update({ status: 'INVESTIGATING', updated_at: new Date().toISOString() })
        .eq('id', incidentId)
        .select()
        .single();

      if (ackErr) throw ackErr;
      return data as ParkingIncident;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<ParkingIncident[]>(['parking-incidents'], (old = []) =>
        old.map((item) => (item.id === updated.id ? { ...item, status: 'INVESTIGATING' } : item))
      );
      setActiveIncident((prev) => (prev?.id === updated.id ? { ...prev, status: 'INVESTIGATING' } : prev));
      queryClient.invalidateQueries({ queryKey: ['parking-incidents'] });
      toast.info(`Incident marked as INVESTIGATING`, {
        description: `Zonal team notified for Camera ${updated.camera_id}`,
      });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Database error';
      console.error('Failed to acknowledge incident:', err);
      toast.error('Failed to mark as investigating', { description: message });
    },
  });

  // Resolve incident (mark RESOLVED or FALSE_ALARM)
  const resolveIncident = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: IncidentStatus; notes?: string }) => {
      saveDismissedIncidentId(id);
      setDismissedIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });

      if (id.startsWith('mock-')) {
        return {
          ...(activeIncident?.id === id ? activeIncident : incidents.find((i) => i.id === id))!,
          id,
          status,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        } as ParkingIncident;
      }

      const { data, error: resErr } = await supabase
        .from('parking_incidents')
        .update({ status, notes: notes || null, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (resErr) throw resErr;
      return data as ParkingIncident;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<ParkingIncident[]>(['parking-incidents'], (old = []) =>
        old.map((item) => (item.id === updated.id ? { ...item, status: updated.status } : item))
      );
      setActiveIncident((prev) => (prev?.id === updated.id ? { ...prev, status: updated.status } : prev));
      queryClient.invalidateQueries({ queryKey: ['parking-incidents'] });
      toast.success(`Incident status updated (${updated.status})`, {
        description: `Camera ${updated.camera_id} cleared.`,
      });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Database error';
      console.error('Failed to resolve incident:', err);
      toast.error('Failed to update incident status', { description: message });
    },
  });

  // Simulation Trigger: Insert a realistic mock collision record to test end-to-end
  const simulateIncident = useCallback(
    async (override?: Partial<NewIncidentPayload>) => {
      playEmergencyChime();

      const demoCameraIds = ['CAM_CP_LOT_04', 'CAM_KB_LOT_02', 'CAM_GK_LOT_01', 'CAM_SC_LOT_03'];
      const demoZones = [
        'Connaught Place - Block A Entry',
        'Karol Bagh - Zone 3 South',
        'Greater Kailash - Main Market',
        'Saket City Centre - Gate 2',
      ];
      const randomIndex = Math.floor(Math.random() * demoCameraIds.length);

      const mockPayload = {
        camera_id: override?.camera_id || demoCameraIds[randomIndex],
        lot_zone: override?.lot_zone || demoZones[randomIndex],
        incident_type: override?.incident_type || 'VEHICLE_COLLISION',
        severity: override?.severity || 'CRITICAL',
        involved_track_ids: override?.involved_track_ids || [104, 112],
        involved_plates: override?.involved_plates || ['DL 01 AB 1234', 'HR 26 DQ 5678'],
        iou_score: override?.iou_score || parseFloat((0.24 + Math.random() * 0.18).toFixed(2)),
        snapshot_url:
          override?.snapshot_url ||
          '/parking-crash.jpg',
        status: override?.status || ('UNRESOLVED' as IncidentStatus),
        notes: override?.notes || 'Simulated collision test from Municipal Commissioner Command Console.',
      };

      try {
        const { data, error: simErr } = await supabase
          .from('parking_incidents')
          .insert([mockPayload])
          .select()
          .single();

        if (simErr) {
          console.warn('Supabase insert failed, using fallback local mock incident:', simErr);
          const fallbackIncident: ParkingIncident = {
            id: 'mock-' + Date.now(),
            camera_id: mockPayload.camera_id,
            lot_zone: mockPayload.lot_zone,
            incident_type: mockPayload.incident_type,
            severity: mockPayload.severity,
            involved_track_ids: mockPayload.involved_track_ids,
            involved_plates: mockPayload.involved_plates,
            iou_score: mockPayload.iou_score,
            snapshot_url: mockPayload.snapshot_url,
            status: 'UNRESOLVED',
            notes: mockPayload.notes,
            created_at: new Date().toISOString(),
          };
          setBannerDismissedForSession(false);
          setActiveIncident(fallbackIncident);
          queryClient.setQueryData<ParkingIncident[]>(['parking-incidents'], (old = []) => [fallbackIncident, ...old]);
          return fallbackIncident;
        }

        const incident = data as ParkingIncident;
        setBannerDismissedForSession(false);
        setActiveIncident(incident);
        queryClient.invalidateQueries({ queryKey: ['parking-incidents'] });
        return incident;
      } catch (e) {
        console.error('Error during simulate incident:', e);
      }
    },
    [queryClient]
  );

  const unresolvedIncidents = incidents.filter((i) => i.status === 'UNRESOLVED');
  const investigatingIncidents = incidents.filter((i) => i.status === 'INVESTIGATING');

  const value: IncidentAlertContextType = {
    incidents,
    unresolvedIncidents,
    investigatingIncidents,
    activeIncident,
    setActiveIncident,
    dismissIncident,
    dismissedIds,
    isLoading,
    error,
    refetch,
    updateIncidentStatus,
    acknowledgeIncident,
    resolveIncident,
    simulateIncident,
    playEmergencyChime,
    toggleAudio: () => {
      audioEnabledRef.current = !audioEnabledRef.current;
      return audioEnabledRef.current;
    },
  };

  return (
    <IncidentAlertContext.Provider value={value}>
      {children}
    </IncidentAlertContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useIncidentAlertContext() {
  return useContext(IncidentAlertContext);
}
