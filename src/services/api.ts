import {
  User,
  Skill,
  UserSkill,
  SkillExchangeRequest,
  Connection,
  Message,
  Notification,
  MatchRecommendation,
  CallSession,
} from '../types';

const API_BASE = '/api';

class ApiService {
  getToken(): string | null {
    return localStorage.getItem('skillswap_token');
  }

  setToken(token: string | null): void {
    if (token) {
      localStorage.setItem('skillswap_token', token);
    } else {
      localStorage.removeItem('skillswap_token');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });
    } catch (networkErr: any) {
      throw new Error(networkErr?.message || 'Network connection failed');
    }

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      if (isJson) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // ignore
        }
      }
      if (response.status === 401) {
        // Token has expired or is invalid - clear stale token
        this.setToken(null);
      }
      throw new Error(errorMessage);
    }

    if (!isJson) {
      throw new Error(`Expected JSON from API, but received ${contentType || 'non-JSON response'}`);
    }

    return response.json();
  }

  // Auth endpoints
  async login(payload: { email: string; password?: string }) {
    const data = await this.request<{
      message: string;
      token: string;
      user: User;
      skills: UserSkill[];
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async register(payload: { name: string; email: string; password: string; confirmPassword?: string }) {
    const data = await this.request<{
      message: string;
      token: string;
      user: User;
      isNewUser: boolean;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async getCurrentUser() {
    return this.request<{ user: User; skills: UserSkill[] }>('/auth/me');
  }

  // Users
  async getUsers(query?: string) {
    const q = query ? `?q=${encodeURIComponent(query)}` : '';
    return this.request<User[]>(`/users/search${q}`);
  }

  async getUser(id: string) {
    return this.request<{ user: User; skills: UserSkill[]; exchanges: SkillExchangeRequest[] }>(
      `/users/${id}`
    );
  }

  async updateProfile(id: string, updates: Partial<User>) {
    return this.request<{ message: string; user: User }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async setUserSkills(
    userId: string,
    skills: { skillName: string; category?: string; type: 'TEACH' | 'LEARN' }[]
  ) {
    return this.request<UserSkill[]>(`/users/${userId}/skills`, {
      method: 'POST',
      body: JSON.stringify({ skills }),
    });
  }

  // Exchanges
  async getExchanges(params?: { search?: string; mode?: string; skill?: string; userId?: string }) {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.mode) query.append('mode', params.mode);
    if (params?.skill) query.append('skill', params.skill);
    if (params?.userId) query.append('userId', params.userId);

    const qs = query.toString();
    return this.request<SkillExchangeRequest[]>(`/exchanges${qs ? `?${qs}` : ''}`);
  }

  async getExchange(id: string) {
    return this.request<SkillExchangeRequest>(`/exchanges/${id}`);
  }

  async createExchange(data: {
    learningSkill: string;
    teachingSkill: string;
    description: string;
    mode: 'Online' | 'Offline' | 'Either';
  }) {
    return this.request<SkillExchangeRequest>('/exchanges', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateExchange(
    id: string,
    updates: Partial<{
      description: string;
      mode: 'Online' | 'Offline' | 'Either';
      status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
      learningSkill: string;
      teachingSkill: string;
    }>
  ) {
    return this.request<SkillExchangeRequest>(`/exchanges/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteExchange(id: string) {
    return this.request<{ message: string }>(`/exchanges/${id}`, {
      method: 'DELETE',
    });
  }

  // Matches
  async getMatches() {
    return this.request<MatchRecommendation[]>('/matches');
  }

  // Connections
  async getConnections() {
    return this.request<{
      all: Connection[];
      pendingIncoming: Connection[];
      pendingSent: Connection[];
      accepted: Connection[];
    }>('/connections');
  }

  async createConnection(receiverId: string) {
    return this.request<Connection>('/connections', {
      method: 'POST',
      body: JSON.stringify({ receiverId }),
    });
  }

  async acceptConnection(id: string) {
    return this.request<Connection>(`/connections/${id}/accept`, {
      method: 'PUT',
    });
  }

  async rejectConnection(id: string) {
    return this.request<Connection>(`/connections/${id}/reject`, {
      method: 'PUT',
    });
  }

  // Messages
  async getMessages(userId: string) {
    return this.request<{
      targetUser: User;
      messages: Message[];
    }>(`/messages/${userId}`);
  }

  async sendMessage(
    receiverId: string,
    message: string,
    type: 'TEXT' | 'CALL_INVITE' | 'CALL_ENDED' = 'TEXT',
    callData?: Message['callData']
  ) {
    return this.request<Message>('/messages', {
      method: 'POST',
      body: JSON.stringify({ receiverId, message, type, callData }),
    });
  }

  // 1-to-1 Video Calls
  async getActiveCalls() {
    return this.request<{ calls: CallSession[] }>('/calls/active');
  }

  async initiateCall(receiverId: string) {
    return this.request<CallSession>('/calls/initiate', {
      method: 'POST',
      body: JSON.stringify({ receiverId }),
    });
  }

  async getCallSession(callId: string) {
    return this.request<CallSession>(`/calls/${callId}`);
  }

  async updateCallStatus(callId: string, status: 'CONNECTED' | 'ENDED' | 'DECLINED') {
    return this.request<CallSession>(`/calls/${callId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async sendCallSignal(callId: string, toUserId: string, signal: any) {
    return this.request<{ success: boolean }>(`/calls/${callId}/signal`, {
      method: 'POST',
      body: JSON.stringify({ toUserId, signal }),
    });
  }

  async getCallSignals(callId: string, since: number = 0) {
    return this.request<{
      signals: Array<{
        callId: string;
        fromUserId: string;
        toUserId: string;
        signal: any;
        timestamp: number;
      }>;
    }>(`/calls/${callId}/signals?since=${since}`);
  }

  async simulateAcceptCall(callId: string) {
    return this.request<CallSession>(`/calls/${callId}/simulate-accept`, {
      method: 'POST',
    });
  }

  // Notifications
  async getNotifications() {
    return this.request<{
      notifications: Notification[];
      unreadCount: number;
    }>('/notifications');
  }

  async markNotificationRead(id: string) {
    return this.request<{ message: string }>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  // Skills
  async getSkills() {
    return this.request<Skill[]>('/skills');
  }

  // Demo reset
  async resetDemoData() {
    return this.request<{ message: string }>('/seed/reset', {
      method: 'POST',
    });
  }
}

export const api = new ApiService();
