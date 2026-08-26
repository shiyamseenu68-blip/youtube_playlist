import { useEffect, useState } from 'react';
import { Youtube, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { checkHealth } from '../services/api';

export function Header() {
  const [healthState, setHealthState] = useState<'online' | 'connecting' | 'offline'>('connecting');

  const pollHealth = () => {
    checkHealth()
      .then((data) => {
        if (data.status === 'ok' && data.ytDlp?.available) {
          setHealthState('online');
        } else {
          setHealthState('offline');
        }
      })
      .catch(() => setHealthState('offline'));
  };

  useEffect(() => {
    pollHealth();
    const interval = setInterval(pollHealth, 30000); // Poll health every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 py-6 px-4 border-b border-slate-800/80">
      <div className="flex items-center gap-3.5">
        <div className="p-3 rounded-2xl bg-red-600/10 border border-red-500/20 text-red-500 shadow-sm">
          <Youtube className="w-7 h-7" aria-hidden="true" />
        </div>
        <div>
          <span className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            YouTube<span className="text-red-500">Downloader</span>
          </span>
          <p className="text-xs text-slate-400 font-medium">
            Fast, Free Video, MP3 Audio & Playlist Extractor
          </p>
        </div>
      </div>

      <div
        className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold shadow-inner"
        role="status"
        aria-live="polite"
      >
        {healthState === 'connecting' && (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span className="text-amber-400">Connecting Engine...</span>
          </>
        )}
        {healthState === 'online' && (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 tracking-wide">Engine Online</span>
          </>
        )}
        {healthState === 'offline' && (
          <>
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-red-400 tracking-wide">Engine Offline</span>
          </>
        )}
      </div>
    </header>
  );
}
