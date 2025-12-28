import React, { useState, useEffect, forwardRef } from 'react';
import { format, addHours } from 'date-fns';
import { Calendar, Clock, Car, IndianRupee, Save, AlertTriangle } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useReservations } from '@/hooks/useReservations';
import { useAuth } from '@/contexts/AuthContext';
import { useSavedVehicles, useProfile, useUserPreferences } from '@/hooks/useProfile';
import { useFines } from '@/hooks/useFines';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

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

// Vehicle number validation regex
const vehicleNumberRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$/;

export const ReservationDialog = forwardRef<HTMLDivElement, ReservationDialogProps>(
  function ReservationDialog({ open, onOpenChange, parkingLot }, ref) {
    const { user } = useAuth();
    const { isHindi } = useLanguage();
    const { createReservation } = useReservations();
    const { vehicles, isLoading: vehiclesLoading, addVehicle } = useSavedVehicles();
    const { profile } = useProfile();
    const { preferences } = useUserPreferences();
    const { pendingFines, pendingFinesTotal, resolveFines } = useFines();
    
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [startTime, setStartTime] = useState('09:00');
    const [duration, setDuration] = useState('2');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
    const [saveVehicle, setSaveVehicle] = useState(false);
    const [vehicleName, setVehicleName] = useState('');
    const [savingVehicle, setSavingVehicle] = useState(false);

    // Auto-select primary vehicle when dialog opens
    useEffect(() => {
      if (open && vehicles.length > 0) {
        const primaryVehicle = vehicles.find(v => v.is_primary) || vehicles[0];
        if (primaryVehicle && !vehicleNumber) {
          setVehicleNumber(primaryVehicle.vehicle_number);
          setSelectedVehicleId(primaryVehicle.id);
        }
      }
    }, [open, vehicles]);

    // Reset form when dialog closes
    useEffect(() => {
      if (!open) {
        setVehicleNumber('');
        setSelectedVehicleId('');
        setDate(new Date());
        setStartTime('09:00');
        setDuration('2');
        setSaveVehicle(false);
        setVehicleName('');
      }
    }, [open]);

    if (!parkingLot) return null;

    const durationHours = parseInt(duration);
    const parkingCost = parkingLot.hourly_rate * durationHours;
    const totalCost = parkingCost + pendingFinesTotal;

    const handleVehicleSelect = (vehicleId: string) => {
      if (vehicleId === 'custom') {
        setSelectedVehicleId('custom');
        setVehicleNumber('');
        setSaveVehicle(false);
      } else {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (vehicle) {
          setSelectedVehicleId(vehicle.id);
          setVehicleNumber(vehicle.vehicle_number);
          setSaveVehicle(false);
        }
      }
    };

    const isValidVehicleNumber = (num: string) => {
      const cleaned = num.toUpperCase().replace(/\s/g, '');
      return vehicleNumberRegex.test(cleaned);
    };

    const isNewVehicle = selectedVehicleId === 'custom' || (vehicleNumber && !vehicles.some(v => v.vehicle_number === vehicleNumber.toUpperCase().replace(/\s/g, '')));

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!date || !vehicleNumber.trim()) return;

      const cleanedVehicleNumber = vehicleNumber.toUpperCase().replace(/\s/g, '');

      // Validate vehicle number format
      if (!isValidVehicleNumber(cleanedVehicleNumber)) {
        toast.error(isHindi ? 'गलत वाहन नंबर' : 'Invalid vehicle number format', {
          description: isHindi ? 'कृपया एक वैध भारतीय वाहन नंबर दर्ज करें (जैसे DL01AB1234)' : 'Please enter a valid Indian vehicle number (e.g., DL01AB1234)',
        });
        return;
      }

      // Save vehicle if requested
      if (saveVehicle && isNewVehicle) {
        setSavingVehicle(true);
        try {
          await addVehicle.mutateAsync({
            vehicle_number: cleanedVehicleNumber,
            vehicle_name: vehicleName || undefined,
            vehicle_type: 'car',
            is_primary: vehicles.length === 0, // Make primary if first vehicle
          });
          toast.success(isHindi ? 'वाहन प्रोफाइल में सहेजा गया' : 'Vehicle saved to your profile');
        } catch (error) {
          console.error('Failed to save vehicle:', error);
          // Continue with reservation even if saving vehicle fails
        } finally {
          setSavingVehicle(false);
        }
      }

      const [hours, minutes] = startTime.split(':').map(Number);
      const startDate = new Date(date);
      startDate.setHours(hours, minutes, 0, 0);
      const endDate = addHours(startDate, durationHours);

      const reservation = await createReservation.mutateAsync({
        lot_id: parkingLot.id,
        vehicle_number: cleanedVehicleNumber,
        reservation_date: format(date, 'yyyy-MM-dd'),
        start_time: startTime,
        end_time: format(endDate, 'HH:mm'),
        amount: totalCost, // Include fines in the total
      });

      // Mark pending fines as resolved with this reservation
      if (pendingFines.length > 0 && reservation) {
        try {
          await resolveFines.mutateAsync({
            fineIds: pendingFines.map(f => f.id),
          });
          toast.success(isHindi ? 'लंबित जुर्माना इस बुकिंग के साथ क्लियर हो गया' : 'Pending fines have been cleared with this reservation');
        } catch (error) {
          console.error('Failed to resolve fines:', error);
        }
      }

      onOpenChange(false);
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent ref={ref} className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isHindi ? 'पार्किंग बुक करें' : 'Reserve Parking Spot'}</DialogTitle>
            <DialogDescription>
              {parkingLot.name} • {parkingLot.zone}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Vehicle Selection */}
            <div className="space-y-2">
              <Label>{isHindi ? 'वाहन' : 'Vehicle'}</Label>
              {vehicles.length > 0 ? (
                <div className="space-y-2">
                  <Select value={selectedVehicleId} onValueChange={handleVehicleSelect}>
                    <SelectTrigger>
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-muted-foreground" />
                        <SelectValue placeholder={isHindi ? 'वाहन चुनें' : 'Select a vehicle'} />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          <div className="flex items-center gap-2">
                            <span>{vehicle.vehicle_type === 'bike' ? '🏍️' : vehicle.vehicle_type === 'suv' ? '🚙' : '🚗'}</span>
                            <span className="font-mono">{vehicle.vehicle_number}</span>
                            {vehicle.vehicle_name && (
                              <span className="text-muted-foreground text-xs">({vehicle.vehicle_name})</span>
                            )}
                            {vehicle.is_primary && (
                              <span className="text-xs text-primary">★</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">
                        <div className="flex items-center gap-2">
                          <span>➕</span>
                          <span>{isHindi ? 'नया वाहन नंबर दर्ज करें' : 'Enter new vehicle number'}</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {selectedVehicleId === 'custom' && (
                    <div className="space-y-3">
                      <div className="relative">
                        <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="DL01AB1234"
                          value={vehicleNumber}
                          onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                          className="pl-10 uppercase font-mono"
                          required
                        />
                      </div>
                      
                      {/* Save vehicle option */}
                      <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="save-vehicle"
                            checked={saveVehicle}
                            onCheckedChange={(checked) => setSaveVehicle(checked === true)}
                          />
                          <Label htmlFor="save-vehicle" className="text-sm cursor-pointer flex items-center gap-2">
                            <Save className="w-4 h-4" />
                            {isHindi ? 'भविष्य की बुकिंग के लिए वाहन सहेजें' : 'Save this vehicle for future bookings'}
                          </Label>
                        </div>
                        
                        {saveVehicle && (
                          <Input
                            placeholder={isHindi ? 'वाहन का नाम (वैकल्पिक)' : 'Vehicle nickname (optional) e.g., My Swift'}
                            value={vehicleName}
                            onChange={(e) => setVehicleName(e.target.value)}
                            className="mt-2"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="vehicle"
                      placeholder="DL01AB1234"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                      className="pl-10 uppercase font-mono"
                      required
                    />
                  </div>
                  
                  {/* Save vehicle option for new users */}
                  {vehicleNumber && (
                    <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="save-vehicle-new"
                          checked={saveVehicle}
                          onCheckedChange={(checked) => setSaveVehicle(checked === true)}
                        />
                        <Label htmlFor="save-vehicle-new" className="text-sm cursor-pointer flex items-center gap-2">
                          <Save className="w-4 h-4" />
                          {isHindi ? 'भविष्य की बुकिंग के लिए वाहन सहेजें' : 'Save this vehicle for future bookings'}
                        </Label>
                      </div>
                      
                      {saveVehicle && (
                        <Input
                          placeholder={isHindi ? 'वाहन का नाम (वैकल्पिक)' : 'Vehicle nickname (optional) e.g., My Swift'}
                          value={vehicleName}
                          onChange={(e) => setVehicleName(e.target.value)}
                          className="mt-2"
                        />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Date Selection */}
            <div className="space-y-2">
              <Label>{isHindi ? 'तारीख' : 'Date'}</Label>
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
                    {date ? format(date, 'PPP') : <span>{isHindi ? 'तारीख चुनें' : 'Pick a date'}</span>}
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
                <Label>{isHindi ? 'समय' : 'Start Time'}</Label>
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
                <Label>{isHindi ? 'अवधि' : 'Duration'}</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((hours) => (
                      <SelectItem key={hours} value={hours.toString()}>
                        {hours} {isHindi ? 'घंटे' : (hours > 1 ? 'hours' : 'hour')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cost Summary */}
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{isHindi ? 'पार्किंग शुल्क' : 'Parking Fee'}</span>
                <span className="text-sm">₹{parkingCost}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                ₹{parkingLot.hourly_rate}/{isHindi ? 'घंटा' : 'hr'} × {durationHours} {isHindi ? 'घंटे' : 'hours'}
              </p>
              
              {pendingFinesTotal > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-2 text-warning">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">{isHindi ? 'लंबित जुर्माना' : 'Pending Fine'}</span>
                  </div>
                  <span className="text-sm text-warning font-medium">₹{pendingFinesTotal}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-sm font-medium">{isHindi ? 'कुल' : 'Total'}</span>
                <div className="flex items-center gap-1 font-semibold text-lg">
                  <IndianRupee className="w-4 h-4" />
                  <span>{totalCost}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {isHindi ? 'रद्द करें' : 'Cancel'}
              </Button>
              <Button 
                type="submit" 
                disabled={createReservation.isPending || savingVehicle || !user || !vehicleNumber.trim()}
              >
                {savingVehicle 
                  ? (isHindi ? 'वाहन सहेज रहे हैं...' : 'Saving Vehicle...') 
                  : createReservation.isPending 
                    ? (isHindi ? 'बुक हो रहा है...' : 'Reserving...') 
                    : (isHindi ? 'बुकिंग की पुष्टि करें' : 'Confirm Reservation')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }
);