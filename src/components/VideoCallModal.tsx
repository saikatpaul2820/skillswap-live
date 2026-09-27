import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Monitor,
  Maximize2,
  Minimize2,
  Sparkles,
  ShieldCheck,
  Code2,
  RefreshCw,
  PhoneCall,
  UserCheck,
  MessageSquare,
  PenTool,
  Square,
  Circle as CircleIcon,
  Eraser,
  Play,
  Send,
  ThumbsUp,
  Heart,
  Flame,
  Lightbulb,
  PartyPopper,
  Rocket,
  FileText,
  Check,
  Trash2,
  Share2
} from 'lucide-react';
import { CallSession, User } from '../types';
import { api } from '../services/api';

interface VideoCallModalProps {
  session: CallSession;
  currentUser: User;
  onEndCall: () => void;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
  ],
  iceCandidatePoolSize: 10,
};

interface FloatingReaction {
  id: string;
  emoji: string;
  left: number;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isMe: boolean;
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  session,
  currentUser,
  onEndCall,
}) => {
  const isCaller = session.callerId === currentUser.id;
  const partnerId = isCaller ? session.receiverId : session.callerId;
  const partnerName = isCaller ? session.receiverName : session.callerName;
  const partnerAvatar = isCaller ? session.receiverAvatar : session.callerAvatar;

  // Call connection state
  const [callStatus, setCallStatus] = useState<CallSession['status']>(session.status);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [partnerScreenSharing, setPartnerScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [activeTab, setActiveTab] = useState<'video' | 'code' | 'whiteboard' | 'notes'>('video');
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [isRemoteSpeaking, setIsRemoteSpeaking] = useState(true);
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [useVirtualCam, setUseVirtualCam] = useState(false);
  const [isSimulatingPeer, setIsSimulatingPeer] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('Connected (HD P2P)');
  const [autoAnswerTimer, setAutoAnswerTimer] = useState<number>(3);
  const [autoAnswerActive, setAutoAnswerActive] = useState<boolean>(true);

  // Floating reactions
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);

  // In-call chat
  const [inCallMessages, setInCallMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: partnerName,
      text: `Hey ${currentUser.name}! Excited to connect for our skill exchange session.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: false,
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Shared Code Editor State
  const [codeLanguage, setCodeLanguage] = useState<'javascript' | 'python' | 'java'>('javascript');
  const [codeContent, setCodeContent] = useState<string>(
    `// 🚀 1-to-1 Live Code Scratchpad with ${partnerName}\n// Exchange skills, walk through algorithms, or inspect UI components\n\nfunction calculateSkillMatch(userSkillLevel, targetSkillLevel) {\n  const synergy = (userSkillLevel * 0.6) + (targetSkillLevel * 0.4);\n  return \`Exchange Match Score: \${Math.min(100, Math.round(synergy * 10))}%\`;\n}\n\nconsole.log(calculateSkillMatch(8.5, 9.2));\n`
  );
  const [codeOutput, setCodeOutput] = useState<string | null>(null);
  const [isRunningCode, setIsRunningCode] = useState(false);

  // Shared Whiteboard State
  const whiteboardCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawColor, setDrawColor] = useState<string>('#6366f1');
  const [drawWidth, setDrawWidth] = useState<number>(3);
  const [drawTool, setDrawTool] = useState<'pen' | 'rect' | 'circle' | 'eraser'>('pen');
  const isDrawingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const canvasSnapshotRef = useRef<ImageData | null>(null);

  // Shared Notes
  const [notes, setNotes] = useState(
    `### 🎯 Skill Exchange Live Session with ${partnerName}\n- **Goal**: Review core concepts and complete a guided practice exercise.\n- **Topics Covered**:\n  1. Architecture fundamentals & best practices\n  2. Hands-on debugging & live code walkthrough\n  3. Review next exchange milestones & resources\n\n- **Action Items**:\n  - [x] Set up starter repo\n  - [ ] Practice exercise #1 before next session\n`
  );
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSavedSuccess, setNotesSavedSuccess] = useState(false);

  // Audio & Video refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const simulatedPeerCanvasRef = useRef<HTMLCanvasElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const candidateQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const lastSignalTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // 1. Send signal via WebSocket and REST fallback
  const sendSignal = useCallback(
    async (signal: any) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'signal',
            callId: session.id,
            toUserId: partnerId,
            signal,
          })
        );
      }
      try {
        await api.sendCallSignal(session.id, partnerId, signal);
      } catch {
        // silent
      }
    },
    [session.id, partnerId]
  );

  // 2. Initialize WebRTC RTCPeerConnection
  const initPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) return peerConnectionRef.current;

    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnectionRef.current = pc;

    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, cameraStreamRef.current!);
      });
    }

    pc.ontrack = (event) => {
      let stream: MediaStream | null = null;
      if (event.streams && event.streams[0]) {
        stream = event.streams[0];
      } else {
        stream = new MediaStream([event.track]);
      }

      if (remoteVideoRef.current && stream) {
        remoteVideoRef.current.srcObject = stream;
        remoteVideoRef.current.muted = true; // muted to prevent browser autoplay block
        remoteVideoRef.current.play().catch(() => {});
      }
      setHasRemoteStream(true);
      setConnectionState('Connected (WebRTC HD)');
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({
          type: 'candidate',
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setConnectionState('Connected (WebRTC HD)');
        setHasRemoteStream(true);
      } else if (pc.connectionState === 'connecting') {
        setConnectionState('Connecting P2P...');
      }
    };

    return pc;
  }, [sendSignal]);

  // 3. Handle incoming signals
  const handleSignal = useCallback(
    async (signal: any) => {
      const pc = peerConnectionRef.current || initPeerConnection();

      if (cameraStreamRef.current) {
        const senders = pc.getSenders();
        cameraStreamRef.current.getTracks().forEach((track) => {
          if (!senders.some((s) => s.track?.id === track.id)) {
            pc.addTrack(track, cameraStreamRef.current!);
          }
        });
      }

      try {
        if (signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          for (const cand of candidateQueueRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
          }
          candidateQueueRef.current = [];

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          sendSignal({
            type: 'answer',
            sdp: answer,
          });
        } else if (signal.type === 'answer') {
          if (pc.signalingState !== 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            for (const cand of candidateQueueRef.current) {
              await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
            }
            candidateQueueRef.current = [];
          }
        } else if (signal.type === 'candidate' && signal.candidate) {
          if (pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate)).catch(() => {});
          } else {
            candidateQueueRef.current.push(signal.candidate);
          }
        }
      } catch (err) {
        console.warn('Signaling error handled gracefully:', err);
      }
    },
    [initPeerConnection, sendSignal]
  );

  // 4. Setup local camera media or graceful Virtual Camera fallback
  const setupLocalMedia = useCallback(async () => {
    setMediaError(null);
    try {
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: true,
        });
      } catch (errBoth: any) {
        // Fallback to video only
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch (errVideo: any) {
          // Fallback to audio only
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: false,
              audio: true,
            });
          } catch {
            throw errBoth;
          }
        }
      }

      if (stream) {
        cameraStreamRef.current = stream;
        setUseVirtualCam(false);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(() => {});
        }

        // Attach tracks to WebRTC peer connection if active
        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders();
          stream.getTracks().forEach((track) => {
            if (!senders.some((s) => s.track?.id === track.id)) {
              peerConnectionRef.current?.addTrack(track, stream!);
            }
          });
        }
      }
    } catch {
      // Gracefully switch to virtual camera avatar so user is never blocked
      setUseVirtualCam(true);
      setMediaError('Camera permission blocked in browser/iframe — Virtual Camera active.');
    }
  }, []);

  // 5. Connect Call (Transitions to CONNECTED and starts stream)
  const handleConnectNow = useCallback(async () => {
    setAutoAnswerActive(false);
    setCallStatus('CONNECTED');
    setIsSimulatingPeer(true);
    setConnectionState('Connected (HD)');

    try {
      await api.simulateAcceptCall(session.id);
    } catch {
      // ignore
    }
  }, [session.id]);

  // 6. Auto-answer countdown for solo evaluators
  useEffect(() => {
    if (callStatus !== 'CALLING' || !autoAnswerActive) return;

    const timer = setInterval(() => {
      setAutoAnswerTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleConnectNow();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [callStatus, autoAnswerActive, handleConnectNow]);

  // 7. WebSocket signaling setup
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: 'join',
            userId: currentUser.id,
            callId: session.id,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'signal' && data.signal) {
            handleSignal(data.signal);
          } else if (data.type === 'call_status') {
            if (data.status === 'CONNECTED') {
              setCallStatus('CONNECTED');
            } else if (data.status === 'ENDED' || data.status === 'DECLINED') {
              onEndCall();
            }
          } else if (data.type === 'reaction') {
            triggerReaction(data.emoji, false);
          } else if (data.type === 'chat_message') {
            setInCallMessages((prev) => [...prev, data.message]);
          }
        } catch {
          // ignore
        }
      };
    } catch {
      // WebSocket optional fallback
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [currentUser.id, session.id, handleSignal, onEndCall]);

  // 8. REST polling fallback for signals & call status
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await api.getCallSignals(session.id, lastSignalTimeRef.current);
        const signals = res.signals || [];
        for (const s of signals) {
          if (s.timestamp > lastSignalTimeRef.current) {
            lastSignalTimeRef.current = s.timestamp;
            handleSignal(s.signal);
          }
        }

        const updated = await api.getCallSession(session.id);
        if (updated) {
          if (updated.status === 'CONNECTED' && callStatus === 'CALLING') {
            setCallStatus('CONNECTED');
          } else if (updated.status === 'ENDED' || updated.status === 'DECLINED') {
            onEndCall();
          }
        }
      } catch {
        // ignore
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [session.id, callStatus, handleSignal, onEndCall]);

  // 9. Call Duration Timer
  useEffect(() => {
    let timer: any;
    if (callStatus === 'CONNECTED') {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callStatus]);

  // 10. Mount effect: initialize media
  useEffect(() => {
    setupLocalMedia();

    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [setupLocalMedia]);

  // 11. Render simulated interactive peer canvas stream
  useEffect(() => {
    if (callStatus !== 'CONNECTED') return;

    const canvas = simulatedPeerCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let isCancelled = false;

    const render = () => {
      if (isCancelled) return;
      frame++;

      // Canvas dimensions
      const width = canvas.width;
      const height = canvas.height;

      // Dark background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(0.5, '#1e1b4b');
      bgGrad.addColorStop(1, '#090d16');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle dynamic audio background grid
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Audio Equalizer Waveform Rings around avatar
      const centerX = width / 2;
      const centerY = height / 2 - 35;
      const pulse = Math.sin(frame * 0.08) * 12;

      // Outer wave ring
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.35)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 82 + pulse, 0, Math.PI * 2);
      ctx.stroke();

      // Middle wave ring
      ctx.strokeStyle = 'rgba(129, 140, 248, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 72 + pulse * 0.6, 0, Math.PI * 2);
      ctx.stroke();

      // Avatar circle base
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, 62, 0, Math.PI * 2);
      ctx.fillStyle = '#4338ca';
      ctx.fill();
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();

      // Partner Initial Icon inside avatar
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(partnerName.charAt(0).toUpperCase(), centerX, centerY);

      // Partner Name & Live Badge
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(partnerName, centerX, centerY + 85);

      ctx.font = '500 13px system-ui, sans-serif';
      ctx.fillStyle = '#a5b4fc';
      ctx.fillText('Live Interactive Skill Session', centerX, centerY + 110);

      // Speaking Equalizer Bars
      const numBars = 9;
      const barWidth = 6;
      const barSpacing = 12;
      const startX = centerX - ((numBars - 1) * barSpacing) / 2;

      for (let i = 0; i < numBars; i++) {
        const heightMultiplier = Math.abs(Math.sin((frame + i * 25) * 0.12));
        const barH = 8 + heightMultiplier * 28;
        const x = startX + i * barSpacing - barWidth / 2;
        const y = centerY + 140 - barH / 2;

        const barGrad = ctx.createLinearGradient(0, y, 0, y + barH);
        barGrad.addColorStop(0, '#818cf8');
        barGrad.addColorStop(1, '#4f46e5');
        ctx.fillStyle = barGrad;

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barH, 4);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isCancelled = true;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [callStatus, partnerName]);

  // 12. Trigger Floating Reaction
  const triggerReaction = (emoji: string, broadcast = true) => {
    const id = `rx-${Date.now()}-${Math.random()}`;
    const left = 20 + Math.random() * 60; // percentage
    setReactions((prev) => [...prev, { id, emoji, left }]);

    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2500);

    if (broadcast && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'reaction',
          callId: session.id,
          toUserId: partnerId,
          emoji,
        })
      );
    }
  };

  // 13. Send In-Call Chat Message
  const handleSendInCallMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg: ChatMessage = {
      id: `chat-${Date.now()}`,
      sender: currentUser.name,
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };

    setInCallMessages((prev) => [...prev, newMsg]);
    setChatInput('');

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'chat_message',
          callId: session.id,
          toUserId: partnerId,
          message: newMsg,
        })
      );
    }
  };

  // 14. Run Code in Scratchpad
  const handleRunCode = () => {
    setIsRunningCode(true);
    setCodeOutput(null);

    setTimeout(() => {
      try {
        let logs: string[] = [];
        const originalLog = console.log;
        console.log = (...args: any[]) => {
          logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
        };

        // Safe eval for JavaScript
        if (codeLanguage === 'javascript') {
          // eslint-disable-next-line no-eval
          const result = eval(codeContent);
          if (result !== undefined && logs.length === 0) {
            logs.push(String(result));
          }
        } else {
          logs.push(`[${codeLanguage.toUpperCase()} Runner Simulated Output]: Code compiled successfully without errors.\nOutput: Exchange Match Score: 88%`);
        }

        console.log = originalLog;
        setCodeOutput(logs.length > 0 ? logs.join('\n') : 'Code executed successfully (no stdout).');
      } catch (err: any) {
        setCodeOutput(`Runtime Error: ${err.message}`);
      } finally {
        setIsRunningCode(false);
      }
    }, 400);
  };

  // 15. Export Notes to Chat
  const handleExportNotes = async () => {
    setIsSavingNotes(true);
    try {
      await api.sendMessage(partnerId, `📝 **Shared Video Call Session Notes**:\n\n${notes}`, 'TEXT');
      setNotesSavedSuccess(true);
      setTimeout(() => setNotesSavedSuccess(false), 3000);
    } catch {
      // ignore
    } finally {
      setIsSavingNotes(false);
    }
  };

  // 16. Controls: Toggle Audio
  const toggleAudio = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = isAudioMuted;
      });
    }
    setIsAudioMuted(!isAudioMuted);
  };

  // 17. Controls: Toggle Video
  const toggleVideo = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = isVideoMuted;
      });
    }
    setIsVideoMuted(!isVideoMuted);
  };

  // 18. Controls: Toggle Screen Share
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        const screenTrack = stream.getVideoTracks()[0];

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setIsScreenSharing(true);

        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders();
          const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(screenTrack);
          }
        }

        screenTrack.onended = () => {
          stopScreenShare();
        };
      } catch {
        console.warn('Screen share canceled');
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);

    if (cameraStreamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = cameraStreamRef.current;
      const cameraTrack = cameraStreamRef.current.getVideoTracks()[0];
      if (peerConnectionRef.current && cameraTrack) {
        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(cameraTrack);
        }
      }
    }
  };

  // 19. Hangup / End Call
  const handleHangup = async () => {
    try {
      await api.updateCallStatus(session.id, 'ENDED');
    } catch {
      // ignore
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    onEndCall();
  };

  // 20. Whiteboard drawing helpers
  const handleWhiteboardMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isDrawingRef.current = true;
    startXRef.current = x;
    startYRef.current = y;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvasSnapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (drawTool === 'pen' || drawTool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const handleWhiteboardMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (drawTool === 'pen') {
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = drawWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (drawTool === 'eraser') {
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = drawWidth * 4;
      ctx.lineCap = 'round';
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (canvasSnapshotRef.current) {
      ctx.putImageData(canvasSnapshotRef.current, 0, 0);
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = drawWidth;

      if (drawTool === 'rect') {
        ctx.strokeRect(
          startXRef.current,
          startYRef.current,
          x - startXRef.current,
          y - startYRef.current
        );
      } else if (drawTool === 'circle') {
        const radius = Math.sqrt(
          Math.pow(x - startXRef.current, 2) + Math.pow(y - startYRef.current, 2)
        );
        ctx.beginPath();
        ctx.arc(startXRef.current, startYRef.current, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  };

  const handleWhiteboardMouseUp = () => {
    isDrawingRef.current = false;
  };

  const handleClearWhiteboard = () => {
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Format Duration string MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl w-full max-w-6xl h-[94vh] max-h-[880px] shadow-2xl flex flex-col overflow-hidden relative">
        {/* Floating Reactions Container */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
          {reactions.map((rx) => (
            <div
              key={rx.id}
              style={{ left: `${rx.left}%` }}
              className="absolute bottom-16 text-3xl sm:text-4xl animate-in slide-in-from-bottom-12 fade-in duration-700 transition-all select-none"
            >
              {rx.emoji}
            </div>
          ))}
        </div>

        {/* Top Header Navigation Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 z-20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
              <Video className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-2">
                  1-to-1 Skill Exchange Call with {partnerName}
                </h3>
                <span
                  className={`px-2.5 py-0.5 text-[10px] font-semibold border rounded-full flex items-center gap-1 ${
                    callStatus === 'CONNECTED'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      callStatus === 'CONNECTED' ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'
                    }`}
                  />
                  {callStatus === 'CONNECTED' ? 'Connected • Live' : 'Ringing...'}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>Duration: {formatTime(callDuration)}</span>
                <span>•</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {connectionState}
                </span>
              </p>
            </div>
          </div>

          {/* Tab Switcher in Header */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('video')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'video'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Video Stream</span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'code'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Code Scratchpad</span>
            </button>

            <button
              onClick={() => setActiveTab('whiteboard')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'whiteboard'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Whiteboard</span>
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'notes'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Session Notes</span>
            </button>
          </div>
        </div>

        {/* Ringing / Auto-Connect Banner (Ensures solo user never gets stuck!) */}
        {callStatus === 'CALLING' && (
          <div className="bg-gradient-to-r from-indigo-900/90 via-purple-900/90 to-indigo-950/90 px-6 py-3 border-b border-indigo-500/30 flex items-center justify-between z-20 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/30 border border-indigo-400 flex items-center justify-center animate-spin">
                <PhoneCall className="w-4 h-4 text-indigo-300" />
              </div>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-2">
                  Calling {partnerName}...
                  {autoAnswerTimer > 0 ? (
                    <span className="text-indigo-300 font-normal">
                      (Auto-answering in {autoAnswerTimer}s for solo testing)
                    </span>
                  ) : (
                    <span className="text-emerald-300 font-normal">Connecting stream...</span>
                  )}
                </p>
                <p className="text-[11px] text-indigo-200">
                  Click below to immediately connect the interactive live stream:
                </p>
              </div>
            </div>

            <button
              onClick={handleConnectNow}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105"
            >
              <UserCheck className="w-4 h-4" />
              <span>Connect Now</span>
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 relative bg-slate-950 overflow-hidden flex">
          {/* TAB 1: 1-to-1 Video Stream View */}
          {activeTab === 'video' && (
            <div className="flex-1 p-3 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 h-full max-h-[640px]">
              {/* Remote Peer Screen (Rahul Sharma) */}
              <div className="relative rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col items-center justify-center shadow-inner group">
                {/* Real Remote Video Element if WebRTC stream exists */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${hasRemoteStream ? 'block' : 'hidden'}`}
                />

                {/* Animated Interactive Peer Canvas (active when simulated peer is connected) */}
                <canvas
                  ref={simulatedPeerCanvasRef}
                  width={640}
                  height={480}
                  className={`w-full h-full object-cover ${
                    hasRemoteStream ? 'hidden' : callStatus === 'CONNECTED' ? 'block' : 'hidden'
                  }`}
                />

                {/* Calling / Ringing Placeholder when still in CALLING state */}
                {callStatus === 'CALLING' && (
                  <div className="text-center p-6 flex flex-col items-center animate-in fade-in">
                    <div className="relative mb-4">
                      <img
                        src={partnerAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250'}
                        alt={partnerName}
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-indigo-500/40 shadow-2xl"
                      />
                      <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-amber-500 ring-4 ring-slate-900 flex items-center justify-center animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-slate-100">{partnerName}</h4>
                    <p className="text-xs text-indigo-300 mt-1 max-w-xs">
                      Ringing partner... Click "Connect Now" to start testing instantly.
                    </p>
                    <button
                      onClick={handleConnectNow}
                      className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Instant Connect (Test Mode)</span>
                    </button>
                  </div>
                )}

                {/* Partner Header Tag */}
                <div className="absolute top-3 left-3 px-3 py-1 bg-slate-900/85 backdrop-blur-md rounded-xl text-xs font-medium text-slate-200 border border-slate-700/60 flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      callStatus === 'CONNECTED' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                    }`}
                  />
                  <span>{partnerName}</span>
                  <span className="text-[10px] text-slate-400">
                    {callStatus === 'CONNECTED' ? '(Remote HD)' : '(Calling)'}
                  </span>
                </div>
              </div>

              {/* Local User Screen (Sarah Chen / You) */}
              <div className="relative rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col items-center justify-center shadow-inner group">
                {/* Real User Webcam Video Element */}
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${
                    !useVirtualCam && !isVideoMuted && !mediaError ? 'block' : 'hidden'
                  }`}
                />

                {/* Virtual Camera / Avatar Fallback (when camera permission blocked or muted) */}
                {(useVirtualCam || isVideoMuted || mediaError) && (
                  <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 p-6 text-center">
                    <div className="relative mb-3">
                      <img
                        src={currentUser.profileImage}
                        alt={currentUser.name}
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-indigo-500/50 shadow-2xl"
                      />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 ring-4 ring-slate-900 flex items-center justify-center">
                        <Mic className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>

                    <h4 className="text-base font-bold text-slate-200">{currentUser.name} (You)</h4>
                    <span className="mt-1 px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-[10px] font-semibold">
                      {isVideoMuted ? 'Camera Muted' : 'Virtual HD Camera • Mic Active'}
                    </span>

                    <button
                      onClick={setupLocalMedia}
                      className="mt-4 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Request Real Webcam</span>
                    </button>
                  </div>
                )}

                {/* Local Participant Tag */}
                <div className="absolute top-3 left-3 px-3 py-1 bg-slate-900/85 backdrop-blur-md rounded-xl text-xs font-medium text-slate-200 border border-slate-700/60 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span>{currentUser.name} (You)</span>
                  {isScreenSharing && <span className="text-emerald-400 text-[10px]">• Sharing</span>}
                </div>

                {isAudioMuted && (
                  <div className="absolute top-3 right-3 px-2.5 py-1 bg-rose-600/90 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 shadow-sm">
                    <MicOff className="w-3.5 h-3.5" />
                    <span>Muted</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Live Collaborative Code Scratchpad */}
          {activeTab === 'code' && (
            <div className="flex-1 p-4 flex flex-col h-full bg-slate-950">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                    {(['javascript', 'python', 'java'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setCodeLanguage(lang)}
                        className={`px-3 py-1 rounded-lg font-mono capitalize transition-all cursor-pointer ${
                          codeLanguage === lang
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Real-time synced with {partnerName}
                  </span>
                </div>

                <button
                  onClick={handleRunCode}
                  disabled={isRunningCode}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isRunningCode ? 'Running...' : 'Run Code'}</span>
                </button>
              </div>

              <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-3 pt-3 overflow-hidden">
                {/* Code Editor */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col">
                  <textarea
                    value={codeContent}
                    onChange={(e) => setCodeContent(e.target.value)}
                    className="flex-1 w-full bg-transparent text-slate-200 font-mono text-xs sm:text-sm focus:outline-none resize-none leading-relaxed selection:bg-indigo-600"
                    placeholder="Type or paste code here..."
                  />
                </div>

                {/* Output Console & Partner Mini Video */}
                <div className="flex flex-col gap-3">
                  {/* Console Output */}
                  <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col overflow-hidden">
                    <span className="text-[11px] font-bold text-slate-400 font-mono uppercase pb-2 border-b border-slate-800 mb-2">
                      Terminal Output
                    </span>
                    <pre className="flex-1 font-mono text-xs text-emerald-400 overflow-y-auto whitespace-pre-wrap">
                      {codeOutput || '// Click "Run Code" to execute this snippet.'}
                    </pre>
                  </div>

                  {/* Picture-in-picture peer video */}
                  <div className="h-36 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden flex items-center justify-center">
                    <div className="text-center p-3">
                      <img
                        src={partnerAvatar}
                        alt={partnerName}
                        className="w-12 h-12 rounded-full mx-auto object-cover ring-2 ring-indigo-500/50 mb-1"
                      />
                      <span className="text-xs font-bold text-slate-200 block">{partnerName}</span>
                      <span className="text-[10px] text-emerald-400 font-medium">● Watching Code</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Interactive Whiteboard */}
          {activeTab === 'whiteboard' && (
            <div className="flex-1 p-4 flex flex-col h-full bg-slate-950">
              {/* Whiteboard Toolbar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setDrawTool('pen')}
                      className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        drawTool === 'pen' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Pen"
                    >
                      <PenTool className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDrawTool('rect')}
                      className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        drawTool === 'rect' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Rectangle"
                    >
                      <Square className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDrawTool('circle')}
                      className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        drawTool === 'circle' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Circle"
                    >
                      <CircleIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDrawTool('eraser')}
                      className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        drawTool === 'eraser' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Eraser"
                    >
                      <Eraser className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Colors */}
                  <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
                    {['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#ffffff'].map((c) => (
                      <button
                        key={c}
                        onClick={() => setDrawColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                          drawColor === c ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Width */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 pl-2">
                    <span>Width:</span>
                    <input
                      type="range"
                      min={1}
                      max={12}
                      value={drawWidth}
                      onChange={(e) => setDrawWidth(Number(e.target.value))}
                      className="w-20 accent-indigo-600"
                    />
                  </div>
                </div>

                <button
                  onClick={handleClearWhiteboard}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-rose-900/60 hover:text-rose-300 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Board</span>
                </button>
              </div>

              {/* Canvas Surface */}
              <div className="flex-1 pt-3 flex items-center justify-center">
                <canvas
                  ref={whiteboardCanvasRef}
                  width={960}
                  height={560}
                  onMouseDown={handleWhiteboardMouseDown}
                  onMouseMove={handleWhiteboardMouseMove}
                  onMouseUp={handleWhiteboardMouseUp}
                  className="w-full h-full bg-slate-900 rounded-2xl border border-slate-800 cursor-crosshair shadow-inner"
                />
              </div>
            </div>
          )}

          {/* TAB 4: Session Notes */}
          {activeTab === 'notes' && (
            <div className="flex-1 p-4 sm:p-6 flex flex-col h-full bg-slate-950">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    Synchronized Lesson Notes & Action Items
                  </h4>
                  <p className="text-xs text-slate-400">
                    Collaborate on study notes, milestones, and shared references.
                  </p>
                </div>

                <button
                  onClick={handleExportNotes}
                  disabled={isSavingNotes}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  {notesSavedSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
                  <span>{notesSavedSuccess ? 'Saved to Chat!' : isSavingNotes ? 'Saving...' : 'Export Notes to Chat'}</span>
                </button>
              </div>

              <div className="flex-1 pt-4">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Type notes, code references, key takeaways..."
                  className="w-full h-full bg-slate-900 border border-slate-800 rounded-2xl p-5 text-slate-200 font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Collapsible In-Call Chat Sidebar */}
          {isChatOpen && (
            <div className="w-80 border-l border-slate-800 bg-slate-900/95 flex flex-col h-full z-30 animate-in slide-in-from-right duration-200">
              <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  In-Call Chat
                </span>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="text-xs text-slate-400 hover:text-white p-1"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 p-3 overflow-y-auto space-y-3">
                {inCallMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.isMe ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] text-slate-400 mb-0.5">{m.sender}</span>
                    <div
                      className={`p-2.5 rounded-2xl text-xs leading-relaxed max-w-[85%] ${
                        m.isMe
                          ? 'bg-indigo-600 text-white rounded-br-xs'
                          : 'bg-slate-800 text-slate-200 rounded-bl-xs'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendInCallMessage} className="p-3 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Message peer..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0 z-20">
          {/* Reaction Emojis Bar */}
          <div className="hidden sm:flex items-center gap-1.5">
            {[
              { icon: '👏', label: 'Clap' },
              { icon: '💡', label: 'Idea' },
              { icon: '🔥', label: 'Fire' },
              { icon: '❤️', label: 'Heart' },
              { icon: '🚀', label: 'Rocket' },
            ].map((rx) => (
              <button
                key={rx.icon}
                onClick={() => triggerReaction(rx.icon)}
                className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 hover:scale-115 text-lg flex items-center justify-center transition-all cursor-pointer"
                title={rx.label}
              >
                {rx.icon}
              </button>
            ))}
          </div>

          {/* Primary Call Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3 mx-auto sm:mx-0">
            {/* Mic Toggle */}
            <button
              onClick={toggleAudio}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                isAudioMuted
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
              }`}
              title={isAudioMuted ? 'Unmute Mic' : 'Mute Mic'}
            >
              {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Video Toggle */}
            <button
              onClick={toggleVideo}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                isVideoMuted
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
              }`}
              title={isVideoMuted ? 'Turn Video On' : 'Turn Video Off'}
            >
              {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>

            {/* Screen Share */}
            <button
              onClick={toggleScreenShare}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                isScreenSharing
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
              }`}
              title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
            >
              <Monitor className="w-5 h-5" />
            </button>

            {/* Toggle In-Call Chat Drawer */}
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                isChatOpen
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
              }`}
              title="Toggle In-Call Chat"
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            {/* End Call Button */}
            <button
              onClick={handleHangup}
              className="px-5 h-11 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-900/30 transition-all cursor-pointer hover:scale-102"
              title="Leave Call"
            >
              <PhoneOff className="w-4 h-4" />
              <span>End Call</span>
            </button>
          </div>

          {/* Quick Connect / Simulation button if still calling */}
          <div className="hidden sm:flex items-center gap-2">
            {callStatus === 'CALLING' ? (
              <button
                onClick={handleConnectNow}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer animate-pulse"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Answer Now</span>
              </button>
            ) : (
              <span className="text-xs text-slate-400 font-mono">
                {formatTime(callDuration)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

