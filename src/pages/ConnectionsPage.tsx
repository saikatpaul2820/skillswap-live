import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Send,
  UserCheck,
  UserX,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Connection } from '../types';

interface ConnectionsPageProps {
  onNavigateToChat: (userId: string) => void;
  onViewProfile: (userId: string) => void;
  onExplore: () => void;
}

export const ConnectionsPage: React.FC<ConnectionsPageProps> = ({
  onNavigateToChat,
  onViewProfile,
  onExplore,
}) => {
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'sent'>('pending');
  const [connectionsData, setConnectionsData] = useState<{
    all: Connection[];
    pendingIncoming: Connection[];
    pendingSent: Connection[];
    accepted: Connection[];
  }>({
    all: [],
    pendingIncoming: [],
    pendingSent: [],
    accepted: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchConnections = async () => {
    setIsLoading(true);
    try {
      const data = await api.getConnections();
      setConnectionsData(data);
      // If no incoming pending requests, default to accepted tab
      if (data.pendingIncoming.length === 0 && data.accepted.length > 0) {
        setActiveTab('accepted');
      }
    } catch (err) {
      console.error('Failed to load connections:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [currentUser]);

  const handleAccept = async (id: string) => {
    setProcessingId(id);
    try {
      await api.acceptConnection(id);
      await fetchConnections();
    } catch (err: any) {
      alert(err.message || 'Failed to accept connection request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      await api.rejectConnection(id);
      await fetchConnections();
    } catch (err: any) {
      alert(err.message || 'Failed to reject connection request');
    } finally {
      setProcessingId(null);
    }
  };

  const safeIncoming = Array.isArray(connectionsData?.pendingIncoming) ? connectionsData.pendingIncoming : [];
  const safeAccepted = Array.isArray(connectionsData?.accepted) ? connectionsData.accepted : [];
  const safeSent = Array.isArray(connectionsData?.pendingSent) ? connectionsData.pendingSent : [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Skill Connections
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your exchange partners, pending invitations, and active learning connections.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'pending'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pending Invitations</span>
          {safeIncoming.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] bg-rose-500 text-white rounded-full font-bold">
              {safeIncoming.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('accepted')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'accepted'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Active Connections ({safeAccepted.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sent')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'sent'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Sent Requests ({safeSent.length})</span>
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading connections...</p>
        </div>
      ) : (
        <div>
          {/* Tab 1: Pending Incoming Requests */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              {safeIncoming.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-slate-800 mb-1">No Pending Invitations</h3>
                  <p className="text-xs text-slate-500 mb-4">
                    When other learners want to connect with you for skill exchange, their requests will appear here.
                  </p>
                  <button
                    onClick={onExplore}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl"
                  >
                    Explore Exchanges
                  </button>
                </div>
              ) : (
                safeIncoming.map((conn) => (
                  <div
                    key={conn.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={conn.senderProfileImage}
                        alt={conn.senderName}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-100"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">
                          {conn.senderName}
                        </h4>
                        <p className="text-xs text-slate-400">@{conn.senderUsername}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Sent invitation on {new Date(conn.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => onViewProfile(conn.senderId)}
                        className="flex-1 sm:flex-initial px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                      >
                        View Profile
                      </button>

                      <button
                        onClick={() => handleReject(conn.id)}
                        disabled={processingId === conn.id}
                        className="flex-1 sm:flex-initial px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() => handleAccept(conn.id)}
                        disabled={processingId === conn.id}
                        className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 2: Accepted Connections */}
          {activeTab === 'accepted' && (
            <div className="space-y-4">
              {safeAccepted.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-slate-800 mb-1">No Active Connections Yet</h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Send invitations from Explore or Matches to start chatting and coordinating skill swaps.
                  </p>
                  <button
                    onClick={onExplore}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl"
                  >
                    Find Peers to Connect
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {safeAccepted.map((conn) => {
                    const isSender = conn.senderId === currentUser?.id;
                    const partnerId = isSender ? conn.receiverId : conn.senderId;
                    const partnerName = isSender ? conn.receiverName : conn.senderName;
                    const partnerUsername = isSender ? conn.receiverUsername : conn.senderUsername;
                    const partnerImage = isSender ? conn.receiverProfileImage : conn.senderProfileImage;

                    return (
                      <div
                        key={conn.id}
                        className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div className="flex items-center gap-3.5 mb-4">
                          <img
                            src={partnerImage}
                            alt={partnerName}
                            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-100"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 leading-tight truncate">
                              {partnerName}
                            </h4>
                            <p className="text-xs text-slate-400 truncate">@{partnerUsername}</p>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 mt-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Active Connection
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                          <button
                            onClick={() => onViewProfile(partnerId)}
                            className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                          >
                            View Profile
                          </button>
                          <button
                            onClick={() => onNavigateToChat(partnerId)}
                            className="flex-1 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Open Chat</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Sent Requests */}
          {activeTab === 'sent' && (
            <div className="space-y-4">
              {safeSent.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
                  <Send className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-slate-800 mb-1">No Pending Sent Requests</h3>
                  <p className="text-xs text-slate-500 mb-4">
                    You have not sent any pending connection requests at this time.
                  </p>
                  <button
                    onClick={onExplore}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl"
                  >
                    Discover Peers to Connect
                  </button>
                </div>
              ) : (
                safeSent.map((conn) => (
                  <div
                    key={conn.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={conn.receiverProfileImage}
                        alt={conn.receiverName}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">
                          {conn.receiverName}
                        </h4>
                        <p className="text-xs text-slate-400">@{conn.receiverUsername}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Sent on {new Date(conn.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewProfile(conn.receiverId)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                      >
                        View
                      </button>
                      <span className="px-3 py-1.5 text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Awaiting Response</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
