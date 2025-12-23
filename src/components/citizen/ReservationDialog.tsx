import React, { useState } from 'react';
import { format, addHours } from 'date-fns';
import { Calendar, Clock, Car, IndianRupee } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useReservations } from '@/hooks/useReservations';
import { useAuth } from '@/contexts/AuthContext';

interface ParkingLot {
  id: string;
  name: string;
  zone: string;
  hourly_rate: number;
}

interface ReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parkingLot: ParkingLot | null;
}

const timeSlots = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00',
];

export function ReservationDialog({ open, onOpenChange, parkingLot }: ReservationDialogProps) {
  const { user } = useAuth();
  const { createReservation } = useReservations();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState('2');
  const [vehicleNumber, setVehicleNumber] = useState('');

  if (!parkingLot) return null;

  const durationHours = parseInt(duration);
  const estimatedCost = parkingLot.hourly_rate * durationHours;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !vehicleNumber.trim()) return;

    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date(date);
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = addHours(startDate, durationHours);

    await createReservation.mutateAsync({
      lot_id: parkingLot.id,
      vehicle_number: vehicleNumber.toUpperCase(),
      reservation_date: format(date, 'yyyy-MM-dd'),
      start_time: startTime,
      end_time: format(endDate, 'HH:mm'),
      amount: estimatedCost,
    });

    onOpenChange(false);
    setVehicleNumber('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reserve Parking Spot</DialogTitle>
          <DialogDescription>
            {parkingLot.name} • {parkingLot.zone}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Vehicle Number */}
          <div className="space-y-2">
            <Label htmlFor="vehicle">Vehicle Number</Label>
            <div className="relative">
              <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="vehicle"
                placeholder="DL 01 AB 1234"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                className="pl-10 uppercase"
                required
              />
            </div>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger>
                  <Clock className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((hours) => (
                    <SelectItem key={hours} value={hours.toString()}>
                      {hours} hour{hours > 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estimated Cost</span>
              <div className="flex items-center gap-1 font-semibold text-lg">
                <IndianRupee className="w-4 h-4" />
                <span>{estimatedCost}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ₹{parkingLot.hourly_rate}/hr × {durationHours} hours
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createReservation.isPending || !user}>
              {createReservation.isPending ? 'Reserving...' : 'Confirm Reservation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
