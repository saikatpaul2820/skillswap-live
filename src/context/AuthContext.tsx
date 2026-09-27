import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserSkill, Notification } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  userSkills: UserSkill[];
  isAuthenticated: boolean;
  isLoading: boolean;
  notifications: Notification[];
  unreadNotificationsCount: number;
  login: (email: string, password?: string) => Promise<void>;
  register: (payload: { name: string; email: string; password: string; confirmPassword?: string }) => Promise<{ isNewUser: boolean }>;
  logout: () => void;
  updateUserSkills: (skills: { skillName: string; category?: string; type: 'TEACH' | 'LEARN' }[]) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  switchDemoUser: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);

  const refreshNotifications = useCallback(async () => {
    const token = api.getToken();
    if (!token) {
      setNotifications([]);
      setUnreadNotificationsCount(0);
      return;
    }
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadNotificationsCount(data.unreadCount || 0);
    } catch (err: any) {
      if (err?.message?.includes('Unauthorized') || err?.message?.includes('401')) {
        api.setToken(null);
        setCurrentUser(null);
        setNotifications([]);
        setUnreadNotificationsCount(0);
        return;
      }
      console.warn('Notifications poll skipped:', err?.message || err);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const token = api.getToken();
    if (!token) {
      setCurrentUser(null);
      setUserSkills([]);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.getCurrentUser();
      setCurrentUser(data.user);
      setUserSkills(data.skills || []);
      await refreshNotifications();
    } catch (err) {
      console.warn('Session expired or invalid token');
      api.setToken(null);
      setCurrentUser(null);
      setUserSkills([]);
    } finally {
      setIsLoading(false);
    }
  }, [refreshNotifications]);

  useEffect(() => {
    // Check if user has an existing saved auth session token
    const token = api.getToken();
    if (token) {
      refreshUser();
    } else {
      // Start in logged-out state so users log in with their own id/password
      setCurrentUser(null);
      setUserSkills([]);
      setIsLoading(false);
    }
  }, [refreshUser]);

  // Periodic notifications poll every 15 seconds while user is logged in
  useEffect(() => {
    if (!currentUser || !api.getToken()) return;
    const interval = setInterval(() => {
      refreshNotifications();
    }, 15000);
    return () => clearInterval(interval);
  }, [currentUser, refreshNotifications]);

  const login = async (email: string, password = 'password123') => {
    setIsLoading(true);
    try {
      const data = await api.login({ email, password });
      setCurrentUser(data.user);
      setUserSkills(data.skills || []);
      await refreshNotifications();
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: { name: string; email: string; password: string; confirmPassword?: string }) => {
    setIsLoading(true);
    try {
      const data = await api.register(payload);
      setCurrentUser(data.user);
      setUserSkills([]);
      return { isNewUser: data.isNewUser };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.setToken(null);
    setCurrentUser(null);
    setUserSkills([]);
    setNotifications([]);
    setUnreadNotificationsCount(0);
  };

  const updateUserSkills = async (skills: { skillName: string; category?: string; type: 'TEACH' | 'LEARN' }[]) => {
    if (!currentUser) return;
    const updated = await api.setUserSkills(currentUser.id, skills);
    setUserSkills(updated);
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!currentUser) return;
    const res = await api.updateProfile(currentUser.id, updates);
    setCurrentUser(res.user);
  };

  const markNotificationRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadNotificationsCount(prev => Math.max(0, prev - 1));
  };

  const switchDemoUser = async (email: string) => {
    await login(email, 'password123');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userSkills,
        isAuthenticated: !!currentUser,
        isLoading,
        notifications,
        unreadNotificationsCount,
        login,
        register,
        logout,
        updateUserSkills,
        updateProfile,
        refreshUser,
        refreshNotifications,
        markNotificationRead,
        switchDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
