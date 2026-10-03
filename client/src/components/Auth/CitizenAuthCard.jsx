import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  Lock, 
  MapPin, 
  ArrowRight, 
  ArrowLeft, 
  Languages, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Compass
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function CitizenAuthCard({ onBack, onAuthSuccess, onGuestExplore }) {
  const { t, language, setLanguage, login, register } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [ward, setWard] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'register') {
        if (!name.trim()) throw new Error('Please enter your full name');
        if (!phone.trim() || phone.trim().length < 10) throw new Error('Please enter a valid 10-digit mobile number');
        if (!password || password.length < 4) throw new Error('Password must be at least 4 characters');

        await register({
          name: name.trim(),
          phone: phone.trim(),
          password,
          ward: ward.trim() || 'General Ward'
        });
      } else {
        if (!phone.trim() || !password) throw new Error('Please enter your mobile phone number and password');
        await login(phone.trim(), password);
      }

      if (onAuthSuccess) onAuthSuccess();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      window.history.back();
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0a192f] border border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Glow accent */}
        <div className="absolute -right-20 -top-20 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Back Link & Language Switcher */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#1e3857]">
          <button
            type="button"
            onClick={handleBack}
            className="text-xs text-slate-400 hover:text-cyan-300 inline-flex items-center gap-1.5 transition-colors font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('backToRoles') || 'Back'}</span>
          </button>

          <div className="flex items-center gap-1 bg-[#0f2438] p-1 rounded-xl border border-[#1e3857]">
            {[
              { code: 'en', label: 'EN' },
              { code: 'te', label: 'తె' },
              { code: 'hi', label: 'हि' }
            ].map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                  language === lang.code
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Header Icon */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-xl shadow-cyan-500/15">
            <User className="w-7 h-7" />
          </div>
          <h2 className="font-display font-bold text-2xl text-slate-100">
            {mode === 'login' ? t('authWelcomeBack') || 'Citizen Sign In' : t('authCreateAccount') || 'Register Citizen Account'}
          </h2>
          <p className="text-xs text-slate-400">
            {mode === 'login' 
              ? 'Enter your registered mobile number and password' 
              : 'Sign up to report civic issues and receive live SMS updates'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-[#0f2438] rounded-2xl border border-[#1e3857] mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('signInSubmit') || 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'register'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('authCreateAccount') || 'Create Account'}
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('fullName') || 'Full Name'} *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Varma"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0f2438] border border-[#1e3857] text-slate-100 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t('phoneNumber') || 'Mobile Phone Number'} *
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 flex items-center gap-1 text-slate-400 text-xs font-mono font-semibold pointer-events-none">
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                <span>+91</span>
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="9876543210"
                maxLength={10}
                className="w-full pl-16 pr-4 py-2.5 rounded-xl bg-[#0f2438] border border-[#1e3857] text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t('password') || 'Password'} *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0f2438] border border-[#1e3857] text-slate-100 text-xs focus:outline-none focus:border-cyan-500 font-mono transition-colors"
                required
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('wardArea') || 'Ward / Colony'} (Optional)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  placeholder="e.g. Ward 14, Main Road Colony"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0f2438] border border-[#1e3857] text-slate-100 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50 mt-2"
          >
            {isSubmitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{mode === 'register' ? 'Register & Enter Citizen Portal' : 'Sign In to Citizen Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>

        {/* Guest Explore Option */}
        {onGuestExplore && (
          <div className="mt-5 pt-4 border-t border-[#1e3857] text-center">
            <button
              type="button"
              onClick={onGuestExplore}
              className="text-xs text-slate-400 hover:text-cyan-300 inline-flex items-center gap-1.5 transition-colors font-medium"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Continue as Guest to View Civic Map →</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
