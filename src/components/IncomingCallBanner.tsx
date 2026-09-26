import React from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { CallSession } from '../types';

interface IncomingCallBannerProps {
  call: CallSession;
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingCallBanner: React.FC<IncomingCallBannerProps> = ({
  call,
  onAccept,
  onDecline,
}) => {
  return (
    <div className="fixed top-20 right-4 sm:right-8 z-50 animate-bounce duration-1000 max-w-sm w-full bg-slate-900 border-2 border-indigo-500 rounded-2xl shadow-2xl p-4 text-white">
      <div className="flex items-center gap-3">
        <div className="relative">
          <img src={call.callerAvatar} alt={call.callerName} className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-400" />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white ring-2 ring-slate-900 animate-pulse">
            <Video className="w-3 h-3" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-slate-100 truncate">{call.callerName}</h4>
          <p className="text-xs text-indigo-300 font-medium">Incoming 1-to-1 Video Call...</p>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3.5 pt-3 border-t border-slate-800">
        <button onClick={onDecline} className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5">
          <PhoneOff className="w-3.5 h-3.5" />
          <span>Decline</span>
        </button>
        <button onClick={onAccept} className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/30">
          <Phone className="w-3.5 h-3.5" />
          <span>Accept & Join</span>
        </button>
      </div>
    </div>
  );
};