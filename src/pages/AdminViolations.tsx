import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  ChevronLeft, Search, Filter, AlertTriangle, CheckCircle, 
  XCircle, Clock, Eye, MessageSquare, ExternalLink, Car
} from 'lucide-react';
import { GovHeader } from '@/components/ui/GovHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminViolations, useUpdateViolationStatus, useViolationStats, ViolationReport } from '@/hooks/useAdminViolations';

const VIOLATION_TYPES: Record<string, string> = {
  illegal_parking: 'Illegal Parking',
  double_parking: 'Double Parking',
  blocking_entrance: 'Blocking Entrance',
  handicap_violation: 'Handicap Violation',
  no_payment: 'No Payment',
  overstay: 'Overstay',
  other: 'Other',
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
  { value: 'reviewing', label: 'Reviewing', color: 'bg-blue-500' },
  { value: 'resolved', label: 'Resolved', color: 'bg-green-500' },
  { value: 'action_taken', label: 'Action Taken', color: 'bg-purple-500' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500' },
];

export default function AdminViolations() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedViolation, setSelectedViolation] = useState<ViolationReport | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const { data: violations, isLoading } = useAdminViolations(statusFilter);
  const { data: stats } = useViolationStats();
  const updateStatus = useUpdateViolationStatus();

  const filteredViolations = violations?.filter(v =>
    v.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.violation_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.parking_lots?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewDetails = (violation: ViolationReport) => {
    setSelectedViolation(violation);
    setDetailsOpen(true);
  };

  const handleOpenUpdate = (violation: ViolationReport) => {
    setSelectedViolation(violation);
    setNewStatus(violation.status);
    setAdminNotes(violation.admin_notes || '');
    setUpdateOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedViolation || !newStatus) return;
    
    await updateStatus.mutateAsync({
      id: selectedViolation.id,
      status: newStatus,
      admin_notes: adminNotes || undefined,
    });
    
    setUpdateOpen(false);
    setSelectedViolation(null);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = STATUS_OPTIONS.find(s => s.value === status);
    return (
      <Badge className={`${statusConfig?.color || 'bg-gray-500'} text-white`}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <GovHeader 
        title="Violation Reports" 
        subtitle="Review and manage citizen-reported parking violations"
      />

      <main className="container mx-auto px-4 py-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
        </Button>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
              <p className="text-xs text-muted-foreground">Total Reports</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-500">{stats?.pending ?? 0}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card className="border-blue-500/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-500">{stats?.reviewing ?? 0}</p>
              <p className="text-xs text-muted-foreground">Reviewing</p>
            </CardContent>
          </Card>
          <Card className="border-green-500/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-500">{stats?.resolved ?? 0}</p>
              <p className="text-xs text-muted-foreground">Resolved</p>
            </CardContent>
          </Card>
          <Card className="border-purple-500/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-500">{stats?.action_taken ?? 0}</p>
              <p className="text-xs text-muted-foreground">Action Taken</p>
            </CardContent>
          </Card>
          <Card className="border-red-500/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-500">{stats?.rejected ?? 0}</p>
              <p className="text-xs text-muted-foreground">Rejected</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by vehicle, type, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {STATUS_OPTIONS.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Violations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Violation Reports</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Evidence</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredViolations?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">No violation reports found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredViolations?.map((violation) => (
                        <TableRow key={violation.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(violation.created_at), 'MMM d, yyyy')}
                            <br />
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(violation.created_at), 'h:mm a')}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Car className="w-4 h-4 text-muted-foreground" />
                              <span className="font-mono font-medium">{violation.vehicle_number}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {VIOLATION_TYPES[violation.violation_type] || violation.violation_type}
                          </TableCell>
                          <TableCell>
                            {violation.parking_lots?.name || violation.location || 'N/A'}
                          </TableCell>
                          <TableCell>{getStatusBadge(violation.status)}</TableCell>
                          <TableCell>
                            {violation.photo_url ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(violation.photo_url!, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">No photo</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(violation)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenUpdate(violation)}
                              >
                                <MessageSquare className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Violation Report Details</DialogTitle>
          </DialogHeader>
          {selectedViolation && (
            <div className="space-y-4">
              {selectedViolation.photo_url && (
                <div className="rounded-lg overflow-hidden border">
                  <img
                    src={selectedViolation.photo_url}
                    alt="Violation evidence"
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle Number</p>
                  <p className="font-mono font-semibold">{selectedViolation.vehicle_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Violation Type</p>
                  <p className="font-medium">
                    {VIOLATION_TYPES[selectedViolation.violation_type] || selectedViolation.violation_type}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p>{selectedViolation.parking_lots?.name || selectedViolation.location || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedViolation.status)}
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Reported On</p>
                  <p>{format(new Date(selectedViolation.created_at), 'PPpp')}</p>
                </div>
              </div>

              {selectedViolation.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-sm">{selectedViolation.description}</p>
                </div>
              )}

              {selectedViolation.admin_notes && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Admin Notes</p>
                  <p className="text-sm">{selectedViolation.admin_notes}</p>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setDetailsOpen(false);
                  handleOpenUpdate(selectedViolation);
                }}>
                  Update Status
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Violation Status</DialogTitle>
            <DialogDescription>
              Update the status and add notes for vehicle {selectedViolation?.vehicle_number}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${status.color}`} />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Admin Notes</Label>
              <Textarea
                placeholder="Add notes about the resolution..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              The reporter will be notified via email/SMS about this status change.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateStatus}
              disabled={updateStatus.isPending}
            >
              {updateStatus.isPending ? 'Updating...' : 'Update & Notify'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
