import React from 'react';
import { 
  ThumbsUp, 
  MapPin, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck
} from 'lucide-react';
import { useIssues } from '../../context/IssuesContext';
import { useAuth } from '../../context/AuthContext';

export default function IssueCard({ issue }) {
  const { setSelectedIssue, upvoteIssue, userLocation, getDistanceMeters } = useIssues();
  const { t } = useAuth();

  const isResolved = issue.status === 'resolved';
  const isInProgress = issue.status === 'in_progress';

  const distance = getDistanceMeters(userLocation.lat, userLocation.lng, issue.latitude, issue.longitude);
  const distanceFormatted = distance > 1000 
    ? `${(distance / 1000).toFixed(1)} km ${t('away')}` 
    : `${distance}m ${t('away')}`;

  const categoryMap = {
    pothole: 'cat_pothole',
    streetlight: 'cat_streetlight',
    garbage: 'cat_garbage',
    water_leak: 'cat_water_leak',
    traffic_hazard: 'cat_traffic_hazard',
    tree_fallen: 'cat_tree_fallen',
    other: 'cat_other'
  };

  const translatedCategory = categoryMap[issue.category] ? t(categoryMap[issue.category]) : (issue.categoryLabel || issue.category);

  return (
    <div className="bg-[#0f2438]/80 hover:bg-[#132c45] border border-[#1e3857] hover:border-cyan-500/40 rounded-2xl p-4 transition-all duration-200 shadow-xl flex flex-col justify-between group">
      
      <div>
        {/* Card Header: Category & Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            {translatedCategory}
          </span>

          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
            isResolved
              ? 'badge-resolved'
              : isInProgress
              ? 'badge-in_progress'
              : 'badge-open'
          }`}>
            {isResolved && <CheckCircle2 className="w-3 h-3" />}
            {isInProgress && <Clock className="w-3 h-3 animate-spin" />}
            {isResolved ? t('resolved') : isInProgress ? t('inProgress') : t('open')}
          </span>
        </div>

        {/* Thumbnail & Title */}
        <div className="flex gap-3 mb-3">
          {(issue.resolvedPhotoUrl || issue.photoUrl) && (
            <div 
              onClick={() => setSelectedIssue(issue)}
              className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-[#1e3857] group/thumb cursor-pointer"
            >
              <img
                src={issue.resolvedPhotoUrl || issue.photoUrl}
                alt={issue.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {issue.resolvedPhotoUrl && (
                <div className="absolute bottom-0 inset-x-0 bg-emerald-950/90 text-emerald-300 text-[8px] font-bold text-center py-0.5">
                  ✓ Fixed Photo
                </div>
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-slate-100 line-clamp-2 group-hover:text-cyan-300 transition-colors">
              {issue.title}
            </h3>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              {issue.description}
            </p>
          </div>
        </div>

        {/* Location & Metadata */}
        <div className="space-y-1.5 text-xs text-slate-400 pb-3 border-b border-[#1e3857]/70">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 truncate text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">{issue.address}</span>
            </span>
            <span className="text-cyan-400/90 font-mono shrink-0 ml-2 font-semibold">
              {distanceFormatted}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              <span>{issue.departmentName || 'Public Works'}</span>
            </span>

            {/* If there is citizen rating, display star */}
            {issue.feedback && issue.feedback.length > 0 ? (
              <span className="text-amber-400 font-mono font-bold flex items-center gap-1">
                <span>⭐ {issue.feedback[0].rating}.0</span>
              </span>
            ) : (
              <span>#{issue.id}</span>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer: Upvote & Track Actions */}
      <div className="pt-3 flex items-center justify-between gap-2 mt-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            upvoteIssue(issue.id);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#16304d] hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 text-xs font-semibold transition-all border border-[#1e3857]"
        >
          <ThumbsUp className="w-3.5 h-3.5 text-cyan-400" />
          <span>{issue.upvotes || 0} {t('upvotes')}</span>
        </button>

        <button
          onClick={() => setSelectedIssue(issue)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 text-xs font-bold transition-all border border-cyan-500/30"
        >
          <span>{t('trackLiveCase')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}
