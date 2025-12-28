import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Shield, 
  Eye, 
  CheckCircle, 
  Clock,
  MapPin,
  Loader2 
} from 'lucide-react';
import { useFraudAlerts } from '@/hooks/useFraudAlerts';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const severityConfig = {
  CRITICAL: { 
    color: 'bg-red-500', 
    textColor: 'text-red-500',
    bgColor: 'bg-red-500/10',
    badge: 'destructive' as const 
  },
  HIGH: { 
    color: 'bg-orange-500', 
    textColor: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    badge: 'default' as const 
  },
  MEDIUM: { 
    color: 'bg-yellow-500', 
    textColor: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    badge: 'secondary' as const 
  },
  LOW: { 
    color: 'bg-blue-500', 
    textColor: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    badge: 'outline' as const 
  },
};

const statusConfig = {
  NEW: { icon: AlertTriangle, label: 'New', color: 'text-red-500' },
  INVESTIGATING: { icon: Eye, label: 'Investigating', color: 'text-yellow-500' },
  RESOLVED: { icon: CheckCircle, label: 'Resolved', color: 'text-green-500' },
};

export function FraudDetectionPanel() {
  const { alerts, isLoading, updateFraudStatus } = useFraudAlerts();

  const criticalCount = alerts?.filter(a => a.severity === 'CRITICAL').length || 0;
  const highCount = alerts?.filter(a => a.severity === 'HIGH').length || 0;
  const investigatingCount = alerts?.filter(a => a.status === 'INVESTIGATING').length || 0;

  const handleStatusUpdate = (id: string, status: 'NEW' | 'INVESTIGATING' | 'RESOLVED') => {
    updateFraudStatus.mutate({ id, status });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[400px]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Fraud Detection
          </CardTitle>
          <div className="flex gap-2">
            {criticalCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {criticalCount} Critical
              </Badge>
            )}
            {highCount > 0 && (
              <Badge variant="default">
                {highCount} High
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Active Alerts: {alerts?.length || 0}</span>
          <span>Under Investigation: {investigatingCount}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[350px] overflow-y-auto">
          {alerts?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No active fraud alerts</p>
              <p className="text-sm">All systems operating normally</p>
            </div>
          ) : (
            alerts?.map((alert) => {
              const severity = severityConfig[alert.severity];
              const status = statusConfig[alert.status];
              const StatusIcon = status.icon;

              return (
                <div
                  key={alert.id}
                  className={cn(
                    "p-4 rounded-lg border transition-all",
                    severity.bgColor,
                    alert.severity === 'CRITICAL' && "animate-pulse"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", severity.color)} />
                      <Badge variant={severity.badge}>{alert.severity}</Badge>
                      <div className={cn("flex items-center gap-1 text-sm", status.color)}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <p className="text-sm font-medium mb-1">{alert.description}</p>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                    <MapPin className="w-3 h-3" />
                    {alert.location}
                  </div>

                  <div className="flex gap-2">
                    {alert.status === 'NEW' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(alert.id, 'INVESTIGATING')}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Investigate
                      </Button>
                    )}
                    {alert.status === 'INVESTIGATING' && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleStatusUpdate(alert.id, 'RESOLVED')}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
