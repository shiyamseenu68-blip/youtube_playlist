import { Download, Loader2, XCircle, CheckCircle2, Zap, Cpu, Sparkles, Activity, FileText } from 'lucide-react';
import { ProgressState } from '../types';

interface ProgressCardProps {
  progress: ProgressState;
  onCancel: () => void;
  onDownloadFile: () => void;
}

export function ProgressCard({ progress, onCancel, onDownloadFile }: ProgressCardProps) {
  const isCompleted = progress.status === 'completed';
  const isFailed = progress.status === 'failed';
  const isCancelled = progress.status === 'cancelled';
  const isActive = !isCompleted && !isFailed && !isCancelled;

  const percent = Math.min(100, Math.max(0, progress.percent || 0));

  // Circular SVG ring calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  const getStatusBadge = () => {
    switch (progress.status) {
      case 'queued':
        return (
          <div className="flex items-center gap-2 text-amber-400 font-extrabold uppercase tracking-widest text-xs">
            <Zap className="w-4 h-4 animate-bounce" />
            <span>QUEUED IN QUEUE</span>
          </div>
        );
      case 'analyzing':
        return (
          <div className="flex items-center gap-2 text-cyan-400 font-extrabold uppercase tracking-widest text-xs">
            <Activity className="w-4 h-4 animate-spin" />
            <span>ANALYZING MEDIA MANIFEST</span>
          </div>
        );
      case 'downloading':
        return (
          <div className="flex items-center gap-2 text-violet-400 font-extrabold uppercase tracking-widest text-xs">
            <Sparkles className="w-4 h-4 animate-pulse text-fuchsia-400" />
            <span>DOWNLOADING HIGH-SPEED STREAMS</span>
          </div>
        );
      case 'processing':
      case 'converting':
        return (
          <div className="flex items-center gap-2 text-fuchsia-400 font-extrabold uppercase tracking-widest text-xs">
            <Cpu className="w-4 h-4 animate-spin" />
            <span>FFMPEG REMUXING & ENCODING</span>
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center gap-2 text-emerald-400 font-extrabold uppercase tracking-widest text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>DOWNLOAD COMPLETE & VERIFIED</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center gap-2 text-rose-400 font-extrabold uppercase tracking-widest text-xs">
            <XCircle className="w-4 h-4 text-rose-400" />
            <span>PROCESS INTERRUPTED</span>
          </div>
        );
      case 'cancelled':
        return (
          <div className="flex items-center gap-2 text-slate-400 font-extrabold uppercase tracking-widest text-xs">
            <XCircle className="w-4 h-4 text-slate-400" />
            <span>DOWNLOAD CANCELLED BY USER</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-slate-400 font-extrabold uppercase tracking-widest text-xs">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>PROCESSING</span>
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-8 relative group">
      {/* Ambient Outer Aura */}
      <div
        className={`absolute -inset-1 rounded-3xl blur-xl opacity-60 transition duration-1000 ${
          isCompleted
            ? 'bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 opacity-80'
            : isFailed || isCancelled
            ? 'bg-gradient-to-r from-rose-600 to-red-800 opacity-50'
            : 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 animate-pulse-aura'
        }`}
      />

      {/* Main Glassmorphic Card Container */}
      <div className="relative w-full bg-slate-950/90 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] space-y-6">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-900">
          <div className="flex items-center gap-3">
            {getStatusBadge()}
          </div>

          {isActive && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 active:bg-slate-950 border border-slate-800 hover:border-rose-500/50 text-xs font-bold text-slate-300 hover:text-rose-400 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel Job</span>
            </button>
          )}
        </div>

        {/* Dual Progress Visualizer (Orbital Circle + Details) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Orbital Circle Progress Meter */}
          <div className="md:col-span-4 flex flex-col items-center justify-center relative">
            <div className="relative w-28 h-28 flex items-center justify-center">
              {/* Background Ring */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  className="stroke-slate-900"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Animated Progress Ring */}
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  stroke={
                    isCompleted
                      ? '#10b981'
                      : isFailed || isCancelled
                      ? '#f43f5e'
                      : 'url(#gradientProgress)'
                  }
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-300 ease-out"
                />
                {/* SVG Gradient Definition */}
                <defs>
                  <linearGradient id="gradientProgress" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="50%" stopColor="#d946ef" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Center Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                {isActive && <Loader2 className="w-5 h-5 text-violet-400 animate-spin mb-0.5" />}
                {isCompleted && <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-0.5" />}
                {(isFailed || isCancelled) && <XCircle className="w-6 h-6 text-rose-400 mb-0.5" />}
                
                <span className="text-sm font-black tracking-tight text-white font-mono">
                  {percent.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Details & Fluid Progress Bar */}
          <div className="md:col-span-8 space-y-4">
            
            {/* Fluid Neon Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-400">
                <span className="text-violet-300">PROGRESS METER</span>
                <span className="text-cyan-400 font-extrabold">{percent.toFixed(1)}%</span>
              </div>

              <div className="w-full bg-slate-900/90 h-4 rounded-full overflow-hidden border border-slate-800/80 shadow-inner relative">
                <div
                  className={`h-full transition-all duration-300 rounded-full relative ${
                    isCompleted
                      ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]'
                      : isFailed || isCancelled
                      ? 'bg-rose-600'
                      : 'bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400 shadow-[0_0_20px_rgba(168,85,247,0.5)]'
                  }`}
                  style={{ width: `${percent}%` }}
                >
                  {/* Shimmer Light Sweep Effect */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer-sweep" />
                  )}
                </div>
              </div>
            </div>

            {/* Live Metrics HUD Badges */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-violet-950/50 text-violet-400 border border-violet-800/40">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Transfer Speed</div>
                  <div className="text-xs font-mono font-black text-white">
                    {progress.speed || (isActive ? 'Calculating...' : '—')}
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-950/50 text-cyan-400 border border-cyan-800/40">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Estimated Time</div>
                  <div className="text-xs font-mono font-black text-white">
                    {progress.eta || (isActive ? 'Calculating...' : '—')}
                  </div>
                </div>
              </div>
            </div>

            {/* Playlist Batch Counter */}
            {progress.totalItems && progress.totalItems > 1 && (
              <div className="flex items-center gap-2 text-xs text-violet-300 font-bold bg-violet-950/40 border border-violet-800/50 px-3.5 py-2 rounded-xl">
                <FileText className="w-4 h-4 text-fuchsia-400" />
                <span>Processing Playlist Item {progress.currentItemIndex || 1} of {progress.totalItems}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button on Completion */}
        {isCompleted && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onDownloadFile}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 active:from-emerald-700 text-white font-black text-base rounded-2xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] flex items-center justify-center gap-3 group/btn"
            >
              <Download className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
              <span>SAVE FILE TO DEVICE</span>
            </button>
          </div>
        )}

        {/* Error Display */}
        {isFailed && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-900/80 text-rose-300 text-xs leading-relaxed font-medium">
            {progress.error || 'An error occurred during download execution.'}
          </div>
        )}
      </div>
    </div>
  );
}
