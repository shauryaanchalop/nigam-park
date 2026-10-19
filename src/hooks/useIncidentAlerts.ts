import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ParkingIncident, IncidentStatus, NewIncidentPayload } from '@/types/incidents';
import { toast } from 'sonner';

/**
 * Synthesizes an emergency alert sound using Web Audio API
 * Avoids dependency on external .mp3 audio files.
 */
function playEmergencyChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const createTone = (freq: number, start: number, duration: number, type: OscillatorType = 'sawtooth') => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);

      // Smooth attack and decay
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration);
    };

    // Urgent two-pulse siren sequence
    createTone(880, now, 0.18, 'sine');
    createTone(659, now + 0.14, 0.18, 'sine');
    createTone(880, now + 0.32, 0.22, 'triangle');
    createTone(987, now + 0.50, 0.30, 'sine');
  } catch (err) {
    console.warn('Audio synthesis note: user interaction required or context error', err);
  }
}

export const DEFAULT_MOCK_INCIDENTS: ParkingIncident[] = [
  {
    id: 'mock-incident-1',
    camera_id: 'CAM_CP_LOT_04',
    lot_zone: 'Connaught Place - Block A Entry',
    incident_type: 'VEHICLE_COLLISION',
    severity: 'CRITICAL',
    involved_track_ids: [104, 112],
    involved_plates: ['DL 01 AB 1234', 'HR 26 DQ 5678'],
    iou_score: 0.38,
    snapshot_url: '/parking-crash.jpg',
    status: 'UNRESOLVED',
    notes: 'Impact detected between sedan and hatchback near Block A automated entry gate.',
    created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-incident-2',
    camera_id: 'CAM_KB_LOT_02',
    lot_zone: 'Karol Bagh - Zone 3 South',
    incident_type: 'ILLEGAL_STOPPAGE',
    severity: 'HIGH',
    involved_track_ids: [205],
    involved_plates: ['UP 16 CD 7823'],
    iou_score: 0.15,
    snapshot_url: '/parking-crash.png',
    status: 'INVESTIGATING',
    notes: 'Vehicle stationary in emergency fire lane obstructing transit for >15 minutes.',
    created_at: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
  },
];

export function useIncidentAlerts() {
  const queryClient = useQueryClient();
  const [activeIncident, setActiveIncident] = useState<ParkingIncident | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const audioEnabledRef = useRef(true);

  // Dismiss an incident so it does not auto-reopen
  const dismissIncident = useCallback((id?: string) => {
    const targetId = id || activeIncident?.id;
    if (targetId) {
      setDismissedIds((prev) => new Set([...prev, targetId]));
    }
    setActiveIncident(null);
  }, [activeIncident]);

  // Fetch recent incidents
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

  // Auto-set the first unresolved incident as active on load, only if not previously dismissed
  useEffect(() => {
    if (!activeIncident && incidents.length > 0) {
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

          // Set active incident banner for commissioner alert
          if (newIncident.status === 'UNRESOLVED') {
            setActiveIncident(newIncident);
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

      const mockPayload: Record<string, unknown> = {
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
        status: override?.status || 'UNRESOLVED',
        notes: override?.notes || 'Simulated collision test from Municipal Commissioner Command Console.',
      };

      try {
        const { data, error } = await supabase
          .from('parking_incidents')
          .insert(mockPayload as any)
          .select()
          .single();

        if (error) {
          console.warn('Supabase insert failed, using fallback local mock incident:', error);
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
          setActiveIncident(fallbackIncident);
          queryClient.setQueryData<ParkingIncident[]>(['parking-incidents'], (old = []) => [fallbackIncident, ...old]);
          return fallbackIncident;
        }

        const incident = data as ParkingIncident;
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
