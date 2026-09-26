import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeftRight,
  Compass,
  Sparkles,
  Users,
  MessageSquare,
  Bell,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Menu,
  X,
  PlusCircle,
  RotateCcw,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export interface NavbarProps {
  currentPage: 'landing' | 'dashboard' | 'explore' | 'matches' | 'connections' | 'messages';
  onNavigate: (page: 'landing' | 'dashboard' | 'explore' | 'matches' | 'connections' | 'messages') => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenRegister: () => void;
  onOpenEditProfile: () => void;
  onOpenCreateExchange: () => void;
  onViewProfile: (userId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onOpenAuth,
  onOpenRegister,
  onOpenEditProfile,
  onOpenCreateExchange,
  onViewProfile,
}) => {
  const {
    currentUser,
    isAuthenticated,
    logout,
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    switchDemoUser,
    refreshUser,
  } = useAuth();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResetData = async () => {
    if (!confirm('Reset all demo data to default test users and requests?')) return;
    setIsResetting(true);
    try {
      await api.resetDemoData();
      await refreshUser();
      alert('Demo data successfully reset!');
    } catch (err: any) {
      alert(err.message || 'Failed to reset data');
    } finally {
      setIsResetting(false);
      setShowUserMenu(false);
    }
  };

  const navItems: Array<{
    id: 'landing' | 'dashboard' | 'explore' | 'matches' | 'connections' | 'messages';
    label: string;
    icon: any;
    badge?: string;
  }> = [
    { id: 'landing', label: 'Home', icon: ArrowLeftRight },
    ...(isAuthenticated
      ? [{ id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard }]
      : []),
    { id: 'explore', label: 'Explore', icon: Compass },
    ...(isAuthenticated
      ? [
          { id: 'matches' as const, label: 'Matches', icon: Sparkles, badge: 'Smart' },
          { id: 'connections' as const, label: 'Connections', icon: Users },
          { id: 'messages' as const, label: 'Messages', icon: MessageSquare },
        ]
      : []),
  ];

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <button
              id="nav-brand-btn"
              onClick={() => onNavigate(isAuthenticated ? 'dashboard' : 'landing')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 group-hover:scale-105 transition-transform">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 block leading-tight">
                  SkillSwap
                </span>
                <span className="text-[11px] font-medium text-slate-500 tracking-wide">
                  Learn · Share · Exchange
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-link-${item.id}`}
                    onClick={() => onNavigate(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-indigo-600 bg-indigo-50/80 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {isAuthenticated ? (
              <>
                {/* Quick Post Exchange Button */}
                <button
                  id="nav-post-exchange-btn"
                  onClick={onOpenCreateExchange}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Post Exchange</span>
                </button>

                {/* Notifications Bell Dropdown */}
                <div className="relative" ref={notifRef}>
                  <button
                    id="nav-notifications-btn"
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                        {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Popover */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Notifications
                        </h4>
                        <span className="text-[11px] text-indigo-600 font-medium">
                          {unreadNotificationsCount} unread
                        </span>
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-xs text-slate-400">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => {
                                markNotificationRead(notif.id);
                                if (notif.link) {
                                  if (notif.link.includes('connections')) onNavigate('connections');
                                  if (notif.link.includes('messages')) onNavigate('messages');
                                  if (notif.link.includes('matches')) onNavigate('matches');
                                  setShowNotifications(false);
                                }
                              }}
                              className={`p-3 text-xs cursor-pointer transition-colors ${
                                notif.isRead ? 'bg-white hover:bg-slate-50' : 'bg-indigo-50/50 hover:bg-indigo-50'
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <div
                                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                    notif.isRead ? 'bg-transparent' : 'bg-indigo-600'
                                  }`}
                                />
                                <div className="flex-1">
                                  <p className="text-slate-800 font-medium leading-relaxed">
                                    {notif.message}
                                  </p>
                                  <span className="text-[10px] text-slate-400 mt-1 block">
                                    {new Date(notif.createdAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}{' '}
                                    · {new Date(notif.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Profile Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    id="nav-user-menu-btn"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <img
                      src={
                        currentUser?.profileImage ||
                        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'
                      }
                      alt={currentUser?.name}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-100"
                    />
                    <span className="hidden lg:block text-sm font-medium text-slate-800 max-w-[120px] truncate">
                      {currentUser?.name}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 divide-y divide-slate-100 animate-in fade-in zoom-in-95">
                      <div className="px-4 py-3">
                        <p className="text-xs font-semibold text-slate-900">{currentUser?.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">@{currentUser?.username}</p>
                        <p className="text-[11px] text-indigo-600 font-medium truncate mt-0.5">
                          {currentUser?.email}
                        </p>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onOpenEditProfile();
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>View & Edit My Profile</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onNavigate('connections');
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>My Connections</span>
                        </button>
                      </div>

                      {/* Demo User Switcher */}
                      <div className="py-2 px-3 bg-slate-50/70">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Quick Demo Switcher
                        </p>
                        <div className="grid grid-cols-2 gap-1">
                          {[
                            { name: 'Sarah (Design)', email: 'sarah@skillswap.io' },
                            { name: 'Rahul (Java)', email: 'rahul@skillswap.io' },
                            { name: 'Elena (Python/ML)', email: 'elena@skillswap.io' },
                            { name: 'Marcus (Video)', email: 'marcus@skillswap.io' },
                          ].map((demo) => (
                            <button
                              key={demo.email}
                              onClick={() => {
                                switchDemoUser(demo.email);
                                setShowUserMenu(false);
                              }}
                              className={`text-[11px] px-2 py-1 rounded text-left truncate transition-colors ${
                                currentUser?.email === demo.email
                                  ? 'bg-indigo-600 text-white font-medium'
                                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {demo.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={handleResetData}
                          disabled={isResetting}
                          className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                          <span>Reset Demo Database</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            logout();
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-500" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="nav-login-btn"
                  onClick={() => onOpenAuth('login')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Log In
                </button>
                <button
                  id="nav-register-btn"
                  onClick={() => onOpenAuth('register')}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Join SkillSwap
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
              aria-label="Toggle Menu"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setShowMobileMenu(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'text-indigo-600 bg-indigo-50 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4 text-slate-500" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto text-[10px] uppercase font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {isAuthenticated && (
            <div className="pt-2 border-t border-slate-100 mt-2">
              <button
                onClick={() => {
                  onOpenCreateExchange();
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Post Skill Exchange</span>
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
