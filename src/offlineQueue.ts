export interface OfflineItem {
  id: string;
  type: 'pet_registration' | 'anonymous_sighting';
  data: any;
  timestamp: string;
  label: string; // Readable label to show in UI
}

const STORAGE_KEY = 'irosin_offline_queue';

export function getOfflineQueue(): OfflineItem[] {
  try {
    const queueStr = localStorage.getItem(STORAGE_KEY);
    return queueStr ? JSON.parse(queueStr) : [];
  } catch (err) {
    console.error('Failed to parse offline queue', err);
    return [];
  }
}

export function saveOfflineQueue(queue: OfflineItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Failed to save offline queue', err);
  }
}

export function addToOfflineQueue(
  type: 'pet_registration' | 'anonymous_sighting',
  data: any,
  label: string
): OfflineItem {
  const queue = getOfflineQueue();
  const newItem: OfflineItem = {
    id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    data,
    timestamp: new Date().toISOString(),
    label
  };
  
  queue.push(newItem);
  saveOfflineQueue(queue);
  
  // Dispatch custom event to notify React components about queue update
  window.dispatchEvent(new Event('offlineQueueUpdated'));
  return newItem;
}

export function removeFromOfflineQueue(id: string): void {
  const queue = getOfflineQueue();
  const filtered = queue.filter(item => item.id !== id);
  saveOfflineQueue(filtered);
  window.dispatchEvent(new Event('offlineQueueUpdated'));
}

export interface SyncResult {
  successCount: number;
  failCount: number;
  errors: string[];
}

/**
 * Synchronize all queued offline items with the server
 */
export async function syncOfflineQueue(token: string | null): Promise<SyncResult> {
  const queue = getOfflineQueue();
  const result: SyncResult = {
    successCount: 0,
    failCount: 0,
    errors: []
  };

  if (queue.length === 0) {
    return result;
  }

  // Group pet registrations to sync them in a single batch
  const petRegistrations = queue.filter(item => item.type === 'pet_registration');
  const otherItems = queue.filter(item => item.type !== 'pet_registration');

  // 1. Sync Pet Registrations in Bulk
  if (petRegistrations.length > 0) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/pets/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify({ pets: petRegistrations.map(item => item.data) })
      });

      if (response.ok) {
        const data = await response.json();
        const count = data.count || petRegistrations.length;
        result.successCount += count;
        
        // Remove successfully batch-synced items from queue
        petRegistrations.forEach(item => {
          removeFromOfflineQueue(item.id);
        });

        if (data.errors && data.errors.length > 0) {
          result.errors.push(...data.errors);
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.error || `HTTP ${response.status}`;
        throw new Error(errMsg);
      }
    } catch (err: any) {
      console.error('Batch pet registration sync failed:', err);
      result.failCount += petRegistrations.length;
      result.errors.push(`Bulk Pet Registration Sync: ${err.message || 'Network error'}`);
    }
  }

  // 2. Sync Other Items (e.g. anonymous_sighting) sequentially
  for (const item of otherItems) {
    try {
      let endpoint = '';
      let headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      if (item.type === 'anonymous_sighting') {
        endpoint = '/api/anonymous-reports';
      } else {
        continue;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(item.data)
      });

      if (response.ok) {
        result.successCount += 1;
        removeFromOfflineQueue(item.id);
      } else {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.error || `HTTP ${response.status}`;
        throw new Error(errMsg);
      }
    } catch (err: any) {
      console.error(`Offline sync failed for item ${item.id}:`, err);
      result.failCount += 1;
      result.errors.push(`${item.label}: ${err.message || 'Network error'}`);
    }
  }

  // Dispatch final updated event
  window.dispatchEvent(new Event('offlineQueueUpdated'));
  return result;
}
