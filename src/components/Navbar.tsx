import React from 'react';
import { LogOut, User as UserIcon, ShieldAlert, Award, Hospital, Heart, MapPin } from 'lucide-react';
import { User } from '../types';
import NotificationCenter from './NotificationCenter';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  token: string | null;
}

export default function Navbar({ user, onLogout, token }: NavbarProps) {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold bg-amber-600 text-white px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs">
            <Award className="h-3 w-3" />
            Municipal Admin
          </span>
        );
      case 'operator':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold bg-amber-500 text-white px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs">
            <MapPin className="h-3 w-3" />
            Barangay Operator
          </span>
        );
      case 'bite_center':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold bg-amber-700 text-white px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs">
            <ShieldAlert className="h-3 w-3" />
            Bite Center
          </span>
        );
      case 'vet_clinic':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs">
            <Hospital className="h-3 w-3" />
            Private Vet
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold bg-stone-500 text-white px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs">
            <Heart className="h-3 w-3" />
            Pet Owner
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand/Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-400 flex items-center justify-center font-display font-extrabold text-amber-950 text-xl shadow-md border-2 border-amber-300">
              IR
            </div>
            <div>
              <h1 className="font-display font-black text-sm sm:text-base leading-tight text-stone-900 tracking-tight">
                IROSIN PET REGISTRY
              </h1>
              <span className="text-[10px] text-stone-500 font-medium tracking-wide uppercase block">
                Sorsogon • Municipal Monitoring System
              </span>
            </div>
          </div>

          {/* User Info & Actions */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-stone-900 flex items-center justify-end gap-1">
                <UserIcon className="h-3.5 w-3.5 text-stone-400" />
                {user.name}
              </span>
              <span className="text-[10px] text-stone-500 font-semibold">
                {user.role === 'operator' && user.barangay ? `Brgy. ${user.barangay}` : user.role === 'owner' && user.barangay ? `Brgy. ${user.barangay}` : 'Irosin Municipal Office'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {getRoleBadge(user.role)}
              <NotificationCenter user={user} token={token} />
              <button
                onClick={onLogout}
                type="button"
                className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
