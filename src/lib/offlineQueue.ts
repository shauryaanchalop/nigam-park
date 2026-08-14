/**
 * Offline-first queue backed by IndexedDB.
 * Attendant POS actions are queued locally when the network is unavailable
 * and replayed automatically once connectivity returns.
 */

export type QueuedActionType =
  | 'transaction'
  | 'sensor_log'
  | 'occupancy_update'
  | 'checkout';

export interface QueuedAction<T = any> {
  id: string;
  type: QueuedActionType;
  payload: T;
  label: string;
  createdAt: number;
  attempts: number;
  lastError?: string;
}

const DB_NAME = 'nigam-park-offline';
const DB_VERSION = 1;
const STORE = 'pos-queue';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest
): Promise<T> {
  const db = await openDB();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = fn(tx.objectStore(STORE));
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

const listeners = new Set<() => void>();

export function subscribeToQueue(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((l) => l());
}

export async function enqueueAction<T>(
  type: QueuedActionType,
  payload: T,
  label: string
): Promise<QueuedAction<T>> {
  const action: QueuedAction<T> = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    payload,
    label,
    createdAt: Date.now(),
    attempts: 0,
  };
  await withStore('readwrite', (store) => store.put(action));
  notify();
  return action;
}

export async function getQueuedActions(): Promise<QueuedAction[]> {
  try {
    const all = await withStore<QueuedAction[]>('readonly', (store) => store.getAll());
    return (all ?? []).sort((a, b) => a.createdAt - b.createdAt);
  } catch {
    return [];
  }
}

export async function removeAction(id: string) {
  await withStore('readwrite', (store) => store.delete(id));
  notify();
}

export async function markActionFailed(action: QueuedAction, message: string) {
  await withStore('readwrite', (store) =>
    store.put({ ...action, attempts: action.attempts + 1, lastError: message })
  );
  notify();
}

export async function clearQueue() {
  await withStore('readwrite', (store) => store.clear());
  notify();
}
