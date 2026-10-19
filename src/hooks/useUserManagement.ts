import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types/database';
import { z } from 'zod';
import { DEMO_USERS, withDemoFallback } from '@/lib/demoData';

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
      try {
        // First get all user roles
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('id, user_id, role, assigned_lot_id');
        
        if (rolesError || !roles || roles.length === 0) return DEMO_USERS;

        // Get profiles for these users
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, created_at');
        
        if (profilesError) return DEMO_USERS;

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

        return withDemoFallback(users, DEMO_USERS);
      } catch (err) {
        console.warn('[useUserManagement] Fetch failed, using demo users:', err);
        return DEMO_USERS;
      }
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

  const resolvedUsers = withDemoFallback(query.data, DEMO_USERS);

  const stats = {
    total: resolvedUsers.length,
    admins: resolvedUsers.filter(u => u.role === 'admin').length,
    attendants: resolvedUsers.filter(u => u.role === 'attendant').length,
    citizens: resolvedUsers.filter(u => u.role === 'citizen').length,
  };

  return {
    ...query,
    data: resolvedUsers,
    updateUserRole,
    stats,
  };
}
