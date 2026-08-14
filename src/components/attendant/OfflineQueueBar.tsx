import React from 'react';
import { CloudOff, Cloud, RefreshCw, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { QueuedAction } from '@/lib/offlineQueue';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface OfflineQueueBarProps {
  isOnline: boolean;
  isSyncing: boolean;
  queue: QueuedAction[];
  onSync: () => void;
}

export function OfflineQueueBar({ isOnline, isSyncing, queue, onSync }: OfflineQueueBarProps) {
  const pending = queue.length;
  if (isOnline && pending === 0) return null;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 text-sm',
        isOnline ? 'border-warning/40 bg-warning/10' : 'border-destructive/40 bg-destructive/10'
      )}
    >
      {isOnline ? (
        <Cloud className="w-4 h-4 text-warning shrink-0" />
      ) : (
        <CloudOff className="w-4 h-4 text-destructive shrink-0" />
      )}
      <div className="flex-1 min-w-[180px]">
        <p className="font-medium">
          {isOnline ? 'Syncing pending work' : 'Offline mode active'}
        </p>
        <p className="text-xs text-muted-foreground">
          {isOnline
            ? 'Queued transactions are being uploaded to the MCD server.'
            : 'Keep collecting — entries are stored on this device and upload automatically.'}
        </p>
      </div>

      <Badge variant={pending > 0 ? 'secondary' : 'outline'}>{pending} queued</Badge>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" disabled={pending === 0}>
            <ListChecks className="w-4 h-4 mr-1" /> View
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 max-h-80 overflow-y-auto">
          {pending === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing pending.</p>
          ) : (
            <ul className="space-y-3">
              {queue.map((action) => (
                <li key={action.id} className="text-sm">
                  <p className="font-medium">{action.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(action.createdAt), 'dd MMM, HH:mm:ss')}
                    {action.attempts > 0 && ` · ${action.attempts} failed attempt(s)`}
                  </p>
                  {action.lastError && (
                    <p className="text-xs text-destructive">{action.lastError}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </PopoverContent>
      </Popover>

      <Button size="sm" onClick={onSync} disabled={!isOnline || isSyncing || pending === 0}>
        <RefreshCw className={cn('w-4 h-4 mr-1', isSyncing && 'animate-spin')} />
        Sync now
      </Button>
    </div>
  );
}
