import React from 'react';
import { Bell, Check, X, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useIssues } from '../../context/IssuesContext';

export default function NotificationsDrawer({ isOpen, onClose }) {
  const { notifications, markAllRead, t } = useAuth();
  const { setSelectedIssue, issues } = useIssues();

  if (!isOpen) return null;

  const handleOpenIssue = (issueId) => {
    const issue = issues.find(i => i.id === issueId);
    if (issue) {
      setSelectedIssue(issue);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="relative w-full max-w-md bg-[#0a192f] border-l border-[#1e3857] shadow-2xl flex flex-col h-full z-10">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#1e3857] flex items-center justify-between bg-[#0f2438]/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-slate-100">
                {t('civicAlertsTitle')}
              </h2>
              <p className="text-xs text-slate-400">
                {t('civicAlertsSubtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#16304d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions bar */}
        <div className="px-6 py-2.5 bg-[#0f2438]/40 border-b border-[#1e3857] flex items-center justify-between text-xs">
          <span className="text-slate-400">
            {notifications.length} {t('civicAlertsTitle')}
          </span>
          <button
            onClick={markAllRead}
            className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{t('markAllAsRead')}</span>
          </button>
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Bell className="w-10 h-10 mx-auto text-slate-600 mb-3 stroke-[1.5]" />
              <p className="font-medium text-slate-300">{t('noNotifications')}</p>
              <p className="text-xs text-slate-500 mt-1">
                {t('noNotificationsSub')}
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const isResolved = notif.type === 'resolved';
              return (
                <div
                  key={notif.id}
                  className={`p-4 rounded-xl border transition-all ${
                    notif.read
                      ? 'bg-[#0f2438]/40 border-[#1e3857]/60 text-slate-300'
                      : 'bg-cyan-950/20 border-cyan-500/30 shadow-md shadow-cyan-950/40 text-slate-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      isResolved
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : notif.type === 'upvote'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-cyan-500/20 text-cyan-400'
                    }`}>
                      {isResolved ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-semibold text-slate-100 truncate">
                          {notif.title}
                        </h4>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                      
                      {notif.issueId && (
                        <button
                          onClick={() => handleOpenIssue(notif.issueId)}
                          className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          <span>{t('trackIssueNumber')} #{notif.issueId}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1e3857] bg-[#0f2438]/80 text-center text-[11px] text-slate-400">
          {t('poweredByNote')}
        </div>

      </div>
    </div>
  );
}
