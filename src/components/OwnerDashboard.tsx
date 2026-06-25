import React, { useState, useEffect } from 'react';
import { Compass, QrCode, ClipboardList, CheckCircle, RefreshCw, AlertTriangle, PlusCircle, User, Award, ExternalLink, Heart, ShieldAlert, Dog, Cat, MapPin, Eye, Camera } from 'lucide-react';
import { Pet, AnonymousReport, IROSIN_BARANGAYS } from '../types';
import QRCodeGenerator from './QRCodeGenerator';
import { CameraCapture } from './CameraCapture';
import SyncStatusIndicator from './SyncStatusIndicator';
import { addToOfflineQueue } from '../offlineQueue';
import MedicalPassportButton from './MedicalPassportButton';
import OnboardingGuidance from './OnboardingGuidance';

interface OwnerDashboardProps {
  token: string;
  user: any;
}

export default function OwnerDashboard({ token, user }: OwnerDashboardProps) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [allPets, setAllPets] = useState<Pet[]>([]); // For the public gallery
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'my_pets' | 'register' | 'adoption' | 'gallery' | 'report'>('my_pets');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Sighting/Incident Form
  const [anonForm, setAnonForm] = useState({
    barangay: 'San Julian',
    classification: 'Dog' as 'Dog' | 'Cat',
    color: '',
    confinementSetup: 'Unleashed/Roaming' as 'Leashed' | 'Unleashed/Roaming',
    additionalTraits: '',
    photoUrl: ''
  });

  // Pet Registration Form
  const [regForm, setRegForm] = useState({
    name: '',
    classification: 'Dog' as 'Dog' | 'Cat',
    breed: '',
    gender: 'Male' as 'Male' | 'Female',
    color: '',
    confinementSetup: 'Leashed' as 'Leashed' | 'Unleashed/Roaming',
    photoUrl: ''
  });

  const presetPhotos = {
    Dog: [
      { name: 'Brown Aspin', url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=300' },
      { name: 'Golden Retriever', url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=300' },
      { name: 'Cute Puppy', url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=300' }
    ],
    Cat: [
      { name: 'Ginger Cat', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=300' },
      { name: 'Fluffy White Cat', url: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&q=80&w=300' },
      { name: 'Tabby Cat', url: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&q=80&w=300' }
    ]
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, callback: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image is too large. Please select an image under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const loadOwnerData = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [petsRes, allPetsRes] = await Promise.all([
        fetch('/api/pets', { headers }),
        // Publicly viewable animals
        fetch('/api/pets')
      ]);

      if (!petsRes.ok || !allPetsRes.ok) {
        throw new Error('Failed to retrieve community lists');
      }

      const petsData = await petsRes.json();
      const allPetsData = await allPetsRes.json();

      // Filter pets belonging to this user
      setPets(petsData.filter((p: any) => p.ownerId === user.id));
      setAllPets(allPetsData);
    } catch (err: any) {
      setError(err.message || 'Error sync with database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOwnerData();
  }, [token, user.id]);

  const handleRegisterPet = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setError('');

    const registrationData = {
      ...regForm,
      ownerId: user.id,
      ownerName: user.name,
      ownerPhone: user.phone || '0917-000-0000',
      barangay: user.barangay || 'San Julian'
    };

    if (!navigator.onLine) {
      try {
        addToOfflineQueue(
          'pet_registration',
          registrationData,
          `Self Reg: ${regForm.name} (Resident: ${user.name})`
        );

        setRegForm({
          name: '',
          classification: 'Dog',
          breed: '',
          gender: 'Male',
          color: '',
          confinementSetup: 'Leashed',
          photoUrl: ''
        });

        setSuccessMsg('Offline Mode Active: Your pet self-registration has been saved to the Offline Queue. It will automatically sync once your internet connection is re-established.');
        setActiveTab('my_pets');
      } catch (err: any) {
        setError('Failed to queue offline registration: ' + err.message);
      }
      return;
    }

    try {
      const response = await fetch('/api/pets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(registrationData)
      });

      if (!response.ok) {
        throw new Error('Could not submit pet registration');
      }

      setRegForm({
        name: '',
        classification: 'Dog',
        breed: '',
        gender: 'Male',
        color: '',
        confinementSetup: 'Leashed',
        photoUrl: ''
      });
      setSuccessMsg('Self-registration logged successfully! Your pet is currently "Pending Verification" until a Barangay Operator or BHW manual verifies it.');
      setActiveTab('my_pets');
      loadOwnerData();
    } catch (err: any) {
      setError(err.message || 'Error creating pet registration');
    }
  };

  const handleAnonReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');

    if (!navigator.onLine) {
      try {
        addToOfflineQueue(
          'anonymous_sighting',
          anonForm,
          `Stray Report: ${anonForm.classification} in ${anonForm.barangay}`
        );

        setAnonForm({
          barangay: 'San Julian',
          classification: 'Dog',
          color: '',
          confinementSetup: 'Unleashed/Roaming',
          additionalTraits: '',
          photoUrl: ''
        });

        setSuccessMsg('Offline Mode Active: Your anonymous stray sighting report has been saved to the Offline Queue. It will automatically sync once your connection is restored.');
        setActiveTab('my_pets');
      } catch (err: any) {
        alert('Failed to queue offline sighting report: ' + err.message);
      }
      return;
    }

    try {
      const response = await fetch('/api/anonymous-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(anonForm)
      });

      if (!response.ok) {
        throw new Error('Failed to submit loose animal incident');
      }

      setAnonForm({
        barangay: 'San Julian',
        classification: 'Dog',
        color: '',
        confinementSetup: 'Unleashed/Roaming',
        additionalTraits: '',
        photoUrl: ''
      });
      setSuccessMsg('Anonymous Loose Sighting reported successfully! Dispatching notification alert to local barangay operator.');
      setActiveTab('my_pets');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const activeAdoptionBoard = allPets.filter(p => p.eligibleForAdoption && p.impounded);

  // Helper for automated booster vaccination countdown alerts
  const getVaccineAlert = (pet: Pet) => {
    if (!pet.lastVaccinatedDate) {
      return {
        type: 'danger',
        message: 'No official Rabies vaccination logged! Immediate immunization required.'
      };
    }

    const lastDate = new Date(pet.lastVaccinatedDate);
    const today = new Date();
    // Rabies booster is due 1 year from last date
    const boosterDate = new Date(lastDate.setFullYear(lastDate.getFullYear() + 1));
    const diffTime = boosterDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return {
        type: 'danger',
        message: `Rabies booster is EXPIRED! Expired on ${boosterDate.toISOString().split('T')[0]}. Please visit the Municipal Vet immediately.`
      };
    } else if (diffDays <= 30) {
      return {
        type: 'warning',
        message: `Rabies booster due in ${diffDays} days (${boosterDate.toISOString().split('T')[0]}). Please arrange an appointment soon.`
      };
    } else {
      return {
        type: 'success',
        message: `Protected. Next booster due on ${boosterDate.toISOString().split('T')[0]} (${diffDays} days remaining).`
      };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <RefreshCw className="h-10 w-10 text-amber-500 animate-spin mb-2" />
        <p className="text-sm text-stone-500 font-medium">Assembling citizen dashboard databases...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Title block */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-100 text-amber-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md">
              Resident Access Gateway
            </span>
            <span className="text-xs text-stone-500 font-semibold flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-amber-500" />
              Brgy. {user.barangay || 'San Julian'}, Irosin
            </span>
          </div>
          <h2 className="font-display font-black text-2xl text-stone-900 mt-1">
            Mabuhay, {user.name}!
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Enlist your dogs and cats, trace booster schedules, browse ready-for-adoption strays, and file local loose animal reports.
          </p>
        </div>

        <button
          onClick={loadOwnerData}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh My Ledger
        </button>
      </div>

      {/* Offline capability status and sync controls */}
      <SyncStatusIndicator token={token} onSyncComplete={loadOwnerData} />

      {/* Onboarding Guidance Tooltip Container */}
      <OnboardingGuidance role="owner" />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-950 text-xs flex gap-2 items-center">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 text-xs flex gap-2 items-center">
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-stone-200 gap-1">
        <button
          onClick={() => { setSuccessMsg(''); setActiveTab('my_pets'); }}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'my_pets'
              ? 'border-amber-500 text-amber-800 bg-amber-50/10'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          My Registered Pets ({pets.length})
        </button>
        <button
          onClick={() => { setSuccessMsg(''); setActiveTab('register'); }}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'register'
              ? 'border-amber-500 text-amber-800 bg-amber-50/10'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <PlusCircle className="h-4 w-4 text-amber-500" />
          Register New Pet
        </button>
        <button
          onClick={() => { setSuccessMsg(''); setActiveTab('adoption'); }}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'adoption'
              ? 'border-amber-500 text-amber-800 bg-amber-50/10'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <Heart className="h-4 w-4 text-amber-500" />
          Public Adoption Board ({activeAdoptionBoard.length})
        </button>
        <button
          onClick={() => { setSuccessMsg(''); setActiveTab('gallery'); }}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'gallery'
              ? 'border-amber-500 text-amber-800 bg-amber-50/10'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <Eye className="h-4 w-4 text-amber-500" />
          Irosin Pet Profile Gallery
        </button>
        <button
          onClick={() => { setSuccessMsg(''); setActiveTab('report'); }}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'report'
              ? 'border-amber-500 text-amber-800 bg-amber-50/10'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <ShieldAlert className="h-4 w-4 text-amber-500" />
          File Sighting Incident
        </button>
      </div>

      {/* Tab contents */}
      
      {/* 1. My Pets Ledger & Booster countdown alerts */}
      {activeTab === 'my_pets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pets.length > 0 ? (
            pets.map(pet => {
              const alert = getVaccineAlert(pet);

              return (
                <div key={pet.id} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Header line */}
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className={`p-3 rounded-xl h-11 w-11 shrink-0 flex items-center justify-center ${
                          pet.classification === 'Dog' ? 'bg-amber-100 text-amber-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {pet.classification === 'Dog' ? <Dog className="h-6 w-6" /> : <Cat className="h-6 w-6" />}
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-lg text-stone-900 flex items-center gap-2">
                            {pet.name}
                            {pet.verificationStatus === 'Pending' ? (
                              <span className="text-[9px] bg-red-100 text-red-800 px-2 py-0.5 rounded-md font-semibold font-mono uppercase">
                                PENDING VERIFY
                              </span>
                            ) : (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-semibold font-mono uppercase">
                                ACTIVE REGISTRY
                              </span>
                            )}
                          </h3>
                          <p className="text-xs text-stone-500 font-semibold">{pet.breed} • {pet.color} • {pet.gender}</p>
                        </div>
                      </div>
                    </div>

                    {/* Verification Warning banner if pending */}
                    {pet.verificationStatus === 'Pending' && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 leading-relaxed">
                        <span className="font-bold flex items-center gap-1 text-amber-700 mb-0.5">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Registration Verification Pipeline Pending
                        </span>
                        This animal tag registration is pending verification from a Brgy. Operator or BHW. The printable QR collar download is disabled until a manual check is performed.
                      </div>
                    )}

                    {/* Booster Immunization Countdown Alert */}
                    <div className={`p-3 rounded-xl border text-[11px] ${
                      alert.type === 'danger'
                        ? 'bg-red-50 border-red-200 text-red-950'
                        : alert.type === 'warning'
                        ? 'bg-orange-50 border-orange-200 text-orange-950'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    }`}>
                      <span className="font-bold block mb-0.5">Automated Rabies Booster Alert:</span>
                      <p>{alert.message}</p>
                    </div>

                    {/* Pet Image Display */}
                    <div className="relative overflow-hidden rounded-xl h-44 border border-stone-200 shadow-inner bg-stone-50">
                      {pet.photoUrl ? (
                        <img
                          src={pet.photoUrl}
                          alt={pet.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className={`w-full h-full flex flex-col items-center justify-center p-4 ${
                          pet.classification === 'Dog' ? 'bg-amber-50/40 text-amber-600/50' : 'bg-orange-50/40 text-orange-600/50'
                        }`}>
                          {pet.classification === 'Dog' ? <Dog className="h-10 w-10 text-amber-300" /> : <Cat className="h-10 w-10 text-orange-300" />}
                          <span className="text-[10px] font-bold uppercase tracking-wider mt-1.5 text-stone-500">No Photo Uploaded</span>
                        </div>
                      )}
                    </div>

                    {/* Basic details */}
                    <div className="grid grid-cols-2 gap-4 text-xs bg-stone-50 p-3 rounded-xl border border-stone-100">
                      <div>
                        <span className="text-stone-400 font-bold block uppercase text-[9px]">Confinement Setup</span>
                        <span className="font-semibold text-stone-900">{pet.confinementSetup}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 font-bold block uppercase text-[9px]">Sterilization Log</span>
                        <span className="font-semibold text-stone-900">{pet.spayNeuterStatus}</span>
                      </div>
                    </div>
                  </div>

                  {/* QR Collar Gen code if Active verified */}
                  <div className="mt-5 pt-3 border-t border-stone-100 space-y-3">
                    <QRCodeGenerator
                      petId={pet.id}
                      petName={pet.name}
                      classification={pet.classification}
                      breed={pet.breed}
                      disabled={pet.verificationStatus === 'Pending'}
                    />
                    {pet.verificationStatus === 'Active' && (
                      <div className="pt-1">
                        <MedicalPassportButton pet={pet} variant="outline" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-2 text-center py-16 bg-white border-2 border-dashed border-stone-200 rounded-3xl text-stone-400 flex flex-col items-center justify-center">
              <ClipboardList className="h-12 w-12 text-stone-300 mb-2" />
              <p className="font-display font-bold text-stone-700 text-sm">No Enlisted Pets Found</p>
              <p className="text-xs text-stone-400 mt-1 max-w-sm">
                Enlist your dogs and cats today to ensure they are protected from Rabies, registered with proper identification collar tags, and trackable.
              </p>
              <button
                onClick={() => setActiveTab('register')}
                className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm"
              >
                Register Your First Pet
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. Self Service registration form */}
      {activeTab === 'register' && (
        <div className="bg-white border border-stone-200 rounded-3xl p-6 max-w-2xl mx-auto shadow-xs">
          <div className="border-b border-stone-100 pb-4 mb-4">
            <h3 className="font-display font-bold text-lg text-stone-900">Enlist New Domestic Dog or Cat</h3>
            <p className="text-xs text-stone-500 mt-0.5">Provide correct visual markers. Your registration will default to "Pending Verification".</p>
          </div>

          <form onSubmit={handleRegisterPet} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Pet Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Max"
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Classification</label>
                <select
                  value={regForm.classification}
                  onChange={(e) => setRegForm({ ...regForm, classification: e.target.value as any })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-xl font-medium text-stone-700"
                >
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Breed</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aspin / Shih Tzu Mix"
                  value={regForm.breed}
                  onChange={(e) => setRegForm({ ...regForm, breed: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Gender</label>
                <select
                  value={regForm.gender}
                  onChange={(e) => setRegForm({ ...regForm, gender: e.target.value as any })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-xl font-medium text-stone-700"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Visual Traits / Color</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fluffy white, brown ears"
                  value={regForm.color}
                  onChange={(e) => setRegForm({ ...regForm, color: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Confinement Setup</label>
              <select
                value={regForm.confinementSetup}
                onChange={(e) => setRegForm({ ...regForm, confinementSetup: e.target.value as any })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-xl font-semibold text-stone-700"
              >
                <option value="Leashed">Leashed (Securely confined in compound/leash)</option>
                <option value="Unleashed/Roaming">Unleashed/Roaming (Loose/Roaming out of compound)</option>
              </select>
            </div>

            {/* Visual Identification Image Section */}
            <div className="space-y-3 bg-stone-50 p-4 border border-stone-200 rounded-2xl">
              <span className="font-bold text-stone-800 block text-xs">Visual Traits & Pet Photo Identification</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  {/* Live Camera Option */}
                  <div className="bg-white p-3 border border-stone-200 rounded-xl space-y-2">
                    <label className="font-bold text-stone-700 block text-[11px] uppercase tracking-wider">Option A: Take Live Photo</label>
                    <CameraCapture 
                      onCapture={(val) => setRegForm({ ...regForm, photoUrl: val })}
                      buttonLabel="Snap Pet Photo"
                    />
                  </div>

                  {/* File Upload Button */}
                  <div className="bg-white p-3 border border-stone-200 rounded-xl space-y-2">
                    <label className="font-bold text-stone-700 block text-[11px] uppercase tracking-wider">Option B: Upload Existing File</label>
                    <div className="relative flex items-center justify-center border-2 border-dashed border-stone-200 hover:border-amber-400 bg-stone-50 rounded-xl p-3 transition-colors cursor-pointer group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, (val) => setRegForm({ ...regForm, photoUrl: val }))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="text-center space-y-1">
                        <span className="text-xs font-bold text-amber-600 group-hover:text-amber-700">Choose file or device gallery</span>
                        <p className="text-[9px] text-stone-400 font-medium">Supports JPG, PNG up to 2MB</p>
                      </div>
                    </div>
                  </div>

                  {/* URL Input */}
                  <div>
                    <label className="font-semibold text-stone-600 block mb-1">Or Paste Image URL</label>
                    <input
                      type="text"
                      placeholder="e.g. https://images.unsplash.com/..."
                      value={regForm.photoUrl}
                      onChange={(e) => setRegForm({ ...regForm, photoUrl: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-xl"
                    />
                  </div>
                </div>

                {/* Preview / Preset block */}
                <div className="flex flex-col justify-between">
                  {/* Active Preview */}
                  <div className="flex-1 flex flex-col items-center justify-center border border-stone-200 rounded-xl bg-white p-2 min-h-[110px] overflow-hidden relative">
                    {regForm.photoUrl ? (
                      <div className="relative w-full h-full min-h-[100px] flex items-center justify-center">
                        <img
                          src={regForm.photoUrl}
                          alt="Pet preview"
                          className="max-h-24 object-cover rounded-lg border"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => setRegForm({ ...regForm, photoUrl: '' })}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 text-[9px] font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="text-center p-3">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">No Photo Configured</span>
                        <p className="text-[9px] text-stone-400 leading-tight">Pick a preset below or load your own image for field tracking.</p>
                      </div>
                    )}
                  </div>

                  {/* Fast Presets */}
                  <div className="mt-3">
                    <span className="font-semibold text-stone-500 block mb-1 text-[10px] uppercase tracking-wider">Quick Identification Presets</span>
                    <div className="flex flex-wrap gap-1">
                      {presetPhotos[regForm.classification as 'Dog' | 'Cat'].map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setRegForm({ ...regForm, photoUrl: preset.url })}
                          className={`px-2 py-1 border text-[10px] rounded-lg font-semibold transition-all ${
                            regForm.photoUrl === preset.url
                              ? 'bg-amber-500 border-amber-500 text-white'
                              : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 p-4 border border-amber-200 rounded-2xl">
              <span className="font-bold text-amber-950 block mb-0.5">Verification Pipeline notice:</span>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                As a pet owner, your submission starts as "Pending Verification". Please contact your Barangay Operator / BHW in Brgy. {user.barangay} to manually verify this record.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Submit Enlistment for Verification
            </button>
          </form>
        </div>
      )}

      {/* 3. Public adoption board */}
      {activeTab === 'adoption' && (
        <div className="space-y-4">
          <div className="bg-white p-4 border border-stone-200 rounded-2xl text-xs text-stone-600">
            Below are strays captured within the municipality and housed at the Municipal Pound. They are eligible for free community adoption.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeAdoptionBoard.length > 0 ? (
              activeAdoptionBoard.map(stray => (
                <div key={stray.id} className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="p-4 bg-amber-50 border-b border-stone-100 flex justify-between items-center">
                      <span className="text-[10px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full uppercase">
                        {stray.classification}
                      </span>
                      <span className="text-xs text-stone-400 font-bold">FOUND: Brgy. {stray.barangay}</span>
                    </div>

                    {/* Stray visual photo display */}
                    <div className="relative overflow-hidden h-44 bg-stone-50 border-b border-stone-100">
                      {stray.photoUrl ? (
                        <img
                          src={stray.photoUrl}
                          alt={stray.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className={`w-full h-full flex flex-col items-center justify-center p-4 ${
                          stray.classification === 'Dog' ? 'bg-amber-50/40 text-amber-600/50' : 'bg-orange-50/40 text-orange-600/50'
                        }`}>
                          {stray.classification === 'Dog' ? <Dog className="h-10 w-10 text-amber-300" /> : <Cat className="h-10 w-10 text-orange-300" />}
                          <span className="text-[10px] font-bold uppercase tracking-wider mt-1 text-stone-500">No Photo Attached</span>
                        </div>
                      )}
                    </div>

                    <div className="p-4 space-y-2">
                      <h4 className="font-display font-black text-lg text-stone-900">{stray.name}</h4>
                      <p className="text-xs text-stone-500 font-semibold">{stray.breed} • {stray.color}</p>
                      
                      <div className="bg-stone-50 border border-stone-100 p-3 rounded-xl text-xs text-stone-600 italic">
                        "{stray.adoptionDetails}"
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-stone-100 bg-stone-50/50 flex flex-col sm:flex-row gap-2">
                    <a
                      href={`mailto:adopt@irospin.gov.ph?subject=Adoption_Inquiry_for_${stray.name}_ID_${stray.id}`}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Heart className="h-4.5 w-4.5 fill-white" />
                      Inquire / Adopt Stray
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-16 bg-white border border-dashed border-stone-200 rounded-2xl text-stone-400 text-xs">
                No active stray animals currently available on the adoption board.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Public Profile Gallery */}
      {activeTab === 'gallery' && (
        <div className="space-y-4">
          <div className="bg-stone-50 p-4 border border-stone-200 rounded-2xl text-xs text-stone-600">
            Public Restricted Gallery of monitored animals in Irosin, Sorsogon. Browse traits to identify neighborhood pets. Contact details are hidden for privacy.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {allPets.length > 0 ? (
              allPets.map(pet => (
                <div key={pet.id} className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-mono font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md">
                      ID: {pet.id}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      pet.confinementSetup === 'Leashed' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {pet.confinementSetup}
                    </span>
                  </div>

                  {/* Photo Thumbnail */}
                  <div className="relative overflow-hidden rounded-xl h-32 border border-stone-100 bg-stone-50">
                    {pet.photoUrl ? (
                      <img
                        src={pet.photoUrl}
                        alt={pet.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className={`w-full h-full flex flex-col items-center justify-center p-2 ${
                        pet.classification === 'Dog' ? 'bg-amber-50/30 text-amber-600/40' : 'bg-orange-50/30 text-orange-600/40'
                      }`}>
                        {pet.classification === 'Dog' ? <Dog className="h-8 w-8 text-amber-300" /> : <Cat className="h-8 w-8 text-orange-300" />}
                        <span className="text-[9px] font-bold uppercase tracking-wider mt-1 text-stone-400">No Image Attached</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h5 className="font-display font-bold text-stone-900 flex items-center gap-1.5">
                      {pet.classification === 'Dog' ? <Dog className="h-4 w-4 text-amber-600" /> : <Cat className="h-4 w-4 text-orange-600" />}
                      {pet.name}
                    </h5>
                    <p className="text-xs text-stone-500 font-semibold">{pet.breed} • {pet.color}</p>
                    <p className="text-xs text-stone-400 font-semibold mt-1">
                      📍 Brgy. {pet.barangay}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-stone-100 flex justify-between items-center text-[10px] text-stone-400 font-semibold">
                    <span>Rabies: {pet.vaccinatedStatus}</span>
                    <span className="text-amber-700">Owner Contact Hidden</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-4 text-center py-10 text-stone-400 text-xs">
                Registry is currently empty
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Anonymous sighting logs */}
      {activeTab === 'report' && (
        <div className="bg-white border border-stone-200 rounded-3xl p-6 max-w-2xl mx-auto shadow-xs">
          <div className="border-b border-stone-100 pb-4 mb-4">
            <h3 className="font-display font-bold text-lg text-stone-900">Report Anonymous Loose/Stray Sighting</h3>
            <p className="text-xs text-stone-500 mt-0.5">Submit visual traits to alert the Barangay Operator / BHW directly in the field.</p>
          </div>

          <form onSubmit={handleAnonReport} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Barangay Location Spotted</label>
                <select
                  value={anonForm.barangay}
                  onChange={(e) => setAnonForm({ ...anonForm, barangay: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-xl font-semibold text-stone-700"
                >
                  {IROSIN_BARANGAYS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Classification</label>
                <select
                  value={anonForm.classification}
                  onChange={(e) => setAnonForm({ ...anonForm, classification: e.target.value as any })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-xl font-medium text-stone-700"
                >
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Visual Traits (Color, Size, breed characteristics)</label>
              <input
                type="text"
                required
                placeholder="e.g. Dirty white aspin, medium size, dragging leash"
                value={anonForm.color}
                onChange={(e) => setAnonForm({ ...anonForm, color: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Detailed description of behaviors & specific landmarks</label>
              <textarea
                required
                placeholder="Spotted near Balogo plaza, barking aggressively at passersby..."
                value={anonForm.additionalTraits}
                onChange={(e) => setAnonForm({ ...anonForm, additionalTraits: e.target.value })}
                className="w-full p-3 bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-xl"
                rows={3}
              />
            </div>

            {/* Sighting Photo / Live Capture Block */}
            <div className="space-y-3 bg-stone-50 p-4 border border-stone-200 rounded-2xl">
              <span className="font-bold text-stone-800 block text-xs">Visual Proof / Sighting Photo (Optional)</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  {/* Live Camera Option */}
                  <div className="bg-white p-3 border border-stone-200 rounded-xl space-y-2">
                    <label className="font-bold text-stone-700 block text-[11px] uppercase tracking-wider">Take Live Photo of Stray</label>
                    <CameraCapture 
                      onCapture={(val) => setAnonForm({ ...anonForm, photoUrl: val })}
                      buttonLabel="Snap Stray Photo"
                    />
                  </div>

                  {/* File Upload Option */}
                  <div className="bg-white p-3 border border-stone-200 rounded-xl space-y-2">
                    <label className="font-bold text-stone-700 block text-[11px] uppercase tracking-wider">Or Upload File</label>
                    <div className="relative flex items-center justify-center border-2 border-dashed border-stone-200 hover:border-amber-400 bg-stone-50 rounded-xl p-3 transition-colors cursor-pointer group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, (val) => setAnonForm({ ...anonForm, photoUrl: val }))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="text-center space-y-1">
                        <span className="text-xs font-bold text-amber-600 group-hover:text-amber-700">Choose file or device gallery</span>
                        <p className="text-[9px] text-stone-400 font-medium">Supports JPG, PNG up to 2MB</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sighting Photo Preview */}
                <div className="flex flex-col justify-between">
                  <div className="flex-1 flex flex-col items-center justify-center border border-stone-200 rounded-xl bg-white p-2 min-h-[110px] overflow-hidden relative">
                    {anonForm.photoUrl ? (
                      <div className="relative w-full h-full min-h-[100px] flex items-center justify-center">
                        <img
                          src={anonForm.photoUrl}
                          alt="Stray preview"
                          className="max-h-28 object-cover rounded-lg border"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => setAnonForm({ ...anonForm, photoUrl: '' })}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 text-[9px] font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="text-center p-3 text-stone-400">
                        <span className="text-[10px] font-bold uppercase tracking-wider block">No proof attached</span>
                        <p className="text-[9px] leading-tight mt-1">If possible, take a photo to help the BHW identify this animal in the field.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Dispatch Anonymous Sighting Alert
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
