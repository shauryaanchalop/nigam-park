import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types/database';
import { z } from 'zod';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  role: AppRole;
  role_id: string;
  assigned_lot_id: string | null;
}

// Validation schema for role updates
const roleUpdateSchema = z.object({
  roleId: z.string().uuid('Invalid role ID'),
  newRole: z.enum(['admin', 'attendant', 'citizen']),
  assignedLotId: z.string().uuid().nullable().optional(),
});

export function useUserManagement() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      // First get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, role, assigned_lot_id');
      
      if (rolesError) throw rolesError;
      if (!roles || roles.length === 0) return [];

      // Get profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, created_at');
      
      if (profilesError) throw profilesError;

      // Combine the data - we'll use user_id as a lookup
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const users: UserWithRole[] = roles.map(role => {
        const profile = profileMap.get(role.user_id);
        return {
          id: role.user_id,
          email: '', // We don't have access to auth.users email directly
          full_name: profile?.full_name || null,
          created_at: profile?.created_at || new Date().toISOString(),
          role: role.role as AppRole,
          role_id: role.id,
          assigned_lot_id: role.assigned_lot_id,
        };
      });

      return users;
    },
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ 
      roleId, 
      newRole, 
      assignedLotId 
    }: { 
      roleId: string; 
      newRole: AppRole; 
      assignedLotId?: string | null;
    }) => {
      // Validate input
      roleUpdateSchema.parse({ roleId, newRole, assignedLotId });
      
      const updateData: { role: AppRole; assigned_lot_id?: string | null } = { 
        role: newRole 
      };
      
      // Only set assigned_lot_id for attendants
      if (newRole === 'attendant') {
        updateData.assigned_lot_id = assignedLotId || null;
      } else {
        updateData.assigned_lot_id = null;
      }

      const { error } = await supabase
        .from('user_roles')
        .update(updateData)
        .eq('id', roleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
    },
  });

  const stats = {
    total: query.data?.length ?? 0,
    admins: query.data?.filter(u => u.role === 'admin').length ?? 0,
    attendants: query.data?.filter(u => u.role === 'attendant').length ?? 0,
    citizens: query.data?.filter(u => u.role === 'citizen').length ?? 0,
  };

  return {
    ...query,
    updateUserRole,
    stats,
  };
}
