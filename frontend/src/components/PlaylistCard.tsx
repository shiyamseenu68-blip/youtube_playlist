import { useState } from 'react';
import { Download, ListMusic, Film, Music, CheckSquare, Square, Lock, Check, Sparkles, Sliders } from 'lucide-react';
import { PlaylistMetadata, PlaylistItem } from '../types';

interface PlaylistCardProps {
  metadata: PlaylistMetadata;
  onStartDownload: (format: 'mp4' | 'mp3', selectedItemIds: string[], quality?: string) => void;
  isDownloading: boolean;
}

export function PlaylistCard({ metadata, onStartDownload, isDownloading }: PlaylistCardProps) {
  const availableItems = metadata.items.filter((item) => item.availability === 'available');
  const [selectedIds, setSelectedIds] = useState<string[]>(
    availableItems.map((item) => item.id)
  );
  const [format, setFormat] = useState<'mp4' | 'mp3'>('mp4');

  const [selectedVideoQuality, setSelectedVideoQuality] = useState<string>('1080p (Full HD)');
  const [selectedAudioBitrate, setSelectedAudioBitrate] = useState<string>('320 kbps (Ultra Quality)');

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
      const chosenQuality = format === 'mp4' ? selectedVideoQuality : selectedAudioBitrate;
      onStartDownload(format, selectedIds, chosenQuality);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const videoPresetOptions = [
    { label: '1080p (Full HD)', tag: '1080p' },
    { label: '720p (HD)', tag: '720p' },
    { label: '480p (SD)', tag: '480p' },
    { label: 'Best Available (Max Quality)', tag: 'AUTO' },
  ];

  const audioPresetOptions = [
    { label: '320 kbps (Ultra Quality)', tag: '320 kbps' },
    { label: '256 kbps (High Quality)', tag: '256 kbps' },
    { label: '192 kbps (Standard Quality)', tag: '192 kbps' },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto my-8 relative group">
      {/* Ambient Backdrop Glow */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600/30 via-fuchsia-600/30 to-cyan-500/30 rounded-3xl blur-xl opacity-50 group-hover:opacity-80 transition duration-700 pointer-events-none" />

      {/* Main Glassmorphic Card */}
      <div className="relative w-full bg-slate-950/90 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Playlist Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-900">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-violet-950 via-slate-900 to-fuchsia-950 border border-violet-500/30 text-violet-400 shadow-md">
              <ListMusic className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/50 text-[9px] uppercase font-black tracking-widest text-cyan-300 mb-1">
                <Sparkles className="w-3 h-3 text-violet-400" />
                <span>YOUTUBE PLAYLIST BATCH</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white line-clamp-1">{metadata.title}</h3>
              <p className="text-xs text-slate-400 font-medium">
                {metadata.uploader} • {metadata.totalItems} Items ({availableItems.length} Available)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 rounded-xl transition-all shadow-sm"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 rounded-xl transition-all shadow-sm"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Format Selector */}
        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-violet-400" />
            <span>Select Playlist Format</span>
          </label>
          
          <div className="grid grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => setFormat('mp4')}
              className={`py-3.5 px-4 rounded-2xl border font-bold text-sm flex items-center justify-between transition-all ${
                format === 'mp4'
                  ? 'bg-gradient-to-r from-violet-950/80 via-slate-900 to-fuchsia-950/80 border-violet-500/60 text-white shadow-md ring-1 ring-violet-500/40'
                  : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Film className="w-4 h-4 text-violet-400" />
                <span>MP4 Video Playlist</span>
              </div>
              {format === 'mp4' && <Check className="w-4 h-4 text-violet-400" />}
            </button>

            <button
              type="button"
              onClick={() => setFormat('mp3')}
              className={`py-3.5 px-4 rounded-2xl border font-bold text-sm flex items-center justify-between transition-all ${
                format === 'mp3'
                  ? 'bg-gradient-to-r from-fuchsia-950/80 via-slate-900 to-cyan-950/80 border-fuchsia-500/60 text-white shadow-md ring-1 ring-fuchsia-500/40'
                  : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Music className="w-4 h-4 text-fuchsia-400" />
                <span>MP3 Audio Playlist</span>
              </div>
              {format === 'mp3' && <Check className="w-4 h-4 text-fuchsia-400" />}
            </button>
          </div>
        </div>

        {/* Quality Preset Selector for Playlist */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">
            Batch Playlist Quality Preset
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {format === 'mp4'
              ? videoPresetOptions.map((opt) => {
                  const isSelected = selectedVideoQuality === opt.label;
                  return (
                    <button
                      key={opt.tag}
                      type="button"
                      onClick={() => setSelectedVideoQuality(opt.label)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-mono font-bold transition-all text-center ${
                        isSelected
                          ? 'bg-violet-950 border-violet-500 text-white shadow-md ring-1 ring-violet-500/40'
                          : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {opt.label.split(' ')[0]}
                    </button>
                  );
                })
              : audioPresetOptions.map((opt) => {
                  const isSelected = selectedAudioBitrate === opt.label;
                  return (
                    <button
                      key={opt.tag}
                      type="button"
                      onClick={() => setSelectedAudioBitrate(opt.label)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-mono font-bold transition-all text-center ${
                        isSelected
                          ? 'bg-fuchsia-950 border-fuchsia-500 text-white shadow-md ring-1 ring-fuchsia-500/40'
                          : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {opt.tag}
                    </button>
                  );
                })}
          </div>
        </div>

        {/* Playlist Items List */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400">
            <span>PLAYLIST TRACKS</span>
            <span className="text-violet-300 font-mono">{selectedIds.length} of {availableItems.length} Selected</span>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar border border-slate-800/60 rounded-2xl p-2 bg-slate-950/40">
            {metadata.items.map((item: PlaylistItem & { availability?: string }) => {
              const isUnavailable = item.availability && item.availability !== 'available';
              const isSelected = selectedIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => !isUnavailable && handleToggleItem(item.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                    isUnavailable
                      ? 'bg-slate-950/50 border-slate-900 opacity-40 cursor-not-allowed'
                      : isSelected
                      ? 'bg-slate-900 border-violet-500/50 cursor-pointer shadow-sm'
                      : 'bg-slate-950/30 border-slate-800/50 hover:border-slate-700 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono font-bold text-slate-500 w-6 text-right">
                      #{item.position}
                    </span>

                    {isUnavailable ? (
                      <Lock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    ) : isSelected ? (
                      <CheckSquare className="w-4 h-4 text-violet-400 flex-shrink-0" />
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
        </div>

        {/* Download Action Button */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={selectedIds.length === 0 || isDownloading}
          className="w-full py-4.5 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 active:from-violet-700 text-white font-black text-base rounded-2xl transition-all duration-300 shadow-[0_0_35px_rgba(139,92,246,0.4)] hover:shadow-[0_0_50px_rgba(139,92,246,0.6)] flex items-center justify-center gap-3 border border-white/10"
        >
          <Download className="w-5 h-5" />
          <span>
            DOWNLOAD {selectedIds.length} SELECTED TRACKS ({format.toUpperCase()})
          </span>
        </button>
      </div>
    </div>
  );
}
