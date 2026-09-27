import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  MessageSquare,
  Users,
  Check,
  CheckCheck,
  MapPin,
  Clock,
  Sparkles,
  ArrowLeft,
  Video,
  Phone,
  PhoneCall,
  Calendar,
  Code2,
  FileText,
  Smile,
  ShieldCheck,
  Paperclip
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { api } from '../services/api';
import { Connection, Message, User } from '../types';

interface MessagesPageProps {
  initialUserId?: string | null;
  onExplore: () => void;
  onViewProfile: (userId: string) => void;
  onStartVideoCall?: (partnerId: string, immediateConnect?: boolean) => void;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({
  initialUserId,
  onExplore,
  onViewProfile,
  onStartVideoCall,
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(initialUserId || null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isStartingCall, setIsStartingCall] = useState(false);

  // Sync initialUserId when navigating from other pages
  useEffect(() => {
    if (initialUserId) {
      setSelectedUserId(initialUserId);
    }
  }, [initialUserId]);

  // Quick message shortcuts for skill swap coordination
  const quickNotes = [
    '📹 Ready for our video session now?',
    '👋 Hi! Excited to exchange skills. When are you free for a video call?',
    '📅 Can we schedule a 45-minute lesson this weekend?',
    '💻 I prepared our starter GitHub repo and notes!',
  ];

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load active accepted connections
  useEffect(() => {
    let isMounted = true;
    setIsLoadingList(true);

    api.getConnections()
      .then((data) => {
        if (!isMounted) return;
        const accepted = data.accepted || [];
        setConnections(accepted);

        if (!selectedUserId && accepted.length > 0) {
          const first = accepted[0];
          const partnerId = first.senderId === currentUser?.id ? first.receiverId : first.senderId;
          setSelectedUserId(partnerId);
        }
      })
      .catch((err) => console.error('Failed to load connections:', err))
      .finally(() => {
        if (isMounted) setIsLoadingList(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Load chat messages when selectedUserId changes
  useEffect(() => {
    if (!selectedUserId) {
      setMessages([]);
      setSelectedUser(null);
      return;
    }

    let isMounted = true;
    setIsLoadingMessages(true);

    api.getMessages(selectedUserId)
      .then((data) => {
        if (!isMounted) return;
        setMessages(data.messages || []);
        setSelectedUser(data.targetUser || null);
        setTimeout(scrollToBottom, 50);
      })
      .catch((err) => {
        console.error('Failed to load messages:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingMessages(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedUserId]);

  // Poll for new messages every 3 seconds when in active chat
  useEffect(() => {
    if (!selectedUserId) return;
    const interval = setInterval(() => {
      api.getMessages(selectedUserId)
        .then((data) => {
          setMessages(data.messages || []);
        })
        .catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedUserId]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || messageText).trim();
    if (!text || !selectedUserId || isSending) return;

    if (!textToSend) setMessageText('');
    setIsSending(true);

    try {
      const newMsg = await api.sendMessage(selectedUserId, text, 'TEXT');
      setMessages((prev) => [...prev, newMsg]);
      setTimeout(scrollToBottom, 50);
    } catch (err: any) {
      showToast(err.message || 'Failed to send message', 'error');
      if (!textToSend) setMessageText(text);
    } finally {
      setIsSending(false);
    }
  };

  const handleStartCall = async (immediate: boolean | React.MouseEvent = false) => {
    const isImmediate = immediate === true;
    if (!selectedUserId || isStartingCall) return;
    setIsStartingCall(true);
    try {
      if (onStartVideoCall) {
        onStartVideoCall(selectedUserId, isImmediate);
      } else {
        await api.initiateCall(selectedUserId, isImmediate);
        const data = await api.getMessages(selectedUserId);
        setMessages(data.messages || []);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to initiate video call', 'error');
    } finally {
      setIsStartingCall(false);
    }
  };

  const safeConnections = Array.isArray(connections) ? connections : [];
  const safeMessages = Array.isArray(messages) ? messages : [];

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-[calc(100vh-125px)] min-h-[580px] flex">
        {/* Left Sidebar: Connections List (hidden on mobile if chat is open) */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col shrink-0 bg-slate-50/50 ${
            selectedUserId ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Exchange Chats</h2>
              <p className="text-xs text-slate-500">1-to-1 Peers & Video Calls</p>
            </div>
            <span className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full">
              {safeConnections.length} Active
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {isLoadingList ? (
              <div className="py-12 text-center">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400">Loading peers...</p>
              </div>
            ) : safeConnections.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No active connections</p>
                <p className="text-[11px] text-slate-400 mt-1 mb-4 leading-relaxed">
                  You can chat and start video calls with peers once your connection request is accepted.
                </p>
                <button
                  onClick={onExplore}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Find Skill Swaps
                </button>
              </div>
            ) : (
              safeConnections.map((conn) => {
                const isSender = conn.senderId === currentUser?.id;
                const partnerId = isSender ? conn.receiverId : conn.senderId;
                const partnerName = isSender ? conn.receiverName : conn.senderName;
                const partnerUsername = isSender ? conn.receiverUsername : conn.senderUsername;
                const partnerImage = isSender ? conn.receiverProfileImage : conn.senderProfileImage;
                const isSelected = selectedUserId === partnerId;

                return (
                  <button
                    key={conn.id}
                    onClick={() => setSelectedUserId(partnerId)}
                    className={`w-full text-left p-3.5 transition-all flex items-center gap-3 relative cursor-pointer ${
                      isSelected
                        ? 'bg-white border-l-4 border-indigo-600 shadow-xs'
                        : 'hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={partnerImage}
                        alt={partnerName}
                        className="w-11 h-11 rounded-full object-cover ring-1 ring-slate-200"
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                          {partnerName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(conn.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        @{partnerUsername}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Chat & Video Call Panel */}
        <div
          className={`flex-1 flex flex-col bg-white ${
            !selectedUserId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {selectedUser ? (
            <>
              {/* Chat Header with Direct 1-to-1 Video Call Action */}
              <div className="px-4 sm:px-6 py-3 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setSelectedUserId(null)}
                    className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                    title="Back to conversations"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div
                    onClick={() => onViewProfile(selectedUser.id)}
                    className="flex items-center gap-2.5 cursor-pointer group truncate"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={selectedUser.profileImage}
                        alt={selectedUser.name}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-indigo-300 transition-all"
                      />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                    </div>
                    <div className="min-w-0 truncate">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5 truncate">
                        <span className="truncate">{selectedUser.name}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full shrink-0">
                          Online
                        </span>
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
                        <span>@{selectedUser.username}</span>
                        {selectedUser.location && (
                          <>
                            <span>·</span>
                            <span className="hidden sm:flex items-center gap-0.5 truncate">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {selectedUser.location}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Primary Video Call Button in Header */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleStartCall}
                    disabled={isStartingCall}
                    className="px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer hover:scale-102"
                    title={`Start 1-to-1 Live Video Call with ${selectedUser.name}`}
                  >
                    <Video className="w-4 h-4 animate-pulse" />
                    <span className="hidden sm:inline">Start Video Call</span>
                    <span className="sm:hidden">Video Call</span>
                  </button>

                  <button
                    onClick={() => onViewProfile(selectedUser.id)}
                    className="hidden sm:inline-block px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Profile
                  </button>
                </div>
              </div>

              {/* Chat Messages Stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40">
                {/* 1-to-1 Video Session Highlight Card */}
                <div className="max-w-md mx-auto p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-white border border-indigo-100 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Video className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-indigo-950">
                          1-to-1 Live Video Call Room
                        </h4>
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded-full">
                          WebRTC Ready
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        Practice live hands-on tutoring, share screens, and exchange code or notes in real-time.
                      </p>
                      <button
                        onClick={handleStartCall}
                        disabled={isStartingCall}
                        className="mt-3 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Start Video Call Now</span>
                      </button>
                    </div>
                  </div>
                </div>

                {isLoadingMessages ? (
                  <div className="py-12 text-center">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Loading conversation...</p>
                  </div>
                ) : safeMessages.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-xs text-slate-400">No messages yet. Say hello or start a video call!</p>
                  </div>
                ) : (
                  safeMessages.map((msg) => {
                    const isMe = msg.senderId === currentUser?.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        {msg.type === 'CALL_INVITE' ? (
                          /* Interactive Video Call Message Banner */
                          <div className={`p-4 rounded-2xl border max-w-sm w-full ${
                            isMe
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-950'
                              : 'bg-white border-slate-200 shadow-sm text-slate-900'
                          }`}>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                                <Video className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-bold block">
                                  {isMe ? 'You started a 1-to-1 Video Call' : `${selectedUser.name} started a Video Call`}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  Live interactive video session
                                </span>
                              </div>
                            </div>
                            <div className="mt-3 pt-2.5 border-t border-indigo-100 flex items-center justify-between">
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <button
                                onClick={() => handleStartCall(true)}
                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer hover:scale-102"
                              >
                                <PhoneCall className="w-3 h-3" />
                                <span>Join Room</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Regular Text Message */
                          <div
                            className={`max-w-[85%] sm:max-w-md px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                              isMe
                                ? 'bg-indigo-600 text-white rounded-br-xs'
                                : 'bg-white text-slate-900 border border-slate-200/90 rounded-bl-xs'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.message}</p>
                          </div>
                        )}

                        <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 px-1">
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isMe && (
                            <span title={msg.isRead ? 'Read' : 'Delivered'}>
                              {msg.isRead ? (
                                <CheckCheck className="w-3 h-3 text-indigo-500" />
                              ) : (
                                <Check className="w-3 h-3 text-slate-400" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick suggestions / Coordination Shortcuts */}
              <div className="px-3 sm:px-4 py-2 border-t border-slate-100 bg-slate-50/70 flex items-center gap-1.5 overflow-x-auto text-[11px] text-slate-600 shrink-0">
                <button
                  type="button"
                  onClick={handleStartCall}
                  className="px-2.5 py-1 bg-indigo-600 text-white hover:bg-indigo-700 font-bold rounded-lg whitespace-nowrap text-left transition-colors shrink-0 flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Start Video Call</span>
                </button>

                {quickNotes.map((note, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(note)}
                    className="px-2.5 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 rounded-lg whitespace-nowrap text-left transition-colors shrink-0 cursor-pointer"
                  >
                    {note.length > 35 ? note.substring(0, 35) + '...' : note}
                  </button>
                ))}
              </div>

              {/* Chat Input Field with Video Call Button */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 sm:p-4 border-t border-slate-200 bg-white shrink-0"
              >
                <div className="flex items-center gap-2">
                  {/* Direct Video Call Button in input bar */}
                  <button
                    type="button"
                    onClick={handleStartCall}
                    disabled={isStartingCall}
                    title={`Start 1-to-1 Video Call with ${selectedUser.name}`}
                    className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200/80 rounded-xl flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                  >
                    <Video className="w-5 h-5" />
                  </button>

                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message or discuss your lesson agenda..."
                    className="flex-1 px-4 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!messageText.trim() || isSending}
                    className="px-4 sm:px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-800 mb-1">Select a Connection to Chat</h3>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Choose a peer from the left sidebar to discuss learning schedules, share notes, and jump into 1-to-1 video calls.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
