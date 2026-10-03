import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Lock, 
  MapPin, 
  Phone, 
  ArrowRight, 
  Languages, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const { t, language, setLanguage, login, register } = useAuth();
  
  const [mode, setMode] = useState('register'); // 'register' | 'login'
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [ward, setWard] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'register') {
        if (!name.trim()) throw new Error('Please enter your full name');
        if (!phone.trim()) throw new Error('Please enter your 10-digit mobile number');
        if (!password || password.length < 4) throw new Error('Password must be at least 4 characters');

        await register({
          name,
          phone: phone.trim(),
          password,
          ward: ward || 'General Ward'
        });
      } else {
        if (!phone.trim() || !password) throw new Error('Please enter your mobile phone number and password');
        await login(phone.trim(), password);
      }

      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-[#0a192f] border border-[#1e3857] rounded-3xl shadow-2xl overflow-hidden z-10 my-8">
        
        {/* Multilingual Switcher Header */}
        <div className="p-4 bg-[#0f2438] border-b border-[#1e3857] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
            <Languages className="w-4 h-4 text-cyan-400" />
            <span>{t('selectLanguage')}:</span>
          </div>

          <div className="flex items-center gap-1 bg-[#0a192f] p-1 rounded-xl border border-[#1e3857]">
            {[
              { code: 'en', label: 'English' },
              { code: 'te', label: 'తెలుగు' },
              { code: 'hi', label: 'हिन्दी' }
            ].map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  language === lang.code
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#16304d] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          <div className="text-center space-y-1">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3 shadow-lg shadow-cyan-500/10">
              <User className="w-6 h-6" />
            </div>
            <h2 className="font-display font-bold text-xl text-slate-100">
              {mode === 'register' ? t('authCreateAccount') : t('authWelcomeBack')}
            </h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {mode === 'register' ? t('authSignUpSubtitle') : t('authSignInSubtitle')}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('fullName')} *
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
                {t('phoneNumber')} *
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
                  placeholder={t('phonePlaceholder')}
                  maxLength={10}
                  className="w-full pl-16 pr-4 py-2.5 rounded-xl bg-[#0f2438] border border-[#1e3857] text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('password')} *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0f2438] border border-[#1e3857] text-slate-100 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('wardArea')} (Optional)
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
                <span>Loading...</span>
              ) : (
                <>
                  <span>{mode === 'register' ? t('signUpSubmit') : t('signInSubmit')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          {/* Toggle between Register and Login */}
          <div className="text-center text-xs text-slate-400 pt-2 border-t border-[#1e3857]/80">
            {mode === 'register' ? (
              <p>
                {t('alreadyHaveAccount')}{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-bold text-cyan-400 hover:underline ml-1"
                >
                  {t('signInSubmit')}
                </button>
              </p>
            ) : (
              <p>
                {t('dontHaveAccount')}{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="font-bold text-cyan-400 hover:underline ml-1"
                >
                  {t('authCreateAccount')}
                </button>
              </p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
