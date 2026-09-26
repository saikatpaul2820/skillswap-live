import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowLeftRight,
  UserPlus,
  MessageSquare,
  Clock,
  CheckCircle2,
  MapPin,
  GraduationCap,
  BookOpen,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { MatchRecommendation } from '../types';

interface MatchesPageProps {
  onViewProfile: (userId: string) => void;
  onNavigateToChat: (userId: string) => void;
  onOpenEditProfile: () => void;
}

export const MatchesPage: React.FC<MatchesPageProps> = ({
  onViewProfile,
  onNavigateToChat,
  onOpenEditProfile,
}) => {
  const { currentUser, userSkills } = useAuth();
  const [matches, setMatches] = useState<MatchRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectingUserId, setConnectingUserId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'MUTUAL' | 'DIRECT'>('ALL');

  const fetchMatches = async () => {
    setIsLoading(true);
    try {
      const data = await api.getMatches();
      setMatches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load matches:', err);
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [currentUser, userSkills]);

  const handleConnect = async (userId: string) => {
    setConnectingUserId(userId);
    try {
      await api.createConnection(userId);
      setMatches(prev =>
        (Array.isArray(prev) ? prev : []).map(m => (m.user.id === userId ? { ...m, connectionStatus: 'PENDING' } : m))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to send connection request');
    } finally {
      setConnectingUserId(null);
    }
  };

  const safeMatches = Array.isArray(matches) ? matches : [];
  const filteredMatches = safeMatches.filter(m => {
    if (filterType === 'MUTUAL') return m.matchType === 'MUTUAL_SWAP';
    if (filterType === 'DIRECT') return m.matchType !== 'MUTUAL_SWAP';
    return true;
  });

  const mutualCount = safeMatches.filter(m => m.matchType === 'MUTUAL_SWAP').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Skill Matching Engine
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Algorithmic matchmaking comparing what you teach with what others want to learn.
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Matches ({safeMatches.length})
          </button>
          <button
            onClick={() => setFilterType('MUTUAL')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              filterType === 'MUTUAL' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Mutual Swaps ({mutualCount})</span>
            {mutualCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>
        </div>
      </div>

      {/* Algorithm Explanation Banner */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-5 border border-indigo-100/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              How Potential Skill Swaps are Computed:
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              When <span className="font-semibold text-emerald-800">You teach X & User B wants X</span> and{' '}
              <span className="font-semibold text-violet-800">User B teaches Y & You want Y</span>, a{' '}
              <span className="font-bold text-indigo-700">100% Mutual Match</span> is triggered!
            </p>
          </div>
        </div>

        <button
          onClick={onOpenEditProfile}
          className="shrink-0 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
        >
          Update My Skills
        </button>
      </div>

      {/* Matches Grid */}
      {isLoading ? (
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Running compatibility comparison algorithm...</p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm max-w-lg mx-auto">
          <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-800 mb-1">No matches found for current filter</p>
          <p className="text-xs text-slate-500 mb-4">
            Try updating the skills you can teach and want to learn to unlock more matching partners.
          </p>
          <button
            onClick={onOpenEditProfile}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl"
          >
            Add More Skills
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMatches.map((match) => {
            const isMutual = match.matchType === 'MUTUAL_SWAP';
            const teachSkills = match.skills.filter(s => s.type === 'TEACH');
            const learnSkills = match.skills.filter(s => s.type === 'LEARN');

            return (
              <div
                key={match.user.id}
                className={`bg-white rounded-2xl p-6 border shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                  isMutual
                    ? 'border-emerald-200 ring-1 ring-emerald-300/40 bg-gradient-to-b from-white to-emerald-50/20'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Top Badge & Match Percentage */}
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isMutual
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {isMutual && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                      <span>{isMutual ? 'Match Found: Mutual Swap' : 'Teach Recommendation'}</span>
                    </span>

                    <span className="text-xs font-bold text-slate-700">
                      {match.compatibilityScore}% Fit
                    </span>
                  </div>

                  {/* Profile Header */}
                  <div className="flex items-center gap-3.5 mb-4">
                    <img
                      src={match.user.profileImage}
                      alt={match.user.name}
                      className="w-13 h-13 rounded-2xl object-cover ring-2 ring-slate-100 shadow-2xs"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-slate-900 leading-tight truncate">
                        {match.user.name}
                      </h3>
                      <p className="text-xs text-slate-400 truncate">@{match.user.username}</p>
                      {match.user.location && (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{match.user.location}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Mutual Pairing Flow Box */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-3 mb-5">
                    {/* What they can teach you */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                          They Can Teach You:
                        </span>
                        <span className="text-[10px] text-slate-400">Your wishlist match</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {match.theyCanTeachYou.length > 0 ? (
                          match.theyCanTeachYou.map((sk) => (
                            <span
                              key={sk}
                              className="px-2.5 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs rounded-md"
                            >
                              ✓ {sk}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">General learning overlap</span>
                        )}
                      </div>
                    </div>

                    {/* What you can teach them */}
                    <div className="pt-2 border-t border-slate-200/70">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-violet-800 uppercase tracking-wider">
                          You Can Teach Them:
                        </span>
                        <span className="text-[10px] text-slate-400">Their wishlist match</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {match.youCanTeachThem.length > 0 ? (
                          match.youCanTeachThem.map((sk) => (
                            <span
                              key={sk}
                              className="px-2.5 py-0.5 bg-violet-100 border border-violet-300 text-violet-900 font-bold text-xs rounded-md"
                            >
                              ✓ {sk}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Direct mentoring opportunity</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => onViewProfile(match.user.id)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl text-center transition-colors"
                  >
                    View Profile
                  </button>

                  {match.connectionStatus === 'ACCEPTED' ? (
                    <button
                      onClick={() => onNavigateToChat(match.user.id)}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl text-center transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message</span>
                    </button>
                  ) : match.connectionStatus === 'PENDING' ? (
                    <span className="px-4 py-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Pending</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConnect(match.user.id)}
                      disabled={connectingUserId === match.user.id}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl text-center transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-100"
                    >
                      {connectingUserId === match.user.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Connect</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
