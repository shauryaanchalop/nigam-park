import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BusinessAccount {
  id: string;
  user_id: string;
  company_name: string;
  company_email: string | null;
  company_phone: string | null;
  gst_number: string | null;
  max_vehicles: number;
  monthly_budget: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FleetVehicle {
  id: string;
  business_account_id: string;
  vehicle_number: string;
  vehicle_type: string;
  driver_name: string | null;
  driver_phone: string | null;
  department: string | null;
  is_active: boolean;
  monthly_limit: number;
  current_month_usage: number;
  created_at: string;
  updated_at: string;
}

export function useFleetManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch business account
  const { data: businessAccount, isLoading: accountLoading } = useQuery({
    queryKey: ['business-account', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('business_accounts')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as BusinessAccount | null;
    },
    enabled: !!user,
  });

  // Fetch fleet vehicles
  const { data: fleetVehicles, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['fleet-vehicles', businessAccount?.id],
    queryFn: async () => {
      if (!businessAccount) return [];
      const { data, error } = await supabase
        .from('fleet_vehicles')
        .select('*')
        .eq('business_account_id', businessAccount.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as FleetVehicle[];
    },
    enabled: !!businessAccount,
  });

  // Create business account
  const createAccount = useMutation({
    mutationFn: async (accountData: Partial<BusinessAccount>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('business_accounts')
        .insert({
          user_id: user.id,
          company_name: accountData.company_name,
          company_email: accountData.company_email,
          company_phone: accountData.company_phone,
          gst_number: accountData.gst_number,
          max_vehicles: accountData.max_vehicles || 10,
          monthly_budget: accountData.monthly_budget || 0,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-account'] });
    },
  });

  // Update business account
  const updateAccount = useMutation({
    mutationFn: async (accountData: Partial<BusinessAccount>) => {
      if (!businessAccount) throw new Error('No business account');
      
      const { data, error } = await supabase
        .from('business_accounts')
        .update(accountData)
        .eq('id', businessAccount.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-account'] });
    },
  });

  // Add vehicle
  const addVehicle = useMutation({
    mutationFn: async (vehicleData: Partial<FleetVehicle>) => {
      if (!businessAccount) throw new Error('No business account');
      
      const { data, error } = await supabase
        .from('fleet_vehicles')
        .insert({
          business_account_id: businessAccount.id,
          vehicle_number: vehicleData.vehicle_number,
          vehicle_type: vehicleData.vehicle_type || 'car',
          driver_name: vehicleData.driver_name,
          driver_phone: vehicleData.driver_phone,
          department: vehicleData.department,
          monthly_limit: vehicleData.monthly_limit || 0,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-vehicles'] });
    },
  });

  // Update vehicle
  const updateVehicle = useMutation({
    mutationFn: async ({ id, ...vehicleData }: Partial<FleetVehicle> & { id: string }) => {
      const { data, error } = await supabase
        .from('fleet_vehicles')
        .update(vehicleData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-vehicles'] });
    },
  });

  // Delete vehicle
  const deleteVehicle = useMutation({
    mutationFn: async (vehicleId: string) => {
      const { error } = await supabase
        .from('fleet_vehicles')
        .delete()
        .eq('id', vehicleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-vehicles'] });
    },
  });

  const totalMonthlyUsage = fleetVehicles?.reduce((sum, v) => sum + Number(v.current_month_usage), 0) || 0;
  const vehicleCount = fleetVehicles?.filter(v => v.is_active).length || 0;

  return {
    businessAccount,
    fleetVehicles,
    isLoading: accountLoading || vehiclesLoading,
    createAccount,
    updateAccount,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    totalMonthlyUsage,
    vehicleCount,
    hasAccount: !!businessAccount,
  };
}
