import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, RefreshCw, Key, UserPlus, LogIn, Lock, HelpCircle,
  Eye, Heart, MapPin, Award, Hospital, Dog, Cat, CheckCircle, AlertTriangle
} from 'lucide-react';
import { User, Pet, IROSIN_BARANGAYS } from './types';
import Navbar from './components/Navbar';
import AdminDashboard from './components/AdminDashboard';
import OperatorDashboard from './components/OperatorDashboard';
import BiteCenterDashboard from './components/BiteCenterDashboard';
import VetDashboard from './components/VetDashboard';
import OwnerDashboard from './components/OwnerDashboard';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Forgot Password / Reset Password states
  const [resetTokenParam, setResetTokenParam] = useState<string>('');
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [resetPassword, setResetPassword] = useState<string>('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState<string>('');
  const [showForgotForm, setShowForgotForm] = useState<boolean>(false);
  const [showResetForm, setShowResetForm] = useState<boolean>(false);
  const [simulatedVerificationInbox, setSimulatedVerificationInbox] = useState<{
    to: string;
    subject: string;
    body: string;
    token: string;
  } | null>(null);

  // Credentials form
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // Register form
  const [regForm, setRegForm] = useState({
    username: '',
    password: '',
    email: '',
    name: '',
    phone: '',
    barangay: 'San Julian'
  });

  // Public QR scan state
  const [scanResultId, setScanResultId] = useState<string | null>(null);
  const [scannedPet, setScannedPet] = useState<Pet | null>(null);
  const [scanLoading, setScanLoading] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string>('');

  // Check URL query parameters for scan (e.g. ?scan=pet-001) or reset token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scanId = params.get('scan');
    const resetToken = params.get('resetToken');
    if (scanId) {
      setScanResultId(scanId);
      loadPublicPet(scanId);
    } else if (resetToken) {
      setResetTokenParam(resetToken);
      setShowResetForm(true);
      setShowForgotForm(false);
      setIsRegistering(false);
      setSuccess('Verification token matched. Please set your new password.');
      // Clean up resetToken from browser URL bar without reloading
      window.history.replaceState({}, document.title, window.location.pathname);
      setLoading(false);
    } else {
      checkSession();
    }
  }, []);

  const checkSession = async () => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${savedToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setToken(savedToken);
      } else {
        // Clear stale session
        localStorage.removeItem('token');
        setToken(null);
      }
    } catch (err) {
      console.error('Session verify failed', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPublicPet = async (id: string) => {
    setScanLoading(true);
    setScanError('');
    try {
      const response = await fetch(`/api/pets/${id}`);
      if (!response.ok) {
        throw new Error(`Animal with ID ${id} not found in Irosin Municipal database.`);
      }
      const data = await response.json();
      setScannedPet(data);
    } catch (err: any) {
      setScanError(err.message || 'Error loading animal passport');
    } finally {
      setScanLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Invalid credentials');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      setUsername('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Server error during login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Registration failed');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      setSuccess('Registration successful! mabuhay, welcome to your dashboard.');
      setIsRegistering(false);
    } catch (err: any) {
      setError(err.message || 'Server error during registration');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setSuccess('');
    setError('');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to request password reset.');
      }

      setSuccess(data.message);
      if (data._devSimulatedEmail) {
        setSimulatedVerificationInbox(data._devSimulatedEmail);
      }
    } catch (err: any) {
      setError(err.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (resetPassword !== resetConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetTokenParam, newPassword: resetPassword })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }

      setSuccess(data.message);
      setShowResetForm(false);
      setShowForgotForm(false);
      setIsRegistering(false);
      setResetTokenParam('');
      setResetPassword('');
      setResetConfirmPassword('');
      setSimulatedVerificationInbox(null);
    } catch (err: any) {
      setError(err.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  const clearPublicScan = () => {
    window.history.replaceState({}, document.title, window.location.pathname);
    setScanResultId(null);
    setScannedPet(null);
    setError('');
    setSuccess('');
  };

  // --- Rendering distinct states ---

  if (scanResultId) {
    // 1. PUBLIC SCAN PASSPORT VIEW
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800 font-sans">
        {/* Simple minimal header */}
        <header className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-400 rounded-md flex items-center justify-center font-bold text-white shadow-xs">
              IPM
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-none">IROSIN PET PASSPORT</h1>
              <span className="text-[9px] font-semibold text-slate-400 tracking-widest uppercase">Public Verification Gateway</span>
            </div>
          </div>
          <button
            onClick={clearPublicScan}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 underline flex items-center gap-1 cursor-pointer"
          >
            Access Login Portal
          </button>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="text-center border-b border-slate-100 pb-4">
              <span className="bg-amber-100 text-amber-800 text-[10px] uppercase font-bold px-2.5 py-1 rounded-md">
                Official Rabies & Health Audit
              </span>
              <h2 className="font-display font-black text-2xl text-slate-900 mt-2">Collar Tag Verified</h2>
              <p className="text-xs text-slate-400 mt-0.5">Scanned from municipal identifier collar tag</p>
            </div>

            {scanLoading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <RefreshCw className="h-8 w-8 text-amber-500 animate-spin mb-2" />
                <p className="text-xs text-slate-500 font-medium">Querying master municipal registry...</p>
              </div>
            ) : scanError ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex gap-2.5">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                <div>
                  <p className="font-bold">Dossier Retrieval Issue</p>
                  <p className="mt-0.5">{scanError}</p>
                </div>
              </div>
            ) : scannedPet ? (
              <div className="space-y-4">
                {/* Animal Specs Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex gap-4">
                  <div className={`p-3 rounded-xl h-12 w-12 shrink-0 flex items-center justify-center ${
                    scannedPet.classification === 'Dog' ? 'bg-amber-100 text-amber-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {scannedPet.classification === 'Dog' ? <Dog className="h-6 w-6" /> : <Cat className="h-6 w-6" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{scannedPet.name}</h3>
                    <p className="text-xs text-slate-500 font-semibold">{scannedPet.breed} • {scannedPet.color} • {scannedPet.gender}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">ID: {scannedPet.id}</p>
                  </div>
                </div>

                {/* Health Indicators */}
                <div className="grid grid-cols-1 gap-3">
                  {/* Rabies Status Banner */}
                  <div className={`p-4 rounded-2xl border flex gap-3 ${
                    scannedPet.vaccinatedStatus === 'Active'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-red-50 border-red-200 text-red-950'
                  }`}>
                    <CheckCircle className={`h-5 w-5 shrink-0 ${scannedPet.vaccinatedStatus === 'Active' ? 'text-emerald-600' : 'text-red-600'}`} />
                    <div className="text-xs">
                      <p className="font-bold">Rabies Vaccine Status: {scannedPet.vaccinatedStatus}</p>
                      <p className="mt-0.5">
                        {scannedPet.vaccinatedStatus === 'Active'
                          ? `Immunized against Rabies. Booster date verified on ${scannedPet.lastVaccinatedDate}.`
                          : 'This animal is currently unprotected. Booster inoculation required.'}
                      </p>
                    </div>
                  </div>

                  {/* Confinement Setup */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold block uppercase text-[9px]">Location Enrolled</span>
                      <span className="font-bold text-slate-800">Brgy. {scannedPet.barangay}, Irosin</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-100">
                      <span className="text-slate-400 font-bold block uppercase text-[9px]">Confinement Style</span>
                      <span className={`font-semibold ${scannedPet.confinementSetup === 'Leashed' ? 'text-emerald-700' : 'text-red-700'}`}>
                        {scannedPet.confinementSetup}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-100">
                      <span className="text-slate-400 font-bold block uppercase text-[9px]">Sterilization</span>
                      <span className="font-semibold text-slate-800">{scannedPet.spayNeuterStatus}</span>
                    </div>
                  </div>
                </div>

                {/* Privacy Safeguard notice */}
                <div className="bg-amber-50 p-3 border border-amber-200 rounded-xl text-[10px] text-amber-900 leading-relaxed text-center font-medium">
                  🔒 Resident Owner Information is obfuscated to comply with municipal privacy directives. For official health concerns, please notify the Municipal Vet.
                </div>
              </div>
            ) : null}

            <button
              onClick={clearPublicScan}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Exit Verification Portal
            </button>
          </div>
        </main>

        <footer className="h-10 bg-white border-t border-slate-200 px-6 flex items-center justify-center text-[9px] font-bold text-slate-400 shrink-0">
          MUNICIPALITY OF IROSIN • SORSOGON PET PASSPORT SYSTEM
        </footer>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <RefreshCw className="h-12 w-12 text-amber-500 animate-spin mb-3" />
        <h3 className="font-display font-extrabold text-slate-900 text-lg">Initializing Pet Registry Network...</h3>
        <p className="text-xs text-slate-400 mt-1">Bootstrapping cloud authorization pipelines & Sorsogon databases</p>
      </div>
    );
  }

  if (!token || !user) {
    // 2. THE LOGIN GATEWAY / SIGNUP SCREEN
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800 font-sans">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-400 rounded-md flex items-center justify-center font-bold text-white shadow-xs">
              IPM
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900 leading-none">IROSIN PET REGISTRY</h1>
              <span className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase block mt-0.5">Municipal Health & Public Safety</span>
            </div>
          </div>
          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md font-mono">
            V2.1.0-STABLE
          </span>
        </header>

        {/* Central Auth Area */}
        <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-10 px-4 py-8 max-w-7xl mx-auto w-full">
          {/* Welcome Info & Geometric Grid Column */}
          <div className="flex-1 space-y-6 max-w-lg text-left">
            <div className="space-y-2">
              <span className="bg-amber-400 text-amber-950 text-[10px] uppercase font-bold px-2.5 py-1 rounded-md tracking-wider">
                Sorsogon Regional Initiative
              </span>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900 leading-none">
                Pet Registry & Rabies Prevention Network
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Empowering Irosin with robust clinical registries, instant smartphone-camera QR verification, automated booster vaccine countdown alerts, and community-wide stray coordination.
              </p>
            </div>

            {/* Feature Bento Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1">
                <Award className="h-5 w-5 text-amber-500" />
                <h4 className="font-bold text-xs text-slate-900">RBAC Verified</h4>
                <p className="text-[10px] text-slate-400 leading-tight">5 operational roles tailored for municipal operators, bite clinics, and owners.</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1">
                <Hospital className="h-5 w-5 text-emerald-500" />
                <h4 className="font-bold text-xs text-slate-900">Medical Dossier</h4>
                <p className="text-[10px] text-slate-400 leading-tight">Instantly log anti-rabies inoculations and spay/neuter operations on tags.</p>
              </div>
            </div>

            {/* High-security system note */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
                Official Municipal Access
              </span>
              <p className="text-[11px] text-slate-500 leading-normal">
                Credentials are encrypted and stored in the central Irosin database. For security evaluations, refer to the pre-authorized administrative and operator accounts using password <code className="font-mono bg-stone-100 text-stone-800 px-1 rounded text-[10px] font-bold">123</code>.
              </p>
            </div>
          </div>

          {/* Login/Signup Forms Column */}
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex border-b border-slate-100 pb-3 justify-between items-center">
              <h3 className="font-display font-black text-lg text-slate-900">
                {showResetForm ? 'Reset Credentials' : showForgotForm ? 'Password Recovery' : isRegistering ? 'Resident Signup' : 'Identity Gateway'}
              </h3>
              <button
                onClick={() => {
                  setError('');
                  setSuccess('');
                  if (showResetForm) {
                    setShowResetForm(false);
                    setShowForgotForm(false);
                    setIsRegistering(false);
                  } else if (showForgotForm) {
                    setShowForgotForm(false);
                    setIsRegistering(false);
                  } else {
                    setIsRegistering(!isRegistering);
                  }
                }}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 underline cursor-pointer"
              >
                {showResetForm || showForgotForm ? 'Back to Sign In' : isRegistering ? 'Back to Sign In' : 'Create Resident Account'}
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-950 text-[11px] flex gap-2 items-center">
                <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 text-[11px] flex gap-2 items-center">
                <CheckCircle className="h-4.5 w-4.5 shrink-0 text-emerald-600" />
                <span>{success}</span>
              </div>
            )}

            {showResetForm ? (
              /* RESET PASSWORD FORM */
              <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
                <p className="text-slate-500 leading-relaxed">
                  Verify your secure token code and choose a new password for your account.
                </p>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Verification Token</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Enter verification token"
                      value={resetTokenParam}
                      onChange={(e) => setResetTokenParam(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-amber-500 pl-8"
                    />
                    <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-amber-500 pl-8"
                    />
                    <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-amber-500 pl-8"
                    />
                    <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Verify Token & Update Password
                </button>
              </form>
            ) : showForgotForm ? (
              /* FORGOT PASSWORD REQUEST FORM */
              <form onSubmit={handleForgotPassword} className="space-y-4 text-xs">
                <p className="text-slate-500 leading-relaxed">
                  Enter your registered email address, and we will dispatch a secure 1-hour verification token to reset your password.
                </p>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Registered Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="e.g. gozarinjohan87@gmail.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-amber-500 pl-8"
                    />
                    <LogIn className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Dispatch Security Code
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotForm(false);
                    setShowResetForm(true);
                    setSuccess('');
                    setError('');
                  }}
                  className="w-full text-center text-[11px] font-bold text-slate-500 hover:text-amber-600 hover:underline pt-1 block"
                >
                  Already have a reset verification token? Reset password
                </button>
              </form>
            ) : !isRegistering ? (
              /* LOGIN FORM */
              <form onSubmit={handleLogin} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Username</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Enter username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-amber-500 pl-8"
                    />
                    <LogIn className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700 block">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotForm(true);
                        setIsRegistering(false);
                        setShowResetForm(false);
                        setError('');
                        setSuccess('');
                      }}
                      className="text-[10px] font-bold text-amber-600 hover:text-amber-700 underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-amber-500 pl-8"
                    />
                    <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Authenticate Session
                </button>
              </form>
            ) : (
              /* REGISTER RESIDENT FORM */
              <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Account Username</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. juandelacruz"
                      value={regForm.username}
                      onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. resident@example.com"
                      value={regForm.email}
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Secure Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Full Citizen Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Juan Dela Cruz"
                      value={regForm.name}
                      onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Contact Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 0917-123-4567"
                      value={regForm.phone}
                      onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Designated Barangay of Residence</label>
                  <select
                    value={regForm.barangay}
                    onChange={(e) => setRegForm({ ...regForm, barangay: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  >
                    {IROSIN_BARANGAYS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Register Owner Profile
                </button>
              </form>
            )}

            {/* Simulated verification mailbox box for direct local execution verification */}
            {simulatedVerificationInbox && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-left">
                <div className="flex items-center gap-2 pb-2 border-b border-amber-100">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex-1">
                    📬 Simulated Email Verification Inbox
                  </span>
                  <button
                    onClick={() => setSimulatedVerificationInbox(null)}
                    className="text-[10px] text-amber-600 hover:text-amber-800 underline font-semibold"
                  >
                    Dismiss
                  </button>
                </div>
                <div className="text-[11px] text-amber-950 space-y-1">
                  <p><strong>To:</strong> <span className="font-mono text-slate-700">{simulatedVerificationInbox.to}</span></p>
                  <p><strong>Subject:</strong> {simulatedVerificationInbox.subject}</p>
                  <div className="bg-white/80 p-2 border border-amber-100 rounded-lg text-[10px] font-mono text-slate-600 mt-2 whitespace-pre-wrap leading-tight max-h-36 overflow-y-auto">
                    {simulatedVerificationInbox.body}
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setResetTokenParam(simulatedVerificationInbox.token);
                        setShowResetForm(true);
                        setShowForgotForm(false);
                        setIsRegistering(false);
                        setSuccess('Verification token matched. Please set your new password.');
                      }}
                      className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Key className="h-3 w-3" />
                      Auto-Prefill & Proceed to Reset
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        <footer className="h-10 bg-white border-t border-slate-200 px-6 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0">
          PROVINCE OF SORSOGON • MUNICIPALITY OF IROSIN • PUBLIC HEALTH SECTOR
        </footer>
      </div>
    );
  }

  // 3. SECURED ROLE-BASED DASHBOARDS
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800 font-sans">
      <Navbar user={user} onLogout={handleLogout} token={token} />

      <main className="flex-1">
        {user.role === 'admin' && <AdminDashboard token={token} />}
        {user.role === 'operator' && <OperatorDashboard token={token} barangay={user.barangay || 'San Julian'} />}
        {user.role === 'bite_center' && <BiteCenterDashboard token={token} />}
        {user.role === 'vet_clinic' && <VetDashboard token={token} />}
        {user.role === 'owner' && <OwnerDashboard token={token} user={user} />}
      </main>

      {/* Dynamic Status Footer */}
      <footer className="h-10 bg-slate-100 border-t border-slate-200 px-8 flex items-center justify-between text-[10px] font-bold text-slate-400 shrink-0">
        <div>MUNICIPALITY OF IROSIN • PROVINCE OF SORSOGON • SECURITY LEVEL: SECURED</div>
        <div className="flex items-center gap-4">
          <span>SYSTEM VERSION 2.1.0-STABLE</span>
          <span className="text-emerald-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            RBAC ACTIVE
          </span>
        </div>
      </footer>
    </div>
  );
}
