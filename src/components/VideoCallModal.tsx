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
  Volume2,
  VolumeX,
  Sparkles,
  ShieldCheck,
  Code2,
  RefreshCw,
  AlertCircle,
  PhoneCall,
  UserCheck
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

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  session,
  currentUser,
  onEndCall,
}) => {
  const isCaller = session.callerId === currentUser.id;
  const partnerId = isCaller ? session.receiverId : session.callerId;
  const partnerName = isCaller ? session.receiverName : session.callerName;
  const partnerAvatar = isCaller ? session.receiverAvatar : session.callerAvatar;

  const [callStatus, setCallStatus] = useState<CallSession['status']>(session.status);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [activeTab, setActiveTab] = useState<'video' | 'notes'>('video');
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [isRemoteSpeaking, setIsRemoteSpeaking] = useState(false);
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isSimulatingPeer, setIsSimulatingPeer] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('Initializing');
  const [notes, setNotes] = useState(
    `### 🎯 Skill Exchange Live Session with ${partnerName}\n- 1. Review goals & current skill level\n- 2. 25-minute hands-on walkthrough & practice\n- 3. Q&A and next exchange milestones`
  );

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const candidateQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const lastSignalTimeRef = useRef<number>(0);
  const simulatedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const simulatedIntervalRef = useRef<any>(null);

  // Send WebRTC signal via WebSocket and REST fallback
  const sendSignal = useCallback(
    async (signal: any) => {
      // 1. Try WebSocket
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

      // 2. Also send via REST API for safety
      try {
        await api.sendCallSignal(session.id, partnerId, signal);
      } catch (err) {
        // silent catch
      }
    },
    [session.id, partnerId]
  );

  // Initialize WebRTC RTCPeerConnection
  const initPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) return peerConnectionRef.current;

    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnectionRef.current = pc;

    // Attach local camera tracks if already captured
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, cameraStreamRef.current!);
      });
    }

    // Handle remote tracks robustly
    pc.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind);
      let stream: MediaStream | null = null;
      if (event.streams && event.streams[0]) {
        stream = event.streams[0];
      } else {
        stream = new MediaStream([event.track]);
      }

      if (remoteVideoRef.current && stream) {
        remoteVideoRef.current.srcObject = stream;
        remoteVideoRef.current.muted = false;
        remoteVideoRef.current.play().catch(() => {});
      }
      setHasRemoteStream(true);
      setConnectionState('Connected');
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({
          type: 'candidate',
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('WebRTC Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setConnectionState('Connected (HD)');
        setHasRemoteStream(true);
      } else if (pc.connectionState === 'connecting') {
        setConnectionState('Connecting P2P...');
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        setConnectionState('Reconnecting...');
      }
    };

    return pc;
  }, [sendSignal]);

  // Handle incoming signals (SDP offer, answer, candidates)
  const handleSignal = useCallback(
    async (signal: any) => {
      const pc = peerConnectionRef.current || initPeerConnection();

      // Ensure local tracks are attached before answering
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
          console.log('Processing incoming WebRTC offer');
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

          // Flush queued candidates
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
          console.log('Processing incoming WebRTC answer');
          if (pc.signalingState !== 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

            for (const cand of candidateQueueRef.current) {
              await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
            }
            candidateQueueRef.current = [];
          }
        } else if (signal.type === 'candidate' && signal.candidate) {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate)).catch(() => {});
          } else {
            candidateQueueRef.current.push(signal.candidate);
          }
        }
      } catch (err) {
        console.error('Error handling WebRTC signal:', err);
      }
    },
    [initPeerConnection, sendSignal]
  );

  // Setup Local Media (Camera & Mic) with progressive fallback
  const setupLocalMedia = useCallback(async () => {
    try {
      setMediaError(null);
      if (!navigator?.mediaDevices?.getUserMedia) {
        setMediaError('Your browser does not support camera or microphone streaming.');
        return;
      }

      let stream: MediaStream | null = null;

      // 1. Try progressive constraints: Ideal HD -> Basic video+audio -> Audio only
      const constraintOptions = [
        {
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: { echoCancellation: true, noiseSuppression: true },
        },
        {
          video: true,
          audio: true,
        },
        {
          video: true,
          audio: false,
        },
        {
          video: false,
          audio: true,
        },
      ];

      let lastError: any = null;
      for (const constraints of constraintOptions) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (stream) {
            setIsVideoMuted(stream.getVideoTracks().length === 0);
            setIsAudioMuted(stream.getAudioTracks().length === 0);
            break;
          }
        } catch (err: any) {
          lastError = err;
          // Continue to next fallback constraint
        }
      }

      if (!stream) {
        throw lastError || new Error('Unable to access camera or microphone');
      }

      cameraStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }

      // Add tracks to PeerConnection if already created
      if (peerConnectionRef.current) {
        const senders = peerConnectionRef.current.getSenders();
        stream.getTracks().forEach((track) => {
          const alreadyAdded = senders.some((s) => s.track?.id === track.id);
          if (!alreadyAdded) {
            peerConnectionRef.current!.addTrack(track, stream!);
          }
        });
      }

      // Setup audio speaking monitor
      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass && stream.getAudioTracks().length > 0) {
          const audioCtx = new AudioCtxClass();
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          let rafId: number;

          const checkVolume = () => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setIsLocalSpeaking(avg > 18);
            rafId = requestAnimationFrame(checkVolume);
          };
          checkVolume();

          return () => {
            cancelAnimationFrame(rafId);
            audioCtx.close().catch(() => {});
          };
        }
      } catch {
        // audio context optional
      }
    } catch (err: any) {
      console.warn('Camera/mic access error:', err);
      const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      const isNotFound = err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError';
      const isBusy = err.name === 'NotReadableError' || err.name === 'TrackStartError';

      if (isDenied) {
        setMediaError('Camera/mic permission was blocked. Please tap the lock or site settings icon in your address bar to "Allow" camera.');
      } else if (isBusy) {
        setMediaError('Camera is already in use by another tab or app. Please close other camera apps and click Retry.');
      } else if (isNotFound) {
        setMediaError('No camera found on this device. You can still talk using microphone or shared notes.');
      } else {
        setMediaError(err.message || 'Could not start camera. Click "Enable Camera & Mic" to retry.');
      }
    }
  }, []);

  // Generate simulated peer video stream for solo testing / demo partner
  const startSimulatedPeerStream = useCallback(() => {
    setIsSimulatingPeer(true);
    setCallStatus('CONNECTED');
    setHasRemoteStream(true);
    setConnectionState('Connected (Interactive Demo)');

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      simulatedCanvasRef.current = canvas;
      const ctx = canvas.getContext('2d')!;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = partnerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250';

      let frame = 0;
      const draw = () => {
        frame++;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Animated background gradient waves
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#1e1b4b');
        gradient.addColorStop(1, '#0f172a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Soundwave rings
        const pulse = Math.sin(frame * 0.1) * 10;
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2 - 20, 75 + pulse, 0, Math.PI * 2);
        ctx.stroke();

        // Draw avatar image or fallback circle
        try {
          ctx.save();
          ctx.beginPath();
          ctx.arc(canvas.width / 2, canvas.height / 2 - 20, 65, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          if (img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, canvas.width / 2 - 65, canvas.height / 2 - 85, 130, 130);
          } else {
            ctx.fillStyle = '#4f46e5';
            ctx.fillRect(canvas.width / 2 - 65, canvas.height / 2 - 85, 130, 130);
          }
          ctx.restore();
        } catch {
          // ignore
        }

        // Draw name & simulated live speech
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(partnerName, canvas.width / 2, canvas.height / 2 + 80);

        ctx.fillStyle = '#818cf8';
        ctx.font = '13px system-ui, sans-serif';
        ctx.fillText('Live Skill Exchange Session (Active)', canvas.width / 2, canvas.height / 2 + 105);

        // Speaking equalizer bars
        const bars = 5;
        const startX = canvas.width / 2 - 35;
        for (let i = 0; i < bars; i++) {
          const h = 10 + Math.abs(Math.sin((frame + i * 20) * 0.15)) * 25;
          ctx.fillStyle = '#a5b4fc';
          ctx.fillRect(startX + i * 16, canvas.height / 2 + 130 - h / 2, 8, h);
        }
      };

      simulatedIntervalRef.current = setInterval(draw, 1000 / 30);
      const canvasStream = (canvas as any).captureStream(30);

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = canvasStream;
        remoteVideoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn('Canvas capture stream fallback error:', err);
    }
  }, [partnerAvatar, partnerName]);

  // Connect WebSocket for zero-latency signaling
  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;

    let ws: WebSocket | null = null;

    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws?.send(
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
            setCallStatus(data.status);
            if (data.status === 'ENDED' || data.status === 'DECLINED') {
              onEndCall();
            }
          } else if (data.type === 'notes_update' && data.notes) {
            setNotes(data.notes);
          }
        } catch {
          // ignore
        }
      };
    } catch (err) {
      console.warn('WebSocket connection not available, using REST polling signaling');
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [currentUser.id, session.id, handleSignal, onEndCall]);

  // REST polling for signals (safety fallback)
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

        // Also check call status updates
        const updated = await api.getCallSession(session.id);
        if (updated) {
          setCallStatus(updated.status);
          if (updated.status === 'ENDED' || updated.status === 'DECLINED') {
            onEndCall();
          }
        }
      } catch {
        // ignore polling error
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [session.id, handleSignal, onEndCall]);

  // Duration Timer
  useEffect(() => {
    let timer: any;
    if (callStatus === 'CONNECTED') {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callStatus]);

  // Trigger setupLocalMedia on mount
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
      if (simulatedIntervalRef.current) {
        clearInterval(simulatedIntervalRef.current);
      }
    };
  }, [setupLocalMedia]);

  // When call status transitions to CONNECTED, initiate WebRTC offer if caller
  useEffect(() => {
    if (callStatus === 'CONNECTED' && !isSimulatingPeer) {
      const pc = initPeerConnection();

      if (isCaller) {
        // Wait 300ms for tracks to settle, then create offer
        const timer = setTimeout(async () => {
          try {
            const offer = await pc.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true,
            });
            await pc.setLocalDescription(offer);
            sendSignal({
              type: 'offer',
              sdp: offer,
            });
          } catch (err) {
            console.error('Failed to create offer:', err);
          }
        }, 400);

        return () => clearTimeout(timer);
      }
    }
  }, [callStatus, isCaller, initPeerConnection, sendSignal, isSimulatingPeer]);

  // Toggle Video Track
  const toggleVideo = () => {
    if (cameraStreamRef.current) {
      const videoTracks = cameraStreamRef.current.getVideoTracks();
      videoTracks.forEach((t) => {
        t.enabled = isVideoMuted; // toggle
      });
    }
    setIsVideoMuted(!isVideoMuted);
  };

  // Toggle Audio Track
  const toggleAudio = () => {
    if (cameraStreamRef.current) {
      const audioTracks = cameraStreamRef.current.getAudioTracks();
      audioTracks.forEach((t) => {
        t.enabled = isAudioMuted; // toggle
      });
    }
    setIsAudioMuted(!isAudioMuted);
  };

  // Screen Share Toggle
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
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
      } catch (err) {
        console.warn('Screen share canceled or unsupported');
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

    if (cameraStreamRef.current) {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = cameraStreamRef.current;
      }
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

  // End Call
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

  // Demo Partner Instant Answer (for solo testing)
  const handleSimulateAnswer = async () => {
    try {
      await api.simulateAcceptCall(session.id);
    } catch {
      // ignore
    }
    startSimulatedPeerStream();
  };

  // Notes update broadcasting
  const handleNotesChange = (val: string) => {
    setNotes(val);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'notes_update',
          callId: session.id,
          toUserId: partnerId,
          notes: val,
        })
      );
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl w-full max-w-5xl h-[92vh] max-h-[850px] shadow-2xl flex flex-col overflow-hidden relative">
        {/* Top Header Bar */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/95 z-10 shrink-0">
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
                  className={`px-2 py-0.5 text-[10px] font-semibold border rounded-full flex items-center gap-1 ${
                    callStatus === 'CONNECTED'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      callStatus === 'CONNECTED' ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  {callStatus === 'CONNECTED' ? 'Live WebRTC Connected' : 'Calling Partner...'}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>
                  Duration:{' '}
                  <strong className="text-slate-200 font-mono">{formatTime(callDuration)}</strong>
                </span>
                <span>•</span>
                <span className="text-indigo-400">{connectionState}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab(activeTab === 'video' ? 'notes' : 'video')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'notes'
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{activeTab === 'notes' ? 'Back to Video' : 'Shared Notes'}</span>
            </button>
          </div>
        </div>

        {/* Media Permission Warning Banner if needed */}
        {mediaError && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-2.5 flex items-center justify-between text-amber-300 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{mediaError}</span>
            </div>
            <button
              onClick={setupLocalMedia}
              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg font-semibold text-amber-200 flex items-center gap-1 text-[11px] transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Video Canvas or Shared Workspace Area */}
        <div className="flex-1 relative bg-slate-950 p-3 sm:p-5 overflow-hidden flex flex-col justify-center">
          {activeTab === 'video' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full max-h-[580px]">
              {/* Remote Peer Screen */}
              <div
                className={`relative rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 border overflow-hidden flex flex-col items-center justify-center group shadow-inner transition-all ${
                  isRemoteSpeaking ? 'ring-2 ring-emerald-500/70 border-emerald-500' : 'border-slate-800/90'
                }`}
              >
                {/* Real Remote Video Element */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className={`w-full h-full object-cover ${hasRemoteStream ? 'block' : 'hidden'}`}
                />

                {/* Display placeholder when waiting for remote peer or stream */}
                {!hasRemoteStream && (
                  <div className="text-center p-6 flex flex-col items-center">
                    <div className="relative mb-4">
                      <img
                        src={partnerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250'}
                        alt={partnerName}
                        className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover ring-4 ring-indigo-500/40 shadow-2xl"
                      />
                      <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-amber-500 ring-4 ring-slate-900 flex items-center justify-center animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                    </div>

                    <h4 className="text-base sm:text-lg font-bold text-slate-100">{partnerName}</h4>
                    <p className="text-xs text-indigo-300 mt-1 max-w-xs">
                      {callStatus === 'CALLING'
                        ? 'Ringing... Waiting for partner to join call'
                        : 'Establishing secure peer-to-peer connection...'}
                    </p>

                    {/* Quick Solo Testing Option */}
                    {callStatus === 'CALLING' && (
                      <div className="mt-5 p-3.5 bg-indigo-950/60 border border-indigo-800/60 rounded-2xl max-w-sm">
                        <p className="text-[11px] text-slate-300 mb-2.5">
                          Testing video calls solo? Click below to instantly connect with an interactive demo stream:
                        </p>
                        <button
                          onClick={handleSimulateAnswer}
                          className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>Instant Answer (Test Mode)</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Remote Participant Label */}
                <div className="absolute top-3 left-3 px-3 py-1 bg-slate-900/80 backdrop-blur-md rounded-lg text-xs font-medium text-slate-200 border border-slate-700/60 flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      hasRemoteStream ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                    }`}
                  />
                  <span>
                    {partnerName} {hasRemoteStream ? '(Live Remote)' : '(Ringing)'}
                  </span>
                </div>
              </div>

              {/* Local User Screen (My Camera or Screen Share) */}
              <div
                className={`relative rounded-2xl bg-slate-900 border overflow-hidden flex flex-col items-center justify-center shadow-inner transition-all ${
                  isLocalSpeaking ? 'ring-2 ring-indigo-500/70 border-indigo-500' : 'border-slate-800/90'
                }`}
              >
                {/* Real Video Element */}
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${
                    isVideoMuted || mediaError ? 'hidden' : 'block'
                  }`}
                />

                {/* Fallback when video is turned off or blocked */}
                {(isVideoMuted || mediaError || !cameraStreamRef.current) && (
                  <div className="text-center p-6 flex flex-col items-center">
                    <img
                      src={currentUser.profileImage}
                      alt={currentUser.name}
                      className="w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-slate-700/50 mb-3 opacity-80"
                    />
                    <h4 className="text-base font-bold text-slate-200">{currentUser.name} (You)</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      {mediaError ? mediaError : 'Camera is currently off'}
                    </p>
                    <button
                      onClick={setupLocalMedia}
                      className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-900/30 transition-all cursor-pointer"
                    >
                      <Video className="w-4 h-4" />
                      <span>Request Camera & Mic Access</span>
                    </button>
                  </div>
                )}

                {/* Local Participant Label */}
                <div className="absolute top-3 left-3 px-3 py-1 bg-slate-900/80 backdrop-blur-md rounded-lg text-xs font-medium text-slate-200 border border-slate-700/60 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span>
                    {currentUser.name} (You) {isScreenSharing && '• Screen Sharing'}
                  </span>
                </div>

                {isAudioMuted && (
                  <div className="absolute top-3 right-3 px-2.5 py-1 bg-rose-600/90 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 shadow-sm">
                    <MicOff className="w-3.5 h-3.5" />
                    <span>Muted</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Collaborative Notes & Code Workspace during call */
            <div className="h-full flex flex-col bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-indigo-400" />
                  <h4 className="font-bold text-slate-200 text-sm">
                    Interactive Live Skill Notes & Code Scratchpad
                  </h4>
                </div>
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Real-time synced with {partnerName}
                </span>
              </div>
              <textarea
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Type lesson notes, code snippets, links, or exchange action items here..."
                className="flex-1 w-full bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-slate-200 font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
              />
            </div>
          )}
        </div>

        {/* Bottom Call Control Bar */}
        <div className="px-6 py-4 bg-slate-900/95 border-t border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>HD Peer-to-Peer Audio & Video</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 sm:gap-4 mx-auto sm:mx-0">
            {/* Mic Toggle */}
            <button
              onClick={toggleAudio}
              title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                isAudioMuted
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Video Toggle */}
            <button
              onClick={toggleVideo}
              title={isVideoMuted ? 'Turn Camera On' : 'Turn Camera Off'}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                isVideoMuted
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>

            {/* Screen Share */}
            <button
              onClick={toggleScreenShare}
              title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                isScreenSharing
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Monitor className="w-5 h-5" />
            </button>

            {/* End Call / Leave Call */}
            <button
              onClick={handleHangup}
              title="Leave / End Call"
              className="px-6 h-12 rounded-2xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-900/30 transition-all cursor-pointer"
            >
              <PhoneOff className="w-5 h-5" />
              <span>Leave Call</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Status: <strong>{callStatus === 'CONNECTED' ? 'Connected' : 'Calling'}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
