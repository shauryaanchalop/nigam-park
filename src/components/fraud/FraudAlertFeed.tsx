import { useState } from 'react';
import { useFraudAlerts } from '@/hooks/useFraudAlerts';
import { FraudAlert } from '@/types/ai-modules';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { AlertTriangle, ShieldAlert, CheckCircle, Eye, Clock, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export function FraudAlertFeed() {
  const { alerts, isLoading, updateFraudStatus } = useFraudAlerts();
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);

  const severityStyles = {
    CRITICAL: {
      bg: 'bg-destructive/10 border-destructive/50 hover:bg-destructive/15',
      badge: 'bg-destructive text-destructive-foreground',
      icon: 'text-destructive',
    },
    HIGH: {
      bg: 'bg-destructive/5 border-destructive/30 hover:bg-destructive/10',
      badge: 'bg-destructive/80 text-destructive-foreground',
      icon: 'text-destructive/80',
    },
    MEDIUM: {
      bg: 'bg-warning/10 border-warning/50 hover:bg-warning/15',
      badge: 'bg-warning text-warning-foreground',
      icon: 'text-warning',
    },
    LOW: {
      bg: 'bg-muted border-border hover:bg-muted/80',
      badge: 'bg-muted-foreground/20 text-foreground',
      icon: 'text-muted-foreground',
    },
  };

  const handleResolve = async () => {
    if (!selectedAlert) return;
    
    try {
      await updateFraudStatus.mutateAsync({
        id: selectedAlert.id,
        status: 'RESOLVED',
      });
      toast.success('Alert resolved successfully');
      setSelectedAlert(null);
    } catch (error) {
      toast.error('Failed to resolve alert');
    }
  };

  const handleInvestigate = async () => {
    if (!selectedAlert) return;
    
    try {
      await updateFraudStatus.mutateAsync({
        id: selectedAlert.id,
        status: 'INVESTIGATING',
      });
      toast.info('Alert marked as investigating');
    } catch (error) {
      toast.error('Failed to update alert status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="chakra-spinner w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldAlert className="w-5 h-5 text-destructive" />
            Live Fraud Alerts
            {alerts && alerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {alerts.length} Active
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="p-4 space-y-3">
              {!alerts || alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mb-4 text-success" />
                  <p className="text-lg font-medium">All Clear</p>
                  <p className="text-sm">No active fraud alerts</p>
                </div>
              ) : (
                alerts.map((alert) => {
                  const styles = severityStyles[alert.severity];
                  return (
                    <div
                      key={alert.id}
                      onClick={() => setSelectedAlert(alert)}
                      className={cn(
                        'p-4 rounded-lg border-2 cursor-pointer transition-all',
                        styles.bg,
                        alert.severity === 'CRITICAL' && 'fraud-alert'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className={cn('w-5 h-5 mt-0.5 flex-shrink-0', styles.icon)} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={styles.badge}>
                                {alert.severity}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {alert.status}
                              </Badge>
                            </div>
                            <p className="font-medium text-sm mb-1">{alert.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {alert.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(alert.created_at), 'HH:mm:ss')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Evidence Dialog */}
      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-destructive" />
              Fraud Alert Evidence
            </DialogTitle>
            <DialogDescription>
              Review the evidence and take appropriate action
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Severity</label>
                  <Badge className={severityStyles[selectedAlert.severity].badge}>
                    {selectedAlert.severity}
                  </Badge>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Status</label>
                  <Badge variant="outline">{selectedAlert.status}</Badge>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Location</label>
                <p className="font-medium">{selectedAlert.location}</p>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Description</label>
                <p className="text-sm">{selectedAlert.description}</p>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Detected At</label>
                <p className="text-sm font-mono">
                  {format(new Date(selectedAlert.created_at), 'PPpp')}
                </p>
              </div>

              {/* Metadata Evidence */}
              <div className="bg-muted rounded-lg p-4">
                <label className="text-xs text-muted-foreground block mb-2">
                  Evidence Data (JSONB)
                </label>
                <pre className="text-xs overflow-auto max-h-40 font-mono">
                  {JSON.stringify(selectedAlert.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedAlert?.status !== 'INVESTIGATING' && (
              <Button variant="outline" onClick={handleInvestigate}>
                Mark as Investigating
              </Button>
            )}
            <Button variant="destructive" onClick={handleResolve}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Resolve Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
