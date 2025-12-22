import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SensorLog } from '@/types/database';

export function useSensorLogs() {
  const queryClient = useQueryClient();

  const createSensorLog = useMutation({
    mutationFn: async (log: Omit<SensorLog, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('sensor_logs')
        .insert(log)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sensor-logs'] });
    },
  });

  return {
    createSensorLog,
  };
}
