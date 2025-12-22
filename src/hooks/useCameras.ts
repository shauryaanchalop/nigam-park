import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Camera, VisionEvent, CameraWithEvents } from '@/types/ai-modules';
import { useEffect } from 'react';

export function useCameras() {
  const queryClient = useQueryClient();

  const { data: cameras, isLoading, error } = useQuery({
    queryKey: ['cameras'],
    queryFn: async () => {
      const { data: camerasData, error: camerasError } = await supabase
        .from('cameras')
        .select('*')
        .order('name', { ascending: true });

      if (camerasError) throw camerasError;

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

      return camerasWithEvents;
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

  return {
    cameras,
    isLoading,
    error,
  };
}
