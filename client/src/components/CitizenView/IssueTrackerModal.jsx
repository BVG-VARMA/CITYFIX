import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Clock, 
  ThumbsUp, 
  ShieldCheck, 
  CheckCircle2, 
  User, 
  Share2,
  Camera,
  ZoomIn,
  Star,
  Sparkles,
  Send,
  Check
} from 'lucide-react';
import { useIssues } from '../../context/IssuesContext';
import { useAuth } from '../../context/AuthContext';
import ImageZoomModal from '../Common/ImageZoomModal';

export default function IssueTrackerModal() {
  const { selectedIssue, setSelectedIssue, upvoteIssue, submitFeedback } = useIssues();
  const { user, isAuthenticated, t } = useAuth();

  // Zoom lightbox state
  const [zoomImage, setZoomImage] = useState(null);

  // Feedback form state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState(['⚡ Fast Resolution', '🛠️ High Quality Fix']);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  if (!selectedIssue) return null;

  const isResolved = selectedIssue.status === 'resolved';
  const isInProgress = selectedIssue.status === 'in_progress';
  const feedbacks = selectedIssue.feedback || [];
  const hasUserSubmitted = user && feedbacks.some(f => f.userId === user.id);

  const availableTags = [
    '⚡ Fast Resolution',
    '🛠️ High Quality Fix',
    '👷 Courteous Staff',
    '✨ Site Cleaned Up',
    '💧 Leak Fully Stopped',
    '🚦 Road Safe to Drive'
  ];

  const handleToggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please log in to submit citizen feedback.');
      return;
    }

    try {
      setIsSubmittingFeedback(true);
      await submitFeedback(selectedIssue.id, {
        rating,
        tags: selectedTags,
        comment: feedbackComment.trim(),
        satisfaction: rating >= 4 ? 'satisfied' : rating >= 3 ? 'neutral' : 'unsatisfied'
      });
      setFeedbackSuccess(true);
      setFeedbackComment('');
    } catch (err) {
      alert(err.message || 'Failed to submit feedback');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const starLabels = {
    1: '1/5 • Very Unsatisfied',
    2: '2/5 • Needs Improvement',
    3: '3/5 • Average / Acceptable',
    4: '4/5 • Good Quality Work',
    5: '5/5 • Outstanding Repair 🎉'
  };

  return (
    <>
      <div className="fixed inset-0 z-[1000] overflow-y-auto flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
          onClick={() => setSelectedIssue(null)}
        />

        {/* Modal Container */}
        <div className="relative w-full max-w-3xl bg-[#0a192f] border border-[#1e3857] rounded-3xl shadow-2xl overflow-hidden z-10 my-8">
          
          {/* Header Bar */}
          <div className="p-5 sm:p-6 border-b border-[#1e3857] bg-[#0f2438]/90 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/15 px-2 py-0.5 rounded-lg border border-cyan-500/30">
                    Case #{selectedIssue.id}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    isResolved
                      ? 'badge-resolved'
                      : isInProgress
                      ? 'badge-in_progress'
                      : 'badge-open'
                  }`}>
                    {isResolved ? t('resolved') : isInProgress ? t('inProgress') : t('open')}
                  </span>
                </div>
                <h2 className="font-display font-bold text-lg sm:text-xl text-slate-100 mt-1">
                  {selectedIssue.title}
                </h2>
              </div>
            </div>

            <button
              onClick={() => setSelectedIssue(null)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#16304d] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-5 sm:p-6 space-y-6 max-h-[calc(85vh-140px)] overflow-y-auto">
            
            {/* Photos Grid: Reported vs Resolved with Click to Zoom */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Reported Photo */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300 font-semibold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                    <Camera className="w-4 h-4 text-cyan-400" />
                    {t('initialReportPhoto')}
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                    🔍 Click photo to Zoom
                  </span>
                </div>
                
                <div 
                  onClick={() => {
                    if (selectedIssue.photoUrl) {
                      setZoomImage({
                        src: selectedIssue.photoUrl,
                        alt: selectedIssue.title,
                        title: `Initial Reported Photo • #${selectedIssue.id}`,
                        subtitle: `${selectedIssue.address} • Geotagged`,
                        badge: 'Initial Report',
                        badgeColor: 'cyan'
                      });
                    }
                  }}
                  className="h-52 rounded-2xl overflow-hidden bg-slate-900 border-2 border-[#1e3857] hover:border-cyan-400 shadow-xl relative group cursor-zoom-in transition-all duration-300"
                >
                  <img
                    src={selectedIssue.photoUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80'}
                    alt="Report photo"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Always-visible Top Right Zoom Badge */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/85 text-cyan-300 text-[11px] font-bold border border-cyan-500/40 backdrop-blur-md shadow-lg group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all">
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Zoom In / Out</span>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white font-bold text-xs backdrop-blur-[2px]">
                    <div className="p-3 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-xl">
                      <ZoomIn className="w-6 h-6" />
                    </div>
                    <span>Click to Open Fullscreen Zoom</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedIssue.photoUrl) {
                      setZoomImage({
                        src: selectedIssue.photoUrl,
                        alt: selectedIssue.title,
                        title: `Initial Reported Photo • #${selectedIssue.id}`,
                        subtitle: `${selectedIssue.address} • Geotagged`,
                        badge: 'Initial Report',
                        badgeColor: 'cyan'
                      });
                    }
                  }}
                  className="w-full py-2 rounded-xl bg-[#0f2438] hover:bg-cyan-500/20 text-cyan-300 hover:text-white border border-[#1e3857] hover:border-cyan-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  <ZoomIn className="w-3.5 h-3.5 text-cyan-400" />
                  <span>🔍 Zoom & Inspect Reported Photo</span>
                </button>
              </div>

              {/* Resolved / Work In Progress Status with Click to Zoom */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {isResolved ? t('resolvedPhotoProof') : t('municipalStatus')}
                  </span>
                  {selectedIssue.resolvedPhotoUrl && (
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      🔍 Click photo to Zoom
                    </span>
                  )}
                </div>
                
                {selectedIssue.resolvedPhotoUrl ? (
                  <>
                    <div 
                      onClick={() => {
                        setZoomImage({
                          src: selectedIssue.resolvedPhotoUrl,
                          alt: selectedIssue.title,
                          title: `Resolution Proof Photo • #${selectedIssue.id}`,
                          subtitle: `Verified Fix by ${selectedIssue.assignedTo || 'Municipal Crew'} • ${selectedIssue.address}`,
                          badge: 'Resolution Proof',
                          badgeColor: 'emerald'
                        });
                      }}
                      className="h-52 rounded-2xl overflow-hidden bg-slate-900 border-2 border-emerald-500/50 hover:border-emerald-400 shadow-xl relative group cursor-zoom-in transition-all duration-300"
                    >
                      <img
                        src={selectedIssue.resolvedPhotoUrl}
                        alt="Resolved photo"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      
                      {/* Always-visible Top Right Zoom Badge */}
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/85 text-emerald-300 text-[11px] font-bold border border-emerald-500/40 backdrop-blur-md shadow-lg group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all">
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>Zoom In / Out</span>
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white font-bold text-xs backdrop-blur-[2px]">
                        <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shadow-xl">
                          <ZoomIn className="w-6 h-6" />
                        </div>
                        <span>Click to Open Fullscreen Zoom</span>
                      </div>

                      <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-emerald-950/90 text-emerald-300 text-[11px] font-bold border border-emerald-500/40 backdrop-blur-md shadow-md">
                        ✓ Verified Fixed
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setZoomImage({
                          src: selectedIssue.resolvedPhotoUrl,
                          alt: selectedIssue.title,
                          title: `Resolution Proof Photo • #${selectedIssue.id}`,
                          subtitle: `Verified Fix by ${selectedIssue.assignedTo || 'Municipal Crew'} • ${selectedIssue.address}`,
                          badge: 'Resolution Proof',
                          badgeColor: 'emerald'
                        });
                      }}
                      className="w-full py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-500/20 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md"
                    >
                      <ZoomIn className="w-3.5 h-3.5 text-emerald-400" />
                      <span>🔍 Zoom & Inspect Resolution Photo</span>
                    </button>
                  </>
                ) : (
                  <div className="h-52 rounded-2xl bg-[#0f2438]/60 border border-[#1e3857] p-4 flex flex-col items-center justify-center text-center">
                    <div className={`p-3 rounded-2xl mb-2 ${
                      isInProgress ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/10 text-cyan-400'
                    }`}>
                      {isInProgress ? <Clock className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
                    </div>
                    <h4 className="text-xs font-bold text-slate-200">
                      {isInProgress ? t('inProgress') : t('open')}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                      {selectedIssue.departmentName} ({selectedIssue.assignedTo || 'Assigned Crew'})
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* CITIZEN FEEDBACK & RATING SECTION (Shown when complaint is resolved) */}
            {isResolved && (
              <div className="bg-gradient-to-br from-[#0e2742] to-[#0a1c30] border border-cyan-500/30 rounded-3xl p-5 space-y-4 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between pb-2 border-b border-[#1e3857]">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-amber-500/15 text-amber-400">
                      <Star className="w-4 h-4 fill-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">
                        Citizen Resolution Review & Feedback
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Rate the municipal team's repair quality & response time
                      </p>
                    </div>
                  </div>
                  
                  <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-xl border border-cyan-500/20">
                    +15 Karma Reward
                  </span>
                </div>

                {/* Feedback Submission Form */}
                {(!hasUserSubmitted && !feedbackSuccess) ? (
                  <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                    
                    {/* Interactive Star Rating Selector */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#0a192f]/80 p-3.5 rounded-2xl border border-[#1e3857]">
                      <span className="text-xs font-semibold text-slate-300">
                        How satisfied are you with this fix?
                      </span>
                      
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 text-slate-600 hover:scale-125 transition-transform"
                          >
                            <Star
                              className={`w-6 h-6 transition-colors ${
                                (hoverRating || rating) >= star
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-600'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="ml-2 text-xs font-mono font-bold text-amber-300">
                          {starLabels[hoverRating || rating]}
                        </span>
                      </div>
                    </div>

                    {/* Quick Tag Pills */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Select highlights:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {availableTags.map((tag) => {
                          const isSelected = selectedTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => handleToggleTag(tag)}
                              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all border ${
                                isSelected
                                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                                  : 'bg-[#0f2438] text-slate-300 border-[#1e3857] hover:border-cyan-500/40'
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Written Comment Input */}
                    <div>
                      <textarea
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        placeholder="Write your feedback or thank the municipal field crew (e.g. Great work, the road is completely smooth now!)..."
                        rows={2}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-[#0a192f] border border-[#1e3857] text-slate-100 text-xs focus:outline-none focus:border-cyan-500 resize-none transition-colors"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        Feedback is published to the public civic registry
                      </span>
                      <button
                        type="submit"
                        disabled={isSubmittingFeedback}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all active:scale-95 disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSubmittingFeedback ? 'Submitting...' : 'Submit Citizen Review'}</span>
                      </button>
                    </div>

                  </form>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2">
                    <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>
                      {feedbackSuccess 
                        ? 'Thank you! Your feedback and 5-star rating have been recorded and +15 karma added to your civic score.' 
                        : 'You have submitted a review for this resolved case.'}
                    </span>
                  </div>
                )}

                {/* Display Existing Feedbacks */}
                {feedbacks.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Citizen Reviews ({feedbacks.length})
                    </span>
                    {feedbacks.map((fb) => (
                      <div key={fb.id} className="bg-[#0a192f]/90 rounded-2xl p-3.5 border border-[#1e3857] space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img 
                              src={fb.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fb.userName || 'Citizen')}`} 
                              alt={fb.userName} 
                              className="w-6 h-6 rounded-full border border-cyan-400/40" 
                            />
                            <span className="text-xs font-bold text-slate-200">{fb.userName || 'Verified Citizen'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-amber-400 font-mono text-xs">
                            <span>{'⭐'.repeat(fb.rating)}</span>
                            <span className="text-slate-400">({fb.rating}/5)</span>
                          </div>
                        </div>

                        {fb.comment && (
                          <p className="text-xs text-slate-200 italic leading-relaxed">
                            "{fb.comment}"
                          </p>
                        )}

                        {fb.tags && fb.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {fb.tags.map((tag, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-300 text-[10px] font-medium border border-cyan-500/20">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

            {/* Issue Details & Metadata Panel */}
            <div className="bg-[#0f2438]/70 border border-[#1e3857] rounded-2xl p-4 sm:p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                {t('detailedDescription')}
              </h4>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {selectedIssue.description || 'No additional description provided.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#1e3857] text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Address</span>
                  <span className="font-medium text-slate-200 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    {selectedIssue.address}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Department</span>
                  <span className="font-medium text-slate-200 block mt-0.5">
                    {selectedIssue.departmentName || 'Public Works'}
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono">
                    {selectedIssue.assignedTo || 'Assigned Crew'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Reported By</span>
                  <span className="font-medium text-slate-200 flex items-center gap-1 mt-0.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedIssue.reporter?.name || 'Citizen'}</span>
                  </span>
                  <span className="text-[11px] text-cyan-400 font-mono block mt-0.5">
                    📱 +91 {selectedIssue.reporter?.phone || '9876543210'}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Timeline */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  {t('liveTimelineTitle')}
                </h4>
                <span className="text-[11px] text-cyan-400 font-mono">
                  {selectedIssue.timeline?.length || 1} {t('eventsLogged')}
                </span>
              </div>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#1e3857]">
                {selectedIssue.timeline && selectedIssue.timeline.map((event, idx) => {
                  const isLast = idx === selectedIssue.timeline.length - 1;
                  return (
                    <div key={event.id || idx} className="relative group">
                      <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isLast
                          ? 'bg-cyan-500 border-cyan-300 ring-4 ring-cyan-500/20'
                          : 'bg-[#0a192f] border-slate-500'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isLast ? 'bg-slate-950' : 'bg-slate-400'}`} />
                      </div>

                      <div className="bg-[#0f2438]/60 border border-[#1e3857] rounded-xl p-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="font-bold text-xs text-slate-100">
                            {event.title}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400">
                            {event.timeFormatted || new Date(event.time).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {event.description}
                        </p>
                        <div className="mt-2 text-[10px] text-cyan-400 font-medium flex items-center gap-1">
                          <span>Actor: {event.actor}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions & Upvoting */}
            <div className="pt-4 border-t border-[#1e3857] flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => upvoteIssue(selectedIssue.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#16304d] hover:bg-cyan-500/20 text-slate-100 hover:text-cyan-300 font-bold text-xs border border-[#1e3857] transition-all"
              >
                <ThumbsUp className="w-4 h-4 text-cyan-400" />
                <span>{selectedIssue.upvotes || 0} {t('upvoteBtn')}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    alert('Case link copied to clipboard!');
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0f2438] hover:bg-[#16304d] text-slate-300 text-xs font-semibold border border-[#1e3857] transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{t('shareCase')}</span>
                </button>

                <button
                  onClick={() => setSelectedIssue(null)}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all"
                >
                  {t('doneBtn')}
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Lightbox / Zoom Modal */}
      {zoomImage && (
        <ImageZoomModal
          src={zoomImage.src}
          alt={zoomImage.alt}
          title={zoomImage.title}
          subtitle={zoomImage.subtitle}
          badge={zoomImage.badge}
          badgeColor={zoomImage.badgeColor}
          onClose={() => setZoomImage(null)}
        />
      )}
    </>
  );
}
