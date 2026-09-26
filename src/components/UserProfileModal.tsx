import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Calendar,
  GraduationCap,
  BookOpen,
  MessageSquare,
  UserPlus,
  Clock,
  CheckCircle2,
  ExternalLink,
  Edit3
} from 'lucide-react';
import { User, UserSkill, SkillExchangeRequest, Connection } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface UserProfileModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenEditProfile?: () => void;
  onNavigateToChat?: (userId: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  userId,
  isOpen,
  onClose,
  onOpenEditProfile,
  onNavigateToChat,
}) => {
  const { currentUser, isAuthenticated } = useAuth();
  const [profileData, setProfileData] = useState<{
    user: User;
    skills: UserSkill[];
    exchanges: SkillExchangeRequest[];
  } | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'NONE' | 'PENDING' | 'ACCEPTED' | 'REJECTED'>('NONE');
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingConn, setIsSendingConn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !userId) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    Promise.all([
      api.getUser(userId),
      currentUser ? api.getConnections() : Promise.resolve({ all: [] as Connection[] }),
    ])
      .then(([userData, connData]) => {
        if (!isMounted) return;
        setProfileData(userData);

        if (currentUser && userId !== currentUser.id) {
          const found = (connData.all || []).find(
            (c: Connection) =>
              (c.senderId === currentUser.id && c.receiverId === userId) ||
              (c.senderId === userId && c.receiverId === currentUser.id)
          );
          if (found) {
            setConnectionStatus(found.status);
            setConnectionId(found.id);
          } else {
            setConnectionStatus('NONE');
            setConnectionId(null);
          }
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load user profile');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, userId, currentUser]);

  if (!isOpen || !userId) return null;

  const isOwnProfile = currentUser?.id === userId;

  const handleSendConnection = async () => {
    if (!currentUser) return;
    setIsSendingConn(true);
    try {
      const conn = await api.createConnection(userId);
      setConnectionStatus(conn.status);
      setConnectionId(conn.id);
    } catch (err: any) {
      alert(err.message || 'Failed to send connection request');
    } finally {
      setIsSendingConn(false);
    }
  };

  const teachSkills = (profileData?.skills || []).filter((s) => s.type === 'TEACH');
  const learnSkills = (profileData?.skills || []).filter((s) => s.type === 'LEARN');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header with Cover */}
        <div className="relative h-28 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500">Loading user profile...</p>
            </div>
          ) : error || !profileData ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              {error || 'User profile not found.'}
            </div>
          ) : (
            <>
              {/* Profile Avatar & Primary Details */}
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between -mt-16 mb-6 gap-4">
                <div className="flex items-end gap-4">
                  <img
                    src={profileData.user.profileImage}
                    alt={profileData.user.name}
                    className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white shadow-md bg-white"
                  />
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 leading-tight">
                      {profileData.user.name}
                    </h3>
                    <p className="text-xs text-slate-500">@{profileData.user.username}</p>
                    {profileData.user.location && (
                      <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{profileData.user.location}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Profile Action Button */}
                <div className="w-full sm:w-auto">
                  {isOwnProfile ? (
                    <button
                      onClick={() => {
                        onClose();
                        if (onOpenEditProfile) onOpenEditProfile();
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit My Profile</span>
                    </button>
                  ) : connectionStatus === 'ACCEPTED' ? (
                    <button
                      onClick={() => {
                        onClose();
                        if (onNavigateToChat) onNavigateToChat(userId);
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message</span>
                    </button>
                  ) : connectionStatus === 'PENDING' ? (
                    <div className="w-full sm:w-auto px-4 py-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Connection Pending</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleSendConnection}
                      disabled={isSendingConn || !isAuthenticated}
                      className="w-full sm:w-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      {isSendingConn ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Connect & Exchange</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Bio */}
              {profileData.user.bio && (
                <div className="mb-6 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                  {profileData.user.bio}
                </div>
              )}

              {/* Skills Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* Teaching */}
                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-2 mb-2.5">
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                      Can Teach
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {teachSkills.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">None listed</span>
                    ) : (
                      teachSkills.map((s) => (
                        <span
                          key={s.id}
                          className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-lg"
                        >
                          {s.skillName}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Learning */}
                <div className="p-4 bg-violet-50/50 rounded-xl border border-violet-100">
                  <div className="flex items-center gap-2 mb-2.5">
                    <BookOpen className="w-4 h-4 text-violet-600" />
                    <h4 className="text-xs font-bold text-violet-900 uppercase tracking-wider">
                      Wants to Learn
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {learnSkills.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">None listed</span>
                    ) : (
                      learnSkills.map((s) => (
                        <span
                          key={s.id}
                          className="px-2.5 py-1 text-xs font-semibold bg-violet-100 text-violet-800 rounded-lg"
                        >
                          {s.skillName}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Active Exchange Requests */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Active Exchange Requests ({profileData.exchanges.length})
                </h4>

                {profileData.exchanges.length === 0 ? (
                  <div className="p-4 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                    No active exchange requests published yet.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {profileData.exchanges.map((ex) => (
                      <div
                        key={ex.id}
                        className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            <span className="font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md">
                              Wants: {ex.learningSkillName}
                            </span>
                            <span className="text-slate-400 font-bold">↔</span>
                            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                              Teaches: {ex.teachingSkillName}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 px-2 py-0.5 bg-slate-100 rounded-full font-medium">
                            {ex.mode}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{ex.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
