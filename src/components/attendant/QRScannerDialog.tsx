import React, { useEffect, useRef, useState, forwardRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
  mode?: 'checkin' | 'checkout';
  onReservationVerified?: (reservation: ScannedReservation) => void;
  onCheckoutComplete?: (reservation: ScannedReservation) => void;
}

export const QRScannerDialog = forwardRef<HTMLDivElement, QRScannerDialogProps>(({ 
  open, 
  onOpenChange, 
  mode = 'checkin',
  onReservationVerified, 
  onCheckoutComplete 
}, ref) => {
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedReservation | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'valid' | 'invalid' | 'permission_denied'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && verificationStatus === 'idle') {
      requestCameraPermission();
    }
    
    return () => {
      stopScanning();
    };
  }, [open]);

  const requestCameraPermission = async () => {
    try {
      // First check if camera permission is granted
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      
      if (result.state === 'denied') {
        setVerificationStatus('permission_denied');
        setErrorMessage('Camera access was denied. Please enable camera permissions in your browser settings.');
        return;
      }
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      // Stop the stream immediately, we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      // Start scanning after permission granted
      startScanning();
    } catch (error: unknown) {
      console.error('Camera permission error:', error);
      setVerificationStatus('permission_denied');
      const err = error as { name?: string };
      if (err.name === 'NotAllowedError') {
        setErrorMessage('Camera access was denied. Please allow camera access to scan QR codes.');
      } else if (err.name === 'NotFoundError') {
        setErrorMessage('No camera found. Please ensure your device has a camera.');
      } else {
        setErrorMessage('Could not access camera. Please check your permissions.');
      }
    }
  };

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
        () => {
          // Ignore scan errors, they happen constantly when no QR is in view
        }
      );
    } catch (error) {
      console.error('Error starting scanner:', error);
      setScanning(false);
      setVerificationStatus('permission_denied');
      setErrorMessage('Could not start camera. Please grant camera permissions and try again.');
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
      
      // Check if reservation is valid based on mode
      const today = format(new Date(), 'yyyy-MM-dd');
      const isValidDate = reservation.reservation_date === today;
      
      // For check-in: must be confirmed/pending
      // For checkout: must be checked_in
      const validStatusForCheckin = ['confirmed', 'pending'].includes(reservation.status);
      const validStatusForCheckout = reservation.status === 'checked_in';
      const isValidStatus = mode === 'checkout' ? validStatusForCheckout : validStatusForCheckin;
      
      if (!isValidDate) {
        setVerificationStatus('invalid');
        setErrorMessage(`This reservation is for ${format(parseISO(reservation.reservation_date), 'MMM d, yyyy')}, not today`);
        return;
      }
      
      if (!isValidStatus) {
        if (mode === 'checkout' && reservation.status !== 'checked_in') {
          setVerificationStatus('invalid');
          setErrorMessage(`Vehicle must be checked in first. Current status: "${reservation.status}"`);
        } else {
          setVerificationStatus('invalid');
          setErrorMessage(`Reservation status is "${reservation.status}"`);
        }
        return;
      }
      
      // Reservation is valid!
      setScannedData(reservation);
      setVerificationStatus('valid');
      
      // Send in-app notification to user
      toast.success('Reservation verified successfully!');
      
    } catch (error: unknown) {
      console.error('QR verification error:', error);
      setVerificationStatus('invalid');
      const err = error as { message?: string };
      setErrorMessage(err.message || 'Failed to verify QR code');
    }
  };

  const handleCheckIn = async () => {
    if (!scannedData) return;
    
    try {
      // Update reservation status to checked_in and set checked_in_at timestamp
      // This prevents the no-show fine from being applied
      const { error } = await supabase
        .from('reservations')
        .update({ 
          status: 'checked_in',
          checked_in_at: new Date().toISOString(),
        })
        .eq('id', scannedData.id);
      
      if (error) throw error;
      
      toast.success('Vehicle checked in successfully!', {
        description: `${scannedData.vehicle_number} at ${scannedData.parking_lots?.name}`,
      });
      
      onReservationVerified?.(scannedData);
      onOpenChange(false);
      
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error('Failed to check in: ' + err.message);
    }
  };

  const handleCheckout = async () => {
    if (!scannedData) return;
    
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'completed' })
        .eq('id', scannedData.id);
      
      if (error) throw error;
      
      toast.success('Vehicle checked out successfully!', {
        description: `${scannedData.vehicle_number} - Reservation completed`,
      });
      
      onCheckoutComplete?.(scannedData);
      onOpenChange(false);
      
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error('Failed to checkout: ' + err.message);
    }
  };

  const handleRescan = () => {
    setScannedData(null);
    setVerificationStatus('idle');
    setErrorMessage('');
    startScanning();
  };

  const isCheckoutMode = mode === 'checkout';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" ref={ref}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            {isCheckoutMode ? 'Scan QR to Checkout' : 'Scan Reservation QR'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera Permission Denied */}
          {verificationStatus === 'permission_denied' && (
            <Card className="border-warning bg-warning/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <CameraOff className="w-6 h-6 text-warning" />
                  <span className="font-semibold text-warning">Camera Access Required</span>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  {errorMessage}
                </p>

                <Button className="w-full" onClick={requestCameraPermission}>
                  Request Camera Permission
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Scanner View */}
          {(verificationStatus === 'idle' || verificationStatus === 'verifying') && (
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
          )}

          {/* Valid Reservation */}
          {verificationStatus === 'valid' && scannedData && (
            <Card className="border-success bg-success/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-6 h-6 text-success" />
                  <span className="font-semibold text-success">
                    {isCheckoutMode ? 'Ready for Checkout' : 'Valid Reservation'}
                  </span>
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
                  {isCheckoutMode ? (
                    <Button className="flex-1 bg-amber-600 hover:bg-amber-700" onClick={handleCheckout}>
                      Confirm Checkout
                    </Button>
                  ) : (
                    <Button className="flex-1" onClick={handleCheckIn}>
                      Check In Vehicle
                    </Button>
                  )}
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
              {isCheckoutMode 
                ? "Scan the QR code from the citizen's reservation to complete checkout"
                : "Position the QR code from the citizen's reservation within the camera frame"
              }
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});

QRScannerDialog.displayName = 'QRScannerDialog';
