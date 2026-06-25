import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertTriangle, Database } from 'lucide-react';
import { getOfflineQueue, syncOfflineQueue, OfflineItem } from '../offlineQueue';

interface OfflineIndicatorProps {
  token: string | null;
  onSyncSuccess?: () => void; // Trigger callback to refresh lists (e.g. fetchData)
}

export default function OfflineIndicator({ token, onSyncSuccess }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [queue, setQueue] = useState<OfflineItem[]>(getOfflineQueue());
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<{
    successCount: number;
    failCount: number;
    errors: string[];
  } | null>(null);

  // Connection listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-trigger sync when returning online
      triggerSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Monitor custom queue update event
    const handleQueueUpdate = () => {
      setQueue(getOfflineQueue());
    };
    window.addEventListener('offlineQueueUpdated', handleQueueUpdate);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offlineQueueUpdated', handleQueueUpdate);
    };
  }, [token]);

  const triggerSync = async () => {
    const currentQueue = getOfflineQueue();
    if (currentQueue.length === 0 || syncing) return;

    setSyncing(true);
    setSyncResult(null);

    try {
      const result = await syncOfflineQueue(token);
      setSyncResult(result);
      if (result.successCount > 0 && onSyncSuccess) {
        onSyncSuccess();
      }
    } catch (err) {
      console.error('Offline sync error', err);
    } finally {
      setSyncing(false);
      // Clear sync result notification after 6 seconds
      setTimeout(() => {
        setSyncResult(null);
      }, 6000);
    }
  };

  const hasQueuedItems = queue.length > 0;

  return (
    <div className="space-y-2 mb-4">
      {/* Visual Bar Indicator */}
      <div className={`p-3 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row items-center justify-between gap-3 ${
        isOnline 
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-2xs' 
          : 'bg-amber-50 border-amber-200 text-amber-900 shadow-xs'
      }`}>
        <div className="flex items-center gap-2.5">
          {isOnline ? (
            <div className="relative">
              <span className="absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
              <div className="relative h-3 w-3 rounded-full bg-emerald-500"></div>
            </div>
          ) : (
            <div className="relative">
              <span className="absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75 animate-ping"></span>
              <div className="relative h-3 w-3 rounded-full bg-red-500"></div>
            </div>
          )}
          
          <div className="text-left">
            <span className="font-bold text-xs flex items-center gap-1">
              {isOnline ? <Wifi className="h-4 w-4 text-emerald-600" /> : <WifiOff className="h-4 w-4 text-amber-600" />}
              {isOnline ? 'Network Connection Stable (Online)' : 'Network Connection Severed (Offline Mode)'}
            </span>
            <p className="text-[10px] text-stone-500 mt-0.5 font-medium">
              {isOnline 
                ? 'Your changes are being synchronized with the cloud database in real-time.' 
                : 'Direct database connections paused. You can safely continue filing registrations below; they will queue locally.'}
            </p>
          </div>
        </div>

        {/* Sync Status / Offline Queue Count Button */}
        {hasQueuedItems && (
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-stone-900 text-white rounded-xl text-[10px] font-mono font-bold w-full sm:w-auto justify-center">
              <Database className="h-3 w-3 text-amber-400" />
              <span>{queue.length} Saved in Queue</span>
            </div>
            {isOnline && (
              <button
                type="button"
                onClick={triggerSync}
                disabled={syncing}
                className="py-1 px-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:bg-stone-300 text-white font-bold rounded-xl text-[10px] transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer select-none"
              >
                {syncing ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sync Success / Failure Notification */}
      {syncResult && (
        <div className={`p-4 rounded-2xl border text-xs space-y-1.5 transition-all animate-fade-in ${
          syncResult.failCount === 0 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
            : 'bg-amber-50 border-amber-300 text-amber-950'
        }`}>
          <div className="flex items-center gap-2">
            {syncResult.failCount === 0 ? (
              <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            )}
            <div>
              <p className="font-bold">
                {syncResult.failCount === 0 
                  ? `Offline Data Synchronized Successfully! (${syncResult.successCount} items)` 
                  : `Offline Sync partially succeeded (${syncResult.successCount} synced, ${syncResult.failCount} failed)`}
              </p>
              <p className="text-[10px] text-stone-500 font-medium">
                Field registrations logged offline have been pushed to the central Irosin Municipal database.
              </p>
            </div>
          </div>

          {syncResult.errors.length > 0 && (
            <div className="bg-white/80 border border-stone-200 p-2 rounded-lg text-[10px] font-mono text-amber-900 mt-2 space-y-1">
              <p className="font-bold border-b border-stone-100 pb-1">Sync conflicts or errors:</p>
              {syncResult.errors.map((err, idx) => (
                <p key={idx} className="leading-relaxed">• {err}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Offline Queue Items list (subtle, collapsed, expandable if needed) */}
      {hasQueuedItems && (
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 text-stone-700">
          <span className="font-bold text-[10px] text-stone-500 uppercase tracking-wider block mb-1">Items waiting for connection:</span>
          <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
            {queue.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-white border border-stone-100 rounded-lg px-2.5 py-1 text-[10px] font-medium">
                <span className="truncate max-w-[200px] text-stone-800 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  {item.label}
                </span>
                <span className="text-[9px] text-stone-400 font-mono">
                  {item.type === 'pet_registration' ? 'Pet Registration' : 'Incident Sighting'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
