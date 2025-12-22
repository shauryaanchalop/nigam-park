import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Users, Shield, UserCheck, User, ArrowLeft, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { GovHeader } from '@/components/ui/GovHeader';
import { StatCard } from '@/components/ui/StatCard';
import { useAuth } from '@/contexts/AuthContext';
import { useUserManagement } from '@/hooks/useUserManagement';
import { useParkingLots } from '@/hooks/useParkingLots';
import { AppRole } from '@/types/database';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AdminUserManagement() {
  const { user, userRole, loading } = useAuth();
  const { data: users, isLoading, updateUserRole, stats, refetch } = useUserManagement();
  const { data: lots } = useParkingLots();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<{
    id: string;
    roleId: string;
    name: string | null;
    currentRole: AppRole;
    newRole: AppRole;
    assignedLotId: string | null;
  } | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full chakra-spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const filteredUsers = users?.filter(u => {
    const matchesSearch = !searchQuery || 
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  }) ?? [];

  const handleRoleChange = async () => {
    if (!editingUser) return;

    try {
      await updateUserRole.mutateAsync({
        roleId: editingUser.roleId,
        newRole: editingUser.newRole,
        assignedLotId: editingUser.newRole === 'attendant' ? editingUser.assignedLotId : null,
      });
      toast.success(`User role updated to ${editingUser.newRole}`);
      setEditingUser(null);
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const getRoleBadge = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-primary text-primary-foreground">Admin</Badge>;
      case 'attendant':
        return <Badge className="bg-accent text-accent-foreground">Attendant</Badge>;
      case 'citizen':
        return <Badge variant="secondary">Citizen</Badge>;
    }
  };

  const getLotName = (lotId: string | null) => {
    if (!lotId) return '-';
    const lot = lots?.find(l => l.id === lotId);
    return lot?.name ?? 'Unknown';
  };

  return (
    <div className="min-h-screen bg-background">
      <GovHeader 
        title="User Management" 
        subtitle="Admin Control Panel"
      />

      <main className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-4 gap-2"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Users"
            value={stats.total}
            icon={Users}
            variant="default"
          />
          <StatCard
            title="Administrators"
            value={stats.admins}
            icon={Shield}
            variant="success"
          />
          <StatCard
            title="Attendants"
            value={stats.attendants}
            icon={UserCheck}
            variant="warning"
          />
          <StatCard
            title="Citizens"
            value={stats.citizens}
            icon={User}
            variant="default"
          />
        </div>

        {/* User Management Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>User Roles</CardTitle>
                <CardDescription>
                  Manage user permissions and role assignments
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="attendant">Attendants</SelectItem>
                  <SelectItem value="citizen">Citizens</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Users Table */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery || roleFilter !== 'all' 
                  ? 'No users match your filters'
                  : 'No users found'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Assigned Lot</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          {u.full_name || 'Unnamed User'}
                          <p className="text-xs text-muted-foreground font-mono">
                            {u.id.slice(0, 8)}...
                          </p>
                        </TableCell>
                        <TableCell>{getRoleBadge(u.role)}</TableCell>
                        <TableCell>{getLotName(u.assigned_lot_id)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString('en-IN')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingUser({
                              id: u.id,
                              roleId: u.role_id,
                              name: u.full_name,
                              currentRole: u.role,
                              newRole: u.role,
                              assignedLotId: u.assigned_lot_id,
                            })}
                          >
                            Edit Role
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Change role for {editingUser?.name || 'this user'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Role</Label>
              <div>{editingUser && getRoleBadge(editingUser.currentRole)}</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-role">New Role</Label>
              <Select
                value={editingUser?.newRole}
                onValueChange={(v) => setEditingUser(prev => 
                  prev ? { ...prev, newRole: v as AppRole } : null
                )}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Administrator
                    </div>
                  </SelectItem>
                  <SelectItem value="attendant">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4" />
                      Parking Attendant
                    </div>
                  </SelectItem>
                  <SelectItem value="citizen">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Citizen
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editingUser?.newRole === 'attendant' && (
              <div className="space-y-2">
                <Label htmlFor="assigned-lot">Assigned Parking Lot</Label>
                <Select
                  value={editingUser?.assignedLotId || ''}
                  onValueChange={(v) => setEditingUser(prev => 
                    prev ? { ...prev, assignedLotId: v || null } : null
                  )}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select lot" />
                  </SelectTrigger>
                  <SelectContent>
                    {lots?.map(lot => (
                      <SelectItem key={lot.id} value={lot.id}>
                        {lot.name} ({lot.zone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRoleChange}
              disabled={updateUserRole.isPending || editingUser?.newRole === editingUser?.currentRole}
            >
              {updateUserRole.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
