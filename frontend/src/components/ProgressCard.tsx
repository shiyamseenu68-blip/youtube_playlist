import { Download, Loader2, XCircle, CheckCircle2 } from 'lucide-react';
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

  const getStatusBadge = () => {
    switch (progress.status) {
      case 'queued':
        return <span className="text-amber-400 font-bold uppercase tracking-wider text-xs">QUEUED IN QUEUE</span>;
      case 'analyzing':
        return <span className="text-blue-400 font-bold uppercase tracking-wider text-xs">ANALYZING MEDIA</span>;
      case 'downloading':
        return <span className="text-emerald-400 font-bold uppercase tracking-wider text-xs">DOWNLOADING STREAMS</span>;
      case 'processing':
      case 'converting':
        return <span className="text-indigo-400 font-bold uppercase tracking-wider text-xs">FFMPEG MERGING / CONVERTING</span>;
      case 'completed':
        return <span className="text-emerald-400 font-bold uppercase tracking-wider text-xs">DOWNLOAD COMPLETED</span>;
      case 'failed':
        return <span className="text-red-400 font-bold uppercase tracking-wider text-xs">DOWNLOAD FAILED</span>;
      case 'cancelled':
        return <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">DOWNLOAD CANCELLED</span>;
      default:
        return <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">PROCESSING</span>;
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-6 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {isActive && <Loader2 className="w-5 h-5 text-red-500 animate-spin" aria-hidden="true" />}
          {isCompleted && <CheckCircle2 className="w-5 h-5 text-emerald-400" aria-hidden="true" />}
          {(isFailed || isCancelled) && <XCircle className="w-5 h-5 text-red-400" aria-hidden="true" />}
          <div className="text-sm font-extrabold text-white">{getStatusBadge()}</div>
        </div>

        {isActive && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-xs font-bold text-slate-300 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancel Download</span>
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden border border-slate-800 shadow-inner">
          <div
            className={`h-full transition-all duration-300 ${
              isCompleted
                ? 'bg-emerald-500'
                : isFailed || isCancelled
                ? 'bg-red-500'
                : 'bg-gradient-to-r from-red-600 to-red-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, progress.percent || 0))}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-xs text-slate-400 font-mono font-bold">
          <span>{progress.percent?.toFixed(1) || '0.0'}%</span>
          {progress.speed && <span>Speed: {progress.speed}</span>}
          {progress.eta && <span>ETA: {progress.eta}</span>}
        </div>
      </div>

      {/* Playlist Item Details */}
      {progress.totalItems && progress.totalItems > 1 && (
        <div className="text-xs text-slate-300 font-semibold bg-slate-950/50 py-2 px-3 rounded-xl border border-slate-800/80 inline-block">
          Item {progress.currentItemIndex || 1} of {progress.totalItems} Processing
        </div>
      )}

      {/* Action Button on Completion */}
      {isCompleted && (
        <button
          type="button"
          onClick={onDownloadFile}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-base rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2.5"
        >
          <Download className="w-5 h-5" />
          <span>Save File to Device</span>
        </button>
      )}

      {/* Error Message Display */}
      {isFailed && (
        <div className="p-4 rounded-2xl bg-red-950/50 border border-red-900/60 text-red-300 text-xs leading-relaxed font-medium">
          {progress.error || 'An error occurred during download execution.'}
        </div>
      )}
    </div>
  );
}
