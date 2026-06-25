import React, { useState, useEffect } from 'react';
import { Hospital, Check, HelpCircle, RefreshCw, QrCode, ClipboardList, CheckCircle, Search, Calendar, Heart, ShieldAlert, Dog, Cat } from 'lucide-react';
import { Pet } from '../types';
import QRScanner from './QRScanner';
import MedicalPassportButton from './MedicalPassportButton';
import OnboardingGuidance from './OnboardingGuidance';

interface VetDashboardProps {
  token: string;
}

export default function VetDashboard({ token }: VetDashboardProps) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [scannedPet, setScannedPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Medical forms
  const [vaccineDate, setVaccineDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [vaccineStatus, setVaccineStatus] = useState<'Active' | 'Expired'>('Active');

  const [surgeryDate, setSurgeryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [surgeryStatus, setSurgeryStatus] = useState<'Spayed/Neutered' | 'Intact'>('Spayed/Neutered');

  const loadPets = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const response = await fetch('/api/pets', { headers });
      if (!response.ok) {
        throw new Error('Failed to load municipal pets list');
      }
      const data = await response.json();
      setPets(data);

      // If we are currently showing a scanned pet, refresh its details from the list!
      if (scannedPet) {
        const fresh = data.find((p: any) => p.id === scannedPet.id);
        if (fresh) setScannedPet(fresh);
      }
    } catch (err: any) {
      setError(err.message || 'Error syncing database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPets();
  }, [token]);

  const handleScanSuccess = (petId: string) => {
    setIsScanning(false);
    setError('');
    const pet = pets.find(p => p.id === petId);
    if (!pet) {
      setError(`QR Code decoded as ID "${petId}" but no matching registered animal found in the Irosin Municipal Registry database. Please verify spelling.`);
      setScannedPet(null);
      return;
    }
    setScannedPet(pet);
  };

  const handleUpdateVaccination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedPet) return;

    setError('');
    setSuccessMsg('');
    try {
      const response = await fetch(`/api/pets/${scannedPet.id}/vaccination`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: vaccineDate,
          status: vaccineStatus
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit rabies vaccination status');
      }

      const updated = await response.json();
      setScannedPet(updated);
      setSuccessMsg('Rabies vaccination history successfully updated and synced to municipal databases!');
      loadPets();
    } catch (err: any) {
      setError(err.message || 'Error updating record');
    }
  };

  const handleUpdateSurgical = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedPet) return;

    setError('');
    setSuccessMsg('');
    try {
      const response = await fetch(`/api/pets/${scannedPet.id}/surgical`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: surgeryDate,
          status: surgeryStatus
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update surgical database records');
      }

      const updated = await response.json();
      setScannedPet(updated);
      setSuccessMsg('Surgical details (Spay/Neuter status) recorded successfully!');
      loadPets();
    } catch (err: any) {
      setError(err.message || 'Error updating surgery records');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <RefreshCw className="h-10 w-10 text-amber-500 animate-spin mb-2" />
        <p className="text-sm text-stone-500 font-medium">Assembling medical directories, please wait...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Clinic Welcome header */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md">
            Clinical Wellness Gateway
          </span>
          <h2 className="font-display font-black text-2xl text-stone-900 mt-1 flex items-center gap-2">
            <Hospital className="text-amber-500 h-7 w-7" />
            Licensed Veterinary Clinic & Surgery Logs
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Authorized to scan collar tags, pull official immunization dossiers, toggle expired rabies states, and log spay/neuter operations.
          </p>
        </div>

        <button
          onClick={loadPets}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Sync Master Database
        </button>
      </div>

      {/* Onboarding Guidance Tooltip Container */}
      <OnboardingGuidance role="vet" />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-950 text-xs flex gap-2 items-center">
          <ShieldAlert className="h-5 w-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 text-xs flex gap-2 items-center">
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* QR scanner trigger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4 lg:col-span-1">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
            <h3 className="font-display font-bold text-stone-900 text-sm mb-2">Scan Collar QR Tag</h3>
            <p className="text-xs text-stone-500 mb-4">
              Place the pet's collar tag under the scanner camera or search their database ID.
            </p>

            {isScanning ? (
              <QRScanner
                onScanSuccess={handleScanSuccess}
                onClose={() => setIsScanning(false)}
                availablePetIds={pets.filter(p => p.verificationStatus === 'Active').map(p => p.id)}
              />
            ) : (
              <button
                onClick={() => { setSuccessMsg(''); setIsScanning(true); }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer"
              >
                <QrCode className="h-4 w-4" />
                Open QR Scanner Portal
              </button>
            )}
          </div>

          {/* Quick Pet manual list selector */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
            <h3 className="font-display font-bold text-stone-900 text-sm mb-3">Lookup Patient Manual Ledger</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {pets.map(pet => (
                <button
                  key={pet.id}
                  onClick={() => { setSuccessMsg(''); handleScanSuccess(pet.id); }}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs flex items-center justify-between ${
                    scannedPet?.id === pet.id
                      ? 'bg-amber-50 border-amber-300 text-amber-950'
                      : 'bg-stone-50 border-stone-100 hover:bg-stone-100 text-stone-700'
                  }`}
                >
                  <div>
                    <p className="font-bold">{pet.name}</p>
                    <p className="text-[10px] text-stone-400">Owner: {pet.ownerName} • Brgy. {pet.barangay}</p>
                  </div>
                  <span className="font-mono text-[10px] bg-stone-200 px-1.5 py-0.5 rounded-md text-stone-600">
                    {pet.id}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected pet health card & updating interface */}
        <div className="lg:col-span-2 space-y-4">
          {scannedPet ? (
            <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-6">
              
              {/* Pet Profile Overview */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-stone-100 pb-5">
                <div className="flex gap-4">
                  <div className="relative h-16 w-16 shrink-0 rounded-2xl overflow-hidden border border-stone-200 bg-stone-50">
                    {scannedPet.photoUrl ? (
                      <img
                        src={scannedPet.photoUrl}
                        alt={scannedPet.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${
                        scannedPet.classification === 'Dog' ? 'bg-amber-100 text-amber-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {scannedPet.classification === 'Dog' ? <Dog className="h-8 w-8" /> : <Cat className="h-8 w-8" />}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-black text-xl text-stone-900">{scannedPet.name}</h3>
                      <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                        {scannedPet.id}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 font-semibold mt-0.5">
                      {scannedPet.breed} • {scannedPet.color} • {scannedPet.gender}
                    </p>
                    <p className="text-xs text-stone-500">
                      Located: Brgy. {scannedPet.barangay} • Confinement: {scannedPet.confinementSetup}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right text-xs space-y-2">
                  <div>
                    <p className="font-bold text-stone-800">Owner: {scannedPet.ownerName}</p>
                    <p className="text-stone-500">Phone: {scannedPet.ownerPhone}</p>
                  </div>
                  <div className="pt-1">
                    <MedicalPassportButton pet={scannedPet} variant="compact" />
                  </div>
                </div>
              </div>

              {/* History Dossier counters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Vaccination History Box */}
                <div className="border border-stone-100 bg-stone-50/50 p-4 rounded-2xl space-y-2">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Current Immunization Dossier
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${scannedPet.vaccinatedStatus === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    <span className="font-bold text-stone-900 text-sm">
                      Rabies Vaccine: {scannedPet.vaccinatedStatus}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    Last Logged Inoculation: {scannedPet.lastVaccinatedDate || 'Never Recorded'}
                  </p>
                </div>

                {/* Surgical status box */}
                <div className="border border-stone-100 bg-stone-50/50 p-4 rounded-2xl space-y-2">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Surgical / Sterilization Dossier
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    <span className="font-bold text-stone-900 text-sm">
                      Status: {scannedPet.spayNeuterStatus}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    Operation Date: {scannedPet.lastSurgicalDate || 'N/A / Intact'}
                  </p>
                </div>
              </div>

              {/* Action Update forms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-stone-100 pt-5">
                {/* Update Vaccine */}
                <form onSubmit={handleUpdateVaccination} className="space-y-3">
                  <h4 className="font-display font-bold text-stone-900 text-sm flex items-center gap-1.5">
                    <Calendar className="h-4.5 w-4.5 text-amber-500" />
                    Record Inoculation / Booster
                  </h4>
                  
                  <div>
                    <label className="text-[11px] font-semibold text-stone-600 block mb-1">Vaccination Date</label>
                    <input
                      type="date"
                      required
                      value={vaccineDate}
                      onChange={(e) => setVaccineDate(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-stone-600 block mb-1">Vaccination Outcome Status</label>
                    <select
                      value={vaccineStatus}
                      onChange={(e) => setVaccineStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700"
                    >
                      <option value="Active">Active (Protected for 1 Year)</option>
                      <option value="Expired">Expired / Booster Needed</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Inoculate & Update Dossier
                  </button>
                </form>

                {/* Update Surgery */}
                <form onSubmit={handleUpdateSurgical} className="space-y-3">
                  <h4 className="font-display font-bold text-stone-900 text-sm flex items-center gap-1.5">
                    <ClipboardList className="h-4.5 w-4.5 text-amber-500" />
                    Record Surgical Operation
                  </h4>

                  <div>
                    <label className="text-[11px] font-semibold text-stone-600 block mb-1">Surgery Date</label>
                    <input
                      type="date"
                      required
                      value={surgeryDate}
                      onChange={(e) => setSurgeryDate(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-stone-600 block mb-1">Surgical Classification</label>
                    <select
                      value={surgeryStatus}
                      onChange={(e) => setSurgeryStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700"
                    >
                      <option value="Spayed/Neutered">Spayed / Neutered (Sterilized)</option>
                      <option value="Intact">Intact / Not Sterilized</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Log Surgical Record
                  </button>
                </form>
              </div>

            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-stone-200 rounded-3xl p-12 text-center text-stone-400 flex flex-col items-center justify-center">
              <ClipboardList className="h-12 w-12 text-stone-300 mb-2" />
              <p className="font-display font-bold text-stone-700 text-sm">No Patient Selected</p>
              <p className="text-xs text-stone-400 mt-1 max-w-sm">
                Please scan a collar tag QR code or click an active patient from the manual directory ledger to review and edit records.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
