import React from 'react';
import { CheckCircle2, Clock, ShieldAlert, ArrowDown, User } from 'lucide-react';
import { StatusHistoryEntry } from '../types';

interface StatusHistoryTimelineProps {
  history?: StatusHistoryEntry[];
  currentStatus: 'Pending Action' | 'Under Quarantine' | 'Case Closed';
  loggedAt: string;
}

export default function StatusHistoryTimeline({
  history = [],
  currentStatus,
  loggedAt
}: StatusHistoryTimelineProps) {
  // If no history exists, generate default initial entry based on currentStatus and loggedAt
  const displayHistory = history.length > 0 ? history : [
    {
      status: 'Pending Action' as const,
      notes: 'Bite incident logged, awaiting formal clinical observation and evaluation.',
      updatedBy: 'Animal Bite Treatment Center',
      updatedAt: `${loggedAt}T12:00:00.000Z`
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending Action':
        return {
          bg: 'bg-red-50 text-red-800 border-red-200',
          dot: 'bg-red-500 ring-red-100',
          text: 'text-red-700'
        };
      case 'Under Quarantine':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500 ring-amber-100',
          text: 'text-amber-700'
        };
      case 'Case Closed':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500 ring-emerald-100',
          text: 'text-emerald-700'
        };
      default:
        return {
          bg: 'bg-stone-50 text-stone-800 border-stone-200',
          dot: 'bg-stone-500 ring-stone-100',
          text: 'text-stone-700'
        };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending Action':
        return <ShieldAlert className="h-4 w-4" />;
      case 'Under Quarantine':
        return <Clock className="h-4 w-4" />;
      case 'Case Closed':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-stone-50/50 border border-stone-200/60 rounded-2xl p-4 mt-3">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="w-1.5 h-3 bg-amber-500 rounded-xs"></span>
        <h5 className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
          Quarantine Pipeline Status History
        </h5>
      </div>

      <div className="relative pl-4 border-l-2 border-stone-200 space-y-5">
        {displayHistory.map((entry, idx) => {
          const colors = getStatusColor(entry.status);
          const isLatest = idx === displayHistory.length - 1;

          return (
            <div key={idx} className="relative group">
              {/* Timeline dot */}
              <div className={`absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full ring-4 ${colors.dot} ${isLatest ? 'animate-pulse' : ''}`} />

              <div className="space-y-1">
                {/* Header */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${colors.bg}`}>
                    {getStatusIcon(entry.status)}
                    {entry.status}
                  </span>
                  <span className="text-[10px] text-stone-400 font-semibold">
                    {formatDate(entry.updatedAt)}
                  </span>
                </div>

                {/* Notes */}
                <p className="text-stone-600 text-xs font-medium leading-relaxed bg-white p-2 rounded-xl border border-stone-150 shadow-2xs">
                  {entry.notes}
                </p>

                {/* Operator tag */}
                <div className="flex items-center gap-1 text-[9px] text-stone-400 font-bold px-1">
                  <User className="h-3 w-3 text-stone-400" />
                  <span>Logged by: {entry.updatedBy}</span>
                </div>
              </div>

              {/* Connecting line arrow */}
              {!isLatest && (
                <div className="flex justify-center w-full my-1.5 text-stone-300">
                  <ArrowDown className="h-3 w-3 text-stone-300" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
