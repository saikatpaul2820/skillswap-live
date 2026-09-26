import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Monitor,
  Code2,
  ShieldCheck
} from 'lucide-react';
import { CallSession, User } from '../types';
import { api } from '../services/api';

interface VideoCallModalProps {
  session: CallSession;
  currentUser: User;
  onEndCall: () => void;
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  session,
  currentUser,
  onEndCall,
}) => {
  const isCaller = session.callerId === currentUser.id;
  const partnerName = isCaller ? session.receiverName : session.callerName;
  const partnerAvatar = isCaller ? session.receiverAvatar : session.callerAvatar;

  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [activeTab, setActiveTab] = useState<'video' | 'notes'>('video');
  const [notes, setNotes] = useState(
    '### 🎯 Learning Session Agenda\n- 1. Review goals & current skill level\n- 2. 25-minute hands-on walkthrough\n- 3. Q&A and next exchange milestones'
  );

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Poll for call status changes (if peer leaves)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const updated = await api.getCallSession(session.id);
        if (updated && (updated.status === 'ENDED' || updated.status === 'DECLINED')) {
          onEndCall();
        }
      } catch {}
    }, 2500);

    return () => clearInterval(interval);
  }, [session.id, onEndCall]);

  // Duration timer
  useEffect(() => {
    const timer = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Request browser camera & mic
  useEffect(() => {
    async function setupCamera() {
      try {
        const localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        cameraStreamRef.current = localStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
      } catch (err) {
        console.warn('Camera/mic access not granted or not available', err);
      }
    }
    setupCamera();

    return () => {
      if (cameraStreamRef.current) cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const toggleVideo = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    }
    setIsVideoMuted(!isVideoMuted);
  };

  const toggleAudio = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    }
    setIsAudioMuted(!isAudioMuted);
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setIsScreenSharing(true);
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (localVideoRef.current && cameraStreamRef.current) {
            localVideoRef.current.srcObject = cameraStreamRef.current;
          }
        };
      } catch (err) {
        console.warn('Screen share canceled');
      }
    } else {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      if (localVideoRef.current && cameraStreamRef.current) {
        localVideoRef.current.srcObject = cameraStreamRef.current;
      }
      setIsScreenSharing(false);
    }
  };

  const handleHangup = async () => {
    try { await api.updateCallStatus(session.id, 'ENDED'); } catch {}
    if (cameraStreamRef.current) cameraStreamRef.current.getTracks().forEach((t) => t.stop());
    if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach((t) => t.stop());
    onEndCall();
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl w-full max-w-5xl h-[92vh] max-h-[850px] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Video className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-2">
                1-to-1 Skill Exchange Call with {partnerName}
              </h3>
              <p className="text-xs text-slate-400">
                Duration: <strong className="text-slate-200 font-mono">{formatTime(callDuration)}</strong> • WebRTC Encrypted
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab(activeTab === 'video' ? 'notes' : 'video')}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{activeTab === 'notes' ? 'Back to Video' : 'Shared Notes'}</span>
          </button>
        </div>

        {/* Video Canvas */}
        <div className="flex-1 relative bg-slate-950 p-4 sm:p-6 overflow-hidden flex flex-col justify-center">
          {activeTab === 'video' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full max-h-[580px]">
              {/* Remote Peer */}
              <div className="relative rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-6 text-center">
                <div className="relative mb-4">
                  <img src={partnerAvatar} alt={partnerName} className="w-32 h-32 rounded-full object-cover ring-4 ring-indigo-500/40" />
                  <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 ring-4 ring-slate-900" />
                </div>
                <h4 className="text-lg font-bold text-slate-100">{partnerName}</h4>
                <p className="text-xs text-indigo-400 mt-1">Live Peer Feed • Active</p>
              </div>

              {/* Local User */}
              <div className="relative rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center overflow-hidden">
                <video ref={localVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${isVideoMuted ? 'hidden' : 'block'}`} />
                {isVideoMuted && (
                  <div className="text-center p-6">
                    <img src={currentUser.profileImage} alt={currentUser.name} className="w-28 h-28 rounded-full object-cover ring-4 ring-slate-700 mx-auto mb-3 opacity-80" />
                    <p className="text-sm font-semibold">{currentUser.name} (You)</p>
                    <p className="text-xs text-slate-400">Camera is off</p>
                  </div>
                )}
                {isAudioMuted && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-rose-600 rounded-md text-[11px] font-bold">Muted</div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-slate-300 mb-2">Interactive Notes & Code Scratchpad:</h4>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 font-mono text-xs focus:outline-none resize-none"
              />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-center sm:justify-between shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>HD Media Connected</span>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggleAudio} className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${isAudioMuted ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-slate-800 border-slate-700'}`}>
              {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button onClick={toggleVideo} className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${isVideoMuted ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-slate-800 border-slate-700'}`}>
              {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
            <button onClick={toggleScreenShare} className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${isScreenSharing ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-800 border-slate-700'}`}>
              <Monitor className="w-5 h-5" />
            </button>
            <button onClick={handleHangup} className="px-6 h-12 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2">
              <PhoneOff className="w-5 h-5" />
              <span>Leave Call</span>
            </button>
          </div>

          <div className="hidden sm:block text-xs text-emerald-400 font-medium">● Latency: 24ms</div>
        </div>
      </div>
    </div>
  );
};