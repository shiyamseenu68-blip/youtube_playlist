import { useState } from 'react';
import { Download, Film, Music, Clock, User, Check } from 'lucide-react';
import { VideoMetadata } from '../types';

interface VideoCardProps {
  metadata: VideoMetadata;
  onStartDownload: (format: 'mp4' | 'mp3', quality?: string) => void;
  isDownloading: boolean;
}

export function VideoCard({ metadata, onStartDownload, isDownloading }: VideoCardProps) {
  const qualityOptions = metadata.qualities || metadata.formats || [];
  const [format, setFormat] = useState<'mp4' | 'mp3'>('mp4');
  const [selectedQuality, setSelectedQuality] = useState<string>(
    qualityOptions[0]?.qualityLabel || 'best'
  );

  const formatDuration = (seconds: number) => {
    if (!seconds) return 'N/A';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleDownload = () => {
    onStartDownload(format, format === 'mp4' ? selectedQuality : undefined);
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-6 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
      {/* Video Header Preview */}
      <div className="flex flex-col sm:flex-row gap-5">
        {metadata.thumbnail && (
          <div className="relative w-full sm:w-60 h-36 rounded-2xl overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-800 shadow-md">
            <img
              src={metadata.thumbnail}
              alt={metadata.title}
              className="w-full h-full object-cover"
            />
            {metadata.duration > 0 && (
              <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-white text-xs font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3 text-red-400" />
                {formatDuration(metadata.duration)}
              </span>
            )}
          </div>
        )}

        <div className="flex-1 space-y-2">
          <h3 className="text-base sm:text-lg font-bold text-white line-clamp-2 leading-snug">
            {metadata.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span>{metadata.uploader}</span>
          </div>
        </div>
      </div>

      {/* Format & Quality Configuration */}
      <div className="pt-5 border-t border-slate-800/80 space-y-5">
        {/* Format Selector: Video (MP4) vs Audio (MP3) */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            Select Format
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormat('mp4')}
              className={`py-3.5 px-4 rounded-2xl border font-bold text-sm flex items-center justify-center gap-2.5 transition-all ${
                format === 'mp4'
                  ? 'bg-red-600/20 border-red-500 text-red-400 shadow-md ring-1 ring-red-500/30'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>MP4 Video</span>
              {format === 'mp4' && <Check className="w-4 h-4 text-red-400 ml-auto" />}
            </button>

            <button
              type="button"
              onClick={() => setFormat('mp3')}
              className={`py-3.5 px-4 rounded-2xl border font-bold text-sm flex items-center justify-center gap-2.5 transition-all ${
                format === 'mp3'
                  ? 'bg-red-600/20 border-red-500 text-red-400 shadow-md ring-1 ring-red-500/30'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Music className="w-4 h-4" />
              <span>MP3 Audio</span>
              {format === 'mp3' && <Check className="w-4 h-4 text-red-400 ml-auto" />}
            </button>
          </div>
        </div>

        {/* Quality Dropdown for Video */}
        {format === 'mp4' && qualityOptions.length > 0 && (
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Select Video Quality
            </label>
            <select
              value={selectedQuality}
              onChange={(e) => setSelectedQuality(e.target.value)}
              className="w-full py-3.5 px-4 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm font-medium focus:outline-none focus:border-red-500 shadow-inner"
            >
              {qualityOptions.map((q) => (
                <option key={q.formatId} value={q.qualityLabel}>
                  {q.qualityLabel} {q.filesizeApprox ? `(~${(q.filesizeApprox / 1024 / 1024).toFixed(1)} MB)` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Download Action Button */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full py-4 bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-black text-base rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2.5"
        >
          <Download className="w-5 h-5" />
          <span>Download {format.toUpperCase()}</span>
        </button>
      </div>
    </div>
  );
}
