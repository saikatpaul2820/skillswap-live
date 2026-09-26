import WebSocket, { WebSocketServer } from 'ws';
import type { Server } from 'http';

export type WSClient = WebSocket;

export interface StoredSignal {
  callId: string;
  fromUserId: string;
  toUserId: string;
  signal: any;
  timestamp: number;
}

class SignalingService {
  private wss: WebSocketServer | null = null;
  private userSockets: Map<string, Set<WebSocket>> = new Map();
  private socketUserMap: Map<WebSocket, { userId: string; callId?: string }> = new Map();
  private signalsBuffer: StoredSignal[] = [];

  public init(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket) => {
      ws.on('message', (data: any) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (err) {
          console.error('Error handling WebSocket message:', err);
        }
      });

      ws.on('close', () => {
        this.removeSocket(ws);
      });

      ws.on('error', (err: Error) => {
        console.warn('WebSocket socket error:', err);
        this.removeSocket(ws);
      });
    });

    // Cleanup old signals every 5 minutes (keep signals newer than 15 minutes)
    setInterval(() => {
      const cutoff = Date.now() - 15 * 60 * 1000;
      this.signalsBuffer = this.signalsBuffer.filter((s) => s.timestamp > cutoff);
    }, 5 * 60 * 1000);

    console.log('WebRTC Signaling WebSocket Server initialized on /ws');
  }

  private removeSocket(ws: WebSocket) {
    const meta = this.socketUserMap.get(ws);
    if (meta) {
      const userSet = this.userSockets.get(meta.userId);
      if (userSet) {
        userSet.delete(ws);
        if (userSet.size === 0) {
          this.userSockets.delete(meta.userId);
        }
      }
      this.socketUserMap.delete(ws);
    }
  }

  private handleMessage(ws: WebSocket, message: any) {
    if (!message || !message.type) return;

    switch (message.type) {
      case 'join': {
        const { userId, callId } = message;
        if (!userId) return;

        this.socketUserMap.set(ws, { userId, callId });
        if (!this.userSockets.has(userId)) {
          this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId)!.add(ws);

        ws.send(JSON.stringify({ type: 'joined', userId, callId }));
        break;
      }

      case 'signal': {
        const meta = this.socketUserMap.get(ws);
        const fromUserId = meta?.userId || message.fromUserId;
        const { callId, toUserId, signal } = message;

        if (callId && toUserId && signal) {
          this.storeAndRelaySignal(callId, fromUserId, toUserId, signal);
        }
        break;
      }

      case 'notes_update': {
        const meta = this.socketUserMap.get(ws);
        const fromUserId = meta?.userId || message.fromUserId;
        const { callId, toUserId, notes } = message;

        if (toUserId) {
          this.sendToUser(toUserId, {
            type: 'notes_update',
            callId,
            fromUserId,
            notes,
          });
        }
        break;
      }

      case 'call_status': {
        const { callId, toUserId, status } = message;
        if (toUserId) {
          this.sendToUser(toUserId, {
            type: 'call_status',
            callId,
            status,
          });
        }
        break;
      }

      case 'ping': {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;
      }

      default:
        break;
    }
  }

  public storeAndRelaySignal(
    callId: string,
    fromUserId: string,
    toUserId: string,
    signal: any
  ) {
    const entry: StoredSignal = {
      callId,
      fromUserId,
      toUserId,
      signal,
      timestamp: Date.now(),
    };

    this.signalsBuffer.push(entry);

    // Relay via WebSocket if toUserId is online
    this.sendToUser(toUserId, {
      type: 'signal',
      callId,
      fromUserId,
      signal,
      timestamp: entry.timestamp,
    });
  }

  public sendToUser(userId: string, data: any) {
    const sockets = this.userSockets.get(userId);
    if (!sockets || sockets.size === 0) return;

    const payload = JSON.stringify(data);
    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }

  public getSignals(callId: string, userId: string, since: number = 0): StoredSignal[] {
    return this.signalsBuffer.filter(
      (s) => s.callId === callId && s.toUserId === userId && s.timestamp > since
    );
  }
}

export const signalingService = new SignalingService();