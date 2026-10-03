import React from 'react';
import { Search, MapPin, AlertCircle, Flame } from 'lucide-react';
import { useIssues } from '../../context/IssuesContext';
import { useAuth } from '../../context/AuthContext';
import IssueCard from './IssueCard';

export default function IssueFeed() {
  const { filteredIssues, filters, setFilters, categories } = useIssues();
  const { t } = useAuth();

  const categoryTranslationMap = {
    pothole: 'cat_pothole',
    streetlight: 'cat_streetlight',
    garbage: 'cat_garbage',
    water_leak: 'cat_water_leak',
    traffic_hazard: 'cat_traffic_hazard',
    tree_fallen: 'cat_tree_fallen',
    other: 'cat_other'
  };

  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-lg text-slate-100 flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-400" />
          <span>{t('allCityIssues')}</span>
        </h3>
        <span className="text-xs text-slate-400">
          {filteredIssues.length} matching reports
        </span>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-[#0f2438]/90 backdrop-blur-md border border-[#1e3857] rounded-2xl p-4 shadow-xl space-y-3">
        
        {/* Top Row: Search and Radius Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          
          {/* Search */}
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0a192f] border border-[#1e3857] text-slate-100 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* PostGIS Spatial Radius Selector */}
          <div className="sm:col-span-4 flex items-center gap-2">
            <div className="relative w-full">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-2.5" />
              <select
                value={filters.radius}
                onChange={(e) => setFilters(prev => ({ ...prev, radius: e.target.value }))}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#0a192f] border border-[#1e3857] text-slate-200 text-xs focus:outline-none focus:border-cyan-500 appearance-none transition-colors"
              >
                <option value="all">{t('allCityIssues')}</option>
                <option value="500">{t('within500m')}</option>
                <option value="1000">{t('within1km')}</option>
                <option value="3000">{t('within3km')}</option>
              </select>
            </div>
          </div>

        </div>

        {/* Bottom Row: Category Pills & Status Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1e3857]/60">
          
          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs">
            <button
              onClick={() => setFilters(prev => ({ ...prev, category: 'all' }))}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filters.category === 'all'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-[#16304d]/60 text-slate-300 hover:bg-[#16304d]'
              }`}
            >
              {t('allCategories')}
            </button>
            {categories.map((cat) => {
              const transKey = categoryTranslationMap[cat.id];
              const label = transKey ? t(transKey) : cat.label;
              return (
                <button
                  key={cat.id}
                  onClick={() => setFilters(prev => ({ ...prev, category: cat.id }))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    filters.category === cat.id
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                      : 'bg-[#16304d]/40 text-slate-400 hover:text-slate-200 hover:bg-[#16304d]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Status filter pills */}
          <div className="flex items-center bg-[#0a192f] p-1 rounded-xl border border-[#1e3857] text-xs shrink-0">
            {[
              { id: 'all', label: t('allStatus') },
              { id: 'open', label: t('open') },
              { id: 'in_progress', label: t('inProgress') },
              { id: 'resolved', label: t('resolved') }
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setFilters(prev => ({ ...prev, status: st.id }))}
                className={`px-2.5 py-0.5 rounded-lg font-medium transition-all ${
                  filters.status === st.id
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* Issues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIssues.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-[#0f2438]/50 rounded-3xl border border-[#1e3857] p-8 shadow-xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 shadow-lg shadow-cyan-500/10">
              <MapPin className="w-7 h-7" />
            </div>
            <h4 className="font-display font-bold text-base text-slate-100">
              {filters.search || filters.category !== 'all' || filters.status !== 'all' || filters.radius !== 'all'
                ? t('noIssuesFound')
                : t('noActiveIssuesMsg')}
            </h4>
            <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
              {filters.search || filters.category !== 'all' || filters.status !== 'all' || filters.radius !== 'all'
                ? t('resetFilters')
                : t('beFirstToReport')}
            </p>
            {(filters.search || filters.category !== 'all' || filters.status !== 'all' || filters.radius !== 'all') && (
              <button
                type="button"
                onClick={() => setFilters({ category: 'all', status: 'all', departmentId: 'all', priority: 'all', search: '', radius: 'all', sortBy: 'newest' })}
                className="mt-4 px-4 py-2 rounded-xl bg-[#16304d] hover:bg-[#1e4168] text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition-all"
              >
                {t('resetFilters')}
              </button>
            )}
          </div>
        ) : (
          filteredIssues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))
        )}
      </div>

    </div>
  );
}
