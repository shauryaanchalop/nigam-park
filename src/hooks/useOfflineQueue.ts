import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  QueuedAction,
  QueuedActionType,
  enqueueAction,
  getQueuedActions,
  markActionFailed,
  removeAction,
  subscribeToQueue,
} from '@/lib/offlineQueue';

async function replay(action: QueuedAction) {
  switch (action.type) {
    case 'transaction': {
      const { data, error } = await supabase.functions.invoke('create-transaction', {
        body: action.payload,
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return;
    }
    case 'sensor_log': {
      const { error } = await supabase.from('sensor_logs').insert(action.payload);
      if (error) throw new Error(error.message);
      return;
    }
    case 'occupancy_update': {
      const { lotId, delta } = action.payload as { lotId: string; delta: number };
      const { data: lot, error: fetchError } = await supabase
        .from('parking_lots')
        .select('current_occupancy, capacity')
        .eq('id', lotId)
        .single();
      if (fetchError) throw new Error(fetchError.message);
      const next = Math.max(0, Math.min(lot.capacity, lot.current_occupancy + delta));
      const { error } = await supabase
        .from('parking_lots')
        .update({ current_occupancy: next })
        .eq('id', lotId);
      if (error) throw new Error(error.message);
      return;
    }
    case 'checkout': {
      const { transactionId, exitTime } = action.payload as {
        transactionId: string;
        exitTime: string;
      };
      const { error } = await supabase
        .from('transactions')
        .update({ exit_time: exitTime, status: 'completed' })
        .eq('id', transactionId);
      if (error) throw new Error(error.message);
      return;
    }
    default:
      throw new Error('Unknown queued action');
  }
}

export function useOfflineQueue() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [queue, setQueue] = useState<QueuedAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const refresh = useCallback(async () => {
    setQueue(await getQueuedActions());
  }, []);

  useEffect(() => {
    refresh();
    const unsubscribe = subscribeToQueue(refresh);
    return () => {
      unsubscribe();
    };
  }, [refresh]);

  const sync = useCallback(async () => {
    if (!navigator.onLine) return;
    const pending = await getQueuedActions();
    if (pending.length === 0) return;

    setIsSyncing(true);
    let synced = 0;
    let failed = 0;

    for (const action of pending) {
      try {
        await replay(action);
        await removeAction(action.id);
        synced += 1;
      } catch (err: any) {
        await markActionFailed(action, err?.message ?? 'Sync failed');
        failed += 1;
      }
    }

    setIsSyncing(false);
    await refresh();

    if (synced > 0) {
      toast.success(`${synced} offline ${synced === 1 ? 'action' : 'actions'} synced`);
    }
    if (failed > 0) {
      toast.error(`${failed} offline ${failed === 1 ? 'action' : 'actions'} could not sync`);
    }
  }, [refresh]);

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      toast.info('Back online — syncing queued transactions');
      sync();
    };
    const goOffline = () => {
      setIsOnline(false);
      toast.warning('Offline mode — transactions will be queued locally');
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    if (navigator.onLine) sync();

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [sync]);

  /** Runs the action immediately when online, otherwise queues it for later. */
  const runOrQueue = useCallback(
    async <T,>(
      type: QueuedActionType,
      payload: T,
      label: string,
      online: () => Promise<any>
    ): Promise<{ queued: boolean }> => {
      if (!navigator.onLine) {
        await enqueueAction(type, payload, label);
        return { queued: true };
      }
      try {
        await online();
        return { queued: false };
      } catch (err: any) {
        if (!navigator.onLine) {
          await enqueueAction(type, payload, label);
          return { queued: true };
        }
        throw err;
      }
    },
    []
  );

  return { isOnline, queue, isSyncing, sync, runOrQueue, refresh };
}
