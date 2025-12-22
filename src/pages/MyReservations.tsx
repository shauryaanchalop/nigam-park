import React, { useEffect, useState } from 'react';
import { format, parseISO, isToday, isTomorrow, isPast, addMinutes } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Calendar, Clock, Car, MapPin, IndianRupee, 
  QrCode, X, CheckCircle, AlertCircle, Timer 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GovHeader } from '@/components/ui/GovHeader';
import { useReservations } from '@/hooks/useReservations';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function MyReservations() {
  const { user, loading: authLoading } = useAuth();
  const { reservations, isLoading, cancelReservation } = useReservations();
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const navigate = useNavigate();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Real-time subscription for reservation updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('reservation-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reservations',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newStatus = payload.new.status;
          const oldStatus = payload.old.status;
          
          if (newStatus !== oldStatus) {
            if (newStatus === 'checked_in') {
              toast.success('Your parking spot is ready!', {
                description: 'You have successfully checked in.',
              });
            } else if (newStatus === 'expiring_soon') {
              toast.warning('Parking time expiring soon!', {
                description: 'Your reservation will expire in 15 minutes.',
              });
            } else if (newStatus === 'expired') {
              toast.error('Reservation expired', {
                description: 'Your parking reservation has expired.',
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Check for expiring reservations
  useEffect(() => {
    if (!reservations.length) return;

    const checkExpiring = () => {
      const now = new Date();
      reservations.forEach((res) => {
        if (res.status === 'confirmed' || res.status === 'checked_in') {
          const resDate = parseISO(res.reservation_date);
          const [hours, minutes] = res.end_time.split(':').map(Number);
          resDate.setHours(hours, minutes, 0, 0);
          
          const timeDiff = resDate.getTime() - now.getTime();
          const minutesLeft = Math.floor(timeDiff / 60000);
          
          if (minutesLeft > 0 && minutesLeft <= 15) {
            toast.warning(`Parking expires in ${minutesLeft} minutes`, {
              description: `${res.parking_lots?.name}`,
              id: `expiring-${res.id}`,
            });
          }
        }
      });
    };

    checkExpiring();
    const interval = setInterval(checkExpiring, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [reservations]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-success text-success-foreground">Confirmed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-warning text-warning">Pending</Badge>;
      case 'checked_in':
        return <Badge className="bg-primary text-primary-foreground">Checked In</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="border-destructive text-destructive">Cancelled</Badge>;
      case 'expired':
        return <Badge variant="outline" className="border-muted-foreground text-muted-foreground">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d, yyyy');
  };

  const handleShowQR = (reservation: any) => {
    setSelectedReservation(reservation);
    setQrDialogOpen(true);
  };

  const handleCancel = async (id: string) => {
    await cancelReservation.mutateAsync(id);
  };

  const generateQRData = (reservation: any) => {
    return JSON.stringify({
      id: reservation.id,
      lot_id: reservation.lot_id,
      vehicle: reservation.vehicle_number,
      date: reservation.reservation_date,
      start: reservation.start_time,
      end: reservation.end_time,
      status: reservation.status,
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <GovHeader title="My Reservations" subtitle="Loading..." />
        <main className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-24 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  const activeReservations = reservations.filter(
    (r) => ['confirmed', 'pending', 'checked_in'].includes(r.status)
  );
  const pastReservations = reservations.filter(
    (r) => ['completed', 'cancelled', 'expired'].includes(r.status)
  );

  return (
    <div className="min-h-screen bg-background">
      <GovHeader title="My Reservations" subtitle="View and manage your parking bookings" />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Back to portal */}
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
          ← Back to Parking Finder
        </Button>

        {reservations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Reservations Yet</h2>
              <p className="text-muted-foreground mb-4">
                You haven't made any parking reservations.
              </p>
              <Button onClick={() => navigate('/')}>Find Parking</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Active Reservations */}
            {activeReservations.length > 0 && (
              <section className="mb-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Timer className="w-5 h-5 text-primary" />
                  Active Reservations ({activeReservations.length})
                </h2>
                <div className="space-y-4">
                  {activeReservations.map((reservation) => (
                    <Card key={reservation.id} className="overflow-hidden">
                      <div className="h-1 bg-primary" />
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{reservation.parking_lots?.name}</h3>
                              {getStatusBadge(reservation.status)}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {reservation.parking_lots?.zone}
                              </div>
                              <div className="flex items-center gap-1">
                                <Car className="w-4 h-4" />
                                {reservation.vehicle_number}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {getDateLabel(reservation.reservation_date)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {reservation.start_time} - {reservation.end_time}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 mt-2 font-medium">
                              <IndianRupee className="w-4 h-4" />
                              ₹{reservation.amount}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 min-w-[120px]">
                            <Button 
                              onClick={() => handleShowQR(reservation)}
                              className="gap-2"
                            >
                              <QrCode className="w-4 h-4" />
                              Show QR
                            </Button>
                            {reservation.status !== 'checked_in' && (
                              <Button 
                                variant="outline"
                                className="gap-2 text-destructive hover:text-destructive"
                                onClick={() => handleCancel(reservation.id)}
                                disabled={cancelReservation.isPending}
                              >
                                <X className="w-4 h-4" />
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Past Reservations */}
            {pastReservations.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-muted-foreground" />
                  Past Reservations ({pastReservations.length})
                </h2>
                <div className="space-y-3">
                  {pastReservations.map((reservation) => (
                    <Card key={reservation.id} className="bg-muted/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium">{reservation.parking_lots?.name}</h3>
                              {getStatusBadge(reservation.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(parseISO(reservation.reservation_date), 'MMM d, yyyy')} • {reservation.vehicle_number}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">₹{reservation.amount}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Your Parking Pass</DialogTitle>
          </DialogHeader>
          {selectedReservation && (
            <div className="flex flex-col items-center p-4">
              <div className="bg-white p-4 rounded-lg mb-4">
                <QRCodeSVG
                  value={generateQRData(selectedReservation)}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">
                  {selectedReservation.parking_lots?.name}
                </h3>
                <p className="text-muted-foreground">
                  {selectedReservation.vehicle_number}
                </p>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Calendar className="w-4 h-4" />
                  {getDateLabel(selectedReservation.reservation_date)}
                </div>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Clock className="w-4 h-4" />
                  {selectedReservation.start_time} - {selectedReservation.end_time}
                </div>
                <Badge className="mt-2 bg-success text-success-foreground">
                  Valid for Entry
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Show this QR code to the attendant at the parking entrance
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
