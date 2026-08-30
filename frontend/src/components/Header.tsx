import { useEffect, useState } from 'react';
import { Youtube, CheckCircle2, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { checkHealth } from '../services/api';

interface HeaderProps {
  onReplayIntro?: () => void;
}

export function Header({ onReplayIntro }: HeaderProps) {
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
        <div className="p-3 rounded-2xl bg-gradient-to-tr from-violet-950 via-slate-900 to-fuchsia-950 border border-violet-500/30 text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.25)]">
          <Youtube className="w-7 h-7 text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-fuchsia-400 to-violet-400 fill-red-500" aria-hidden="true" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              YouTube<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 uppercase">Playlist</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono font-bold text-slate-400">
              Created by Shiyam S
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Ultra High-Speed Video, MP3 Audio & Playlist Extractor
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {onReplayIntro && (
          <button
            type="button"
            onClick={onReplayIntro}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-violet-500/40 text-xs font-bold text-violet-300 transition-all shadow-sm group"
            title="Replay Intro Animation"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform" />
            <span>Intro</span>
          </button>
        )}

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
      </div>
    </header>
  );
}
