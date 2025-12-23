import React, { useState } from 'react';
import { Settings, Car, CreditCard, Banknote, AlertTriangle, RotateCcw, X, Play, BrainCircuit, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useParkingLots } from '@/hooks/useParkingLots';
import { useTransactions } from '@/hooks/useTransactions';
import { useAlerts } from '@/hooks/useAlerts';
import { useSensorLogs } from '@/hooks/useSensorLogs';
import { useFraudAlerts } from '@/hooks/useFraudAlerts';
import { useOccupancyForecasts } from '@/hooks/useOccupancyForecasts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { addHours } from 'date-fns';

interface SimulationEvent {
  id: string;
  type: 'entry' | 'payment' | 'fraud' | 'alert' | 'ai';
  message: string;
  timestamp: Date;
}

export function SimulationSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState<string>('');
  const [events, setEvents] = useState<SimulationEvent[]>([]);
  const [pendingFraud, setPendingFraud] = useState<{ lotId: string; logId: string; timer: number } | null>(null);

  const { data: lots, updateOccupancy } = useParkingLots();
  const { createTransaction } = useTransactions();
  const { createAlert } = useAlerts();
  const { createSensorLog } = useSensorLogs();
  const { createFraudAlert } = useFraudAlerts();
  const { createForecast } = useOccupancyForecasts();

  const generateVehicleNumber = () => {
    const states = ['DL', 'HR', 'UP', 'RJ'];
    const state = states[Math.floor(Math.random() * states.length)];
    const num1 = Math.floor(Math.random() * 99).toString().padStart(2, '0');
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letter = letters[Math.floor(Math.random() * 26)] + letters[Math.floor(Math.random() * 26)];
    const num2 = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `${state}${num1}${letter}${num2}`;
  };

  const addEvent = (type: SimulationEvent['type'], message: string) => {
    setEvents(prev => [{
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
    }, ...prev].slice(0, 20));
  };

  const handleCarEntry = async () => {
    if (!selectedLot) {
      toast.error('Please select a parking lot');
      return;
    }

    const lot = lots?.find(l => l.id === selectedLot);
    if (!lot) return;

    const vehicle = generateVehicleNumber();

    try {
      await createSensorLog.mutateAsync({
        lot_id: selectedLot,
        event_type: 'entry',
        vehicle_detected: vehicle,
        has_payment: true,
      });

      await updateOccupancy.mutateAsync({ lotId: selectedLot, delta: 1 });

      addEvent('entry', `🚗 Vehicle ${vehicle} entered ${lot.name}`);
      toast.success(`Vehicle ${vehicle} entered ${lot.name}`);
    } catch (error: any) {
      console.error('Car entry simulation error:', error);
      toast.error('Failed to simulate car entry', {
        description: error?.message || 'Please try again',
      });
    }
  };

  const handlePayment = async (method: 'FASTag' | 'Cash') => {
    if (!selectedLot) {
      toast.error('Please select a parking lot');
      return;
    }

    const lot = lots?.find(l => l.id === selectedLot);
    if (!lot) return;

    const vehicle = generateVehicleNumber();
    const amount = lot.hourly_rate * (Math.floor(Math.random() * 3) + 1);

    try {
      await createTransaction.mutateAsync({
        lot_id: selectedLot,
        vehicle_number: vehicle,
        amount,
        payment_method: method,
        status: 'completed',
        entry_time: new Date().toISOString(),
        exit_time: null,
      });

      addEvent('payment', `💳 ₹${amount} received via ${method} for ${vehicle}`);
      toast.success(`₹${amount} payment received via ${method}`);
    } catch (error: any) {
      console.error('Payment simulation error:', error);
      toast.error('Failed to process payment', {
        description: error?.message || 'Please try again',
      });
    }
  };

  const handleFraudScenario = async () => {
    if (!selectedLot) {
      toast.error('Please select a parking lot');
      return;
    }

    const lot = lots?.find(l => l.id === selectedLot);
    if (!lot) return;

    const vehicle = generateVehicleNumber();

    try {
      // Create sensor log WITHOUT payment
      const sensorLog = await createSensorLog.mutateAsync({
        lot_id: selectedLot,
        event_type: 'entry',
        vehicle_detected: vehicle,
        has_payment: false,
      });

      await updateOccupancy.mutateAsync({ lotId: selectedLot, delta: 1 });

      addEvent('fraud', `⚠️ FRAUD TRIGGERED: ${vehicle} entered ${lot.name} WITHOUT payment`);
      toast.warning(`Fraud scenario initiated for ${vehicle}`);

      // Start countdown timer
      setPendingFraud({ lotId: selectedLot, logId: sensorLog.id, timer: 10 });

      // Countdown and trigger alert
      let countdown = 10;
      const interval = setInterval(() => {
        countdown--;
        setPendingFraud(prev => prev ? { ...prev, timer: countdown } : null);
        
        if (countdown <= 0) {
          clearInterval(interval);
          triggerFraudAlert(lot.name, vehicle, sensorLog.id);
          setPendingFraud(null);
        }
      }, 1000);

    } catch (error) {
      toast.error('Failed to simulate fraud scenario');
    }
  };

  const triggerFraudAlert = async (lotName: string, vehicle: string, sensorLogId: string) => {
    const lot = lots?.find(l => l.name === lotName);
    if (!lot) return;

    try {
      await createAlert.mutateAsync({
        lot_id: lot.id,
        alert_type: 'fraud',
        message: `🚨 MISMATCH DETECTED: Vehicle ${vehicle} entered ${lotName}, Payment Pending - Potential Revenue Leakage`,
        severity: 'critical',
        is_resolved: false,
        sensor_log_id: sensorLogId,
      });

      addEvent('alert', `🚨 FRAUD ALERT: ${vehicle} at ${lotName}`);
      toast.error('FRAUD DETECTED!', {
        description: `Vehicle entered ${lotName} without payment`,
        duration: 10000,
      });
    } catch (error) {
      console.error('Failed to create alert:', error);
    }
  };

  const handleSimulateFraudAI = async () => {
    if (!selectedLot) {
      toast.error('Please select a parking lot');
      return;
    }
    const lot = lots?.find(l => l.id === selectedLot);
    if (!lot) return;

    try {
      await createFraudAlert.mutateAsync({
        severity: 'CRITICAL',
        location: lot.name,
        description: `AI detected unauthorized vehicle entry at ${lot.name} - No payment recorded for 15 minutes`,
        metadata: {
          entry_time: new Date().toISOString(),
          payment_time: null,
          confidence: 0.96,
          detection_type: 'REVENUE_LEAKAGE',
        },
      });
      addEvent('ai', `🤖 AI FRAUD ALERT: Critical detection at ${lot.name}`);
      toast.error('AI Fraud Alert Created!', { duration: 5000 });
    } catch (error) {
      toast.error('Failed to simulate AI fraud');
    }
  };

  const handleSimulateTraffic = async () => {
    if (!selectedLot) {
      toast.error('Please select a parking lot');
      return;
    }

    try {
      const now = new Date();
      for (let i = 1; i <= 6; i++) {
        await createForecast.mutateAsync({
          parking_lot_id: selectedLot,
          forecast_time: addHours(now, i).toISOString(),
          predicted_occupancy: Math.min(100, 40 + Math.floor(Math.random() * 50) + i * 5),
          confidence_score: 0.85 + Math.random() * 0.1,
        });
      }
      addEvent('ai', `🧠 AI generated 6-hour traffic forecast`);
      toast.success('AI Traffic Forecast Generated!');
    } catch (error) {
      toast.error('Failed to simulate traffic forecast');
    }
  };

  const handleReset = () => {
    setEvents([]);
    setPendingFraud(null);
    toast.info('Demo data cleared');
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-4 left-4 z-50 p-3 rounded-full shadow-lg transition-all',
          'bg-primary text-primary-foreground hover:bg-primary/90',
          'flex items-center gap-2',
          isOpen && 'opacity-0 pointer-events-none'
        )}
      >
        <Settings className="w-5 h-5" />
        <span className="text-sm font-medium hidden sm:inline">Demo Mode</span>
      </button>

      {/* Sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-80 bg-sidebar text-sidebar-foreground shadow-2xl transition-transform duration-300',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Play className="w-5 h-5 text-sidebar-accent" />
              <h2 className="font-semibold">Simulation Panel</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-sidebar-foreground hover:bg-sidebar-accent/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Lot Selector */}
          <div className="p-4 border-b border-sidebar-border">
            <label className="text-sm text-sidebar-foreground/70 mb-2 block">Select Parking Lot</label>
            <Select value={selectedLot} onValueChange={setSelectedLot}>
              <SelectTrigger className="bg-sidebar-accent/10 border-sidebar-border">
                <SelectValue placeholder="Choose a lot..." />
              </SelectTrigger>
              <SelectContent>
                {lots?.map(lot => (
                  <SelectItem key={lot.id} value={lot.id}>
                    {lot.name} ({lot.current_occupancy}/{lot.capacity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="p-4 space-y-3 border-b border-sidebar-border">
            <Button
              onClick={handleCarEntry}
              className="w-full justify-start gap-3 bg-sidebar-primary/20 hover:bg-sidebar-primary/30 text-sidebar-foreground"
              disabled={!selectedLot}
            >
              <Car className="w-5 h-5" />
              Simulate Car Entry (Sensor)
            </Button>

            <Button
              onClick={() => handlePayment('FASTag')}
              className="w-full justify-start gap-3 bg-sidebar-primary/20 hover:bg-sidebar-primary/30 text-sidebar-foreground"
              disabled={!selectedLot}
            >
              <CreditCard className="w-5 h-5" />
              Simulate FASTag Payment
            </Button>

            <Button
              onClick={() => handlePayment('Cash')}
              className="w-full justify-start gap-3 bg-sidebar-primary/20 hover:bg-sidebar-primary/30 text-sidebar-foreground"
              disabled={!selectedLot}
            >
              <Banknote className="w-5 h-5" />
              Simulate Cash Payment
            </Button>

            <Button
              onClick={handleFraudScenario}
              className="w-full justify-start gap-3 bg-destructive/20 hover:bg-destructive/30 text-destructive"
              disabled={!selectedLot || pendingFraud !== null}
            >
              <AlertTriangle className="w-5 h-5" />
              {pendingFraud 
                ? `Alert in ${pendingFraud.timer}s...` 
                : 'SIMULATE FRAUD SCENARIO'
              }
            </Button>

            {/* AI Simulation Buttons */}
            <div className="pt-2 border-t border-sidebar-border">
              <p className="text-xs text-sidebar-foreground/50 mb-2">AI Simulations</p>
              <Button
                onClick={handleSimulateFraudAI}
                className="w-full justify-start gap-3 bg-destructive/30 hover:bg-destructive/40 text-destructive mb-2"
                disabled={!selectedLot}
              >
                <ShieldAlert className="w-5 h-5" />
                Simulate AI Fraud Alert
              </Button>
              <Button
                onClick={handleSimulateTraffic}
                className="w-full justify-start gap-3 bg-primary/20 hover:bg-primary/30 text-sidebar-foreground"
                disabled={!selectedLot}
              >
                <BrainCircuit className="w-5 h-5" />
                Simulate Traffic Forecast
              </Button>
            </div>

            <Button
              onClick={handleReset}
              variant="outline"
              className="w-full justify-start gap-3 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/10"
            >
              <RotateCcw className="w-5 h-5" />
              Reset Demo Data
            </Button>
          </div>

          {/* Event Log */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-4 border-b border-sidebar-border">
              <h3 className="text-sm font-medium text-sidebar-foreground/70">Event Log</h3>
            </div>
            <ScrollArea className="flex-1 custom-scrollbar">
              <div className="p-4 space-y-2">
                {events.length === 0 ? (
                  <p className="text-sm text-sidebar-foreground/50 text-center py-4">
                    No events yet. Start simulating!
                  </p>
                ) : (
                  events.map(event => (
                    <div
                      key={event.id}
                      className={cn(
                        'p-2 rounded text-sm',
                        event.type === 'fraud' && 'bg-destructive/20 text-destructive',
                        event.type === 'alert' && 'bg-destructive/30 text-destructive font-medium',
                        event.type === 'payment' && 'bg-success/20 text-success',
                        event.type === 'entry' && 'bg-sidebar-accent/20 text-sidebar-foreground',
                      )}
                    >
                      <p>{event.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {event.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
