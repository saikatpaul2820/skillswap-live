import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  GraduationCap,
  BookOpen,
  ArrowLeftRight,
  UserPlus,
  Clock,
  Compass,
  PlusCircle,
  ChevronRight,
  MapPin,
  CheckCircle2,
  ExternalLink,
  Edit3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { MatchRecommendation, SkillExchangeRequest } from '../types';

interface DashboardPageProps {
  onOpenCreateExchange: () => void;
  onOpenEditProfile: () => void;
  onViewProfile: (userId: string) => void;
  onNavigateToMatches: () => void;
  onNavigateToExplore: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenCreateExchange,
  onOpenEditProfile,
  onViewProfile,
  onNavigateToMatches,
  onNavigateToExplore,
}) => {
  const { currentUser, userSkills } = useAuth();
  const [matches, setMatches] = useState<MatchRecommendation[]>([]);
  const [recentExchanges, setRecentExchanges] = useState<SkillExchangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectingUserId, setConnectingUserId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      api.getMatches().catch(() => [] as MatchRecommendation[]),
      api.getExchanges().catch(() => [] as SkillExchangeRequest[]),
    ])
      .then(([matchesData, exchangesData]) => {
        if (!isMounted) return;
        const safeMatches = Array.isArray(matchesData) ? matchesData : [];
        const safeExchanges = Array.isArray(exchangesData) ? exchangesData : [];
        setMatches(safeMatches);
        setRecentExchanges(safeExchanges.slice(0, 4));
      })
      .catch((err) => {
        console.warn('Dashboard failed to load data:', err);
        if (isMounted) {
          setMatches([]);
          setRecentExchanges([]);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

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

  const safeSkills = Array.isArray(userSkills) ? userSkills : [];
  const teachSkills = safeSkills.filter(s => s.type === 'TEACH');
  const learnSkills = safeSkills.filter(s => s.type === 'LEARN');
  const safeMatches = Array.isArray(matches) ? matches : [];
  const safeRecentExchanges = Array.isArray(recentExchanges) ? recentExchanges : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-medium mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>SkillSwap Active Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {currentUser?.name}!
            </h1>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              {learnSkills.length > 0
                ? `You're currently looking to learn ${learnSkills.map(s => s.skillName).join(', ')}. Check out recommended peers below who can teach you!`
                : 'Add skills you want to learn to get personalized peer exchange recommendations.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="dash-post-exchange-btn"
              onClick={onOpenCreateExchange}
              className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-2 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Exchange</span>
            </button>
            <button
              onClick={onOpenEditProfile}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-2"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Skills</span>
            </button>
          </div>
        </div>
      </div>

      {/* Your Skills Grid */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Your Skills</h2>
            <p className="text-xs text-slate-500">Skills you share and skills you wish to learn.</p>
          </div>
          <button
            onClick={onOpenEditProfile}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Manage Skills</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
          {/* I Can Teach */}
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                  I Can Teach ({teachSkills.length})
                </span>
              </div>
              <span className="text-[10px] text-emerald-700 font-medium">Offered Expertise</span>
            </div>

            <div className="flex flex-wrap gap-1.5 min-h-[36px]">
              {teachSkills.length === 0 ? (
                <span className="text-xs text-slate-400 italic">
                  No teaching skills added yet. Click manage to add your skills!
                </span>
              ) : (
                teachSkills.map((sk) => (
                  <span
                    key={sk.id}
                    className="px-3 py-1 bg-white border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg shadow-2xs"
                  >
                    {sk.skillName}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* I Want to Learn */}
          <div className="p-4 rounded-xl bg-violet-50/60 border border-violet-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-violet-600" />
                <span className="text-xs font-bold text-violet-950 uppercase tracking-wide">
                  I Want to Learn ({learnSkills.length})
                </span>
              </div>
              <span className="text-[10px] text-violet-700 font-medium">Learning Goals</span>
            </div>

            <div className="flex flex-wrap gap-1.5 min-h-[36px]">
              {learnSkills.length === 0 ? (
                <span className="text-xs text-slate-400 italic">
                  No learning goals added yet. Add what you want to learn!
                </span>
              ) : (
                learnSkills.map((sk) => (
                  <span
                    key={sk.id}
                    className="px-3 py-1 bg-white border border-violet-200 text-violet-800 text-xs font-semibold rounded-lg shadow-2xs"
                  >
                    {sk.skillName}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Matches Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-slate-900">Recommended Matches</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Peers whose teaching skills match what you want to learn, or who want what you teach.
            </p>
          </div>
          <button
            onClick={onNavigateToMatches}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>View All Matches</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Finding best matching peers...</p>
          </div>
        ) : safeMatches.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <p className="text-xs text-slate-500 mb-3">
              No direct matches found yet for your current skills. Try adding more skills to your profile!
            </p>
            <button
              onClick={onOpenEditProfile}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
            >
              Update My Skills
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {safeMatches.slice(0, 3).map((match) => {
              const otherTeaches = match.skills.filter(s => s.type === 'TEACH');
              const otherLearns = match.skills.filter(s => s.type === 'LEARN');
              const isMutual = match.matchType === 'MUTUAL_SWAP';

              return (
                <div
                  key={match.user.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={match.user.profileImage}
                          alt={match.user.name}
                          className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-100"
                        />
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 leading-tight">
                            {match.user.name}
                          </h3>
                          <p className="text-xs text-slate-500">@{match.user.username}</p>
                          {match.user.location && (
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate max-w-[130px]">{match.user.location}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                          isMutual
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {isMutual ? 'Mutual Swap' : 'Teach Match'}
                      </span>
                    </div>

                    {/* Skill Match Breakdown */}
                    <div className="space-y-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs mb-4">
                      <div>
                        <span className="text-[10px] font-semibold text-emerald-800 uppercase block">
                          Can Teach:
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {otherTeaches.map((s) => (
                            <span
                              key={s.id}
                              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                match.theyCanTeachYou.includes(s.skillName.toLowerCase())
                                  ? 'bg-emerald-200 text-emerald-950 font-bold ring-1 ring-emerald-400'
                                  : 'bg-white text-slate-700 border border-slate-200'
                              }`}
                            >
                              {s.skillName}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold text-violet-800 uppercase block">
                          Wants to Learn:
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {otherLearns.map((s) => (
                            <span
                              key={s.id}
                              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                match.youCanTeachThem.includes(s.skillName.toLowerCase())
                                  ? 'bg-violet-200 text-violet-950 font-bold ring-1 ring-violet-400'
                                  : 'bg-white text-slate-700 border border-slate-200'
                              }`}
                            >
                              {s.skillName}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => onViewProfile(match.user.id)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl text-center transition-colors"
                    >
                      View Profile
                    </button>

                    {match.connectionStatus === 'ACCEPTED' ? (
                      <span className="px-3 py-2 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Connected</span>
                      </span>
                    ) : match.connectionStatus === 'PENDING' ? (
                      <span className="px-3 py-2 bg-amber-50 text-amber-700 text-xs font-semibold rounded-xl flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pending</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleConnect(match.user.id)}
                        disabled={connectingUserId === match.user.id}
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl text-center transition-colors flex items-center justify-center gap-1 shadow-sm"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Connect</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Requests Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Skill Exchange Requests</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Newly published skill swap proposals from the community.
            </p>
          </div>
          <button
            onClick={onNavigateToExplore}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Explore All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {safeRecentExchanges.map((ex) => (
            <div
              key={ex.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={ex.userProfileImage}
                    alt={ex.userName}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">
                      {ex.userName}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {new Date(ex.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {ex.mode}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onViewProfile(ex.userId)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition-colors"
                  title="View User"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>

              {/* Skills pair */}
              <div className="flex items-center gap-2 mb-3 text-xs">
                <span className="font-semibold text-violet-800 bg-violet-50 border border-violet-100 px-2.5 py-1 rounded-lg truncate">
                  Wants: {ex.learningSkillName}
                </span>
                <span className="text-slate-400 font-bold">↔</span>
                <span className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg truncate">
                  Teaches: {ex.teachingSkillName}
                </span>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                "{ex.description}"
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="text-[11px] text-slate-400">
                  {ex.userLocation || 'Online'}
                </span>
                <button
                  onClick={() => onViewProfile(ex.userId)}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <span>Connect & View</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
