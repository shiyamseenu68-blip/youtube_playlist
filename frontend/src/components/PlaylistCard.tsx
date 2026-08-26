import { useState } from 'react';
import { Download, ListMusic, Film, Music, CheckSquare, Square, Lock, Check } from 'lucide-react';
import { PlaylistMetadata, PlaylistItem } from '../types';

interface PlaylistCardProps {
  metadata: PlaylistMetadata;
  onStartDownload: (format: 'mp4' | 'mp3', selectedItemIds: string[]) => void;
  isDownloading: boolean;
}

export function PlaylistCard({ metadata, onStartDownload, isDownloading }: PlaylistCardProps) {
  const availableItems = metadata.items.filter((item) => item.availability === 'available');
  const [selectedIds, setSelectedIds] = useState<string[]>(
    availableItems.map((item) => item.id)
  );
  const [format, setFormat] = useState<'mp4' | 'mp3'>('mp4');

  const handleToggleItem = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    setSelectedIds(availableItems.map((item) => item.id));
  };

  const handleClearAll = () => {
    setSelectedIds([]);
  };

  const handleDownload = () => {
    if (selectedIds.length > 0) {
      onStartDownload(format, selectedIds);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-6 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
      {/* Playlist Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-red-600/10 text-red-500 border border-red-500/20">
            <ListMusic className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white line-clamp-1">{metadata.title}</h3>
            <p className="text-xs text-slate-400 font-medium">
              {metadata.uploader} • {metadata.totalItems} Items ({availableItems.length} Available)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleSelectAll}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl transition-colors"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Format Selector */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setFormat('mp4')}
          className={`py-3.5 px-4 rounded-2xl border font-bold text-sm flex items-center justify-center gap-2.5 transition-all ${
            format === 'mp4'
              ? 'bg-red-600/20 border-red-500 text-red-400 ring-1 ring-red-500/30'
              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>MP4 Video Playlist</span>
          {format === 'mp4' && <Check className="w-4 h-4 text-red-400 ml-auto" />}
        </button>

        <button
          type="button"
          onClick={() => setFormat('mp3')}
          className={`py-3.5 px-4 rounded-2xl border font-bold text-sm flex items-center justify-center gap-2.5 transition-all ${
            format === 'mp3'
              ? 'bg-red-600/20 border-red-500 text-red-400 ring-1 ring-red-500/30'
              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Music className="w-4 h-4" />
          <span>MP3 Audio Playlist</span>
          {format === 'mp3' && <Check className="w-4 h-4 text-red-400 ml-auto" />}
        </button>
      </div>

      {/* Playlist Items List */}
      <div className="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {metadata.items.map((item: PlaylistItem & { availability?: string }) => {
          const isUnavailable = item.availability && item.availability !== 'available';
          const isSelected = selectedIds.includes(item.id);

          return (
            <div
              key={item.id}
              onClick={() => !isUnavailable && handleToggleItem(item.id)}
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                isUnavailable
                  ? 'bg-slate-950/50 border-slate-900 opacity-40 cursor-not-allowed'
                  : isSelected
                  ? 'bg-slate-800/80 border-slate-700 cursor-pointer shadow-sm'
                  : 'bg-slate-950/30 border-slate-800/50 hover:border-slate-700 cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="text-xs font-mono font-bold text-slate-500 w-6 text-right">
                  #{item.position}
                </span>

                {isUnavailable ? (
                  <Lock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                ) : isSelected ? (
                  <CheckSquare className="w-4 h-4 text-red-500 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-600 flex-shrink-0" />
                )}

                <span className="text-xs sm:text-sm font-semibold text-slate-200 truncate">
                  {item.title}
                </span>
              </div>

              {item.duration > 0 && (
                <span className="text-xs text-slate-400 font-mono flex-shrink-0">
                  {formatDuration(item.duration)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Download Action Button */}
      <button
        type="button"
        onClick={handleDownload}
        disabled={selectedIds.length === 0 || isDownloading}
        className="w-full py-4 bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-black text-base rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2.5"
      >
        <Download className="w-5 h-5" />
        <span>
          Download {selectedIds.length} Selected Items ({format.toUpperCase()})
        </span>
      </button>
    </div>
  );
}
