import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin({ onBackToGateway }) {
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your officer email/phone and password');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await login(email.trim(), password);
      if (res.user.role !== 'admin') {
        throw new Error('This account does not have municipal administrator privileges.');
      }
    } catch (err) {
      setError(err.message || 'Invalid officer credentials. Please check details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (onBackToGateway) {
      onBackToGateway();
    } else if (window.history.length > 1) {
      window.history.back();
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0a192f] border border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Glow accent */}
        <div className="absolute -right-20 -top-20 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Back Link */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleBack}
            className="text-xs text-slate-400 hover:text-cyan-300 inline-flex items-center gap-1.5 transition-colors font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Role Selection</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-xl shadow-cyan-500/15">
            <Shield className="w-8 h-8" />
          </div>
          <span className="text-[10px] font-mono uppercase font-bold tracking-widest px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 inline-block">
            MUNICIPAL OFFICER GATEWAY
          </span>
          <h2 className="font-display font-bold text-2xl text-slate-100">
            Admin Command Center
          </h2>
          <p className="text-xs text-slate-400">
            Secure sign-in for municipal supervisors, dispatchers & field engineers
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Officer Email or Mobile
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@cityfix.org"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0f2438] border border-[#1e3857] text-slate-100 text-xs focus:outline-none focus:border-cyan-500 font-mono transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Security Access Key / Password
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50 mt-4"
          >
            {isSubmitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Enter Admin Command Center</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
