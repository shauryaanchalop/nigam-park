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
      <div className="p-4 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="h-full custom-scrollbar">
      <div className="p-3 space-y-2">
        {alerts?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-success" />
            <p className="text-sm">No anomalies detected</p>
            <p className="text-xs mt-1">System operating normally</p>
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
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                    {alert.alert_type === 'fraud' ? (
                      <XCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0" />
                    )}
                    <Badge 
                      variant="outline" 
                      className={cn(
                        'text-[10px] px-1.5 py-0',
                        alert.severity === 'critical' && 'border-destructive text-destructive',
                        alert.severity === 'high' && 'border-destructive/70 text-destructive/90',
                        alert.severity === 'medium' && 'border-warning text-warning',
                        alert.severity === 'low' && 'border-muted-foreground text-muted-foreground',
                      )}
                    >
                      {alert.severity.toUpperCase()}
                    </Badge>
                    {alert.is_resolved && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-success text-success">
                        RESOLVED
                      </Badge>
                    )}
                  </div>
                  <p className={cn(
                    'text-xs sm:text-sm font-medium line-clamp-2',
                    alert.alert_type === 'fraud' && !alert.is_resolved && 'text-destructive'
                  )}>
                    {alert.message}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5 text-[10px] sm:text-xs text-muted-foreground">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>{formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}</span>
                    {alert.parking_lots && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:inline truncate">{alert.parking_lots.name}</span>
                      </>
                    )}
                  </div>
                </div>
                {!alert.is_resolved && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0 h-7 text-xs px-2"
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
  );
}
