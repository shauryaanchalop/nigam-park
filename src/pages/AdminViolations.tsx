import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  ChevronLeft, Search, Filter, AlertTriangle, CheckCircle, 
  XCircle, Clock, Eye, MessageSquare, ExternalLink, Car, RotateCcw
} from 'lucide-react';
import { GovHeader } from '@/components/ui/GovHeader';
import { BackButton } from '@/components/ui/BackButton';
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

const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  pending: { label: 'Pending', badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30', dot: 'bg-amber-500' },
  reviewing: { label: 'Reviewing', badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30', dot: 'bg-blue-500' },
  resolved: { label: 'Resolved', badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30', dot: 'bg-emerald-500' },
  action_taken: { label: 'Action Taken', badge: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30', dot: 'bg-purple-500' },
  rejected: { label: 'Rejected', badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30', dot: 'bg-rose-500' },
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'action_taken', label: 'Action Taken' },
  { value: 'rejected', label: 'Rejected' },
];

export default function AdminViolations() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedViolation, setSelectedViolation] = useState<ViolationReport | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const { data: violations, isLoading } = useAdminViolations(statusFilter);
  const { data: stats } = useViolationStats();
  const updateStatus = useUpdateViolationStatus();

  const filteredViolations = violations?.filter(v => {
    const matchesSearch =
      v.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.violation_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.parking_lots?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.location && v.location.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === 'all' || v.violation_type === typeFilter;
    return matchesSearch && matchesType;
  });

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
    const config = STATUS_CONFIG[status] || {
      label: status,
      badge: 'bg-muted text-muted-foreground border border-border',
      dot: 'bg-muted-foreground'
    };
    return (
      <Badge variant="outline" className={`font-medium ${config.badge}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} mr-1.5 inline-block`} />
        {config.label}
      </Badge>
    );
  };

  const hasActiveFilters = statusFilter !== 'all' || typeFilter !== 'all' || searchQuery.trim() !== '';

  const clearFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-background">
      <GovHeader 
        title="Violation Reports" 
        subtitle="Review and manage citizen-reported parking violations"
      />

      <main className="container mx-auto px-4 py-6">
        <BackButton inline to="/dashboard" label="Back to Dashboard" />

        {/* Stats Cards - Click to filter */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`text-left rounded-xl transition-all ${
              statusFilter === 'all'
                ? 'ring-2 ring-primary shadow-md'
                : 'hover:border-primary/50'
            }`}
          >
            <Card className="h-full">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
                <p className="text-xs text-muted-foreground font-medium mt-1">Total Reports</p>
              </CardContent>
            </Card>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`text-left rounded-xl transition-all ${
              statusFilter === 'pending'
                ? 'ring-2 ring-amber-500 shadow-md'
                : 'hover:border-amber-500/50'
            }`}
          >
            <Card className="h-full border-amber-500/40">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats?.pending ?? 0}</p>
                <p className="text-xs text-muted-foreground font-medium mt-1">Pending</p>
              </CardContent>
            </Card>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('reviewing')}
            className={`text-left rounded-xl transition-all ${
              statusFilter === 'reviewing'
                ? 'ring-2 ring-blue-500 shadow-md'
                : 'hover:border-blue-500/50'
            }`}
          >
            <Card className="h-full border-blue-500/40">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats?.reviewing ?? 0}</p>
                <p className="text-xs text-muted-foreground font-medium mt-1">Reviewing</p>
              </CardContent>
            </Card>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('resolved')}
            className={`text-left rounded-xl transition-all ${
              statusFilter === 'resolved'
                ? 'ring-2 ring-emerald-500 shadow-md'
                : 'hover:border-emerald-500/50'
            }`}
          >
            <Card className="h-full border-emerald-500/40">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats?.resolved ?? 0}</p>
                <p className="text-xs text-muted-foreground font-medium mt-1">Resolved</p>
              </CardContent>
            </Card>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('action_taken')}
            className={`text-left rounded-xl transition-all ${
              statusFilter === 'action_taken'
                ? 'ring-2 ring-purple-500 shadow-md'
                : 'hover:border-purple-500/50'
            }`}
          >
            <Card className="h-full border-purple-500/40">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats?.action_taken ?? 0}</p>
                <p className="text-xs text-muted-foreground font-medium mt-1">Action Taken</p>
              </CardContent>
            </Card>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('rejected')}
            className={`text-left rounded-xl transition-all ${
              statusFilter === 'rejected'
                ? 'ring-2 ring-rose-500 shadow-md'
                : 'hover:border-rose-500/50'
            }`}
          >
            <Card className="h-full border-rose-500/40">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats?.rejected ?? 0}</p>
                <p className="text-xs text-muted-foreground font-medium mt-1">Rejected</p>
              </CardContent>
            </Card>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by vehicle, type, lot, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUS_OPTIONS.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Car className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Violation Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Violation Types</SelectItem>
              {Object.entries(VIOLATION_TYPES).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-10"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </Button>
          )}
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
                        <div className={`w-2 h-2 rounded-full ${STATUS_CONFIG[status.value]?.dot || 'bg-muted-foreground'}`} />
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
