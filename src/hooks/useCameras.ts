import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Camera, VisionEvent, CameraWithEvents } from '@/types/ai-modules';
import { useEffect } from 'react';
import { DEMO_CAMERAS, withDemoFallback } from '@/lib/demoData';

export function useCameras() {
  const queryClient = useQueryClient();

  const { data: rawCameras, isLoading, error } = useQuery({
    queryKey: ['cameras'],
    queryFn: async () => {
      try {
        const { data: camerasData, error: camerasError } = await supabase
          .from('cameras')
          .select('*')
          .order('name', { ascending: true });

        if (camerasError || !camerasData || camerasData.length === 0) {
          return DEMO_CAMERAS;
        }

        // Fetch recent vision events for each camera
        const camerasWithEvents: CameraWithEvents[] = await Promise.all(
          (camerasData as Camera[]).map(async (camera) => {
            const { data: events } = await supabase
              .from('vision_events')
              .select('*')
              .eq('camera_id', camera.id)
              .order('detected_at', { ascending: false })
              .limit(5);

            return {
              ...camera,
              vision_events: (events as VisionEvent[]) || [],
            };
          })
        );

        return withDemoFallback(camerasWithEvents, DEMO_CAMERAS);
      } catch (err) {
        console.warn('[useCameras] Supabase camera fetch failed, using demo cameras:', err);
        return DEMO_CAMERAS;
      }
    },
  });

  // Real-time subscription for vision events
  useEffect(() => {
    const channel = supabase
      .channel('vision-events-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vision_events',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['cameras'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const cameras = withDemoFallback(rawCameras, DEMO_CAMERAS);

  return {
    cameras,
    isLoading: isLoading && !rawCameras,
    error,
  };
}

