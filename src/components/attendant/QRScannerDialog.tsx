import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

interface ReservationData {
  id: string;
  lot_id: string;
  vehicle: string;
  date: string;
  start: string;
  end: string;
  status: string;
}

interface ScannedReservation {
  id: string;
  vehicle_number: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  status: string;
  amount: number;
  parking_lots?: {
    name: string;
    zone: string;
  };
}

interface QRScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReservationVerified?: (reservation: ScannedReservation) => void;
}

export function QRScannerDialog({ open, onOpenChange, onReservationVerified }: QRScannerDialogProps) {
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedReservation | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'valid' | 'invalid'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && !scanning) {
      startScanning();
    }
    
    return () => {
      stopScanning();
    };
  }, [open]);

  const startScanning = async () => {
    if (!containerRef.current) return;
    
    try {
      setScanning(true);
      setVerificationStatus('idle');
      setScannedData(null);
      setErrorMessage('');
      
      scannerRef.current = new Html5Qrcode('qr-reader');
      
      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        handleQRCodeSuccess,
        (errorMessage) => {
          // Ignore scan errors, they happen constantly when no QR is in view
        }
      );
    } catch (error) {
      console.error('Error starting scanner:', error);
      setScanning(false);
      toast.error('Could not access camera. Please grant camera permissions.');
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleQRCodeSuccess = async (decodedText: string) => {
    // Stop scanning once we get a result
    await stopScanning();
    
    setVerificationStatus('verifying');
    
    try {
      const qrData: ReservationData = JSON.parse(decodedText);
      
      if (!qrData.id) {
        throw new Error('Invalid QR code format');
      }
      
      // Verify reservation in database
      const { data: reservation, error } = await supabase
        .from('reservations')
        .select(`
          *,
          parking_lots (
            name,
            zone
          )
        `)
        .eq('id', qrData.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (!reservation) {
        setVerificationStatus('invalid');
        setErrorMessage('Reservation not found in system');
        return;
      }
      
      // Check if reservation is valid
      const today = format(new Date(), 'yyyy-MM-dd');
      const isValidDate = reservation.reservation_date === today;
      const isValidStatus = ['confirmed', 'pending'].includes(reservation.status);
      
      if (!isValidDate) {
        setVerificationStatus('invalid');
        setErrorMessage(`This reservation is for ${format(parseISO(reservation.reservation_date), 'MMM d, yyyy')}, not today`);
        return;
      }
      
      if (!isValidStatus) {
        setVerificationStatus('invalid');
        setErrorMessage(`Reservation status is "${reservation.status}"`);
        return;
      }
      
      // Reservation is valid!
      setScannedData(reservation);
      setVerificationStatus('valid');
      
      // Send in-app notification to user
      toast.success('Reservation verified successfully!');
      
    } catch (error: any) {
      console.error('QR verification error:', error);
      setVerificationStatus('invalid');
      setErrorMessage(error.message || 'Failed to verify QR code');
    }
  };

  const handleCheckIn = async () => {
    if (!scannedData) return;
    
    try {
      // Update reservation status to checked_in
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'checked_in' })
        .eq('id', scannedData.id);
      
      if (error) throw error;
      
      toast.success('Vehicle checked in successfully!', {
        description: `${scannedData.vehicle_number} at ${scannedData.parking_lots?.name}`,
      });
      
      onReservationVerified?.(scannedData);
      onOpenChange(false);
      
    } catch (error: any) {
      toast.error('Failed to check in: ' + error.message);
    }
  };

  const handleRescan = () => {
    setScannedData(null);
    setVerificationStatus('idle');
    setErrorMessage('');
    startScanning();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Scan Reservation QR
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Scanner View */}
          {verificationStatus === 'idle' || verificationStatus === 'verifying' ? (
            <div className="relative">
              <div 
                id="qr-reader" 
                ref={containerRef}
                className="w-full aspect-square bg-muted rounded-lg overflow-hidden"
              />
              {verificationStatus === 'verifying' && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Verifying reservation...</p>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Valid Reservation */}
          {verificationStatus === 'valid' && scannedData && (
            <Card className="border-success bg-success/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-6 h-6 text-success" />
                  <span className="font-semibold text-success">Valid Reservation</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vehicle</span>
                    <span className="font-mono font-semibold">{scannedData.vehicle_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Parking Lot</span>
                    <span>{scannedData.parking_lots?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time Slot</span>
                    <span>{scannedData.start_time} - {scannedData.end_time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount Paid</span>
                    <span className="font-semibold">₹{scannedData.amount}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" className="flex-1" onClick={handleRescan}>
                    Scan Another
                  </Button>
                  <Button className="flex-1" onClick={handleCheckIn}>
                    Check In Vehicle
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Invalid Reservation */}
          {verificationStatus === 'invalid' && (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                  <span className="font-semibold text-destructive">Invalid Reservation</span>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  {errorMessage || 'This reservation could not be verified.'}
                </p>

                <Button className="w-full" onClick={handleRescan}>
                  Scan Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Help Text */}
          {verificationStatus === 'idle' && (
            <p className="text-xs text-muted-foreground text-center">
              Position the QR code from the citizen's reservation within the camera frame
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
