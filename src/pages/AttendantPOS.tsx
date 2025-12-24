import React, { useState, useEffect } from 'react';
import { Car, CreditCard, Banknote, QrCode, CheckCircle2, Clock, LogOut, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { GovHeader } from '@/components/ui/GovHeader';

import { QRScannerDialog } from '@/components/attendant/QRScannerDialog';
import { useParkingLots } from '@/hooks/useParkingLots';
import { useTransactions, useTodayStats } from '@/hooks/useTransactions';
import { useSensorLogs } from '@/hooks/useSensorLogs';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AttendantPOS() {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrRefreshKey, setQrRefreshKey] = useState(0);
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const { data: lots } = useParkingLots();
  const { createTransaction } = useTransactions();
  const { data: stats } = useTodayStats();
  const { createSensorLog } = useSensorLogs();
  const { updateOccupancy } = useParkingLots();

  // Assuming attendant is assigned to first lot for demo
  const assignedLot = lots?.[0];

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

          {/* Check-in */}
          <Dialog open={checkInDialogOpen} onOpenChange={setCheckInDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full h-16 text-lg gap-3 gradient-primary" 
                size="lg"
              >
                <Car className="w-6 h-6" />
                Check-in Vehicle
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

          {/* FASTag */}
          <Button 
            className="w-full h-16 text-lg gap-3 bg-primary/90 hover:bg-primary" 
            size="lg"
            onClick={() => handlePayment('FASTag')}
            disabled={isProcessing}
          >
            <CreditCard className="w-6 h-6" />
            Scan FASTag
            <Badge variant="secondary" className="ml-auto">
              ₹{assignedLot?.hourly_rate ?? 0}/hr
            </Badge>
          </Button>

          {/* Cash */}
          <Button 
            className="w-full h-16 text-lg gap-3 gradient-saffron text-accent-foreground hover:opacity-90" 
            size="lg"
            onClick={() => handlePayment('Cash')}
            disabled={isProcessing}
          >
            <Banknote className="w-6 h-6" />
            Cash Entry
            <Badge variant="secondary" className="ml-auto bg-accent-foreground/20">
              ₹{assignedLot?.hourly_rate ?? 0}/hr
            </Badge>
          </Button>

          {/* UPI */}
          <Button 
            variant="outline"
            className="w-full h-16 text-lg gap-3" 
            size="lg"
            onClick={() => handlePayment('UPI')}
            disabled={isProcessing}
          >
            <QrCode className="w-6 h-6" />
            UPI Payment
            <Badge variant="outline" className="ml-auto">
              ₹{assignedLot?.hourly_rate ?? 0}/hr
            </Badge>
          </Button>
        </div>

        {/* Current Status */}
        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Current Lot Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">{assignedLot?.name}</p>
                <p className="text-sm text-muted-foreground">{assignedLot?.zone}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">
                  {assignedLot?.current_occupancy}/{assignedLot?.capacity}
                </p>
                <Badge 
                  variant="outline"
                  className={cn(
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

      {/* QR Scanner Dialog */}
      <QRScannerDialog 
        open={scannerOpen} 
        onOpenChange={setScannerOpen}
        onReservationVerified={handleReservationVerified}
      />
    </div>
  );
}
