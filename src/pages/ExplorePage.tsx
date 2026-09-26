import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  PlusCircle,
  ExternalLink,
  UserPlus,
  Clock,
  CheckCircle2,
  Calendar,
  Globe,
  Monitor,
  MapPin,
  Trash2,
  Edit3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { SkillExchangeRequest, Connection } from '../types';

interface ExplorePageProps {
  onOpenCreateExchange: (existing?: SkillExchangeRequest) => void;
  onViewProfile: (userId: string) => void;
  onOpenAuthModal: () => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({
  onOpenCreateExchange,
  onViewProfile,
  onOpenAuthModal,
}) => {
  const { currentUser, isAuthenticated } = useAuth();

  const [exchanges, setExchanges] = useState<SkillExchangeRequest[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState<string>('ALL');
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [connectingUserId, setConnectingUserId] = useState<string | null>(null);

  const fetchExchanges = async () => {
    setIsLoading(true);
    try {
      const [exData, connData] = await Promise.all([
        api.getExchanges({
          search: searchQuery,
          mode: selectedMode !== 'ALL' ? selectedMode : undefined,
          skill: selectedSkillFilter !== 'ALL' ? selectedSkillFilter : undefined,
        }),
        isAuthenticated ? api.getConnections().then(res => res.all).catch(() => []) : Promise.resolve([]),
      ]);
      setExchanges(Array.isArray(exData) ? exData : []);
      setConnections(Array.isArray(connData) ? connData : []);
    } catch (err) {
      console.error('Failed to load exchanges:', err);
      setExchanges([]);
      setConnections([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExchanges();
  }, [searchQuery, selectedMode, selectedSkillFilter, isAuthenticated]);

  const handleConnect = async (receiverId: string) => {
    if (!isAuthenticated) {
      onOpenAuthModal();
      return;
    }
    setConnectingUserId(receiverId);
    try {
      const newConn = await api.createConnection(receiverId);
      setConnections(prev => [newConn, ...(Array.isArray(prev) ? prev : [])]);
    } catch (err: any) {
      alert(err.message || 'Failed to send connection request');
    } finally {
      setConnectingUserId(null);
    }
  };

  const handleDeleteExchange = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exchange request?')) return;
    try {
      await api.deleteExchange(id);
      setExchanges(prev => (Array.isArray(prev) ? prev : []).filter(e => e.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete exchange request');
    }
  };

  const safeConnections = Array.isArray(connections) ? connections : [];
  const safeExchanges = Array.isArray(exchanges) ? exchanges : [];

  const getConnStatus = (otherUserId: string) => {
    if (!currentUser) return 'NONE';
    const found = safeConnections.find(
      c =>
        (c.senderId === currentUser.id && c.receiverId === otherUserId) ||
        (c.senderId === otherUserId && c.receiverId === currentUser.id)
    );
    return found ? found.status : 'NONE';
  };

  const popularSkillTags = [
    'ALL',
    'Java',
    'UI/UX Design',
    'Python',
    'React',
    'Graphic Design',
    'Machine Learning',
    'Video Editing',
    'Digital Marketing',
    'Advanced Excel'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Explore Exchanges
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse public skill exchange proposals and discover members ready to trade knowledge.
          </p>
        </div>

        <button
          id="explore-post-exchange-btn"
          onClick={() => {
            if (!isAuthenticated) {
              onOpenAuthModal();
            } else {
              onOpenCreateExchange();
            }
          }}
          className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post Skill Exchange</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Text Search Input */}
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by skill name (Java, React, UI/UX...), user name, or keyword..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Mode Selector */}
          <div className="md:col-span-4 flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Mode:</span>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Modes (Online & Offline)</option>
              <option value="Online">Online Sessions Only</option>
              <option value="Offline">In-Person Only</option>
              <option value="Either">Flexible / Either</option>
            </select>
          </div>
        </div>

        {/* Skill Filter Chips */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Skill Filter:
          </span>
          {popularSkillTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedSkillFilter(tag)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg shrink-0 transition-colors ${
                selectedSkillFilter === tag
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Exchange Cards Grid */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading skill exchange requests...</p>
        </div>
      ) : safeExchanges.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm max-w-lg mx-auto">
          <p className="text-sm font-semibold text-slate-800 mb-1">No exchange requests found</p>
          <p className="text-xs text-slate-500 mb-4">
            Try clearing your search filters or be the first to post a new skill exchange request!
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedMode('ALL');
              setSelectedSkillFilter('ALL');
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl mr-2"
          >
            Reset Filters
          </button>
          <button
            onClick={() => onOpenCreateExchange()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl"
          >
            Post Exchange
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {safeExchanges.map((exchange) => {
            const isOwner = currentUser?.id === exchange.userId;
            const connStatus = getConnStatus(exchange.userId);

            return (
              <div
                key={exchange.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* User Profile Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div
                      onClick={() => onViewProfile(exchange.userId)}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <img
                        src={exchange.userProfileImage}
                        alt={exchange.userName}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-indigo-300 transition-all"
                      />
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                          {exchange.userName}
                        </h3>
                        <p className="text-xs text-slate-400">@{exchange.userUsername}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {exchange.mode}
                      </span>
                      {isOwner && (
                        <div className="flex items-center">
                          <button
                            onClick={() => onOpenCreateExchange(exchange)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteExchange(exchange.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Skills Exchange Badge Matrix */}
                  <div className="space-y-2 mb-3.5">
                    <div className="p-2.5 rounded-xl bg-violet-50/70 border border-violet-100">
                      <span className="text-[10px] font-bold text-violet-800 uppercase tracking-wider block">
                        Wants to Learn:
                      </span>
                      <span className="text-xs font-bold text-violet-950 block mt-0.5 truncate">
                        {exchange.learningSkillName}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                        Can Teach:
                      </span>
                      <span className="text-xs font-bold text-emerald-950 block mt-0.5 truncate">
                        {exchange.teachingSkillName}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4">
                    "{exchange.description}"
                  </p>
                </div>

                {/* Footer and Actions */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(exchange.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    {exchange.userLocation && (
                      <span className="flex items-center gap-1 truncate max-w-[140px]">
                        <MapPin className="w-3 h-3" />
                        {exchange.userLocation}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewProfile(exchange.userId)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl text-center transition-colors"
                    >
                      View Profile
                    </button>

                    {isOwner ? (
                      <span className="px-3 py-2 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-xl text-center">
                        Your Request
                      </span>
                    ) : connStatus === 'ACCEPTED' ? (
                      <span className="px-3 py-2 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Connected</span>
                      </span>
                    ) : connStatus === 'PENDING' ? (
                      <span className="px-3 py-2 bg-amber-50 text-amber-700 text-xs font-semibold rounded-xl flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pending</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleConnect(exchange.userId)}
                        disabled={connectingUserId === exchange.userId}
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl text-center transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        {connectingUserId === exchange.userId ? (
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
