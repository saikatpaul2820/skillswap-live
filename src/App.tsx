import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { ProfileSetupModal } from './components/ProfileSetupModal';
import { CreateExchangeModal } from './components/CreateExchangeModal';
import { UserProfileModal } from './components/UserProfileModal';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExplorePage } from './pages/ExplorePage';
import { MatchesPage } from './pages/MatchesPage';
import { ConnectionsPage } from './pages/ConnectionsPage';
import { MessagesPage } from './pages/MessagesPage';
import { SkillExchangeRequest } from './types';
import { ArrowLeftRight, Heart, Sparkles } from 'lucide-react';

function AppContent() {
  const { isAuthenticated, currentUser } = useAuth();

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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenAuth={() => handleOpenAuth('login')}
        onOpenRegister={() => handleOpenAuth('register')}
        onOpenEditProfile={() => setIsProfileModalOpen(true)}
        onOpenCreateExchange={() => handleOpenCreateExchange()}
        onViewProfile={handleViewProfile}
      />

      {/* Main Routed Page Content */}
      <main className="flex-1">
        {currentPage === 'landing' && (
          <LandingPage
            onExplore={() => setCurrentPage('explore')}
            onPostSkill={() => {
              if (isAuthenticated) {
                handleOpenCreateExchange();
              } else {
                handleOpenAuth('register');
              }
            }}
            onJoin={() => handleOpenAuth('register')}
            onViewProfile={handleViewProfile}
          />
        )}

        {currentPage === 'dashboard' && (
          <DashboardPage
            onOpenCreateExchange={() => handleOpenCreateExchange()}
            onOpenEditProfile={() => setIsProfileModalOpen(true)}
            onViewProfile={handleViewProfile}
            onNavigateToMatches={() => setCurrentPage('matches')}
            onNavigateToExplore={() => setCurrentPage('explore')}
          />
        )}

        {currentPage === 'explore' && (
          <ExplorePage
            onOpenCreateExchange={(ex) => handleOpenCreateExchange(ex)}
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
            onExplore={() => setCurrentPage('explore')}
          />
        )}

        {currentPage === 'messages' && (
          <MessagesPage
            initialUserId={targetChatUserId}
            onExplore={() => setCurrentPage('explore')}
            onViewProfile={handleViewProfile}
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
                    setIsProfileModalOpen(true);
                  } else {
                    handleOpenAuth('login');
                  }
                }}
                className="hover:text-indigo-600"
              >
                Profile & Skills
              </button>
            </div>

            <div className="text-xs text-slate-400 text-center md:text-right">
              <p>Exchange knowledge without monetary transactions.</p>
              <p className="mt-0.5 text-slate-400 text-[11px]">
                Built with React, Express REST APIs, and modern peer matching.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          setCurrentPage('dashboard');
        }}
      />

      <ProfileSetupModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      <CreateExchangeModal
        isOpen={isCreateExchangeOpen}
        onClose={() => {
          setIsCreateExchangeOpen(false);
          setEditingExchange(null);
        }}
        existingExchange={editingExchange}
        onCreated={(exchange) => {
          setIsCreateExchangeOpen(false);
          setEditingExchange(null);
          // Navigate to explore to see the newly posted/updated exchange
          setCurrentPage('explore');
        }}
      />

      <UserProfileModal
        userId={inspectUserId}
        isOpen={isUserProfileOpen}
        onClose={() => {
          setIsUserProfileOpen(false);
          setInspectUserId(null);
        }}
        onOpenEditProfile={() => setIsProfileModalOpen(true)}
        onNavigateToChat={handleNavigateToChat}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
