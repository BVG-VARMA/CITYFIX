import React, { useState, useEffect } from 'react';
import Navbar from './components/Common/Navbar';
import RoleSelectGateway from './components/Auth/RoleSelectGateway';
import CitizenAuthCard from './components/Auth/CitizenAuthCard';
import CitizenPortal from './components/CitizenView/CitizenPortal';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import AdminLogin from './components/AdminDashboard/AdminLogin';
import ReportModal from './components/CitizenView/ReportModal';
import IssueTrackerModal from './components/CitizenView/IssueTrackerModal';
import NotificationsDrawer from './components/Common/NotificationsDrawer';
import ToastNotification from './components/Common/ToastNotification';
import AuthModal from './components/Auth/AuthModal';
import { useAuth } from './context/AuthContext';
import { useIssues } from './context/IssuesContext';

export default function App() {
  // Simple URL path routing (supports '/', '/login', '/register', '/admin/login', '/citizen', '/admin')
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/');

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportModalCoords, setReportModalCoords] = useState(null);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const { user, isAuthenticated, isAdmin, loading, logout, t } = useAuth();
  const { loading: issuesLoading } = useIssues();

  // Navigation handler
  const navigate = (path) => {
    if (window.location.pathname !== path) {
      window.history.pushState({ path }, '', path);
    }
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  // Reset to home gateway
  const handleReturnToGateway = () => {
    navigate('/');
  };

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleOpenReportModal = (coords) => {
    if (coords && coords.lat && coords.lng) {
      setReportModalCoords(coords);
    } else {
      setReportModalCoords(null);
    }
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
    } else {
      setIsReportModalOpen(true);
    }
  };

  const isAuthOrGatewayPage = !isAuthenticated && (
    currentPath === '/' || 
    currentPath === '/login' || 
    currentPath === '/register' || 
    currentPath === '/admin/login' || 
    (currentPath === '/admin' && !isAdmin)
  );

  // Determine what main screen to render based on URL & auth state
  const renderMainContent = () => {
    // 1. Officer direct login / admin routes
    if (currentPath === '/admin/login' || currentPath.startsWith('/admin/login')) {
      if (isAdmin) {
        return <AdminDashboard />;
      }
      return <AdminLogin onBackToGateway={handleReturnToGateway} />;
    }

    if (currentPath === '/admin' || currentPath.startsWith('/admin')) {
      if (isAdmin) {
        return <AdminDashboard />;
      }
      return <AdminLogin onBackToGateway={handleReturnToGateway} />;
    }

    // 2. Citizen direct login / register routes
    if (currentPath === '/login' || currentPath === '/register' || currentPath.startsWith('/login') || currentPath.startsWith('/register')) {
      if (isAuthenticated) {
        if (isAdmin) {
          return <AdminDashboard />;
        }
        return <CitizenPortal onOpenReportModal={handleOpenReportModal} />;
      }
      return (
        <CitizenAuthCard
          onBack={handleReturnToGateway}
          onAuthSuccess={() => navigate('/citizen')}
          onGuestExplore={() => navigate('/citizen')}
        />
      );
    }

    // 3. Citizen Explicit Route (/citizen)
    if (currentPath === '/citizen' || currentPath.startsWith('/citizen')) {
      return <CitizenPortal onOpenReportModal={handleOpenReportModal} />;
    }

    // 4. Authenticated User on Root (/)
    if (isAuthenticated) {
      if (isAdmin) {
        return <AdminDashboard />;
      }
      return <CitizenPortal onOpenReportModal={handleOpenReportModal} />;
    }

    // 5. Default Unauthenticated Root Gateway: Dual Role Selection
    return (
      <RoleSelectGateway
        onSelectOfficer={() => navigate('/admin/login')}
        onSelectCitizen={() => navigate('/login')}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#07111e] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      
      {/* Top Navigation Bar */}
      <Navbar
        currentPath={currentPath}
        onNavigate={navigate}
        onOpenReportModal={() => handleOpenReportModal(null)}
        onOpenNotifs={() => setIsNotifsOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onReturnToGateway={handleReturnToGateway}
        isInGatewayMode={isAuthOrGatewayPage}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {loading || issuesLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
            <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
            <p className="text-xs font-mono text-cyan-400 animate-pulse">
              Connecting to CityFix PostGIS Engine & Live Bus...
            </p>
          </div>
        ) : (
          renderMainContent()
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1e3857] py-6 px-4 bg-[#0a192f] text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="font-semibold text-slate-200">CityFix Platform</span>
            <span className="text-slate-500">•</span>
            <span>English • తెలుగు • हिन्दी</span>
          </div>
          
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <button 
              onClick={() => navigate('/')} 
              className="hover:text-cyan-300 font-medium transition-colors"
            >
              Role Selection Gateway
            </button>
            <span>•</span>
            <button 
              onClick={() => navigate('/citizen')} 
              className="hover:text-cyan-300 transition-colors"
            >
              Citizen Portal
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Live Overlays */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setReportModalCoords(null);
        }}
        onRequireAuth={() => {
          setIsReportModalOpen(false);
          setIsAuthModalOpen(true);
        }}
        initialCoords={reportModalCoords}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setIsReportModalOpen(true)}
      />

      <IssueTrackerModal />

      <NotificationsDrawer
        isOpen={isNotifsOpen}
        onClose={() => setIsNotifsOpen(false)}
      />

      <ToastNotification />

    </div>
  );
}
