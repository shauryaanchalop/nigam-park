import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, AlertTriangle, Car, Clock, Camera, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface Detection {
  id: string;
  vehicleNumber: string;
  timestamp: Date;
  status: 'approved' | 'fraud' | 'warning';
  confidence: number;
  cameraId: string;
  reason?: string;
}

const DEMO_VEHICLES = [
  { number: 'DL01AB1234', status: 'approved' as const, reason: 'Valid reservation found' },
  { number: 'HR26CX5678', status: 'approved' as const, reason: 'Payment confirmed' },
  { number: 'UP16DY9012', status: 'fraud' as const, reason: 'No payment record - Unauthorized entry' },
  { number: 'DL02EZ3456', status: 'warning' as const, reason: 'Expired reservation - Overstay detected' },
  { number: 'RJ14FA7890', status: 'approved' as const, reason: 'FASTag payment verified' },
  { number: 'DL03GB1122', status: 'fraud' as const, reason: 'Blacklisted vehicle - Multiple violations' },
  { number: 'HR55HC3344', status: 'approved' as const, reason: 'Monthly pass holder' },
  { number: 'UP32ID5566', status: 'warning' as const, reason: 'Payment pending - Grace period' },
  { number: 'DL04JE7788', status: 'approved' as const, reason: 'VIP vehicle registered' },
  { number: 'MP09KF9900', status: 'fraud' as const, reason: 'Fake number plate detected' },
];

const CAMERAS = ['CAM-A1', 'CAM-A2', 'CAM-B1', 'CAM-B2', 'CAM-C1'];

export function VisionDetectionDemo() {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [isSimulating, setIsSimulating] = useState(true);

  const generateDetection = (): Detection => {
    const vehicle = DEMO_VEHICLES[Math.floor(Math.random() * DEMO_VEHICLES.length)];
    return {
      id: crypto.randomUUID(),
      vehicleNumber: vehicle.number,
      timestamp: new Date(),
      status: vehicle.status,
      confidence: 85 + Math.random() * 15,
      cameraId: CAMERAS[Math.floor(Math.random() * CAMERAS.length)],
      reason: vehicle.reason,
    };
  };

  useEffect(() => {
    if (!isSimulating) return;

    // Add initial detections
    const initialDetections = Array.from({ length: 5 }, generateDetection);
    setDetections(initialDetections);

    // Simulate new detections
    const interval = setInterval(() => {
      setDetections(prev => [generateDetection(), ...prev].slice(0, 20));
    }, 4000);

    return () => clearInterval(interval);
  }, [isSimulating]);

  const getStatusIcon = (status: Detection['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'fraud':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
    }
  };

  const getStatusBadge = (status: Detection['status']) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success/20 text-success border-success/30">APPROVED</Badge>;
      case 'fraud':
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">FRAUD ALERT</Badge>;
      case 'warning':
        return <Badge className="bg-warning/20 text-warning border-warning/30">WARNING</Badge>;
    }
  };

  const stats = {
    approved: detections.filter(d => d.status === 'approved').length,
    fraud: detections.filter(d => d.status === 'fraud').length,
    warning: detections.filter(d => d.status === 'warning').length,
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            ANPR Detection Feed
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/10 border border-success/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              <span className="text-xs font-medium text-success">LIVE</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSimulating(!isSimulating)}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isSimulating ? 'animate-spin' : ''}`} />
              {isSimulating ? 'Pause' : 'Resume'}
            </Button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-sm text-muted-foreground">{stats.approved} Approved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <XCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-muted-foreground">{stats.fraud} Fraud</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-sm text-muted-foreground">{stats.warning} Warnings</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-2 p-4 pt-0">
            {detections.map((detection, index) => (
              <div
                key={detection.id}
                className={`p-3 rounded-lg border transition-all duration-500 ${
                  index === 0 ? 'animate-fade-in ring-2 ring-primary/20' : ''
                } ${
                  detection.status === 'fraud' 
                    ? 'bg-destructive/5 border-destructive/30' 
                    : detection.status === 'warning'
                    ? 'bg-warning/5 border-warning/30'
                    : 'bg-card border-border/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(detection.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono font-semibold">{detection.vehicleNumber}</span>
                        {getStatusBadge(detection.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{detection.reason}</p>
                    </div>
                  </div>
                  
                  <div className="text-right text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Camera className="h-3 w-3" />
                      {detection.cameraId}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {format(detection.timestamp, 'HH:mm:ss')}
                    </div>
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      {detection.confidence.toFixed(1)}% conf
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
