import React, { useState, useEffect, useRef } from 'react';
import { Bell, ShieldAlert, CheckCircle, Info, Calendar, MapPin, Eye } from 'lucide-react';
import { User, Pet, AnonymousReport } from '../types';

interface NotificationCenterProps {
  user: User;
  token: string | null;
}

interface NotificationItem {
  id: string;
  type: 'pending_pet' | 'unverified_report';
  title: string;
  description: string;
  timestamp: string;
  barangay: string;
  meta: any;
}

export default function NotificationCenter({ user, token }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Poll only for admins and operators
  const isAuthorized = user && (user.role === 'admin' || user.role === 'operator');

  const fetchNotifications = async () => {
    if (!token || !isAuthorized) return;

    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Fetch pets and anonymous reports
      const [petsRes, reportsRes] = await Promise.all([
        fetch('/api/pets', { headers }),
        fetch('/api/anonymous-reports', { headers })
      ]);

      if (petsRes.ok && reportsRes.ok) {
        const pets: Pet[] = await petsRes.json();
        const reports: AnonymousReport[] = await reportsRes.json();

        const items: NotificationItem[] = [];

        // Filter pending pets
        const pendingPets = pets.filter(p => {
          const isPending = p.verificationStatus === 'Pending';
          if (!isPending) return false;
          if (user.role === 'operator') {
            return p.barangay === user.barangay;
          }
          return true; // Admin sees all
        });

        pendingPets.forEach(p => {
          items.push({
            id: `pet-${p.id}`,
            type: 'pending_pet',
            title: 'Pending Registration Verification',
            description: `New registration: "${p.name}" (${p.breed || 'Unknown Breed'}) requires field certification.`,
            timestamp: p.registeredAt || new Date().toISOString(),
            barangay: p.barangay,
            meta: p
          });
        });

        // Filter unverified reports (not yet reviewed)
        const unreviewedReports = reports.filter(r => {
          const isPending = r.status === 'Pending';
          if (!isPending) return false;
          if (user.role === 'operator') {
            return r.barangay === user.barangay;
          }
          return true; // Admin sees all
        });

        unreviewedReports.forEach(r => {
          items.push({
            id: `report-${r.id}`,
            type: 'unverified_report',
            title: 'Unverified Stray Sighting',
            description: `A roaming ${r.classification.toLowerCase()} was reported. Needs community verification.`,
            timestamp: r.reportedAt || new Date().toISOString(),
            barangay: r.barangay,
            meta: r
          });
        });

        // Sort items by timestamp (newest first)
        items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        setNotifications(items);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    if (!isAuthorized) return;

    // Fetch immediately
    fetchNotifications();

    // Poll every 10 seconds for real-time monitoring
    const interval = setInterval(fetchNotifications, 10000);

    return () => clearInterval(interval);
  }, [token, user]);

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthorized) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-xl transition-all relative cursor-pointer select-none ${
          isOpen ? 'bg-amber-100 text-amber-800' : 'text-stone-400 hover:text-amber-500 hover:bg-stone-50'
        }`}
        title="System Tasks & Notifications Feed"
      >
        <Bell className={`h-5 w-5 ${notifications.length > 0 ? 'animate-bounce-slow' : ''}`} />
        
        {/* Count Badge */}
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white font-mono font-black text-[9px] h-5 w-5 rounded-full flex items-center justify-center border-2 border-white ring-1 ring-red-300 animate-pulse">
            {notifications.length}
          </span>
        )}
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-fade-in-down">
          {/* Header */}
          <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white p-4 flex items-center justify-between">
            <div>
              <h3 className="font-display font-black text-xs sm:text-xs uppercase tracking-wider text-amber-400">
                Operational Tasks Feed
              </h3>
              <p className="text-[10px] text-stone-300 font-semibold">
                {notifications.length === 0 ? 'No outstanding actions required' : `${notifications.length} unverified items require attention`}
              </p>
            </div>
            <span className="text-[9px] bg-white/10 text-stone-200 border border-white/20 px-2 py-0.5 rounded-md uppercase font-bold tracking-wider">
              {user.role} hq
            </span>
          </div>

          {/* List Section */}
          <div className="max-h-[320px] overflow-y-auto divide-y divide-stone-100">
            {notifications.length > 0 ? (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 hover:bg-amber-50/15 transition-colors flex items-start gap-3 text-left"
                >
                  <div className={`p-1.5 rounded-lg shrink-0 ${
                    item.type === 'pending_pet' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {item.type === 'pending_pet' ? <Calendar className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 flex-wrap mb-1">
                      <span className="font-bold text-stone-900 text-[11px] uppercase tracking-wide">
                        {item.title}
                      </span>
                      <span className="text-[9px] bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded-md font-black uppercase text-stone-600">
                        {item.barangay}
                      </span>
                    </div>
                    <p className="text-stone-600 text-[11px] leading-relaxed font-semibold">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[9px] text-stone-400 font-bold font-mono">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[9px] text-amber-700 font-black flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" />
                        Brgy. {item.barangay} Action Point
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-stone-400 text-xs italic flex flex-col items-center justify-center gap-2">
                <CheckCircle className="h-8 w-8 text-emerald-500 mb-1" />
                <span>Excellent! All municipal tasks in Brgy. {user.role === 'operator' ? user.barangay : 'Irosin'} are certified active.</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-stone-50 p-2.5 text-center border-t border-stone-150">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">
              Auto-syncs every 10s • Sorsogon Public Health
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
