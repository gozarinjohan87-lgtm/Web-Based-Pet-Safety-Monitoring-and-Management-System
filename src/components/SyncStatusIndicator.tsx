import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, CloudLightning, Database, RefreshCw, CheckCircle, ShieldAlert } from 'lucide-react';
import { getOfflineQueue, syncOfflineQueue, OfflineItem } from '../offlineQueue';

interface SyncStatusIndicatorProps {
  token: string | null;
  onSyncComplete?: () => void;
}

export default function SyncStatusIndicator({ token, onSyncComplete }: SyncStatusIndicatorProps) {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [queue, setQueue] = useState<OfflineItem[]>(getOfflineQueue());
  const [swState, setSwState] = useState<string>('Detecting');
  const [syncing, setSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  useEffect(() => {
    // 1. Monitor network connection state
    const handleOnline = () => {
      setIsOnline(true);
      autoSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 2. Monitor custom offline queue updates
    const handleQueueUpdate = () => {
      setQueue(getOfflineQueue());
    };
    window.addEventListener('offlineQueueUpdated', handleQueueUpdate);

    // 3. Monitor Service Worker registrations
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          setSwState('Active (Offline Capable)');
        } else {
          setSwState('Registering');
        }
      }).catch(() => {
        setSwState('Unavailable');
      });
    } else {
      setSwState('Not Supported');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offlineQueueUpdated', handleQueueUpdate);
    };
  }, [token]);

  const autoSync = async () => {
    const currentQueue = getOfflineQueue();
    if (currentQueue.length > 0 && navigator.onLine && !syncing) {
      handleForceSync();
    }
  };

  const handleForceSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const result = await syncOfflineQueue(token);
      if (result.successCount > 0) {
        setLastSynced(new Date().toLocaleTimeString());
        if (onSyncComplete) {
          onSyncComplete();
        }
      }
    } catch (err) {
      console.error('Manual queue sync failed', err);
    } finally {
      setSyncing(false);
    }
  };

  const pendingRegistrations = queue.filter(item => item.type === 'pet_registration');
  const hasPending = queue.length > 0;

  return (
    <div className="space-y-3 mb-6">
      {/* Pending Items Visual Alert Banner */}
      {hasPending && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 shadow-sm animate-pulse-slow">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex gap-3 items-start">
              <div className="p-2.5 bg-amber-500 text-white rounded-2xl shrink-0 shadow-xs">
                <Database className="h-5 w-5 animate-bounce" />
              </div>
              <div>
                <h4 className="font-display font-black text-amber-950 text-sm">
                  Pending Offline Records Detected ({queue.length} items)
                </h4>
                <p className="text-xs text-amber-900/80 mt-1">
                  You logged {pendingRegistrations.length} registrations offline. These are held in the browser's persistent queue and require internet synchronization to merge with the central municipal databases.
                </p>
                <div className="flex gap-2.5 mt-2 flex-wrap items-center">
                  <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                    Service Worker: {swState}
                  </span>
                  <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider flex items-center gap-1">
                    {isOnline ? (
                      <>
                        <Wifi className="h-3 w-3 text-emerald-600" /> Connection: Active
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-3 w-3 text-amber-600" /> Connection: Severed
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {isOnline && (
              <button
                onClick={handleForceSync}
                disabled={syncing}
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:bg-stone-300 text-white text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer shrink-0 select-none"
              >
                {syncing ? (
                  <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                ) : (
                  <CloudLightning className="h-4.5 w-4.5" />
                )}
                <span>{syncing ? 'Pushing to Server...' : 'Synchronize Now'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Service Worker State Monitoring bar */}
      <div className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-2.5 flex items-center justify-between text-[11px] font-semibold text-stone-500">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-ping' : 'bg-red-500'}`}></span>
          <span className="text-stone-700 font-bold">
            System Connectivity: {isOnline ? 'Online' : 'Offline Mode (Local Storage Engaged)'}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block">Service Worker State: <strong className="text-amber-800">{swState}</strong></span>
          {lastSynced && (
            <span className="text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md font-bold border border-emerald-100">
              <CheckCircle className="h-3 w-3" /> Last Synced: {lastSynced}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
