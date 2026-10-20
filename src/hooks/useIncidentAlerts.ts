import { 
  useIncidentAlertContext, 
  IncidentAlertContextType
} from '@/contexts/IncidentAlertContext';
import {
  DEFAULT_MOCK_INCIDENTS,
  getDismissedIncidentIds,
  saveDismissedIncidentId,
  isIncidentDismissed,
  isBannerDismissedForSession,
  setBannerDismissedForSession,
  playEmergencyChime,
} from '@/lib/incidentAlertSession';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ParkingIncident, IncidentStatus, NewIncidentPayload } from '@/types/incidents';
import { toast } from 'sonner';

export { 
  DEFAULT_MOCK_INCIDENTS,
  getDismissedIncidentIds,
  saveDismissedIncidentId,
  isIncidentDismissed,
  isBannerDismissedForSession,
  setBannerDismissedForSession,
  playEmergencyChime 
};

/**
 * Fallback standalone hook in case component is rendered outside of IncidentAlertProvider
 */
function useStandaloneIncidentAlerts(): IncidentAlertContextType {
  const queryClient = useQueryClient();
  const [activeIncident, setActiveIncident] = useState<ParkingIncident | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => getDismissedIncidentIds());
  const audioEnabledRef = useRef(true);
  const initialCheckDoneRef = useRef(false);

  const dismissIncident = useCallback((id?: string) => {
    const targetId = id || activeIncident?.id;
    if (targetId) {
      saveDismissedIncidentId(targetId);
      setDismissedIds((prev) => new Set([...prev, targetId]));
    }
    setBannerDismissedForSession(true);
    setActiveIncident(null);
  }, [activeIncident]);

  const { data: incidents = DEFAULT_MOCK_INCIDENTS, isLoading, error, refetch } = useQuery({
    queryKey: ['parking-incidents'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('parking_incidents')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          console.warn('Failed to fetch parking incidents:', error);
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

  useEffect(() => {
    if (initialCheckDoneRef.current) return;
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

  const updateIncidentStatus = useCallback(
    async (incidentId: string, newStatus: IncidentStatus, notes?: string) => {
      try {
        if (newStatus === 'RESOLVED' || newStatus === 'FALSE_ALARM') {
          saveDismissedIncidentId(incidentId);
          setDismissedIds((prev) => new Set([...prev, incidentId]));
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

        const { data, error } = await supabase
          .from('parking_incidents')
          .update({ 
            status: newStatus, 
            notes: notes !== undefined ? notes : undefined,
            updated_at: new Date().toISOString() 
          })
          .eq('id', incidentId)
          .select()
          .single();

        if (error) throw error;

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

      const { data, error } = await supabase
        .from('parking_incidents')
        .update({ status: 'INVESTIGATING', updated_at: new Date().toISOString() })
        .eq('id', incidentId)
        .select()
        .single();

      if (error) throw error;
      return data as ParkingIncident;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<ParkingIncident[]>(['parking-incidents'], (old = []) =>
        old.map((item) => (item.id === updated.id ? { ...item, status: 'INVESTIGATING' } : item))
      );
      setActiveIncident((prev) => (prev?.id === updated.id ? { ...prev, status: 'INVESTIGATING' } : prev));
      queryClient.invalidateQueries({ queryKey: ['parking-incidents'] });
    },
  });

  const resolveIncident = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: IncidentStatus; notes?: string }) => {
      saveDismissedIncidentId(id);
      setDismissedIds((prev) => new Set([...prev, id]));

      if (id.startsWith('mock-')) {
        return {
          ...(activeIncident?.id === id ? activeIncident : incidents.find((i) => i.id === id))!,
          id,
          status,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        } as ParkingIncident;
      }

      const { data, error } = await supabase
        .from('parking_incidents')
        .update({ status, notes: notes || null, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ParkingIncident;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<ParkingIncident[]>(['parking-incidents'], (old = []) =>
        old.map((item) => (item.id === updated.id ? { ...item, status: updated.status } : item))
      );
      setActiveIncident((prev) => (prev?.id === updated.id ? { ...prev, status: updated.status } : prev));
      queryClient.invalidateQueries({ queryKey: ['parking-incidents'] });
    },
  });

  const simulateIncident = useCallback(
    async (override?: Partial<NewIncidentPayload>) => {
      playEmergencyChime();
      const demoCameraIds = ['CAM_CP_LOT_04', 'CAM_KB_LOT_02'];
      const demoZones = ['Connaught Place - Block A Entry', 'Karol Bagh - Zone 3 South'];
      const randomIndex = Math.floor(Math.random() * demoCameraIds.length);

      const mockPayload: Record<string, unknown> = {
        camera_id: override?.camera_id || demoCameraIds[randomIndex],
        lot_zone: override?.lot_zone || demoZones[randomIndex],
        incident_type: override?.incident_type || 'VEHICLE_COLLISION',
        severity: override?.severity || 'CRITICAL',
        involved_track_ids: override?.involved_track_ids || [104, 112],
        involved_plates: override?.involved_plates || ['DL 01 AB 1234', 'HR 26 DQ 5678'],
        iou_score: override?.iou_score || 0.38,
        snapshot_url: override?.snapshot_url || '/parking-crash.jpg',
        status: override?.status || 'UNRESOLVED',
        notes: override?.notes || 'Simulated collision test',
      };

      const fallbackIncident: ParkingIncident = {
        id: 'mock-' + Date.now(),
        camera_id: mockPayload.camera_id as string,
        lot_zone: mockPayload.lot_zone as string,
        incident_type: mockPayload.incident_type as string,
        severity: mockPayload.severity as string,
        involved_track_ids: mockPayload.involved_track_ids as number[],
        involved_plates: mockPayload.involved_plates as string[],
        iou_score: mockPayload.iou_score as number,
        snapshot_url: mockPayload.snapshot_url as string,
        status: 'UNRESOLVED',
        notes: mockPayload.notes as string,
        created_at: new Date().toISOString(),
      };
      setBannerDismissedForSession(false);
      setActiveIncident(fallbackIncident);
      return fallbackIncident;
    },
    []
  );

  const unresolvedIncidents = incidents.filter((i) => i.status === 'UNRESOLVED');
  const investigatingIncidents = incidents.filter((i) => i.status === 'INVESTIGATING');

  return {
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
}

/**
 * Main hook to consume incident alerts across all components.
 * Consumes the centralized IncidentAlertContext when mounted inside IncidentAlertProvider,
 * or gracefully falls back to session-persistent standalone state if used outside.
 */
export function useIncidentAlerts(): IncidentAlertContextType {
  const context = useIncidentAlertContext();
  const standalone = useStandaloneIncidentAlerts();
  return context || standalone;
}
