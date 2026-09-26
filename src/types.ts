export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  bio: string;
  location: string;
  profileImage: string;
  createdAt: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
}

export interface UserSkill {
  id: string;
  userId: string;
  skillId: string;
  skillName: string;
  category: string;
  type: 'TEACH' | 'LEARN';
}

export interface SkillExchangeRequest {
  id: string;
  userId: string;
  userName: string;
  userUsername: string;
  userProfileImage: string;
  userLocation: string;
  learningSkillId: string;
  learningSkillName: string;
  teachingSkillId: string;
  teachingSkillName: string;
  description: string;
  mode: 'Online' | 'Offline' | 'Either';
  createdAt: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
}

export interface Connection {
  id: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderProfileImage: string;
  receiverId: string;
  receiverName: string;
  receiverUsername: string;
  receiverProfileImage: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type?: 'TEXT' | 'CALL_INVITE' | 'CALL_ENDED';
  callData?: {
    callId: string;
    status: 'RINGING' | 'ACCEPTED' | 'REJECTED' | 'ENDED';
    channelName?: string;
  };
}

export interface CallSession {
  id: string;
  callerId: string;
  callerName: string;
  callerAvatar: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar: string;
  status: 'CALLING' | 'CONNECTED' | 'ENDED' | 'DECLINED';
  startedAt: string;
  endedAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'CONNECTION_REQUEST' | 'CONNECTION_ACCEPTED' | 'NEW_MESSAGE' | 'NEW_MATCH' | 'INCOMING_CALL';
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface MatchRecommendation {
  user: User;
  skills: UserSkill[];
  matchType: 'MUTUAL_SWAP' | 'CAN_TEACH_YOU' | 'WANTS_YOUR_SKILL';
  compatibilityScore: number;
  theyCanTeachYou: string[];
  youCanTeachThem: string[];
  connectionStatus: 'NONE' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
  connectionId: string | null;
  isSender: boolean;
}