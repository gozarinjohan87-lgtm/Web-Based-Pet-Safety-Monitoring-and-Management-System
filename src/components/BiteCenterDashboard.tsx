import React, { useState, useEffect } from 'react';
import { ShieldAlert, PlusCircle, CheckCircle, Search, HelpCircle, RefreshCw, AlertCircle, Eye, Trash, Info, Dog, Cat } from 'lucide-react';
import { BiteCase, IROSIN_BARANGAYS, Pet } from '../types';
import StatusHistoryTimeline from './StatusHistoryTimeline';
import OnboardingGuidance from './OnboardingGuidance';

interface BiteCenterDashboardProps {
  token: string;
}

export default function BiteCenterDashboard({ token }: BiteCenterDashboardProps) {
  const [biteCases, setBiteCases] = useState<BiteCase[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'ledger' | 'log'>('ledger');

  // Form for logging a bite case
  const [form, setForm] = useState({
    patientName: '',
    patientAge: '',
    patientGender: 'Male' as 'Male' | 'Female' | 'Other',
    patientAddress: '',
    contactPhone: '',
    incidentDate: '',
    biteLocation: '',
    barangay: 'San Julian',
    animalType: 'Dog' as 'Dog' | 'Cat',
    petId: '',
    quarantineStatus: 'Pending Action' as 'Pending Action' | 'Under Quarantine' | 'Case Closed',
    quarantineNotes: ''
  });

  // Action update status
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<'Pending Action' | 'Under Quarantine' | 'Case Closed'>('Pending Action');
  const [updateNotes, setUpdateNotes] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [bitesRes, petsRes] = await Promise.all([
        fetch('/api/bite-cases', { headers }),
        fetch('/api/pets', { headers })
      ]);

      if (!bitesRes.ok || !petsRes.ok) {
        throw new Error('Failed to retrieve disease monitoring records');
      }

      const bitesData = await bitesRes.json();
      const petsData = await petsRes.json();

      setBiteCases(bitesData);
      setPets(petsData);
    } catch (err: any) {
      setError(err.message || 'Error updating databases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleLogBiteCase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/bite-cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        throw new Error('Could not record bite incident');
      }

      setForm({
        patientName: '',
        patientAge: '',
        patientGender: 'Male',
        patientAddress: '',
        contactPhone: '',
        incidentDate: '',
        biteLocation: '',
        barangay: 'San Julian',
        animalType: 'Dog',
        petId: '',
        quarantineStatus: 'Pending Action',
        quarantineNotes: ''
      });
      setActiveTab('ledger');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/bite-cases/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          quarantineStatus: updateStatus,
          quarantineNotes: updateNotes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update case progression');
      }

      setSelectedCaseId(null);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const startStatusUpdate = (bCase: BiteCase) => {
    setSelectedCaseId(bCase.id);
    setUpdateStatus(bCase.quarantineStatus);
    setUpdateNotes(bCase.quarantineNotes || '');
  };

  const filteredCases = biteCases.filter(c => {
    return c.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           c.barangay.toLowerCase().includes(searchTerm.toLowerCase()) ||
           c.id.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <RefreshCw className="h-10 w-10 text-amber-500 animate-spin mb-2" />
        <p className="text-sm text-stone-500 font-medium">Loading Animal Bite Clinic databases...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Title section */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide">
            Sterile Portal • Authorized Access
          </span>
          <h2 className="font-display font-black text-2xl text-stone-900 mt-1 flex items-center gap-1.5">
            <ShieldAlert className="text-amber-500 h-7 w-7" />
            Irosin Animal Bite Treatment Center (ABTC)
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Register bite exposure cases, monitor vaccination requirements, and coordinate animal quarantine status in compliance with rabies prevention standards.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Records
        </button>
      </div>

      {/* Onboarding Guidance Tooltip Container */}
      <OnboardingGuidance role="bite_center" />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-950 text-xs">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-stone-200 gap-1">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'ledger'
              ? 'border-amber-500 text-amber-800 bg-amber-50/10'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          Municipal Bite Ledger ({filteredCases.length})
        </button>
        <button
          onClick={() => setActiveTab('log')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'log'
              ? 'border-amber-500 text-amber-800 bg-amber-50/10'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <PlusCircle className="h-4 w-4 text-amber-500" />
          Log New Patient Bite Exposure
        </button>
      </div>

      {/* Ledger list */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4 flex-col sm:flex-row">
            <p className="text-xs text-stone-500">
              * Active quarantines require clinical follow-up within 14 days of biting exposure.
            </p>
            <input
              type="text"
              placeholder="Search patient, barangay, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-xl w-full sm:w-64"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredCases.length > 0 ? (
              filteredCases.map(bCase => {
                // Find matching pet details if linked
                const linkedPet = pets.find(p => p.id === bCase.petId);

                return (
                  <div key={bCase.id} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                      {/* Patient info */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md">
                            CASE: {bCase.id}
                          </span>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            bCase.quarantineStatus === 'Pending Action'
                              ? 'bg-red-50 text-red-700 border-red-100'
                              : bCase.quarantineStatus === 'Under Quarantine'
                              ? 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          }`}>
                            {bCase.quarantineStatus}
                          </span>
                        </div>
                        <h4 className="font-display font-black text-lg text-stone-900">{bCase.patientName}</h4>
                        <p className="text-xs text-stone-500 font-semibold">
                          {bCase.patientAge} y/o • {bCase.patientGender} • Address: {bCase.patientAddress} • {bCase.contactPhone}
                        </p>
                        <p className="text-xs text-stone-600 mt-2">
                          <span className="font-bold text-stone-700">Incident Sighting:</span> Bit on <span className="underline">{bCase.biteLocation}</span> on {bCase.incidentDate} in Brgy. {bCase.barangay} (Animal: {bCase.animalType})
                        </p>
                      </div>

                      {/* Linked Animal quarantine status */}
                      <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl text-xs w-full md:w-80 shrink-0">
                        <p className="font-bold text-stone-800 flex items-center gap-1.5 pb-1.5 border-b border-stone-200">
                          <Info className="h-4 w-4 text-amber-500" />
                          Biting Animal Tracking Details
                        </p>
                        <div className="mt-2 space-y-1.5">
                          {linkedPet ? (
                            <div>
                              <p className="font-semibold text-stone-950 flex items-center gap-1">
                                {linkedPet.classification === 'Dog' ? <Dog className="h-3.5 w-3.5 text-amber-600" /> : <Cat className="h-3.5 w-3.5 text-orange-600" />}
                                {linkedPet.name} ({linkedPet.breed})
                              </p>
                              <p className="text-[10px] text-stone-500">Registered Owner: {linkedPet.ownerName}</p>
                              <p className="text-[10px] text-stone-500">Owner Contact: {linkedPet.ownerPhone}</p>
                              <p className="text-[10px] font-mono text-amber-700 font-bold mt-1">ID: {linkedPet.id}</p>
                            </div>
                          ) : (
                            <p className="text-stone-400 italic">No official registered collar tag linked to this incident</p>
                          )}

                          <div className="pt-2 border-t border-stone-200 mt-2">
                            <span className="font-bold text-stone-700 block mb-0.5">Clinical Observation Logs:</span>
                            <p className="text-stone-600 text-[11px] leading-relaxed">{bCase.quarantineNotes}</p>
                          </div>

                          <StatusHistoryTimeline 
                            history={bCase.statusHistory} 
                            currentStatus={bCase.quarantineStatus} 
                            loggedAt={bCase.loggedAt} 
                          />
                        </div>

                        {selectedCaseId === bCase.id ? (
                          <div className="mt-4 pt-3 border-t border-stone-200 space-y-3">
                            <div>
                              <label className="text-[10px] font-bold text-stone-700 block mb-1">Update Pipeline State</label>
                              <select
                                value={updateStatus}
                                onChange={(e) => setUpdateStatus(e.target.value as any)}
                                className="w-full px-2 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                              >
                                <option value="Pending Action">Pending Action</option>
                                <option value="Under Quarantine">Under Quarantine</option>
                                <option value="Case Closed">Case Closed</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-stone-700 block mb-1">Clinical Observation Notes</label>
                              <textarea
                                value={updateNotes}
                                onChange={(e) => setUpdateNotes(e.target.value)}
                                className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs"
                                rows={2}
                                placeholder="Details about animal symptoms, Rabies evaluation..."
                              />
                            </div>

                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedCaseId(null)}
                                className="px-2.5 py-1 text-stone-600 bg-white border border-stone-200 rounded-lg text-[10px]"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(bCase.id)}
                                className="px-2.5 py-1 bg-amber-500 text-white rounded-lg text-[10px] font-bold"
                              >
                                Save Status
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => startStatusUpdate(bCase)}
                            className="mt-4 w-full py-1.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold rounded-lg text-[11px] transition-all cursor-pointer"
                          >
                            Update Quarantine Observation
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 bg-white border border-dashed border-stone-200 rounded-2xl text-stone-400 text-xs">
                No human bite cases recorded currently matching search
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logging form */}
      {activeTab === 'log' && (
        <div className="bg-white border border-stone-200 rounded-3xl p-6 max-w-2xl mx-auto shadow-xs">
          <div className="border-b border-stone-100 pb-4 mb-4">
            <h3 className="font-display font-bold text-lg text-stone-900">Patient Rabies Exposure Log</h3>
            <p className="text-xs text-stone-500 mt-0.5">Log patient details, bite location, and link the biting animal for tracking.</p>
          </div>

          <form onSubmit={handleLogBiteCase} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Patient Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Clara"
                  value={form.patientName}
                  onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Age</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 24"
                    value={form.patientAge}
                    onChange={(e) => setForm({ ...form, patientAge: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Gender</label>
                  <select
                    value={form.patientGender}
                    onChange={(e) => setForm({ ...form, patientGender: e.target.value as any })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-xl font-medium text-stone-700"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Patient Home Address</label>
              <input
                type="text"
                required
                placeholder="Complete street/barangay detail"
                value={form.patientAddress}
                onChange={(e) => setForm({ ...form, patientAddress: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Patient Phone</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 0917-123-4567"
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Incident Date</label>
                <input
                  type="date"
                  required
                  value={form.incidentDate}
                  onChange={(e) => setForm({ ...form, incidentDate: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Bite Location on Body</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Right Hand"
                  value={form.biteLocation}
                  onChange={(e) => setForm({ ...form, biteLocation: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-stone-100 pt-3">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Bite Barangay Location</label>
                <select
                  value={form.barangay}
                  onChange={(e) => setForm({ ...form, barangay: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-xl font-semibold text-stone-700"
                >
                  {IROSIN_BARANGAYS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Biting Animal Type</label>
                <select
                  value={form.animalType}
                  onChange={(e) => setForm({ ...form, animalType: e.target.value as any })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-xl font-semibold text-stone-700"
                >
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Link Registered Pet ID (Optional)</label>
                <select
                  value={form.petId}
                  onChange={(e) => setForm({ ...form, petId: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-xl font-semibold text-stone-700"
                >
                  <option value="">No collar/Unidentified stray</option>
                  {pets.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.id}) • {p.barangay}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3 border-t border-stone-100 pt-3">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Initial Quarantine Status</label>
                <select
                  value={form.quarantineStatus}
                  onChange={(e) => setForm({ ...form, quarantineStatus: e.target.value as any })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-xl font-semibold text-stone-700"
                >
                  <option value="Pending Action">Pending Action</option>
                  <option value="Under Quarantine">Under Quarantine</option>
                  <option value="Case Closed">Case Closed</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Quarantine Observation Notes</label>
                <textarea
                  required
                  placeholder="Describe details of quarantine setup or patient post-exposure vaccination pipeline status..."
                  value={form.quarantineNotes}
                  onChange={(e) => setForm({ ...form, quarantineNotes: e.target.value })}
                  className="w-full p-3 bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-xl"
                  rows={3}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Record Bite exposure & Lock Observation Pipeline
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
