import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './components/Toast';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { ProfileSetupModal } from './components/ProfileSetupModal';
import { CreateExchangeModal } from './components/CreateExchangeModal';
import { UserProfileModal } from './components/UserProfileModal';
import { VideoCallModal } from './components/VideoCallModal';
import { IncomingCallBanner } from './components/IncomingCallBanner';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExplorePage } from './pages/ExplorePage';
import { MatchesPage } from './pages/MatchesPage';
import { ConnectionsPage } from './pages/ConnectionsPage';
import { MessagesPage } from './pages/MessagesPage';
import { SkillExchangeRequest, CallSession } from './types';
import { api } from './services/api';
import { ArrowLeftRight } from 'lucide-react';

function AppContent() {
  const { isAuthenticated, currentUser } = useAuth();
  const { showToast } = useToast();

  // Navigation page state
  const [currentPage, setCurrentPage] = useState<'landing' | 'dashboard' | 'explore' | 'matches' | 'connections' | 'messages'>(
    isAuthenticated ? 'dashboard' : 'landing'
  );

  const hasInitializedPage = React.useRef(false);
  React.useEffect(() => {
    if (!hasInitializedPage.current && isAuthenticated) {
      hasInitializedPage.current = true;
      setCurrentPage('dashboard');
    }
  }, [isAuthenticated]);

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCreateExchangeOpen, setIsCreateExchangeOpen] = useState(false);
  const [editingExchange, setEditingExchange] = useState<SkillExchangeRequest | null>(null);

  // Profile Viewer modal
  const [inspectUserId, setInspectUserId] = useState<string | null>(null);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);

  // Messaging targeted user
  const [targetChatUserId, setTargetChatUserId] = useState<string | null>(null);

  // 1-to-1 Video Call State
  const [activeCallSession, setActiveCallSession] = useState<CallSession | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);

  // Poll for incoming calls when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      setIncomingCall(null);
      return;
    }

    const interval = setInterval(async () => {
      try {
        const data = await api.getActiveCalls();
        const calls = data.calls || [];

        // Check if there is an incoming call where currentUser is receiver
        const incoming = calls.find(
          (c) => c.receiverId === currentUser.id && c.status === 'CALLING'
        );

        if (incoming && (!activeCallSession || activeCallSession.id !== incoming.id)) {
          setIncomingCall(incoming);
        } else if (!incoming && incomingCall) {
          setIncomingCall(null);
        }

        // If current active call was ended by peer
        if (activeCallSession) {
          const currentInServer = calls.find((c) => c.id === activeCallSession.id);
          if (!currentInServer || currentInServer.status === 'ENDED' || currentInServer.status === 'DECLINED') {
            setActiveCallSession(null);
          }
        }
      } catch {
        // ignore polling error
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isAuthenticated, currentUser, activeCallSession, incomingCall]);

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleNavigate = (page: 'landing' | 'dashboard' | 'explore' | 'matches' | 'connections' | 'messages') => {
    if (!isAuthenticated && (page === 'dashboard' || page === 'matches' || page === 'connections' || page === 'messages')) {
      handleOpenAuth('login');
      return;
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewProfile = (userId: string) => {
    setInspectUserId(userId);
    setIsUserProfileOpen(true);
  };

  const handleNavigateToChat = (userId: string) => {
    setTargetChatUserId(userId);
    setCurrentPage('messages');
  };

  const handleOpenCreateExchange = (existing?: SkillExchangeRequest) => {
    if (!isAuthenticated) {
      handleOpenAuth('login');
      return;
    }
    setEditingExchange(existing || null);
    setIsCreateExchangeOpen(true);
  };

  const handleStartVideoCall = async (partnerId: string, immediateConnect = false) => {
    try {
      showToast('Starting 1-to-1 live video room...', 'info');
      const session = await api.initiateCall(partnerId, immediateConnect);
      setActiveCallSession(session);
    } catch (err: any) {
      showToast(err.message || 'Failed to start video call', 'error');
    }
  };

  const handleAcceptIncomingCall = async () => {
    if (!incomingCall) return;
    try {
      const updated = await api.updateCallStatus(incomingCall.id, 'CONNECTED');
      setActiveCallSession(updated || incomingCall);
      setIncomingCall(null);
      showToast('Joined live video call room', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to join video call', 'error');
    }
  };

  const handleDeclineIncomingCall = async () => {
    if (!incomingCall) return;
    try {
      await api.updateCallStatus(incomingCall.id, 'DECLINED');
      setIncomingCall(null);
    } catch {
      setIncomingCall(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenAuth={handleOpenAuth}
        onOpenRegister={() => handleOpenAuth('register')}
        onOpenEditProfile={() => setIsProfileModalOpen(true)}
        onOpenCreateExchange={() => handleOpenCreateExchange()}
        onViewProfile={handleViewProfile}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentPage === 'landing' && (
          <LandingPage
            onExplore={() => handleNavigate('explore')}
            onRegister={() => handleOpenAuth('register')}
            onOpenLogin={() => handleOpenAuth('login')}
          />
        )}

        {currentPage === 'dashboard' && (
          <DashboardPage
            onOpenCreateExchange={() => handleOpenCreateExchange()}
            onOpenEditProfile={() => setIsProfileModalOpen(true)}
            onViewProfile={handleViewProfile}
            onNavigateToMatches={() => handleNavigate('matches')}
            onNavigateToExplore={() => handleNavigate('explore')}
          />
        )}

        {currentPage === 'explore' && (
          <ExplorePage
            onOpenCreateExchange={handleOpenCreateExchange}
            onViewProfile={handleViewProfile}
            onOpenAuthModal={() => handleOpenAuth('login')}
          />
        )}

        {currentPage === 'matches' && (
          <MatchesPage
            onViewProfile={handleViewProfile}
            onNavigateToChat={handleNavigateToChat}
            onOpenEditProfile={() => setIsProfileModalOpen(true)}
          />
        )}

        {currentPage === 'connections' && (
          <ConnectionsPage
            onNavigateToChat={handleNavigateToChat}
            onViewProfile={handleViewProfile}
            onExplore={() => handleNavigate('explore')}
            onStartVideoCall={handleStartVideoCall}
          />
        )}

        {currentPage === 'messages' && (
          <MessagesPage
            initialUserId={targetChatUserId}
            onExplore={() => handleNavigate('explore')}
            onViewProfile={handleViewProfile}
            onStartVideoCall={handleStartVideoCall}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-sm">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base text-slate-900 tracking-tight">
                SkillSwap
              </span>
              <span className="text-xs text-slate-400">
                — Peer-to-Peer Knowledge Sharing Platform
              </span>
            </div>

            <div className="flex items-center gap-6 text-xs text-slate-500">
              <button onClick={() => handleNavigate('explore')} className="hover:text-indigo-600">
                Explore Requests
              </button>
              <button onClick={() => handleNavigate('matches')} className="hover:text-indigo-600">
                Match Engine
              </button>
              <button
                onClick={() => {
                  if (isAuthenticated) {
                    handleNavigate('messages');
                  } else {
                    handleOpenAuth('login');
                  }
                }}
                className="hover:text-indigo-600"
              >
                1-to-1 Video Calls
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal (Login/Register) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          setCurrentPage('dashboard');
        }}
      />

      {/* Profile Edit / Skill Tag Setup Modal */}
      <ProfileSetupModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Create or Edit Exchange Request Modal */}
      <CreateExchangeModal
        isOpen={isCreateExchangeOpen}
        existingExchange={editingExchange}
        onClose={() => {
          setIsCreateExchangeOpen(false);
          setEditingExchange(null);
        }}
        onSuccess={() => {
          setIsCreateExchangeOpen(false);
          setEditingExchange(null);
          setCurrentPage('explore');
        }}
      />

      {/* Inspect Peer Profile Modal */}
      <UserProfileModal
        userId={inspectUserId}
        isOpen={isUserProfileOpen}
        onClose={() => {
          setIsUserProfileOpen(false);
          setInspectUserId(null);
        }}
        onOpenEditProfile={() => setIsProfileModalOpen(true)}
        onNavigateToChat={handleNavigateToChat}
        onStartVideoCall={handleStartVideoCall}
      />

      {/* Incoming Video Call Alert Banner */}
      {incomingCall && (
        <IncomingCallBanner
          call={incomingCall}
          onAccept={handleAcceptIncomingCall}
          onDecline={handleDeclineIncomingCall}
        />
      )}

      {/* 1-to-1 Live Video Call Modal */}
      {activeCallSession && currentUser && (
        <VideoCallModal
          session={activeCallSession}
          currentUser={currentUser}
          onEndCall={() => setActiveCallSession(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
