import React from 'react';
import { CheckCircle, ClipboardList, HeartPulse, PawPrint, ShieldCheck, Stethoscope } from 'lucide-react';

type GuidanceRole = 'admin' | 'operator' | 'bite_center' | 'vet' | 'vet_clinic' | 'owner';

interface OnboardingGuidanceProps {
  role: GuidanceRole;
}

const guidanceByRole: Record<GuidanceRole, { title: string; items: string[]; icon: React.ElementType }> = {
  admin: {
    title: 'Administrative workflow',
    icon: ShieldCheck,
    items: [
      'Review municipal registry coverage and barangay compliance trends.',
      'Approve verified records, monitor pound status, and export backups when needed.',
      'Track rabies, bite, and cross-barangay alerts from one control view.'
    ]
  },
  operator: {
    title: 'Barangay operator workflow',
    icon: ClipboardList,
    items: [
      'Validate pending local registrations before they enter the active registry.',
      'Review roaming or stray reports and coordinate cross-barangay alerts.',
      'Use sync controls after offline collection work to update municipal records.'
    ]
  },
  bite_center: {
    title: 'Bite center workflow',
    icon: HeartPulse,
    items: [
      'Log bite incidents with patient, location, and animal details.',
      'Update quarantine status as each case moves through observation.',
      'Link known pets where possible to support faster rabies follow-up.'
    ]
  },
  vet: {
    title: 'Veterinary clinic workflow',
    icon: Stethoscope,
    items: [
      'Scan collar QR tags or search registered pet IDs for medical records.',
      'Update vaccination expiry and surgical history after clinical service.',
      'Use official pet passports when validating owner-facing documentation.'
    ]
  },
  vet_clinic: {
    title: 'Veterinary clinic workflow',
    icon: Stethoscope,
    items: [
      'Scan collar QR tags or search registered pet IDs for medical records.',
      'Update vaccination expiry and surgical history after clinical service.',
      'Use official pet passports when validating owner-facing documentation.'
    ]
  },
  owner: {
    title: 'Owner and resident workflow',
    icon: PawPrint,
    items: [
      'Register owned pets with current identification and vaccination details.',
      'Report roaming animals with location, traits, and photos when available.',
      'Check adoption listings and keep personal pet records up to date.'
    ]
  }
};

export default function OnboardingGuidance({ role }: OnboardingGuidanceProps) {
  const guidance = guidanceByRole[role];
  const Icon = guidance.icon;

  return (
    <section className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 shadow-xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 border border-amber-100">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-sm font-black text-stone-900">{guidance.title}</h3>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {guidance.items.map((item) => (
              <div key={item} className="flex items-start gap-2 text-xs font-medium leading-relaxed text-stone-700">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
