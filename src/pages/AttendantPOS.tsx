import React, { useState, useEffect } from 'react';
import { Car, CreditCard, Banknote, QrCode, CheckCircle2, Clock, LogOut, ScanLine, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { GovHeader } from '@/components/ui/GovHeader';
import { ScrollArea } from '@/components/ui/scroll-area';

import { QRScannerDialog } from '@/components/attendant/QRScannerDialog';
import { useParkingLots } from '@/hooks/useParkingLots';
import { useTransactions, useTodayStats } from '@/hooks/useTransactions';
import { useSensorLogs } from '@/hooks/useSensorLogs';
import { useReservations } from '@/hooks/useReservations';
import { useParkedVehicles } from '@/hooks/useParkedVehicles';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function AttendantPOS() {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [checkoutVehicle, setCheckoutVehicle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrRefreshKey, setQrRefreshKey] = useState(0);
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [checkoutScannerOpen, setCheckoutScannerOpen] = useState(false);

  const { data: lots } = useParkingLots();
  const { createTransaction } = useTransactions();
  const { data: stats } = useTodayStats();
  const { createSensorLog } = useSensorLogs();
  const { updateOccupancy } = useParkingLots();
  const { checkoutByVehicle } = useReservations();

  // Assuming attendant is assigned to first lot for demo
  const assignedLot = lots?.[0];
  
  const { parkedVehicles, isLoading: isLoadingParked } = useParkedVehicles(assignedLot?.id);

  // Refresh QR every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setQrRefreshKey(k => k + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const generateVehicleNumber = () => {
    const states = ['DL', 'HR', 'UP', 'RJ'];
    const state = states[Math.floor(Math.random() * states.length)];
    const num1 = Math.floor(Math.random() * 99).toString().padStart(2, '0');
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letter = letters[Math.floor(Math.random() * 26)] + letters[Math.floor(Math.random() * 26)];
    const num2 = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `${state}${num1}${letter}${num2}`;
  };

  const handleCheckIn = async () => {
    if (!vehicleNumber.trim() || !assignedLot) {
      toast.error('Please enter a vehicle number');
      return;
    }

    setIsProcessing(true);
    try {
      await createSensorLog.mutateAsync({
        lot_id: assignedLot.id,
        event_type: 'entry',
        vehicle_detected: vehicleNumber,
        has_payment: false,
      });

      await updateOccupancy.mutateAsync({ lotId: assignedLot.id, delta: 1 });

      toast.success(`Vehicle ${vehicleNumber} checked in`);
      setVehicleNumber('');
      setCheckInDialogOpen(false);
    } catch (error: any) {
      console.error('Check-in error:', error);
      const message = error?.message || 'Failed to check in vehicle';
      if (message.includes('row-level security')) {
        toast.error('Permission denied. Please ensure you are assigned to this lot.');
      } else if (message.includes('Invalid vehicle number')) {
        toast.error('Invalid vehicle number format. Use format like DL01AB1234');
      } else {
        toast.error(message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async (method: 'FASTag' | 'Cash' | 'UPI') => {
    if (!assignedLot) {
      toast.error('No parking lot assigned. Contact administrator.');
      return;
    }

    setIsProcessing(true);
    const vehicle = vehicleNumber.trim() || generateVehicleNumber();
    const amount = assignedLot.hourly_rate;

    try {
      await createTransaction.mutateAsync({
        lot_id: assignedLot.id,
        vehicle_number: vehicle,
        amount,
        payment_method: method,
        status: 'completed',
        entry_time: new Date().toISOString(),
        exit_time: null,
      });

      toast.success(`₹${amount} received via ${method}`, {
        description: `Vehicle: ${vehicle}`,
      });
      setVehicleNumber('');
    } catch (error: any) {
      console.error('Payment error:', error);
      const message = error?.message || 'Payment failed';
      if (message.includes('row-level security')) {
        toast.error('Permission denied. Please ensure you are assigned to this lot.');
      } else if (message.includes('Invalid vehicle number')) {
        toast.error('Invalid vehicle number format. Use format like DL01AB1234');
      } else {
        toast.error(message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReservationVerified = async (reservation: any) => {
    if (!assignedLot) return;
    
    // Log the entry
    try {
      await createSensorLog.mutateAsync({
        lot_id: reservation.lot_id,
        event_type: 'entry',
        vehicle_detected: reservation.vehicle_number,
        has_payment: true,
      });

      await updateOccupancy.mutateAsync({ lotId: reservation.lot_id, delta: 1 });
    } catch (error) {
      console.error('Error logging entry:', error);
    }
  };

  const handleCheckout = async () => {
    if (!checkoutVehicle.trim() || !assignedLot) {
      toast.error('Please enter a vehicle number');
      return;
    }

    setIsProcessing(true);
    try {
      // Find and complete the reservation
      await checkoutByVehicle.mutateAsync({
        vehicleNumber: checkoutVehicle.trim(),
        lotId: assignedLot.id,
      });

      // Log the exit event
      await createSensorLog.mutateAsync({
        lot_id: assignedLot.id,
        event_type: 'exit',
        vehicle_detected: checkoutVehicle,
        has_payment: true,
      });

      // Decrease occupancy
      await updateOccupancy.mutateAsync({ lotId: assignedLot.id, delta: -1 });

      setCheckoutVehicle('');
      setCheckoutDialogOpen(false);
    } catch (error: any) {
      console.error('Checkout error:', error);
      // Toast already shown by mutation
    } finally {
      setIsProcessing(false);
    }
  const handleQRCheckoutComplete = async (reservation: any) => {
    if (!assignedLot) return;
    
    try {
      // Log the exit event
      await createSensorLog.mutateAsync({
        lot_id: reservation.lot_id,
        event_type: 'exit',
        vehicle_detected: reservation.vehicle_number,
        has_payment: true,
      });

      // Decrease occupancy
      await updateOccupancy.mutateAsync({ lotId: reservation.lot_id, delta: -1 });
    } catch (error) {
      console.error('Error logging exit:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <GovHeader 
        title="NIGAM-Park POS" 
        subtitle="Parking Attendant Terminal"
      />

      <main className="container mx-auto px-4 py-6 max-w-lg">
        {/* Verified Badge */}
        <Card className="mb-6 border-success bg-success/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-success">Verified MCD Official</p>
                  <p className="text-sm text-muted-foreground">
                    {assignedLot?.name ?? 'Loading...'}
                  </p>
                </div>
              </div>
              
              {/* Dynamic QR Code */}
              <div className="text-center">
                <div className="w-16 h-16 bg-card border border-border rounded-lg flex items-center justify-center mb-1">
                  <QrCode className="w-12 h-12 text-foreground" key={qrRefreshKey} />
                </div>
                <p className="text-xs text-muted-foreground">Scan to verify</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">
                ₹{(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-muted-foreground">Today's Collection</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">
                {stats?.transactionCount ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">Vehicles Processed</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          {/* Scan Reservation QR */}
          <Button 
            className="w-full h-16 text-lg gap-3 bg-success hover:bg-success/90 text-success-foreground" 
            size="lg"
            onClick={() => setScannerOpen(true)}
          >
            <ScanLine className="w-6 h-6" />
            Scan Reservation QR
          </Button>

          {/* Scan to Checkout */}
          <Button 
            className="w-full h-16 text-lg gap-3 bg-amber-600 hover:bg-amber-700 text-white" 
            size="lg"
            onClick={() => setCheckoutScannerOpen(true)}
          >
            <ScanLine className="w-6 h-6" />
            Scan QR to Checkout
          </Button>

          {/* Check-in */}
          <Dialog open={checkInDialogOpen} onOpenChange={setCheckInDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full h-14 text-base gap-3 gradient-primary" 
                size="lg"
              >
                <Car className="w-5 h-5" />
                Manual Check-in
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Check-in Vehicle</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="vehicle-number">Vehicle Number</Label>
                  <Input
                    id="vehicle-number"
                    placeholder="DL01AB1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    className="text-lg font-mono mt-2"
                  />
                </div>
                <Button 
                  onClick={handleCheckIn}
                  className="w-full"
                  disabled={isProcessing || !vehicleNumber.trim()}
                >
                  {isProcessing ? 'Processing...' : 'Confirm Check-in'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Manual Checkout */}
          <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline"
                className="w-full h-14 text-base gap-3" 
                size="lg"
              >
                <LogOut className="w-5 h-5" />
                Manual Checkout
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Manual Checkout</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="checkout-vehicle">Vehicle Number</Label>
                  <Input
                    id="checkout-vehicle"
                    placeholder="DL01AB1234"
                    value={checkoutVehicle}
                    onChange={(e) => setCheckoutVehicle(e.target.value.toUpperCase())}
                    className="text-lg font-mono mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Enter the vehicle number to mark the reservation as completed
                  </p>
                </div>
                <Button 
                  onClick={handleCheckout}
                  className="w-full"
                  disabled={isProcessing || !checkoutVehicle.trim()}
                >
                  {isProcessing ? 'Processing...' : 'Confirm Checkout'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Payment Section */}
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">Walk-in Payments</p>
            <div className="grid grid-cols-3 gap-2">
              <Button 
                className="h-14 flex-col gap-1 bg-primary/90 hover:bg-primary" 
                onClick={() => handlePayment('FASTag')}
                disabled={isProcessing}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs">FASTag</span>
              </Button>

              <Button 
                className="h-14 flex-col gap-1 gradient-saffron text-accent-foreground hover:opacity-90" 
                onClick={() => handlePayment('Cash')}
                disabled={isProcessing}
              >
                <Banknote className="w-5 h-5" />
                <span className="text-xs">Cash</span>
              </Button>

              <Button 
                variant="outline"
                className="h-14 flex-col gap-1" 
                onClick={() => handlePayment('UPI')}
                disabled={isProcessing}
              >
                <QrCode className="w-5 h-5" />
                <span className="text-xs">UPI</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Currently Parked Vehicles */}
        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Currently Parked ({parkedVehicles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingParked ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : parkedVehicles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No vehicles currently parked with reservations</p>
            ) : (
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {parkedVehicles.map((vehicle) => (
                    <div 
                      key={vehicle.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-mono font-semibold text-sm">{vehicle.vehicle_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {vehicle.start_time} - {vehicle.end_time}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="border-success text-success text-xs">
                          Checked In
                        </Badge>
                        {vehicle.checked_in_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(vehicle.checked_in_at), 'HH:mm')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
        {/* Current Lot Status */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-semibold text-foreground text-sm">{assignedLot?.name}</p>
                  <p className="text-xs text-muted-foreground">{assignedLot?.zone}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-foreground">
                  {assignedLot?.current_occupancy}/{assignedLot?.capacity}
                </p>
                <Badge 
                  variant="outline"
                  className={cn(
                    "text-xs",
                    assignedLot && (assignedLot.current_occupancy / assignedLot.capacity) >= 0.9 
                      ? 'border-destructive text-destructive' 
                      : 'border-success text-success'
                  )}
                >
                  {assignedLot && Math.round((assignedLot.current_occupancy / assignedLot.capacity) * 100)}% Full
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* QR Scanner Dialog - Check-in */}
      <QRScannerDialog 
        open={scannerOpen} 
        onOpenChange={setScannerOpen}
        mode="checkin"
        onReservationVerified={handleReservationVerified}
      />

      {/* QR Scanner Dialog - Checkout */}
      <QRScannerDialog 
        open={checkoutScannerOpen} 
        onOpenChange={setCheckoutScannerOpen}
        mode="checkout"
        onCheckoutComplete={handleQRCheckoutComplete}
      />
    </div>
  );
}
