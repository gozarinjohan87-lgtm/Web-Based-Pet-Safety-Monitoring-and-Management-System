import React, { useState, useEffect } from 'react';
import {
  Compass, ShieldAlert, Award, Grid, Users, CheckCircle, RefreshCw, Check,
  UserCheck, AlertTriangle, MessageSquare, PlusCircle, Search, HelpCircle, MapPin, Eye, Dog, Cat, Camera
} from 'lucide-react';
import { Pet, CrossBarangayAlert, AnonymousReport, IROSIN_BARANGAYS } from '../types';
import QRCodeGenerator from './QRCodeGenerator';
import { CameraCapture } from './CameraCapture';
import SyncStatusIndicator from './SyncStatusIndicator';
import { addToOfflineQueue } from '../offlineQueue';
import OnboardingGuidance from './OnboardingGuidance';

interface OperatorDashboardProps {
  token: string;
  barangay: string; // The operator's designated barangay, e.g. "San Julian"
}

export default function OperatorDashboard({ token, barangay }: OperatorDashboardProps) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [alerts, setAlerts] = useState<CrossBarangayAlert[]>([]);
  const [reports, setReports] = useState<AnonymousReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'pending' | 'roaming' | 'alerts' | 'reports' | 'register'>('pending');

  // Direct registration state for Operator rounds
  const [petForm, setPetForm] = useState({
    name: '',
    classification: 'Dog' as 'Dog' | 'Cat',
    breed: '',
    gender: 'Male' as 'Male' | 'Female',
    color: '',
    ownerName: '',
    ownerPhone: '',
    confinementSetup: 'Leashed' as 'Leashed' | 'Unleashed/Roaming',
    sightingClassification: 'Local Pet' as 'Local Pet' | 'Stray' | 'Suspected Neighboring Barangay Stray',
    suspectedOriginBarangay: '',
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

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [petsRes, alertsRes, reportsRes] = await Promise.all([
        fetch(`/api/pets?barangay=${barangay}`, { headers }),
        fetch('/api/alerts', { headers }),
        fetch('/api/anonymous-reports', { headers })
      ]);

      if (!petsRes.ok || !alertsRes.ok || !reportsRes.ok) {
        throw new Error('Failed to retrieve localized databases');
      }

      const petsData = await petsRes.json();
      const alertsData = await alertsRes.json();
      const reportsData = await reportsRes.json();

      setPets(petsData);
      
      // Filter alerts where the TARGET is this barangay (suspected home of stray) or origin is this
      setAlerts(alertsData.filter((a: any) => a.targetBarangay === barangay || a.originBarangay === barangay));
      
      // Filter anonymous reports for this barangay
      setReports(reportsData.filter((r: any) => r.barangay === barangay));
    } catch (err: any) {
      setError(err.message || 'Error sync with database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, barangay]);

  // Verify Citizen creation
  const handleVerifyPet = async (id: string) => {
    try {
      const response = await fetch(`/api/pets/${id}/verify`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to verify record');
      }

      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Direct Registration (Operators skip verification state)
  const handleRegisterDirect = async (e: React.FormEvent) => {
    e.preventDefault();

    const registrationData = {
      ...petForm,
      barangay: barangay // Pinned to operator's barangay
    };

    // If browser is offline, queue the registration
    if (!navigator.onLine) {
      try {
        addToOfflineQueue(
          'pet_registration',
          registrationData,
          `Field Reg: ${petForm.name} (${petForm.ownerName || 'No Owner'})`
        );

        // Reset form
        setPetForm({
          name: '',
          classification: 'Dog',
          breed: '',
          gender: 'Male',
          color: '',
          ownerName: '',
          ownerPhone: '',
          confinementSetup: 'Leashed',
          sightingClassification: 'Local Pet',
          suspectedOriginBarangay: '',
          photoUrl: ''
        });
        
        alert(`Offline Mode Active: Your registration for "${petForm.name}" has been saved to the Offline Queue. It will automatically sync once your connection is restored.`);
        setActiveTab('pending');
      } catch (err: any) {
        alert('Failed to save offline registration: ' + err.message);
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
        throw new Error('Failed to log field registration');
      }

      // Reset form and return
      setPetForm({
        name: '',
        classification: 'Dog',
        breed: '',
        gender: 'Male',
        color: '',
        ownerName: '',
        ownerPhone: '',
        confinementSetup: 'Leashed',
        sightingClassification: 'Local Pet',
        suspectedOriginBarangay: '',
        photoUrl: ''
      });
      setActiveTab('pending');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Resolve cross-barangay stray alert
  const handleResolveAlert = async (id: string, newStatus: 'Identified' | 'Archived') => {
    try {
      const response = await fetch(`/api/alerts/${id}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update alert status');
      }

      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Review anonymous citizens reports
  const handleReviewReport = async (id: string) => {
    try {
      const response = await fetch(`/api/anonymous-reports/${id}/review`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to archive report');
      }

      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Split into lists
  const pendingRegistrations = pets.filter(p => p.verificationStatus === 'Pending');
  const activeRoamingStrays = pets.filter(p => p.verificationStatus === 'Active' && p.confinementSetup === 'Unleashed/Roaming');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <RefreshCw className="h-10 w-10 text-amber-500 animate-spin mb-2" />
        <p className="text-sm text-stone-500 font-medium">Synching local barangay registry database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Welcome operator banner */}
      <div className="bg-white border border-amber-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-100 text-amber-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md">
              Field HQ Active
            </span>
            <span className="text-xs text-stone-500 font-medium flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-amber-500" />
              Municipality of Irosin
            </span>
          </div>
          <h2 className="font-display font-black text-2xl text-stone-900 mt-1">
            Barangay Operator Dashboard: Brgy. {barangay}
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Review self-registrations, verify community pet tags, manage loose stray logs, and trace adjacent cross-barangay alerts.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm"
        >
          <RefreshCw className="h-4 w-4" />
          Sync Local Records
        </button>
      </div>

      {/* Offline capability status and queue control */}
      <SyncStatusIndicator token={token} onSyncComplete={fetchData} />

      {/* Onboarding Guidance Tooltip Container */}
      <OnboardingGuidance role="operator" />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-950 text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-stone-200 gap-1">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'border-amber-500 text-amber-800 bg-amber-50/20'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          Unverified Registrations ({pendingRegistrations.length})
        </button>
        <button
          onClick={() => setActiveTab('roaming')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'roaming'
              ? 'border-amber-500 text-amber-800 bg-amber-50/20'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          Active Roaming Pets ({activeRoamingStrays.length})
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all relative cursor-pointer ${
            activeTab === 'alerts'
              ? 'border-amber-500 text-amber-800 bg-amber-50/20'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          Cross-Brgy Alerts ({alerts.filter(a => a.status === 'Unresolved').length})
          {alerts.filter(a => a.status === 'Unresolved').length > 0 && (
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full animate-ping"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'reports'
              ? 'border-amber-500 text-amber-800 bg-amber-50/20'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          Citizen Loose Sightings ({reports.filter(r => r.status === 'Pending').length})
        </button>
        <button
          onClick={() => setActiveTab('register')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'register'
              ? 'border-amber-500 text-amber-800 bg-amber-50/20'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <PlusCircle className="h-4 w-4 text-amber-500" />
          Field Registry Rounds
        </button>
      </div>

      {/* Tab contents */}
      
      {/* 1. Pending verification list */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="bg-amber-50 p-4 border border-amber-200 rounded-2xl flex gap-3 text-amber-900 text-xs">
            <UserCheck className="h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-bold">Pending Citizen Self-Service Registrations</p>
              <p className="mt-0.5">These records are unverified. Collar QR download is blocked for owners until manually verified here in the system or verified via field house rounds.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRegistrations.length > 0 ? (
              pendingRegistrations.map(pet => (
                <div key={pet.id} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    {/* Visual Photo verification header */}
                    <div className="relative overflow-hidden rounded-xl h-36 mb-4 border border-stone-200 shadow-inner bg-stone-50">
                      {pet.photoUrl ? (
                        <img
                          src={pet.photoUrl}
                          alt={pet.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className={`w-full h-full flex flex-col items-center justify-center p-3 ${
                          pet.classification === 'Dog' ? 'bg-amber-50/40 text-amber-600/50' : 'bg-orange-50/40 text-orange-600/50'
                        }`}>
                          {pet.classification === 'Dog' ? <Dog className="h-8 w-8 text-amber-300" /> : <Cat className="h-8 w-8 text-orange-300" />}
                          <span className="text-[9px] font-bold uppercase tracking-wider mt-1 text-stone-500">No Photo Attached</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4">
                    <div className={`p-3 rounded-xl h-12 w-12 shrink-0 flex items-center justify-center ${
                      pet.classification === 'Dog' ? 'bg-amber-100 text-amber-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {pet.classification === 'Dog' ? <Dog className="h-6 w-6" /> : <Cat className="h-6 w-6" />}
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-stone-900">{pet.name}</h4>
                      <p className="text-xs text-stone-500 font-medium">
                        {pet.breed} • {pet.color} • {pet.gender}
                      </p>
                      <div className="text-[10px] font-mono text-amber-800 font-semibold bg-amber-50 px-2.5 py-0.5 rounded-full inline-block mt-2">
                        ID: {pet.id}
                      </div>

                      <div className="mt-3 border-t border-stone-100 pt-3 text-xs">
                        <p className="font-semibold text-stone-800">Owner: {pet.ownerName}</p>
                        <p className="text-stone-500">Contact: {pet.ownerPhone}</p>
                        <p className="text-stone-500">Confinement: {pet.confinementSetup}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-stone-100 flex gap-2">
                    <button
                      onClick={() => handleVerifyPet(pet.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Verify and Activate QR
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-10 bg-white border border-dashed border-stone-200 rounded-2xl text-stone-400 text-xs">
                No unverified citizen registrations currently listed for Brgy. {barangay}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Active Roaming Pets */}
      {activeTab === 'roaming' && (
        <div className="space-y-4">
          <div className="bg-white p-4 border border-stone-200 rounded-2xl text-xs text-stone-600">
            Currently monitoring active loose pets in Brgy. {barangay}. Field workers can scan their collars to verify vaccine alerts.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeRoamingStrays.length > 0 ? (
              activeRoamingStrays.map(pet => (
                <div key={pet.id} className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded-full border border-red-100">
                        {pet.confinementSetup}
                      </span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-100">
                        VERIFIED
                      </span>
                    </div>

                    {/* Visual photo thumbnail */}
                    <div className="relative overflow-hidden rounded-xl h-36 my-3 border border-stone-200 shadow-inner bg-stone-50">
                      {pet.photoUrl ? (
                        <img
                          src={pet.photoUrl}
                          alt={pet.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className={`w-full h-full flex flex-col items-center justify-center p-3 ${
                          pet.classification === 'Dog' ? 'bg-amber-50/40 text-amber-600/50' : 'bg-orange-50/40 text-orange-600/50'
                        }`}>
                          {pet.classification === 'Dog' ? <Dog className="h-8 w-8 text-amber-300" /> : <Cat className="h-8 w-8 text-orange-300" />}
                          <span className="text-[9px] font-bold uppercase tracking-wider mt-1 text-stone-500">No Photo Attached</span>
                        </div>
                      )}
                    </div>

                    <h4 className="font-display font-bold text-base text-stone-900">{pet.name}</h4>
                    <p className="text-xs text-stone-500 font-medium">
                      {pet.breed} • {pet.color}
                    </p>
                    <p className="text-xs text-stone-500">
                      Owner: {pet.ownerName} ({pet.ownerPhone})
                    </p>

                    <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${pet.vaccinatedStatus === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        <span className="font-semibold text-stone-700">Rabies Vaccine: {pet.vaccinatedStatus}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100">
                    <QRCodeGenerator
                      petId={pet.id}
                      petName={pet.name}
                      classification={pet.classification}
                      breed={pet.breed}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-10 bg-white border border-dashed border-stone-200 rounded-2xl text-stone-400 text-xs">
                Excellent! No loose or unleashed pets registered in Brgy. {barangay} at this moment.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Cross-Barangay Stray Mechanics */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="bg-orange-50 p-4 border border-orange-200 rounded-2xl flex gap-3 text-orange-950 text-xs">
            <AlertTriangle className="h-5 w-5 shrink-0 text-orange-600" />
            <div>
              <p className="font-bold">Cross-Barangay Sighting Tracing Alerts</p>
              <p className="mt-0.5">When field operators catch a loose pet and suspect it came from your barangay, an alert is dispatched below. Compare details with local records to bridge identities.</p>
            </div>
          </div>

          <div className="space-y-3">
            {alerts.length > 0 ? (
              alerts.map(alert => (
                <div key={alert.id} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full uppercase">
                        {alert.status}
                      </span>
                      <span className="text-xs text-stone-400 font-semibold">{alert.createdAt}</span>
                    </div>
                    <p className="text-sm font-semibold text-stone-900">
                      Dispatched from Brgy. {alert.originBarangay} → Target: Brgy. {alert.targetBarangay}
                    </p>
                    <p className="text-xs text-stone-600 mt-1">{alert.message}</p>
                  </div>

                  {alert.status === 'Unresolved' && (
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => handleResolveAlert(alert.id, 'Archived')}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                      >
                        Archive
                      </button>
                      <button
                        onClick={() => handleResolveAlert(alert.id, 'Identified')}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Match Identified
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-white border border-dashed border-stone-200 rounded-2xl text-stone-400 text-xs">
                No active cross-barangay stray alerts currently registered
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Anonymous Loose Sightings */}
      {activeTab === 'reports' && (
        <div className="space-y-3">
          {reports.length > 0 ? (
            reports.map(rep => (
              <div key={rep.id} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-start">
                <div className="flex gap-4 items-start flex-1">
                  {rep.photoUrl && (
                    <div className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden border border-stone-200 bg-stone-50">
                      <img
                        src={rep.photoUrl}
                        alt="Stray sighting proof"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rep.status === 'Pending' ? 'bg-red-500 text-white' : 'bg-stone-300 text-stone-700'
                      }`}>
                        {rep.status}
                      </span>
                      <span className="text-xs text-stone-400 font-medium">{rep.reportedAt}</span>
                    </div>
                    <h5 className="font-bold text-sm text-stone-900">
                      Sighting Sourced: Loose {rep.classification} ({rep.color})
                    </h5>
                    <p className="text-xs text-stone-600">
                      <span className="font-semibold text-amber-800">Traits:</span> {rep.additionalTraits}
                    </p>
                  </div>
                </div>

                {rep.status === 'Pending' && (
                  <button
                    onClick={() => handleReviewReport(rep.id)}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer self-center"
                  >
                    Mark Reviewed & Log
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-10 bg-white border border-dashed border-stone-200 rounded-2xl text-stone-400 text-xs">
              No pending loose sightings reported by citizens
            </div>
          )}
        </div>
      )}

      {/* 5. Field Registry rounds */}
      {activeTab === 'register' && (
        <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs max-w-2xl mx-auto">
          <div className="border-b border-stone-100 pb-4 mb-4">
            <h3 className="font-display font-bold text-lg text-stone-900">Direct Local Field Registration</h3>
            <p className="text-xs text-stone-500 mt-0.5">Logged directly during house-to-house rounds. Skip verification.</p>
          </div>

          <form onSubmit={handleRegisterDirect} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Pet Name (if collarless stray, type Stray Dog/Cat)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Buddy"
                  value={petForm.name}
                  onChange={(e) => setPetForm({ ...petForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Classification</label>
                <select
                  value={petForm.classification}
                  onChange={(e) => setPetForm({ ...petForm, classification: e.target.value as any })}
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
                  placeholder="e.g. Aspin / Mixed"
                  value={petForm.breed}
                  onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Gender</label>
                <select
                  value={petForm.gender}
                  onChange={(e) => setPetForm({ ...petForm, gender: e.target.value as any })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-xl font-medium text-stone-700"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Visual Trait/Color</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brown with dark spots"
                  value={petForm.color}
                  onChange={(e) => setPetForm({ ...petForm, color: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Owner Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Type N/A if community stray"
                  value={petForm.ownerName}
                  onChange={(e) => setPetForm({ ...petForm, ownerName: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Owner Contact Phone</label>
                <input
                  type="text"
                  required
                  placeholder="Type N/A if community stray"
                  value={petForm.ownerPhone}
                  onChange={(e) => setPetForm({ ...petForm, ownerPhone: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-stone-100 pt-3">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Confinement Setup</label>
                <select
                  value={petForm.confinementSetup}
                  onChange={(e) => setPetForm({ ...petForm, confinementSetup: e.target.value as any })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-xl font-medium text-stone-700"
                >
                  <option value="Leashed">Leashed</option>
                  <option value="Unleashed/Roaming">Unleashed/Roaming</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Sighting Classification</label>
                <select
                  value={petForm.sightingClassification}
                  onChange={(e) => setPetForm({ ...petForm, sightingClassification: e.target.value as any })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-xl font-medium text-stone-700"
                >
                  <option value="Local Pet">Local Pet</option>
                  <option value="Stray">Stray</option>
                  <option value="Suspected Neighboring Barangay Stray">Suspected Neighboring Barangay Stray</option>
                </select>
              </div>
            </div>

            {petForm.sightingClassification === 'Suspected Neighboring Barangay Stray' && (
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                <label className="font-bold text-amber-900 block mb-1">Suspected Origin Barangay</label>
                <select
                  value={petForm.suspectedOriginBarangay}
                  onChange={(e) => setPetForm({ ...petForm, suspectedOriginBarangay: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-xl font-semibold text-stone-700"
                >
                  <option value="">Select Probable Adjacent Barangay</option>
                  {IROSIN_BARANGAYS.filter(b => b !== barangay).map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <span className="text-[10px] text-amber-700 block mt-1.5 font-medium">
                  * Triggers an alert directly in the target barangay's operators ledger automatically.
                </span>
              </div>
            )}

            {/* Visual Identification Image Section */}
            <div className="space-y-3 bg-stone-50 p-4 border border-stone-200 rounded-2xl">
              <span className="font-bold text-stone-800 block text-xs">Visual Traits & Pet Photo Identification</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  {/* Live Camera Option */}
                  <div className="bg-white p-3 border border-stone-200 rounded-xl space-y-2">
                    <label className="font-bold text-stone-700 block text-[11px] uppercase tracking-wider">Option A: Take Live Photo</label>
                    <CameraCapture 
                      onCapture={(val) => setPetForm({ ...petForm, photoUrl: val })}
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
                        onChange={(e) => handleFileChange(e, (val) => setPetForm({ ...petForm, photoUrl: val }))}
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
                      value={petForm.photoUrl}
                      onChange={(e) => setPetForm({ ...petForm, photoUrl: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-xl"
                    />
                  </div>
                </div>

                {/* Preview / Preset block */}
                <div className="flex flex-col justify-between">
                  {/* Active Preview */}
                  <div className="flex-1 flex flex-col items-center justify-center border border-stone-200 rounded-xl bg-white p-2 min-h-[110px] overflow-hidden relative">
                    {petForm.photoUrl ? (
                      <div className="relative w-full h-full min-h-[100px] flex items-center justify-center">
                        <img
                          src={petForm.photoUrl}
                          alt="Pet preview"
                          className="max-h-24 object-cover rounded-lg border"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => setPetForm({ ...petForm, photoUrl: '' })}
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
                      {presetPhotos[petForm.classification as 'Dog' | 'Cat'].map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setPetForm({ ...petForm, photoUrl: preset.url })}
                          className={`px-2 py-1 border text-[10px] rounded-lg font-semibold transition-all ${
                            petForm.photoUrl === preset.url
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

            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Log Active Pet & Generate Collar QR Tag
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
