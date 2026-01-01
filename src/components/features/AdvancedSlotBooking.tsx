import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Car, MapPin, CalendarCheck, AlertCircle, CheckCircle2, Timer, Bell, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface BookingSlot {
  id: string;
  time: string;
  available: boolean;
  price: number;
}

const timeSlots: BookingSlot[] = [
  { id: '1', time: '09:00 - 11:00', available: true, price: 60 },
  { id: '2', time: '11:00 - 13:00', available: true, price: 60 },
  { id: '3', time: '13:00 - 15:00', available: false, price: 60 },
  { id: '4', time: '15:00 - 17:00', available: true, price: 80 },
  { id: '5', time: '17:00 - 19:00', available: true, price: 100 },
  { id: '6', time: '19:00 - 21:00', available: true, price: 80 },
];

export function AdvancedSlotBooking() {
  const { isHindi } = useLanguage();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [autoExtend, setAutoExtend] = useState(true);
  const [reminder, setReminder] = useState(true);
  const [isBooked, setIsBooked] = useState(false);
  const [bookedSlot, setBookedSlot] = useState<BookingSlot | null>(null);

  const handleBooking = () => {
    if (!selectedSlot) {
      toast.error(isHindi ? 'कृपया समय स्लॉट चुनें' : 'Please select a time slot');
      return;
    }
    if (!vehicleNumber) {
      toast.error(isHindi ? 'कृपया वाहन नंबर दर्ज करें' : 'Please enter vehicle number');
      return;
    }

    const slot = timeSlots.find(s => s.id === selectedSlot);
    setBookedSlot(slot || null);
    setIsBooked(true);
    toast.success(isHindi ? 'स्लॉट बुक हो गया!' : 'Slot booked successfully!');
  };

  const resetBooking = () => {
    setSelectedSlot(null);
    setVehicleNumber('');
    setIsBooked(false);
    setBookedSlot(null);
  };

  if (isBooked && bookedSlot) {
    return (
      <Card className="border-success/30">
        <CardContent className="pt-6">
          <div className="text-center mb-4">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h3 className="text-xl font-bold text-success">
              {isHindi ? 'बुकिंग पुष्टि!' : 'Booking Confirmed!'}
            </h3>
          </div>

          <div className="space-y-3 bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{isHindi ? 'समय स्लॉट' : 'Time Slot'}</span>
              <span className="font-medium">{bookedSlot.time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{isHindi ? 'वाहन नंबर' : 'Vehicle'}</span>
              <span className="font-mono">{vehicleNumber.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{isHindi ? 'राशि' : 'Amount'}</span>
              <span className="font-bold text-primary">₹{bookedSlot.price}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{isHindi ? 'बुकिंग आईडी' : 'Booking ID'}</span>
              <span className="font-mono text-xs">NP{Date.now().toString().slice(-8)}</span>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            {autoExtend && (
              <Badge variant="outline" className="text-xs gap-1">
                <RefreshCw className="w-3 h-3" />
                {isHindi ? 'ऑटो-एक्सटेंड' : 'Auto-extend'}
              </Badge>
            )}
            {reminder && (
              <Badge variant="outline" className="text-xs gap-1">
                <Bell className="w-3 h-3" />
                {isHindi ? 'रिमाइंडर सेट' : 'Reminder set'}
              </Badge>
            )}
          </div>

          <Button onClick={resetBooking} variant="outline" className="w-full mt-4">
            {isHindi ? 'नई बुकिंग करें' : 'Make New Booking'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-primary" />
          {isHindi ? 'स्मार्ट स्लॉट बुकिंग' : 'Smart Slot Booking'}
        </CardTitle>
        <CardDescription>
          {isHindi 
            ? 'समय स्लॉट प्री-बुक करें, ऑटो-एक्सटेंशन और रिमाइंडर के साथ'
            : 'Pre-book time slots with auto-extension and reminders'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Selection */}
        <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
          <Calendar className="w-5 h-5 text-primary" />
          <div>
            <p className="font-medium text-sm">{isHindi ? 'आज' : 'Today'}</p>
            <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
        </div>

        {/* Time Slots */}
        <div>
          <Label className="mb-2 block">{isHindi ? 'समय स्लॉट चुनें' : 'Select Time Slot'}</Label>
          <div className="grid grid-cols-2 gap-2">
            {timeSlots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => slot.available && setSelectedSlot(slot.id)}
                disabled={!slot.available}
                className={`p-3 rounded-lg border text-left transition-all ${
                  !slot.available 
                    ? 'bg-muted/50 opacity-50 cursor-not-allowed' 
                    : selectedSlot === slot.id 
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/20' 
                      : 'hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium">{slot.time}</span>
                  </div>
                  {!slot.available && (
                    <Badge variant="secondary" className="text-[10px]">{isHindi ? 'भरा' : 'Full'}</Badge>
                  )}
                </div>
                <p className="text-primary font-bold mt-1">₹{slot.price}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle Number */}
        <div>
          <Label htmlFor="vehicleNum" className="mb-2 block">
            {isHindi ? 'वाहन नंबर' : 'Vehicle Number'}
          </Label>
          <Input 
            id="vehicleNum"
            placeholder="DL 01 AB 1234"
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value)}
            className="uppercase"
          />
        </div>

        {/* Options */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={autoExtend} 
              onChange={(e) => setAutoExtend(e.target.checked)}
              className="rounded"
            />
            <div className="flex-1">
              <span className="text-sm">{isHindi ? 'ऑटो-एक्सटेंड' : 'Auto-extend'}</span>
              <p className="text-xs text-muted-foreground">{isHindi ? 'समय समाप्त होने पर अपने आप बढ़ाएं' : 'Automatically extend when time runs out'}</p>
            </div>
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={reminder} 
              onChange={(e) => setReminder(e.target.checked)}
              className="rounded"
            />
            <div className="flex-1">
              <span className="text-sm">{isHindi ? 'रिमाइंडर' : 'Reminder'}</span>
              <p className="text-xs text-muted-foreground">{isHindi ? '15 मिनट पहले अलर्ट' : 'Alert 15 minutes before expiry'}</p>
            </div>
            <Bell className="w-4 h-4 text-muted-foreground" />
          </label>
        </div>

        {/* Book Button */}
        <Button 
          className="w-full gap-2" 
          size="lg"
          onClick={handleBooking}
          disabled={!selectedSlot}
        >
          <CalendarCheck className="w-4 h-4" />
          {selectedSlot 
            ? `${isHindi ? 'बुक करें' : 'Book'} - ₹${timeSlots.find(s => s.id === selectedSlot)?.price}`
            : (isHindi ? 'स्लॉट चुनें' : 'Select a Slot')
          }
        </Button>

        {/* Info */}
        <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            {isHindi 
              ? 'बुकिंग शुरू होने से 30 मिनट पहले तक मुफ्त रद्द करें'
              : 'Free cancellation up to 30 minutes before booking start time'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
