import React, { useState } from 'react';
import { History, Calendar, Car, IndianRupee, MapPin, Clock, Filter, ChevronDown } from 'lucide-react';
import { GovHeader } from '@/components/ui/GovHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReservations } from '@/hooks/useReservations';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { format, parseISO, isAfter, isBefore, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ParkingHistory() {
  const { user, loading, userRole } = useAuth();
  const { reservations, isLoading } = useReservations();
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Only allow citizens to access this page
  if (userRole !== 'citizen') {
    return <Navigate to="/" replace />;
  }

  const today = startOfDay(new Date());
  
  // Separate past reservations from current/upcoming
  const pastReservations = reservations.filter(r => {
    const reservationDate = parseISO(r.reservation_date);
    return isBefore(reservationDate, today) || ['completed', 'cancelled', 'checked_in'].includes(r.status);
  });

  const filteredReservations = pastReservations.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'completed') return ['completed', 'checked_in'].includes(r.status);
    if (filter === 'cancelled') return r.status === 'cancelled';
    return true;
  });

  // Calculate summary stats
  const totalSpent = pastReservations
    .filter(r => ['completed', 'checked_in', 'confirmed'].includes(r.status))
    .reduce((sum, r) => sum + r.amount, 0);
  
  const totalVisits = pastReservations.filter(r => ['completed', 'checked_in'].includes(r.status)).length;
  
  const totalHours = pastReservations
    .filter(r => ['completed', 'checked_in'].includes(r.status))
    .reduce((sum, r) => {
      const start = parseInt(r.start_time.split(':')[0]);
      const end = parseInt(r.end_time.split(':')[0]);
      return sum + (end - start);
    }, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'checked_in':
        return <Badge className="bg-success text-success-foreground">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'confirmed':
        return <Badge className="bg-primary">Confirmed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-6">
      <GovHeader 
        title="Parking History" 
        subtitle="View your past reservations and payments"
      />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <IndianRupee className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold text-foreground">₹{totalSpent.toLocaleString('en-IN')}</p>
              <p className="text-xs text-muted-foreground">Total Spent</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Car className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold text-foreground">{totalVisits}</p>
              <p className="text-xs text-muted-foreground">Total Visits</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold text-foreground">{totalHours}h</p>
              <p className="text-xs text-muted-foreground">Parked Hours</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <History className="w-5 h-5" />
            Past Reservations
          </h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                {filter === 'all' ? 'All' : filter === 'completed' ? 'Completed' : 'Cancelled'}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilter('all')}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('completed')}>Completed</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('cancelled')}>Cancelled</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Reservation List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-20 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredReservations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <History className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium text-foreground">No parking history yet</p>
              <p className="text-muted-foreground text-sm">
                {filter !== 'all' 
                  ? `No ${filter} reservations found. Try changing the filter.`
                  : 'Your past reservations will appear here.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredReservations.map((reservation) => (
              <Card key={reservation.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Status Bar */}
                  <div className={cn(
                    'h-1',
                    ['completed', 'checked_in'].includes(reservation.status) && 'bg-success',
                    reservation.status === 'cancelled' && 'bg-destructive',
                    reservation.status === 'confirmed' && 'bg-primary',
                  )} />
                  
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {reservation.parking_lots?.name}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {reservation.parking_lots?.zone}
                        </p>
                      </div>
                      {getStatusBadge(reservation.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{format(parseISO(reservation.reservation_date), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{reservation.start_time} - {reservation.end_time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono">{reservation.vehicle_number}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <IndianRupee className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold">₹{reservation.amount}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
