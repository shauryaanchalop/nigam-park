import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAlerts } from '@/hooks/useAlerts';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export function VigilanceFeed() {
  const { data: alerts, isLoading, resolveAlert } = useAlerts();

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const unresolvedAlerts = alerts?.filter(a => !a.is_resolved) ?? [];

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-foreground">Vigilance Feed</h3>
        </div>
        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
          {unresolvedAlerts.length} Active
        </Badge>
      </div>
      
      <ScrollArea className="h-[400px] custom-scrollbar">
        <div className="p-2 space-y-2">
          {alerts?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-success" />
              <p>No anomalies detected</p>
            </div>
          ) : (
            alerts?.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  'p-3 rounded-lg border transition-all',
                  alert.is_resolved 
                    ? 'bg-muted/50 border-border opacity-60' 
                    : alert.alert_type === 'fraud'
                    ? 'bg-destructive/10 border-destructive/40 fraud-alert'
                    : 'bg-warning/10 border-warning/40'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {alert.alert_type === 'fraud' ? (
                        <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
                      )}
                      <Badge 
                        variant="outline" 
                        className={cn(
                          'text-xs',
                          alert.severity === 'critical' && 'border-destructive text-destructive',
                          alert.severity === 'high' && 'border-destructive/70 text-destructive/90',
                          alert.severity === 'medium' && 'border-warning text-warning',
                          alert.severity === 'low' && 'border-muted-foreground text-muted-foreground',
                        )}
                      >
                        {alert.severity.toUpperCase()}
                      </Badge>
                      {alert.is_resolved && (
                        <Badge variant="outline" className="text-xs border-success text-success">
                          RESOLVED
                        </Badge>
                      )}
                    </div>
                    <p className={cn(
                      'text-sm font-medium',
                      alert.alert_type === 'fraud' && !alert.is_resolved && 'text-destructive'
                    )}>
                      {alert.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}</span>
                      {alert.parking_lots && (
                        <>
                          <span>•</span>
                          <span>{alert.parking_lots.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {!alert.is_resolved && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-shrink-0"
                      onClick={() => resolveAlert.mutate(alert.id)}
                    >
                      Resolve
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
