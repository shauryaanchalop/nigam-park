import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { 
  AlertTriangle, IndianRupee, CheckCircle, XCircle, 
  Edit2, Search, Filter, TrendingUp
} from 'lucide-react';
import { GovHeader } from '@/components/ui/GovHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatCard } from '@/components/ui/StatCard';
import { useAdminFines, FineWithUser } from '@/hooks/useFines';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

export default function AdminFines() {
  const navigate = useNavigate();
  const { fines, isLoading, waiveFine, adjustFine, fineStats } = useAdminFines();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedFine, setSelectedFine] = useState<FineWithUser | null>(null);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [newAmount, setNewAmount] = useState('');

  const filteredFines = fines.filter(fine => {
    const matchesSearch = 
      fine.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fine.reservations?.vehicle_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fine.reservations?.parking_lots?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || fine.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-warning text-warning">Pending</Badge>;
      case 'resolved':
        return <Badge className="bg-success text-success-foreground">Resolved</Badge>;
      case 'waived':
        return <Badge variant="secondary">Waived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleWaive = async (fine: FineWithUser) => {
    await waiveFine.mutateAsync({ fineId: fine.id });
  };

  const handleAdjust = async () => {
    if (!selectedFine || !newAmount) return;
    await adjustFine.mutateAsync({ 
      fineId: selectedFine.id, 
      newAmount: parseInt(newAmount) 
    });
    setAdjustDialogOpen(false);
    setSelectedFine(null);
    setNewAmount('');
  };

  const openAdjustDialog = (fine: FineWithUser) => {
    setSelectedFine(fine);
    setNewAmount(fine.amount.toString());
    setAdjustDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <GovHeader title="Fine Management" subtitle="Loading..." />
        <main className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GovHeader 
        title="Fine Management" 
        subtitle="View and manage user fines"
      />

      <main className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
          ← Back to Dashboard
        </Button>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Fines"
            value={fineStats.total}
            subtitle={`${fineStats.pending} pending`}
            icon={AlertTriangle}
            variant="default"
          />
          <StatCard
            title="Pending Amount"
            value={`₹${fineStats.totalPendingAmount.toLocaleString('en-IN')}`}
            subtitle="To be collected"
            icon={IndianRupee}
            variant="warning"
          />
          <StatCard
            title="Collected"
            value={`₹${fineStats.totalCollectedAmount.toLocaleString('en-IN')}`}
            subtitle={`${fineStats.resolved} fines`}
            icon={TrendingUp}
            variant="success"
          />
          <StatCard
            title="Waived"
            value={fineStats.waived}
            subtitle="Fines waived"
            icon={XCircle}
            variant="default"
          />
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by vehicle, reason, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="waived">Waived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Fines Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              All Fines ({filteredFines.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredFines.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                <p className="text-lg font-medium">No fines found</p>
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'No fines have been issued yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFines.map((fine) => (
                      <TableRow key={fine.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(parseISO(fine.created_at), 'MMM d, yyyy')}
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(fine.created_at), 'h:mm a')}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono">
                          {fine.reservations?.vehicle_number || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {fine.reservations?.parking_lots?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {fine.reason}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ₹{fine.amount}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(fine.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          {fine.status === 'pending' && (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openAdjustDialog(fine)}
                              >
                                <Edit2 className="w-3 h-3 mr-1" />
                                Adjust
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-muted-foreground hover:text-foreground"
                                onClick={() => handleWaive(fine)}
                                disabled={waiveFine.isPending}
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Waive
                              </Button>
                            </div>
                          )}
                          {fine.status === 'resolved' && fine.resolved_at && (
                            <span className="text-xs text-muted-foreground">
                              {format(parseISO(fine.resolved_at), 'MMM d')}
                            </span>
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

      {/* Adjust Fine Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Fine Amount</DialogTitle>
          </DialogHeader>
          {selectedFine && (
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm text-muted-foreground">Vehicle</p>
                <p className="font-mono font-semibold">
                  {selectedFine.reservations?.vehicle_number || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reason</p>
                <p>{selectedFine.reason}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Amount</p>
                <p className="font-semibold">₹{selectedFine.amount}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-amount">New Amount (₹)</Label>
                <Input
                  id="new-amount"
                  type="number"
                  min="0"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="Enter new amount"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdjust} disabled={adjustFine.isPending || !newAmount}>
              {adjustFine.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
