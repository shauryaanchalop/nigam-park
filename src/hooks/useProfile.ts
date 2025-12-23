import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

interface SavedVehicle {
  id: string;
  user_id: string;
  vehicle_number: string;
  vehicle_name: string | null;
  vehicle_type: string;
  is_primary: boolean;
  created_at: string;
}

interface UserPreferences {
  id: string;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  reminder_before_expiry: number;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user?.id,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Pick<Profile, 'full_name' | 'phone' | 'avatar_url'>>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update profile', { description: error.message });
    },
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    updateProfile,
  };
}

export function useSavedVehicles() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const vehiclesQuery = useQuery({
    queryKey: ['saved-vehicles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('saved_vehicles')
        .select('*')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SavedVehicle[];
    },
    enabled: !!user?.id,
  });

  const addVehicle = useMutation({
    mutationFn: async (vehicle: { vehicle_number: string; vehicle_name?: string; vehicle_type?: string; is_primary?: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // If setting as primary, unset other primaries first
      if (vehicle.is_primary) {
        await supabase
          .from('saved_vehicles')
          .update({ is_primary: false })
          .eq('user_id', user.id);
      }

      const { data, error } = await supabase
        .from('saved_vehicles')
        .insert({
          user_id: user.id,
          vehicle_number: vehicle.vehicle_number.toUpperCase(),
          vehicle_name: vehicle.vehicle_name || null,
          vehicle_type: vehicle.vehicle_type || 'car',
          is_primary: vehicle.is_primary || false,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-vehicles'] });
      toast.success('Vehicle added successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to add vehicle', { description: error.message });
    },
  });

  const updateVehicle = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SavedVehicle> & { id: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // If setting as primary, unset other primaries first
      if (updates.is_primary) {
        await supabase
          .from('saved_vehicles')
          .update({ is_primary: false })
          .eq('user_id', user.id);
      }

      const { data, error } = await supabase
        .from('saved_vehicles')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-vehicles'] });
      toast.success('Vehicle updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update vehicle', { description: error.message });
    },
  });

  const deleteVehicle = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('saved_vehicles')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-vehicles'] });
      toast.success('Vehicle removed');
    },
    onError: (error: Error) => {
      toast.error('Failed to remove vehicle', { description: error.message });
    },
  });

  return {
    vehicles: vehiclesQuery.data ?? [],
    isLoading: vehiclesQuery.isLoading,
    addVehicle,
    updateVehicle,
    deleteVehicle,
  };
}

export function useUserPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const preferencesQuery = useQuery({
    queryKey: ['user-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      // Return default preferences if none exist
      if (!data) {
        return {
          email_notifications: true,
          push_notifications: true,
          sms_notifications: false,
          reminder_before_expiry: 30,
        } as Partial<UserPreferences>;
      }
      return data as UserPreferences;
    },
    enabled: !!user?.id,
  });

  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<Pick<UserPreferences, 'email_notifications' | 'push_notifications' | 'sms_notifications' | 'reminder_before_expiry'>>) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Check if preferences exist
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('user_preferences')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('user_preferences')
          .insert({ user_id: user.id, ...updates })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
      toast.success('Preferences updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update preferences', { description: error.message });
    },
  });

  return {
    preferences: preferencesQuery.data,
    isLoading: preferencesQuery.isLoading,
    updatePreferences,
  };
}
