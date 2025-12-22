import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, Pencil, Trash2, MapPin, Car, IndianRupee, 
  ChevronLeft, Search, MoreHorizontal, CheckCircle, XCircle 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GovHeader } from '@/components/ui/GovHeader';
import { useParkingLots } from '@/hooks/useParkingLots';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { z } from 'zod';

const parkingLotSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  zone: z.string().min(2, 'Zone is required').max(50),
  capacity: z.number().int().min(1, 'Capacity must be at least 1').max(10000),
  hourly_rate: z.number().int().min(1, 'Rate must be at least ₹1').max(1000),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  status: z.enum(['active', 'inactive', 'maintenance']),
});

type ParkingLotFormData = z.infer<typeof parkingLotSchema>;

const ZONES = [
  'Central Delhi',
  'South Delhi',
  'North Delhi',
  'East Delhi',
  'West Delhi',
  'New Delhi',
];

export default function AdminParkingLots() {
  const { data: lots, isLoading, refetch } = useParkingLots();
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingLot, setEditingLot] = useState<any>(null);
  const [deletingLot, setDeletingLot] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<ParkingLotFormData>({
    name: '',
    zone: '',
    capacity: 100,
    hourly_rate: 20,
    lat: 28.6139,
    lng: 77.2090,
    status: 'active',
  });

  const filteredLots = lots?.filter(lot =>
    lot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lot.zone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingLot(null);
    setFormData({
      name: '',
      zone: '',
      capacity: 100,
      hourly_rate: 20,
      lat: 28.6139,
      lng: 77.2090,
      status: 'active',
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (lot: any) => {
    setEditingLot(lot);
    setFormData({
      name: lot.name,
      zone: lot.zone,
      capacity: lot.capacity,
      hourly_rate: lot.hourly_rate,
      lat: lot.lat,
      lng: lot.lng,
      status: lot.status,
    });
    setDialogOpen(true);
  };

  const handleOpenDelete = (lot: any) => {
    setDeletingLot(lot);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const validated = parkingLotSchema.parse(formData);

      if (editingLot) {
        // Update existing lot
        const { error } = await supabase
          .from('parking_lots')
          .update(validated)
          .eq('id', editingLot.id);

        if (error) throw error;
        toast.success('Parking lot updated successfully');
      } else {
        // Create new lot
        const { name, zone, capacity, hourly_rate, lat, lng, status } = validated;
        const { error } = await supabase
          .from('parking_lots')
          .insert({
            name,
            zone,
            capacity,
            hourly_rate,
            lat,
            lng,
            status,
          });

        if (error) throw error;
        toast.success('Parking lot created successfully');
      }

      setDialogOpen(false);
      refetch();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || 'Failed to save parking lot');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingLot) return;

    try {
      const { error } = await supabase
        .from('parking_lots')
        .delete()
        .eq('id', deletingLot.id);

      if (error) throw error;
      
      toast.success('Parking lot deleted');
      setDeleteDialogOpen(false);
      setDeletingLot(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete parking lot');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success text-success-foreground">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'maintenance':
        return <Badge variant="outline" className="border-warning text-warning">Maintenance</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <GovHeader 
        title="Parking Lot Management" 
        subtitle="Add, Edit, and Manage Parking Locations"
      />

      <main className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
        </Button>

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search parking lots..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Parking Lot
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{lots?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground">Total Lots</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-success">
                {lots?.filter(l => l.status === 'active').length ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">
                {lots?.reduce((sum, l) => sum + l.capacity, 0) ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">Total Capacity</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">
                {lots?.reduce((sum, l) => sum + l.current_occupancy, 0) ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">Current Occupancy</p>
            </CardContent>
          </Card>
        </div>

        {/* Parking Lots Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-32 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLots?.map(lot => (
              <Card key={lot.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{lot.name}</CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {lot.zone}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEdit(lot)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleOpenDelete(lot)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      {getStatusBadge(lot.status)}
                      <span className="text-sm text-muted-foreground">
                        {lot.current_occupancy}/{lot.capacity} spots
                      </span>
                    </div>
                    
                    {/* Occupancy Bar */}
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          'h-full rounded-full transition-all',
                          (lot.current_occupancy / lot.capacity) >= 0.9 ? 'bg-destructive' :
                          (lot.current_occupancy / lot.capacity) >= 0.7 ? 'bg-warning' :
                          'bg-success'
                        )}
                        style={{ width: `${(lot.current_occupancy / lot.capacity) * 100}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <IndianRupee className="w-4 h-4" />
                        ₹{lot.hourly_rate}/hr
                      </div>
                      <div className="text-muted-foreground">
                        {Math.round((lot.current_occupancy / lot.capacity) * 100)}% full
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredLots?.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No parking lots found</p>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try a different search term' : 'Add your first parking lot'}
            </p>
            <Button onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Parking Lot
            </Button>
          </div>
        )}
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingLot ? 'Edit Parking Lot' : 'Add New Parking Lot'}
            </DialogTitle>
            <DialogDescription>
              {editingLot ? 'Update the parking lot details below.' : 'Fill in the details to create a new parking lot.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Connaught Place Main"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="zone">Zone</Label>
                <Select
                  value={formData.zone}
                  onValueChange={(value) => setFormData({ ...formData, zone: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {ZONES.map(zone => (
                      <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="hourly_rate">Hourly Rate (₹)</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  min={1}
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({ ...formData, hourly_rate: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="lat">Latitude</Label>
                <Input
                  id="lat"
                  type="number"
                  step="0.0001"
                  value={formData.lat}
                  onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="lng">Longitude</Label>
                <Input
                  id="lng"
                  type="number"
                  step="0.0001"
                  value={formData.lng}
                  onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'inactive' | 'maintenance') => 
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingLot ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Parking Lot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingLot?.name}"? This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
