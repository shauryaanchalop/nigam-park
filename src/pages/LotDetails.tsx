import { useParams, useNavigate } from 'react-router-dom';
import { GovHeader } from '@/components/ui/GovHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MapPin, 
  Car, 
  Clock, 
  IndianRupee, 
  Navigation, 
  CalendarPlus,
  ArrowLeft,
  Phone,
  AlertTriangle
} from 'lucide-react';
import { useParkingLots } from '@/hooks/useParkingLots';
import { ReservationDialog } from '@/components/citizen/ReservationDialog';
import { useState } from 'react';

export default function LotDetails() {
  const { lotId } = useParams<{ lotId: string }>();
  const navigate = useNavigate();
  const { data: parkingLots, isLoading } = useParkingLots();
  const [reservationOpen, setReservationOpen] = useState(false);

  const lot = parkingLots?.find(l => l.id === lotId);

  const handleNavigate = () => {
    if (!lot) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lot.lat},${lot.lng}`;
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <GovHeader />
        <main className="container py-8">
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (!lot) {
    return (
      <div className="min-h-screen bg-background">
        <GovHeader />
        <main className="container py-8">
          <Card className="max-w-lg mx-auto text-center">
            <CardContent className="pt-8">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Parking Lot Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The parking lot you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate('/citizen')}>
                Go to Citizen Portal
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const occupancyPercent = Math.round((lot.current_occupancy / lot.capacity) * 100);
  const availableSpots = lot.capacity - lot.current_occupancy;

  const getOccupancyColor = (percent: number) => {
    if (percent < 50) return 'bg-green-500';
    if (percent < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Open</Badge>;
      case 'maintenance':
        return <Badge variant="secondary">Maintenance</Badge>;
      case 'closed':
        return <Badge variant="destructive">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <GovHeader />
      
      <main className="container py-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Info Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{lot.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <MapPin className="h-4 w-4" />
                    {lot.zone}
                  </CardDescription>
                </div>
                {getStatusBadge(lot.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Occupancy */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Current Occupancy</span>
                  <span className="text-sm text-muted-foreground">
                    {lot.current_occupancy} / {lot.capacity} spots
                  </span>
                </div>
                <Progress value={occupancyPercent} className="h-3" />
                <p className={`text-sm mt-2 font-medium ${
                  availableSpots > 10 ? 'text-green-600' : 
                  availableSpots > 0 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {availableSpots > 0 
                    ? `${availableSpots} spots available`
                    : 'No spots available'}
                </p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <IndianRupee className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Hourly Rate</p>
                    <p className="font-semibold">₹{lot.hourly_rate}/hr</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Car className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Capacity</p>
                    <p className="font-semibold">{lot.capacity} spots</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Operating Hours</p>
                    <p className="font-semibold">24/7</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Helpline</p>
                    <p className="font-semibold">1800-XXX-XXXX</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  className="flex-1" 
                  onClick={() => setReservationOpen(true)}
                  disabled={lot.status !== 'active' || availableSpots === 0}
                >
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Reserve Spot
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleNavigate}>
                  <Navigation className="h-4 w-4 mr-2" />
                  Navigate
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Map Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-muted rounded-lg overflow-hidden relative">
                <iframe
                  title="Parking Lot Location"
                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${lot.lat},${lot.lng}&zoom=16`}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Coordinates: {lot.lat.toFixed(4)}, {lot.lng.toFixed(4)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Reservation Dialog */}
        <ReservationDialog
          open={reservationOpen}
          onOpenChange={setReservationOpen}
          parkingLot={lot}
        />
      </main>
    </div>
  );
}
