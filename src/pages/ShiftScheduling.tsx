import React, { useState } from 'react';
import { format, parseISO, addDays, startOfWeek } from 'date-fns';
import { Calendar, Clock, MapPin, Users, ChevronLeft, Plus, Check, X } from 'lucide-react';
import { GovHeader } from '@/components/ui/GovHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatCard } from '@/components/ui/StatCard';
import { useShiftTemplates, useAttendantShifts, useShiftMutations } from '@/hooks/useShifts';
import { useParkingLots } from '@/hooks/useParkingLots';
import { useUserManagement } from '@/hooks/useUserManagement';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

export default function ShiftScheduling() {
  const { data: templates } = useShiftTemplates();
  const { data: shifts, isLoading } = useAttendantShifts();
  const { data: lots } = useParkingLots();
  const { data: users } = useUserManagement();
  const { createShift, updateShiftStatus } = useShiftMutations();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [shiftDate, setShiftDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const attendants = users?.filter(u => u.role === 'attendant') || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline">Scheduled</Badge>;
      case 'in_progress':
        return <Badge className="bg-primary">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-success text-success-foreground">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleCreateShift = async () => {
    if (!selectedLot || !selectedUser || !selectedTemplate || !shiftDate) return;
    
    const template = templates?.find(t => t.id === selectedTemplate);
    if (!template) return;

    await createShift.mutateAsync({
      user_id: selectedUser,
      lot_id: selectedLot,
      shift_date: shiftDate,
      start_time: template.start_time,
      end_time: template.end_time,
    });

    setCreateDialogOpen(false);
    setSelectedLot('');
    setSelectedUser('');
    setSelectedTemplate('');
  };

  const stats = {
    totalShifts: shifts?.length ?? 0,
    scheduled: shifts?.filter(s => s.status === 'scheduled').length ?? 0,
    inProgress: shifts?.filter(s => s.status === 'in_progress').length ?? 0,
    completed: shifts?.filter(s => s.status === 'completed').length ?? 0,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <GovHeader title="Shift Scheduling" subtitle="Loading..." />
        <main className="container mx-auto px-4 py-6">
          <Skeleton className="h-96" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GovHeader 
        title="Shift Scheduling" 
        subtitle="Manage attendant shifts and attendance"
      />

      <main className="container mx-auto px-4 py-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
        </Button>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Shifts"
            value={stats.totalShifts}
            subtitle="All scheduled"
            icon={Calendar}
            variant="default"
          />
          <StatCard
            title="Scheduled"
            value={stats.scheduled}
            subtitle="Upcoming"
            icon={Clock}
            variant="default"
          />
          <StatCard
            title="In Progress"
            value={stats.inProgress}
            subtitle="Currently active"
            icon={Users}
            variant="warning"
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            subtitle="This week"
            icon={Check}
            variant="success"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end mb-6">
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Schedule Shift
          </Button>
        </div>

        {/* Shifts Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              All Shifts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {shifts?.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No shifts scheduled</p>
                <p className="text-muted-foreground">Create your first shift schedule</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shifts?.map((shift) => (
                      <TableRow key={shift.id}>
                        <TableCell>
                          {format(parseISO(shift.shift_date), 'EEE, MMM d')}
                        </TableCell>
                        <TableCell>
                          {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
                        </TableCell>
                        <TableCell>
                          {shift.parking_lots?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(shift.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          {shift.status === 'scheduled' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => updateShiftStatus.mutateAsync({ 
                                shiftId: shift.id, 
                                status: 'cancelled' 
                              })}
                            >
                              <X className="w-3 h-3 mr-1" />
                              Cancel
                            </Button>
                          )}
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

      {/* Create Shift Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule New Shift</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Parking Lot</Label>
              <Select value={selectedLot} onValueChange={setSelectedLot}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {lots?.map((lot) => (
                    <SelectItem key={lot.id} value={lot.id}>
                      {lot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Attendant</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select attendant" />
                </SelectTrigger>
                <SelectContent>
                  {attendants.map((user) => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Shift Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  {templates?.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.start_time.slice(0, 5)} - {template.end_time.slice(0, 5)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={shiftDate}
                onChange={(e) => setShiftDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateShift}
              disabled={!selectedLot || !selectedUser || !selectedTemplate || createShift.isPending}
            >
              {createShift.isPending ? 'Creating...' : 'Schedule Shift'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}