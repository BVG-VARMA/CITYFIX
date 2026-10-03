import React from 'react';
import { MapPin, Plus, Sparkles, Activity, ShieldCheck, Flame, Radio } from 'lucide-react';
import CivicMap from './CivicMap';
import IssueFeed from './IssueFeed';
import { useIssues } from '../../context/IssuesContext';
import { useAuth } from '../../context/AuthContext';

export default function CitizenPortal({ onOpenReportModal }) {
  const { issues, filteredIssues } = useIssues();
  const { user, t } = useAuth();

  const activeReportsCount = issues.filter(i => i.status !== 'resolved').length;
  const resolvedCount = issues.filter(i => i.status === 'resolved').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 lg:px-8 py-6">
      
      {/* Citizen Welcome Banner & Stats Bar */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0c243c] via-[#0f2d4a] to-[#0a1e33] border border-[#1e3857] p-6 lg:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>{t('bannerTag')}</span>
            </div>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-white tracking-tight">
              {t('bannerTitle')} <span className="text-cyan-400">{t('bannerTitleHighlight')}</span>
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {t('bannerDesc')}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-3 rounded-2xl bg-[#0a192f]/80 border border-[#1e3857] backdrop-blur-md">
              <p className="text-[11px] uppercase font-semibold tracking-wider text-slate-400">{t('activeCityIssues')}</p>
              <p className="text-xl font-bold text-amber-400 font-mono mt-0.5">{activeReportsCount}</p>
            </div>

            <div className="px-4 py-3 rounded-2xl bg-[#0a192f]/80 border border-[#1e3857] backdrop-blur-md">
              <p className="text-[11px] uppercase font-semibold tracking-wider text-slate-400">{t('fixedAndClosed')}</p>
              <p className="text-xl font-bold text-emerald-400 font-mono mt-0.5">{resolvedCount}</p>
            </div>

            <button
              onClick={onOpenReportModal}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-5 h-5" />
              <span>{t('reportIssueBtn')}</span>
            </button>
          </div>

        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Map View Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <h3 className="font-display font-bold text-lg text-slate-100">
              {t('liveMapTitle')}
            </h3>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            {t('mapSocketNote')}
          </span>
        </div>

        <CivicMap onOpenReportWithCoords={onOpenReportModal} />
      </section>

      {/* Issues Feed & Upvoting Section */}
      <section className="space-y-3 pt-4">
        <IssueFeed />
      </section>

    </div>
  );
}
