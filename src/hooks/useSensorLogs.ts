import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SensorLog } from '@/types/database';
import { z } from 'zod';

// Sensor log validation schema - more flexible Indian vehicle number format
const sensorLogSchema = z.object({
  lot_id: z.string().uuid('Invalid lot ID'),
  event_type: z.enum(['entry', 'exit'], { errorMap: () => ({ message: 'Invalid event type' }) }),
  vehicle_detected: z.string()
    .regex(/^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$/, 'Invalid vehicle number format')
    .max(15, 'Vehicle number too long')
    .nullable()
    .optional(),
  has_payment: z.boolean(),
});

export function useSensorLogs() {
  const queryClient = useQueryClient();

  const createSensorLog = useMutation({
    mutationFn: async (log: Omit<SensorLog, 'id' | 'created_at'>) => {
      // Validate input before database operation
      sensorLogSchema.parse(log);
      
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
