import { Video, ListMusic } from 'lucide-react';

interface ModeSelectorProps {
  activeMode: 'video' | 'playlist';
  onSelectMode: (mode: 'video' | 'playlist') => void;
  videoTitle?: string;
  playlistTitle?: string;
  playlistItemCount?: number;
}

export function ModeSelector({
  activeMode,
  onSelectMode,
  videoTitle,
  playlistTitle,
  playlistItemCount,
}: ModeSelectorProps) {
  return (
    <div className="w-full max-w-3xl mx-auto my-6 p-5 bg-slate-900/90 border border-amber-500/30 rounded-3xl space-y-4 shadow-xl">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        Dual Context URL Detected — Choose Download Target
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onSelectMode('video')}
          aria-pressed={activeMode === 'video'}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all flex flex-col justify-between group ${
            activeMode === 'video'
              ? 'bg-red-600/15 border-red-500 text-white shadow-lg ring-1 ring-red-500/50'
              : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-xl ${activeMode === 'video' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
              <Video className="w-5 h-5" aria-hidden="true" />
            </div>
            <span className="font-bold text-base">This Single Video</span>
          </div>
          <p className="text-xs text-slate-400 line-clamp-1">{videoTitle || 'Single Video Stream'}</p>
        </button>

        <button
          type="button"
          onClick={() => onSelectMode('playlist')}
          aria-pressed={activeMode === 'playlist'}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all flex flex-col justify-between group ${
            activeMode === 'playlist'
              ? 'bg-red-600/15 border-red-500 text-white shadow-lg ring-1 ring-red-500/50'
              : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-xl ${activeMode === 'playlist' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
              <ListMusic className="w-5 h-5" aria-hidden="true" />
            </div>
            <span className="font-bold text-base">Entire Playlist</span>
          </div>
          <p className="text-xs text-slate-400 line-clamp-1">
            {playlistTitle || 'Full Playlist'} ({playlistItemCount || 0} items)
          </p>
        </button>
      </div>
    </div>
  );
}
