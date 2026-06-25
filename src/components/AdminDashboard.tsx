import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import {
  TrendingUp, ShieldAlert, Award, Grid, Users, Compass, CheckCircle, Flame,
  Check, RefreshCw, Trash2, Heart, PlusCircle, AlertCircle, Edit, Dog, Cat, ClipboardList,
  Download
} from 'lucide-react';
import { Pet, BiteCase, CrossBarangayAlert, AnonymousReport, IROSIN_BARANGAYS } from '../types';
import OnboardingGuidance from './OnboardingGuidance';
import MedicalPassportButton from './MedicalPassportButton';

interface AdminDashboardProps {
  token: string;
}

export default function AdminDashboard({ token }: AdminDashboardProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [biteCases, setBiteCases] = useState<BiteCase[]>([]);
  const [alerts, setAlerts] = useState<CrossBarangayAlert[]>([]);
  const [anonymousReports, setAnonymousReports] = useState<AnonymousReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterBarangay, setFilterBarangay] = useState<string>('');
  
  // Pound control state
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [poundStatus, setPoundStatus] = useState<boolean>(false);
  const [adoptionEligible, setAdoptionEligible] = useState<boolean>(false);
  const [adoptionDetails, setAdoptionDetails] = useState<string>('');

  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [analyticsRes, petsRes, biteRes, alertsRes, reportsRes] = await Promise.all([
        fetch('/api/analytics', { headers }),
        fetch('/api/pets', { headers }),
        fetch('/api/bite-cases', { headers }),
        fetch('/api/alerts', { headers }),
        fetch('/api/anonymous-reports', { headers })
      ]);

      if (!analyticsRes.ok || !petsRes.ok || !biteRes.ok || !alertsRes.ok || !reportsRes.ok) {
        throw new Error('Failed to fetch administrative records');
      }

      const analyticsData = await analyticsRes.json();
      const petsData = await petsRes.json();
      const biteData = await biteRes.json();
      const alertsData = await alertsRes.json();
      const reportsData = await reportsRes.json();

      setAnalytics(analyticsData);
      setPets(petsData);
      setBiteCases(biteData);
      setAlerts(alertsData);
      setAnonymousReports(reportsData);
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [token]);

  const handleUpdatePoundControl = async (id: string) => {
    try {
      const response = await fetch(`/api/pets/${id}/pound`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          impounded: poundStatus,
          eligibleForAdoption: adoptionEligible,
          adoptionDetails: adoptionDetails
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update pound state');
      }

      setEditingPetId(null);
      fetchAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const startPoundEditing = (pet: Pet) => {
    setEditingPetId(pet.id);
    setPoundStatus(pet.impounded);
    setAdoptionEligible(pet.eligibleForAdoption);
    setAdoptionDetails(pet.adoptionDetails || '');
  };

  // Filtered list
  const filteredPets = pets.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBarangay = filterBarangay ? p.barangay === filterBarangay : true;
    return matchesSearch && matchesBarangay;
  });

  // Calculate leashed vs unleashed confinement setup distribution across the top barangays
  const barangayComplianceData = (() => {
    const map: Record<string, { barangay: string; leashed: number; unleashed: number; total: number }> = {};
    pets.forEach(p => {
      const brgy = p.barangay || 'San Julian';
      if (!map[brgy]) {
        map[brgy] = { barangay: brgy, leashed: 0, unleashed: 0, total: 0 };
      }
      if (p.confinementSetup === 'Leashed') {
        map[brgy].leashed += 1;
      } else {
        map[brgy].unleashed += 1;
      }
      map[brgy].total += 1;
    });
    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8); // Top 8 active barangays
  })();

  const recentActivities = (() => {
    const approvals = pets
      .filter(p => p.verificationStatus === 'Active')
      .map(p => ({
        id: `reg-${p.id}`,
        type: 'approval',
        title: 'Registration Approved',
        description: `Pet "${p.name}" (${p.breed}) owned by ${p.ownerName} was officially approved and added to the active registry.`,
        timestamp: p.registeredAt || '2026-06-24',
        barangay: p.barangay,
        severity: 'low'
      }));

    const strays = anonymousReports.map(r => ({
      id: `stray-${r.id}`,
      type: 'stray',
      title: 'Stray Sighting Reported',
      description: `A loose/roaming ${r.classification.toLowerCase()} (${r.color}) was reported anonymously in Brgy. ${r.barangay}. Additional traits: ${r.additionalTraits || 'None'}.`,
      timestamp: r.reportedAt || '2026-06-24',
      barangay: r.barangay,
      severity: 'medium'
    }));

    const expiredVac = pets
      .filter(p => p.vaccinatedStatus === 'Expired')
      .map(p => ({
        id: `vac-${p.id}`,
        type: 'critical',
        title: 'Rabies Protection Expired',
        description: `Immunization shield expired for "${p.name}" (Owner: ${p.ownerName}). Contact number: ${p.ownerPhone}. Immediate booster recommended.`,
        timestamp: p.lastVaccinatedDate || '2026-06-24',
        barangay: p.barangay,
        severity: 'high'
      }));

    const crossAlerts = alerts.map(a => ({
      id: `alert-${a.id}`,
      type: 'critical',
      title: 'Cross-Barangay Stray Alert',
      description: a.message,
      timestamp: a.createdAt || '2026-06-24',
      barangay: a.targetBarangay,
      severity: 'high'
    }));

    return [...approvals, ...strays, ...expiredVac, ...crossAlerts]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 8); // Top 8 most recent
  })();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <RefreshCw className="h-10 w-10 text-amber-500 animate-spin mb-2" />
        <p className="text-sm text-stone-500 font-medium">Assembling administrative ledger, please wait...</p>
      </div>
    );
  }

  const handleDownloadBackup = () => {
    try {
      const backupData = {
        exportedAt: new Date().toISOString(),
        system: "Irosin Sorsogon Pet Registry & Monitoring System",
        version: "1.2.0",
        summary: {
          totalPets: pets.length,
          totalBiteCases: biteCases.length,
          totalAlerts: alerts.length,
          totalAnonymousReports: anonymousReports.length
        },
        records: {
          pets,
          biteCases,
          alerts,
          anonymousReports
        }
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `irosin_pet_registry_snapshot_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Backup Generation Failed: ${err.message}`);
    }
  };

  // Visual Palette colors
  const COLORS = ['#fbbf24', '#f59e0b', '#78350f', '#d97706', '#fef3c7'];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-3xl border border-amber-100 shadow-xs">
        <div>
          <h2 className="font-display font-black text-2xl text-stone-900 flex items-center gap-2">
            <Award className="text-amber-500 h-7 w-7" />
            MUNICIPAL VET / AGRICULTURE OFFICE
          </h2>
          <p className="text-sm text-amber-950/80 font-medium mt-1">
            Core Master CRUD Control, Disease Prevention Hotspots, and Pound Administration for Irosin
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={handleDownloadBackup}
            className="flex items-center gap-2 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-800 border border-stone-250 font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
            title="Initiate a secure full database snapshot download (JSON format) for local archiving"
          >
            <Download className="h-4 w-4 text-stone-600 animate-bounce-slow" />
            <span>Database Backup</span>
          </button>
          <button
            onClick={fetchAllData}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
          >
            <RefreshCw className="h-4.5 w-4.5" />
            Synchronize Registry
          </button>
        </div>
      </div>

      {/* Onboarding Guidance Tooltip Container */}
      <OnboardingGuidance role="admin" />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-950 text-sm flex gap-2 items-center">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Aggregate metrics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 border border-stone-200 rounded-2xl shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">Total Registered Pets</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Compass className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-display font-black text-stone-900">{pets.length}</p>
          <div className="text-[10px] text-stone-400 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5 text-amber-500" />
            All verified and pending records
          </div>
        </div>

        <div className="bg-white p-5 border border-stone-200 rounded-2xl shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">Vaccination Coverage</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-display font-black text-stone-900">
            {analytics?.vaccination?.total ? Math.round((analytics.vaccination.active / analytics.vaccination.total) * 100) : 0}%
          </p>
          <div className="text-[10px] text-amber-700 font-semibold mt-1">
            {analytics?.vaccination?.active} Active vs {analytics?.vaccination?.expired} Expired
          </div>
        </div>

        <div className="bg-white p-5 border border-stone-200 rounded-2xl shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">Leash Compliance</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Grid className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-display font-black text-stone-900">
            {analytics?.compliance?.total ? Math.round((analytics.compliance.leashed / analytics.compliance.total) * 100) : 0}%
          </p>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">
            {analytics?.compliance?.leashed} leashed dogs & cats monitored
          </div>
        </div>

        <div className="bg-white p-5 border border-stone-200 rounded-2xl shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">Pound & Adoption</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Heart className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-display font-black text-stone-900">{analytics?.pound?.impounded || 0}</p>
          <div className="text-[10px] text-amber-700 font-semibold mt-1">
            {analytics?.pound?.adoptionEligible || 0} strays pushed to Adoption Board
          </div>
        </div>
      </div>

      {/* Analytics Visualization Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hotspots Chart (Bar Chart) */}
        <div className="bg-white p-5 border border-stone-200 rounded-2xl shadow-xs lg:col-span-2">
          <h3 className="font-display font-bold text-stone-900 mb-4 flex items-center gap-2">
            <Flame className="text-amber-500 h-5 w-5" />
            Diseases & Loose Animal Hotspots (By Barangay)
          </h3>
          <div className="h-80 w-full">
            {analytics?.hotspots?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.hotspots.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                  <XAxis dataKey="barangay" stroke="#78716c" fontSize={11} tickLine={false} />
                  <YAxis stroke="#78716c" fontSize={11} tickLine={false} />
                  <Tooltip cursor={{ fill: '#fef3c7', opacity: 0.3 }} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="bites" name="Human Bite Cases" fill="#78350f" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="roaming" name="Roaming/Loose Pets" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-stone-400">
                No active hotspots logged
              </div>
            )}
          </div>
        </div>

        {/* Compliance Pie Chart */}
        <div className="bg-white p-5 border border-stone-200 rounded-2xl shadow-xs">
          <h3 className="font-display font-bold text-stone-900 mb-4 flex items-center gap-2">
            <Users className="text-amber-500 h-5 w-5" />
            Vaccination Compliance Ratio
          </h3>
          <div className="h-64 w-full flex items-center justify-center relative">
            {analytics?.vaccination ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Active (Protected)', value: analytics.vaccination.active },
                      { name: 'Expired/Intact (Vulnerable)', value: analytics.vaccination.expired }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#f59e0b" />
                    <Cell fill="#78350f" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
            <div className="absolute text-center">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wide">Protection</p>
              <p className="text-2xl font-black font-display text-stone-900">
                {analytics?.vaccination?.total ? Math.round((analytics.vaccination.active / analytics.vaccination.total) * 100) : 0}%
              </p>
            </div>
          </div>
          <div className="flex justify-around text-xs mt-2 border-t border-stone-100 pt-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
              <span className="text-stone-600 font-medium">Active Vaccination ({analytics?.vaccination?.active})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-900 inline-block"></span>
              <span className="text-stone-600 font-medium">Expired Vaccine ({analytics?.vaccination?.expired})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Leash vs Unleashed Compliance Distribution by Barangay Chart */}
      <div className="bg-white p-5 border border-stone-200 rounded-2xl shadow-xs">
        <div className="mb-4">
          <span className="bg-amber-100 text-amber-800 text-[9px] uppercase font-bold px-2 py-0.5 rounded-md">
            Confinement Compliance Metrics
          </span>
          <h3 className="font-display font-black text-stone-900 text-base mt-1">
            Leash Compliance & Confinement Setup Distribution across active Barangays
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Real-time comparative analysis tracking pets securely leashed versus loose/roaming animals in the top active communities.
          </p>
        </div>
        
        <div className="h-80 w-full">
          {barangayComplianceData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barangayComplianceData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis dataKey="barangay" stroke="#78716c" fontSize={11} tickLine={false} />
                <YAxis stroke="#78716c" fontSize={11} tickLine={false} />
                <Tooltip cursor={{ fill: '#fef3c7', opacity: 0.15 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="leashed" name="Leashed & Confined" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="unleashed" name="Unleashed / Roaming / Loose" fill="#78350f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-stone-400">
              No registered pet data to aggregate confinement metrics
            </div>
          )}
        </div>
      </div>

      {/* Live Recent Activity Feed & Growth Timeline Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Feed (Takes 2 cols) */}
        <div className="bg-white p-5 border border-stone-200 rounded-2xl shadow-xs lg:col-span-2 flex flex-col">
          <div className="mb-4">
            <span className="bg-amber-100 text-amber-800 text-[9px] uppercase font-bold px-2 py-0.5 rounded-md">
              Real-time Operations
            </span>
            <h3 className="font-display font-black text-stone-900 text-base mt-1 flex items-center gap-2">
              <ClipboardList className="text-amber-500 h-5 w-5 animate-pulse" />
              Municipal Monitoring & Recent Activity Feed
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Live system logs tracking recent stray reports, vaccination warnings, and approvals in Irosin.
            </p>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 flex-1">
            {recentActivities.length > 0 ? (
              recentActivities.map((act) => {
                let badgeColor = "bg-stone-100 text-stone-700 border-stone-200";
                let iconColor = "text-stone-500 bg-stone-50";
                let Icon = Compass;

                if (act.type === 'approval') {
                  badgeColor = "bg-emerald-50 text-emerald-800 border-emerald-100";
                  iconColor = "text-emerald-600 bg-emerald-50";
                  Icon = CheckCircle;
                } else if (act.type === 'stray') {
                  badgeColor = "bg-amber-50 text-amber-800 border-amber-100";
                  iconColor = "text-amber-600 bg-amber-50";
                  Icon = Compass;
                } else if (act.type === 'critical') {
                  badgeColor = "bg-rose-50 text-rose-800 border-rose-100";
                  iconColor = "text-rose-600 bg-rose-50";
                  Icon = ShieldAlert;
                }

                return (
                  <div key={act.id} className="p-3 bg-stone-50/50 border border-stone-200/60 rounded-xl flex items-start gap-3 transition-all">
                    <div className={`p-2 rounded-lg shrink-0 ${iconColor}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-bold text-xs text-stone-900">{act.title}</span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${badgeColor}`}>
                          {act.barangay}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed font-medium">
                        {act.description}
                      </p>
                      <div className="text-[9px] text-stone-400 font-bold font-mono">
                        {act.timestamp}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-stone-400 italic py-12">
                No recent activity logged in the database.
              </div>
            )}
          </div>
        </div>

        {/* Registry Growth Panel (Takes 1 col) */}
        <div className="bg-white p-5 border border-stone-200 rounded-2xl shadow-xs flex flex-col">
          <div className="mb-4">
            <span className="bg-amber-100 text-amber-800 text-[9px] uppercase font-bold px-2 py-0.5 rounded-md">
              Demographic Trends
            </span>
            <h3 className="font-display font-black text-stone-900 text-base mt-1">
              Registry Trajectory
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Enrolled pets growth trends.
            </p>
          </div>
          <div className="h-60 w-full flex-1">
            {analytics?.registrationTrend?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.registrationTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                  <XAxis dataKey="month" stroke="#78716c" fontSize={11} />
                  <YAxis stroke="#78716c" fontSize={11} />
                  <Tooltip />
                  <Line type="monotone" dataKey="registered" name="Pets Enrolled" stroke="#d97706" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-stone-400">
                Generating trajectory chart...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Municipal Ledger Database and Pound control */}
      <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-6 border-b border-stone-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="font-display font-bold text-xl text-stone-900">Municipal Master Pet Ledger</h3>
            <p className="text-xs text-stone-500 mt-0.5">Full CRUD view across all 20 Irosin barangays with pound control overrides</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            {/* Barangay Filter */}
            <select
              value={filterBarangay}
              onChange={(e) => setFilterBarangay(e.target.value)}
              className="px-3 py-2 text-xs bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:border-amber-400 rounded-xl font-semibold text-stone-700"
            >
              <option value="">All 20 Barangays</option>
              {IROSIN_BARANGAYS.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            {/* Keyword search */}
            <input
              type="text"
              placeholder="Search pet, owner, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 text-xs bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:border-amber-400 rounded-xl text-stone-950 placeholder-stone-400 flex-1 md:w-64"
            />
          </div>
        </div>

        {/* Master Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-stone-50 text-stone-500 text-[11px] font-bold uppercase tracking-wider border-b border-stone-100">
                <th className="px-6 py-4">Pet Details</th>
                <th className="px-6 py-4">Owner Info</th>
                <th className="px-6 py-4">Barangay</th>
                <th className="px-6 py-4">Confinement</th>
                <th className="px-6 py-4">Health Status</th>
                <th className="px-6 py-4">Pound State</th>
                <th className="px-6 py-4 text-center">Administrative Overrides</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {filteredPets.length > 0 ? (
                filteredPets.map(pet => (
                  <tr key={pet.id} className="hover:bg-amber-50/20 transition-colors">
                    {/* Pet Details */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden border border-stone-200 bg-stone-50">
                          {pet.photoUrl ? (
                            <img
                              src={pet.photoUrl}
                              alt={pet.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center ${
                              pet.classification === 'Dog' ? 'bg-amber-100 text-amber-800' : 'bg-orange-100 text-orange-800'
                            }`}>
                              {pet.classification === 'Dog' ? <Dog className="h-5 w-5" /> : <Cat className="h-5 w-5" />}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-stone-900 flex items-center gap-1.5">
                            {pet.name}
                            {pet.verificationStatus === 'Pending' && (
                              <span className="text-[9px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded-md font-semibold font-mono animate-pulse">
                                Pending Verification
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-stone-500 font-medium">
                            {pet.breed} • {pet.color}
                          </div>
                          <div className="text-[10px] font-mono font-bold text-amber-700 mt-1">
                            ID: {pet.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Owner Info */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-stone-900">{pet.ownerName}</div>
                      <div className="text-xs text-stone-500">{pet.ownerPhone}</div>
                    </td>

                    {/* Barangay */}
                    <td className="px-6 py-4">
                      <span className="font-medium text-stone-900 block">Brgy. {pet.barangay}</span>
                    </td>

                    {/* Confinement */}
                    <td className="px-6 py-4">
                      <span className={`inline-block text-[11px] font-bold px-2 py-1 rounded-lg ${
                        pet.confinementSetup === 'Leashed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-red-50 text-red-700 border border-red-100'
                      }`}>
                        {pet.confinementSetup}
                      </span>
                    </td>

                    {/* Health Status */}
                    <td className="px-6 py-4 space-y-1">
                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${pet.vaccinatedStatus === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        <span className="text-xs font-semibold text-stone-700">
                          Rabies: {pet.vaccinatedStatus}
                        </span>
                      </div>
                      <div className="text-[10px] text-stone-400 font-semibold">
                        Surg: {pet.spayNeuterStatus}
                      </div>
                    </td>

                    {/* Pound State */}
                    <td className="px-6 py-4">
                      {pet.impounded ? (
                        <span className="inline-block text-[10px] font-bold bg-amber-600 text-white px-2 py-0.5 rounded-md">
                          IMPOUNDED
                        </span>
                      ) : (
                        <span className="text-xs text-stone-400 font-medium">Safe in Community</span>
                      )}
                      {pet.eligibleForAdoption && (
                        <span className="block text-[10px] font-bold text-emerald-600 mt-0.5">
                          ✓ Public Adoption Board
                        </span>
                      )}
                    </td>

                    {/* Administrative Overrides */}
                    <td className="px-6 py-4 text-center">
                      {editingPetId === pet.id ? (
                        <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-left space-y-3 min-w-[280px]">
                          <p className="text-xs font-bold text-stone-900 border-b border-stone-200 pb-1.5">
                            Update Pound Configuration
                          </p>
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-stone-700">Impounded State</label>
                            <input
                              type="checkbox"
                              checked={poundStatus}
                              onChange={(e) => setPoundStatus(e.target.checked)}
                              className="accent-amber-500 h-4 w-4"
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-stone-700">Eligible for Adoption</label>
                            <input
                              type="checkbox"
                              checked={adoptionEligible}
                              onChange={(e) => setAdoptionEligible(e.target.checked)}
                              className="accent-amber-500 h-4 w-4"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-stone-600 block mb-1">Adoption Profile Bio</label>
                            <textarea
                              value={adoptionDetails}
                              onChange={(e) => setAdoptionDetails(e.target.value)}
                              placeholder="Describe characteristics or finding details..."
                              className="w-full p-2 bg-white border border-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 rounded-lg text-xs"
                              rows={2}
                            />
                          </div>

                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() => setEditingPetId(null)}
                              className="px-2.5 py-1.5 text-stone-500 hover:text-stone-700 bg-white border border-stone-200 rounded-lg text-xs font-semibold"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleUpdatePoundControl(pet.id)}
                              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                            >
                              <Check className="h-3 w-3" />
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-1.5 justify-center items-center">
                          <button
                            onClick={() => startPoundEditing(pet)}
                            className="px-2.5 py-1.5 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Edit className="h-3 w-3" />
                            <span>Configure Pound/Adoption</span>
                          </button>
                          {pet.verificationStatus === 'Active' && (
                            <MedicalPassportButton pet={pet} variant="compact" />
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-stone-400 text-xs">
                    No registered pets found matching the criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
