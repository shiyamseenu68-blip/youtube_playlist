import { useState, useEffect } from 'react';
import { Sparkles, Play, Zap, ShieldCheck, Heart } from 'lucide-react';

interface PremiumIntroProps {
  onComplete: () => void;
}

export function PremiumIntro({ onComplete }: PremiumIntroProps) {
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  const statusMessages = [
    'Initializing Quantum Engine...',
    'Connecting Datacenter Nodes...',
    'Calibrating Media Transcoders...',
    'Engine Online • Welcome!',
  ];

  useEffect(() => {
    const duration = 2200; // 2.2 seconds total intro
    const intervalTime = 30;
    const increment = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setIsFading(true);
            setTimeout(onComplete, 500); // 500ms fade out transition
          }, 300);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onComplete]);

  useEffect(() => {
    if (progress < 30) setStatusIndex(0);
    else if (progress < 65) setStatusIndex(1);
    else if (progress < 90) setStatusIndex(2);
    else setStatusIndex(3);
  }, [progress]);

  const handleSkip = () => {
    setIsFading(true);
    setTimeout(onComplete, 400);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-slate-950 text-white transition-opacity duration-500 overflow-hidden select-none ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Ambient Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse-aura" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse-aura" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Floating Particles Backdrop */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-1/3 left-1/5 w-1.5 h-1.5 bg-violet-400 rounded-full animate-float-particle" style={{ animationDuration: '4s' }} />
        <div className="absolute top-2/3 right-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-float-particle" style={{ animationDuration: '3.5s', animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-fuchsia-400 rounded-full animate-float-particle" style={{ animationDuration: '5s', animationDelay: '0.5s' }} />
      </div>

      {/* Top Header Controls */}
      <div className="w-full max-w-5xl flex justify-between items-center z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 backdrop-blur-md text-xs font-semibold text-violet-300">
          <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>v2.0 PRO ENGINE</span>
        </div>

        <button
          type="button"
          onClick={handleSkip}
          className="px-4 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 active:bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 transition-all backdrop-blur-md hover:text-white hover:border-violet-500/50 shadow-lg"
        >
          Skip Intro →
        </button>
      </div>

      {/* Center Cinematic Brand & Animation */}
      <div className="flex flex-col items-center justify-center z-10 my-auto text-center space-y-8">
        {/* Animated Central Emblem */}
        <div className="relative flex items-center justify-center">
          {/* Outer Pulsing Wave Rings */}
          <div className="absolute w-36 h-36 rounded-full border border-violet-500/30 animate-ping" style={{ animationDuration: '2.5s' }} />
          <div className="absolute w-48 h-48 rounded-full border border-cyan-500/20 animate-pulse-aura" />

          {/* Orbit Ring with Rotating Particle */}
          <div className="absolute w-40 h-40 rounded-full border border-slate-800/80 animate-spin-orbit">
            <div className="w-3 h-3 bg-gradient-to-r from-violet-400 to-fuchsia-400 rounded-full shadow-[0_0_12px_#a855f7] -top-1.5 left-1/2 -translate-x-1/2 absolute" />
          </div>

          {/* Inner Reverse Orbit */}
          <div className="absolute w-28 h-28 rounded-full border border-dashed border-violet-400/40 animate-reverse-orbit" />

          {/* Glass Emblem Card */}
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-slate-900 via-slate-900/90 to-violet-950/80 border border-violet-500/40 shadow-[0_0_40px_rgba(139,92,246,0.3)] flex items-center justify-center backdrop-blur-xl relative group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-violet-500/40">
              <Play className="w-6 h-6 text-white fill-white ml-0.5" />
            </div>
          </div>
        </div>

        {/* Shimmering Title & Watermark */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-violet-950/70 to-fuchsia-950/70 border border-violet-500/30 text-[10px] uppercase font-black tracking-widest text-violet-300 shadow-inner">
            <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>PREMIUM MEDIA SUITE</span>
          </div>

          {/* Requested Intro Name: YOUTUBE PLAYLIST */}
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-200 to-cyan-300 drop-shadow-[0_0_35px_rgba(168,85,247,0.4)] uppercase">
            YOUTUBE PLAYLIST
          </h1>

          {/* Requested Subtle Watermark Tag: Created by Shiyam S */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-md">
            <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />
            <span className="text-xs font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300">
              Created by Shiyam S
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-sm mx-auto">
            High-Speed Video, Audio & Playlist Downloader Platform
          </p>
        </div>

        {/* Loading Meter & Status HUD */}
        <div className="w-72 sm:w-96 space-y-3">
          <div className="relative w-full h-2.5 bg-slate-900/90 rounded-full overflow-hidden border border-slate-800 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400 transition-all duration-75 rounded-full relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer-sweep" />
            </div>
          </div>

          <div className="flex justify-between items-center text-xs font-mono text-slate-400 px-1">
            <span className="text-violet-300 font-semibold">{statusMessages[statusIndex]}</span>
            <span className="font-bold text-cyan-400">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>

      {/* Footer Branding with Watermark */}
      <div className="w-full max-w-5xl flex justify-between items-center text-[11px] text-slate-500 font-mono z-10 border-t border-slate-900/80 pt-4">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Encrypted Stream Engine</span>
        </div>
        <span className="font-bold text-slate-400">Created by Shiyam S</span>
      </div>
    </div>
  );
}
