import React from 'react';
import { MapPin, X, ArrowRight, CheckCircle } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useIssues } from '../../context/IssuesContext';
import { useAuth } from '../../context/AuthContext';

export default function ToastNotification() {
  const { liveToast, setLiveToast } = useSocket();
  const { setSelectedIssue, issues } = useIssues();
  const { t } = useAuth();

  if (!liveToast) return null;

  const handleViewIssue = () => {
    if (liveToast.issueId) {
      const found = issues.find(i => i.id === liveToast.issueId);
      if (found) {
        setSelectedIssue(found);
      }
    }
    setLiveToast(null);
  };

  const isStatus = liveToast.type === 'status_updated';

  return (
    <div className="fixed bottom-6 right-6 z-[1100] max-w-md w-full animate-bounce-subtle">
      <div className="bg-[#0f2438]/95 backdrop-blur-xl border border-cyan-500/40 rounded-2xl p-4 shadow-2xl shadow-cyan-500/10 flex items-start gap-3 text-slate-100">
        
        {/* Icon */}
        <div className={`p-2.5 rounded-xl shrink-0 ${
          isStatus ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
        }`}>
          {isStatus ? <CheckCircle className="w-5 h-5 animate-pulse" /> : <MapPin className="w-5 h-5 animate-bounce" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
              {isStatus ? 'Socket.io Push' : 'Live Map Broadcast'}
            </span>
            <button 
              onClick={() => setLiveToast(null)}
              className="text-slate-400 hover:text-white p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <h4 className="font-semibold text-sm text-slate-100 mt-1 truncate">
            {liveToast.title}
          </h4>
          <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">
            {liveToast.message}
          </p>

          <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-[#1e3857]">
            <span className="text-[10px] text-slate-400">Zero Page Refresh</span>
            <button
              onClick={handleViewIssue}
              className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <span>{t('trackLiveCase')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
