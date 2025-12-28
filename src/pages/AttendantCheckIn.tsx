import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  QrCode, Car, CheckCircle, Clock, MapPin, Search,
  Camera, LogOut, User, RefreshCw, AlertTriangle, XCircle
} from 'lucide-react';
import { GovHeader } from '@/components/ui/GovHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QRScannerDialog } from '@/components/attendant/QRScannerDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useParkingLots } from '@/hooks/useParkingLots';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RecentCheckIn {
  id: string;
  vehicle_number: string;
  checked_in_at: string;
  lot_name: string;
  status: string;
}

export default function AttendantCheckIn() {
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();
  const { data: lots } = useParkingLots();
  
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanMode, setScanMode] = useState<'checkin' | 'checkout'>('checkin');
  const [manualVehicle, setManualVehicle] = useState('');
  const [recentCheckIns, setRecentCheckIns] = useState<RecentCheckIn[]>([]);
  const [todayStats, setTodayStats] = useState({ checkIns: 0, checkOuts: 0, active: 0 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userRole !== 'attendant' && userRole !== 'admin') {
      navigate('/');
      return;
    }
    loadTodayData();
  }, [userRole]);

  const loadTodayData = async () => {
    setIsLoading(true);
    const today = format(new Date(), 'yyyy-MM-dd');
    
    try {
      // Get today's reservations
      const { data: reservations } = await supabase
        .from('reservations')
        .select(`
          id,
          vehicle_number,
          checked_in_at,
          status,
          parking_lots (name)
        `)
        .eq('reservation_date', today)
        .order('checked_in_at', { ascending: false, nullsFirst: false });

      if (reservations) {
        const checkIns = reservations.filter(r => r.status === 'checked_in' || r.status === 'completed');
        const checkOuts = reservations.filter(r => r.status === 'completed');
        const active = reservations.filter(r => r.status === 'checked_in');

        setTodayStats({
          checkIns: checkIns.length,
          checkOuts: checkOuts.length,
          active: active.length,
        });

        setRecentCheckIns(
          checkIns.slice(0, 10).map(r => ({
            id: r.id,
            vehicle_number: r.vehicle_number,
            checked_in_at: r.checked_in_at || '',
            lot_name: (r.parking_lots as any)?.name || 'Unknown',
            status: r.status,
          }))
        );
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSearch = async () => {
    if (!manualVehicle.trim()) return;
    
    const cleanedVehicle = manualVehicle.toUpperCase().replace(/\s/g, '');
    const today = format(new Date(), 'yyyy-MM-dd');
    
    try {
      const { data: reservation, error } = await supabase
        .from('reservations')
        .select(`
          *,
          parking_lots (name, zone)
        `)
        .eq('vehicle_number', cleanedVehicle)
        .eq('reservation_date', today)
        .in('status', ['pending', 'confirmed', 'checked_in'])
        .maybeSingle();

      if (error) throw error;

      if (!reservation) {
        toast.error('No reservation found', {
          description: `No active reservation for ${cleanedVehicle} today`,
        });
        return;
      }

      if (reservation.status === 'checked_in') {
        // Already checked in - offer checkout
        toast.info('Vehicle is already checked in', {
          description: 'Switching to checkout mode',
        });
        setScanMode('checkout');
      }

      toast.success('Reservation found!', {
        description: `${reservation.vehicle_number} at ${reservation.parking_lots?.name}`,
      });

      // Update to checked_in if not already
      if (reservation.status !== 'checked_in') {
        await supabase
          .from('reservations')
          .update({
            status: 'checked_in',
            checked_in_at: new Date().toISOString(),
          })
          .eq('id', reservation.id);

        toast.success('Vehicle checked in!');
        loadTodayData();
      }

      setManualVehicle('');
    } catch (error: any) {
      toast.error('Search failed: ' + error.message);
    }
  };

  const handleScanComplete = () => {
    loadTodayData();
  };

  const openScanner = (mode: 'checkin' | 'checkout') => {
    setScanMode(mode);
    setScannerOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Mobile Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-foreground/10 rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-semibold">Attendant Check-In</h1>
              <p className="text-xs opacity-80">
                {format(new Date(), 'EEEE, MMM d')}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary-foreground"
            onClick={() => signOut()}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <main className="p-4 max-w-lg mx-auto space-y-4">
        {/* Today's Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-green-500">{todayStats.checkIns}</p>
              <p className="text-xs text-muted-foreground">Check-ins</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-blue-500">{todayStats.active}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-amber-500">{todayStats.checkOuts}</p>
              <p className="text-xs text-muted-foreground">Check-outs</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            size="lg"
            className="h-24 flex-col gap-2 bg-green-600 hover:bg-green-700"
            onClick={() => openScanner('checkin')}
          >
            <QrCode className="w-8 h-8" />
            <span>Scan Check-In</span>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-24 flex-col gap-2 border-amber-500 text-amber-600 hover:bg-amber-50"
            onClick={() => openScanner('checkout')}
          >
            <LogOut className="w-8 h-8" />
            <span>Scan Check-Out</span>
          </Button>
        </div>

        {/* Manual Search */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Search className="w-4 h-4" />
              Manual Vehicle Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter vehicle number"
                value={manualVehicle}
                onChange={(e) => setManualVehicle(e.target.value.toUpperCase())}
                className="font-mono uppercase"
                onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
              />
              <Button onClick={handleManualSearch}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" onClick={loadTodayData} disabled={isLoading}>
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentCheckIns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No check-ins today yet
              </p>
            ) : (
              recentCheckIns.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-full",
                      item.status === 'completed' ? 'bg-amber-100' : 'bg-green-100'
                    )}>
                      {item.status === 'completed' ? (
                        <LogOut className="w-4 h-4 text-amber-600" />
                      ) : (
                        <Car className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-mono font-medium text-sm">{item.vehicle_number}</p>
                      <p className="text-xs text-muted-foreground">{item.lot_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={item.status === 'completed' ? 'secondary' : 'default'} className="text-xs">
                      {item.status === 'completed' ? 'Out' : 'In'}
                    </Badge>
                    {item.checked_in_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(item.checked_in_at), 'h:mm a')}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>

      {/* QR Scanner Dialog */}
      <QRScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        mode={scanMode}
        onReservationVerified={handleScanComplete}
        onCheckoutComplete={handleScanComplete}
      />
    </div>
  );
}
