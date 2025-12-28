import React, { useState } from 'react';
import { MapPin, Clock, Car, ChevronLeft } from 'lucide-react';
import { GovHeader } from '@/components/ui/GovHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useParkingLots } from '@/hooks/useParkingLots';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function LiveParkingMap() {
  const { data: lots, isLoading } = useParkingLots();
  const [selectedLot, setSelectedLot] = useState<string | null>(null);

  const getOccupancyColor = (occupancy: number, capacity: number) => {
    const percent = (occupancy / capacity) * 100;
    if (percent >= 90) return 'destructive';
    if (percent >= 70) return 'warning';
    return 'success';
  };

  return (
    <div className="min-h-screen bg-background">
      <GovHeader 
        title="Live Parking Map" 
        subtitle="Real-time availability with ETA"
      />

      <main className="container mx-auto px-4 py-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/citizen">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Portal
          </Link>
        </Button>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Lot List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Car className="w-5 h-5" />
                Available Parking Lots
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
              {lots?.map((lot) => {
                const available = lot.capacity - lot.current_occupancy;
                const occupancyPercent = (lot.current_occupancy / lot.capacity) * 100;

                return (
                  <div
                    key={lot.id}
                    className={cn(
                      "p-4 rounded-lg border cursor-pointer transition-all hover:border-primary",
                      selectedLot === lot.id && "border-primary bg-primary/5"
                    )}
                    onClick={() => setSelectedLot(lot.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{lot.name}</h4>
                        <p className="text-xs text-muted-foreground">{lot.zone}</p>
                      </div>
                      <Badge variant={getOccupancyColor(lot.current_occupancy, lot.capacity) as any}>
                        {available} spots
                      </Badge>
                    </div>
                    <Progress value={occupancyPercent} className="h-2 mb-2" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ₹{lot.hourly_rate}/hr
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {lot.zone}
                      </span>
                    </div>
                    <Button size="sm" className="w-full mt-3" asChild>
                      <Link to={`/citizen?lot=${lot.id}`}>
                        Reserve Now
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Availability Legend</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-success" />
                <span>Available (&lt;70%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-warning" />
                <span>Filling (70-90%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-destructive" />
                <span>Full (&gt;90%)</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}