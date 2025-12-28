import React from 'react';
import { AlertTriangle, IndianRupee } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFines } from '@/hooks/useFines';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface PendingFinesBannerProps {
  showDetails?: boolean;
}

export function PendingFinesBanner({ showDetails = false }: PendingFinesBannerProps) {
  const { pendingFines, pendingFinesTotal, isPendingLoading } = useFines();

  if (isPendingLoading || pendingFinesTotal === 0) {
    return null;
  }

  return (
    <Card className="bg-destructive/10 border-destructive/30">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-destructive/20">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-destructive">
                  Pending Fine{pendingFines.length > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-muted-foreground">
                  You have {pendingFines.length} outstanding fine{pendingFines.length > 1 ? 's' : ''} that will be added to your next parking transaction
                </p>
              </div>
              <Badge variant="outline" className="border-destructive text-destructive font-semibold text-lg">
                <IndianRupee className="w-4 h-4 mr-1" />
                ₹{pendingFinesTotal}
              </Badge>
            </div>
            
            {showDetails && pendingFines.length > 0 && (
              <div className="mt-4 space-y-2">
                {pendingFines.map((fine) => (
                  <div
                    key={fine.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-destructive/20"
                  >
                    <div>
                      <p className="text-sm font-medium">{fine.reason}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(fine.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <Badge variant="destructive">₹{fine.amount}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
