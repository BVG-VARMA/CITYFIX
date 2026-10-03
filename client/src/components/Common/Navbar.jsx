import React, { useState } from 'react';
import { 
  MapPin, 
  Shield, 
  User, 
  Bell, 
  PlusCircle, 
  Languages, 
  ChevronDown, 
  LogOut, 
  Lock,
  Sparkles,
  Edit3
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import EditProfileModal from '../AdminDashboard/EditProfileModal';

export default function Navbar({ 
  currentPath, 
  onNavigate, 
  onOpenReportModal, 
  onOpenNotifs, 
  onOpenAuthModal,
  onReturnToGateway,
  isInGatewayMode
}) {
  const { user, isAuthenticated, isAdmin, logout, t, language, setLanguage } = useAuth();
  const { isConnected } = useSocket();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const isAdminView = currentPath === '/admin' || (currentPath === '/' && isAdmin);

  return (
    <header className="sticky top-0 z-40 bg-[#0a192f]/98 backdrop-blur-md border-b border-[#1e3e6b] px-3 sm:px-6 lg:px-8 py-2.5 transition-all shadow-xl relative">
      {/* Government Tri-Color Top Accent Ribbon */}
      <div className="h-[3px] w-full bg-gradient-to-r from-[#f97316] via-[#ffffff] to-[#16a34a] absolute top-0 left-0 right-0 z-50 shadow-sm" />

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 pt-0.5">
        
        {/* Top / Left Section: Brand & Subtitle */}
        <div className="w-full md:w-auto flex items-center justify-between md:justify-start gap-3">
          <div 
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-amber-500 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0a192f] rounded-[14px] flex items-center justify-center">
                <MapPin className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-300 bg-clip-text text-transparent">
                  {t('brandTitle')}
                </h1>
                {!isInGatewayMode && (
                  isAdminView ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold font-mono uppercase tracking-wider rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      ADMIN
                    </span>
                  ) : (
                    <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {t('citizenPortalLink')}
                    </span>
                  )
                )}
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block truncate max-w-xs">
                {t('brandSubtitle')}
              </p>
            </div>
          </div>

          {/* Mobile Right Controls */}
          {!isInGatewayMode && (
            <div className="flex items-center gap-2 md:hidden">
              {!isAdminView && (
                <button
                  onClick={onOpenReportModal}
                  className="p-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold"
                  aria-label="Report"
                >
                  <PlusCircle className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onOpenNotifs}
                className="p-2 rounded-xl bg-[#0f2438] text-slate-300 border border-[#1e3857]"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Center: 3-Language Segmented Tab Bar */}
        <div className="flex items-center bg-[#071322] p-1 rounded-2xl border border-[#1e3857] shadow-inner">
          <div className="flex items-center px-2 text-[11px] text-cyan-400 font-bold hidden sm:flex gap-1">
            <Languages className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1">
            {[
              { code: 'en', label: 'English', flag: '🇬🇧' },
              { code: 'te', label: 'తెలుగు', flag: '🇮🇳' },
              { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' }
            ].map((lang) => {
              const isActive = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25 scale-[1.02]'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-[#0f2438]'
                  }`}
                >
                  <span className="text-xs">{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Section: Actions & User Auth (Hidden on Gateway Landing) */}
        {!isInGatewayMode && (
          <div className="hidden md:flex items-center gap-2.5">
            
            {/* Socket Connection Badge */}
            <div 
              title={isConnected ? "Socket.io Connected" : "Connecting..."}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#0f2438] border border-[#1e3857] text-[11px]"
            >
              <span className="relative flex h-2 w-2">
                {isConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <span className="text-slate-300 font-mono text-[10px]">
                {isConnected ? t('liveWebSocket') : t('connecting')}
              </span>
            </div>

            {/* Report Issue CTA button (Citizen Mode) */}
            {!isAdminView && (
              <button
                onClick={onOpenReportModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t('reportIssueBtn')}</span>
              </button>
            )}

            {/* Notifications Bell */}
            {!isAdminView && (
              <button
                onClick={onOpenNotifs}
                className="p-2 rounded-xl bg-[#0f2438] hover:bg-[#16304d] text-slate-300 hover:text-white border border-[#1e3857] transition-all"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
              </button>
            )}

            {/* User Account / Sign In */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-[#0f2438] hover:bg-[#16304d] border border-[#1e3857] text-left transition-all"
                >
                  <img
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Citizen')}&background=06b6d4&color=0f172a&bold=true`}
                    alt={user?.name || "User"}
                    className="w-7 h-7 rounded-lg object-cover border border-cyan-500/40"
                  />
                  <span className="text-xs font-semibold text-slate-200 truncate max-w-[90px]">
                    {user?.name}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {profileDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-60 rounded-2xl glass-dropdown shadow-2xl p-2 border border-[#1e3857] z-50 text-xs"
                    onMouseLeave={() => setProfileDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-[#1e3857]/60 mb-1">
                      <p className="font-bold text-slate-100 truncate">{user?.name}</p>
                      <p className="text-[11px] text-cyan-400 font-mono mt-0.5">
                        📱 +91 {user?.phone || '9876543210'}
                      </p>
                      {user?.ward && (
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          📍 {user.ward}
                        </p>
                      )}
                      <span className="mt-1.5 inline-block px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 text-[10px] font-mono capitalize">
                        {user?.role === 'admin' ? t('municipalAdmin') : t('registeredCitizen')}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setIsEditProfileOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-cyan-300 hover:bg-cyan-500/15 transition-colors mb-1"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit Officer Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        logout();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-300 hover:bg-rose-500/15 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t('logout')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0f2438] hover:bg-[#16304d] border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-semibold transition-all shadow-md"
              >
                <User className="w-3.5 h-3.5" />
                <span>{t('signInBtn')}</span>
              </button>
            )}

            {/* Switch Portal / Return to Gateway (Only shown when inside citizen or admin portals) */}
            <button
              onClick={onReturnToGateway || (() => onNavigate('/'))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0a192f] hover:bg-[#16304d] text-slate-400 hover:text-cyan-300 border border-[#1e3857] hover:border-cyan-500/30 text-xs font-semibold transition-all"
              title="Return to Role Selection Gateway"
            >
              <span>🔄</span>
              <span className="hidden sm:inline">{t('switchRoleBtn') || 'Switch Role'}</span>
            </button>

            {/* If logged in as Admin, allow viewing Citizen Portal */}
            {isAdminView && (
              <button
                onClick={() => onNavigate('/citizen')}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all flex items-center gap-1"
              >
                <span>← {t('citizenPortalLink')}</span>
              </button>
            )}

          </div>
        )}

      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />

    </header>
  );
}
