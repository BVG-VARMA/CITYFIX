import React from 'react';
import { 
  Shield, 
  User, 
  ArrowRight, 
  Languages, 
  Sparkles,
  Building2,
  Lock,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function RoleSelectGateway({ onSelectOfficer, onSelectCitizen }) {
  const { language, setLanguage, t } = useAuth();

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-8 relative">
      
      {/* Background Ambience Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md space-y-6 relative z-10">
        
        {/* Top Header */}
        <div className="text-center space-y-2 mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-100 tracking-tight">
            {t('howToContinue') || 'How would you like to continue?'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Select your role to access the CityFix civic network
          </p>
        </div>

        {/* Dual Cards Container */}
        <div className="space-y-4">
          
          {/* CARD 1: OFFICER / MUNICIPAL */}
          <div className="group bg-[#0e1f33]/90 hover:bg-[#122842] border border-[#1e3857] hover:border-cyan-500/50 rounded-3xl p-6 sm:p-7 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 text-center space-y-4">
            
            {/* Officer Avatar Circle */}
            <div className="w-20 h-20 mx-auto rounded-full bg-[#163252] border-2 border-cyan-500/30 flex items-center justify-center text-4xl shadow-inner shadow-black/40 group-hover:scale-105 group-hover:border-cyan-400 transition-all">
              <span>👮</span>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-slate-100 font-display">
                {t('officer') || 'Officer'}
              </h2>
              <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
                {t('officerSubtitle') || 'Access the officer dashboard, alerts and management tools.'}
              </p>
            </div>

            <button
              onClick={onSelectOfficer}
              type="button"
              className="w-full py-3 px-4 rounded-2xl bg-[#1e344f] hover:bg-gradient-to-r hover:from-teal-500 hover:to-cyan-500 text-slate-200 hover:text-slate-950 font-bold text-xs sm:text-sm border border-[#2a4a70] hover:border-transparent shadow-md transition-all flex items-center justify-center gap-2 group-hover:shadow-cyan-500/20"
            >
              <span>{t('continueAsOfficer') || 'Continue as Officer'}</span>
              <ChevronRight className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
            </button>

          </div>

          {/* CARD 2: CITIZEN */}
          <div className="group bg-[#0e1f33]/90 hover:bg-[#122842] border border-[#1e3857] hover:border-cyan-500/50 rounded-3xl p-6 sm:p-7 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 text-center space-y-4">
            
            {/* Citizen Avatar Circle */}
            <div className="w-20 h-20 mx-auto rounded-full bg-[#163252] border-2 border-blue-500/30 flex items-center justify-center text-4xl shadow-inner shadow-black/40 group-hover:scale-105 group-hover:border-cyan-400 transition-all">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-cyan-400">
                <User className="w-8 h-8 fill-cyan-400/30 text-cyan-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-slate-100 font-display">
                {t('citizen') || 'Citizen'}
              </h2>
              <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
                {t('citizenSubtitle') || 'Report issues, receive alerts and access citizen services.'}
              </p>
            </div>

            <button
              onClick={onSelectCitizen}
              type="button"
              className="w-full py-3 px-4 rounded-2xl bg-[#1e344f] hover:bg-gradient-to-r hover:from-teal-500 hover:to-cyan-500 text-slate-200 hover:text-slate-950 font-bold text-xs sm:text-sm border border-[#2a4a70] hover:border-transparent shadow-md transition-all flex items-center justify-center gap-2 group-hover:shadow-cyan-500/20"
            >
              <span>{t('continueAsCitizen') || 'Continue as Citizen'}</span>
              <ChevronRight className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
            </button>

          </div>

        </div>

        {/* Footer Brand info */}
        <div className="text-center pt-2">
          <p className="text-[11px] text-slate-500">
            CityFix 2026 • AI-Powered Municipal Grievance & Real-Time GIS Dispatch
          </p>
        </div>

      </div>

    </div>
  );
}
