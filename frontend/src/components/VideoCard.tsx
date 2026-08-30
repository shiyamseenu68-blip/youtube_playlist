import { useState } from 'react';
import { Download, Film, Music, Clock, User, Check, Sparkles, Sliders, ShieldCheck } from 'lucide-react';
import { VideoMetadata, QualityOption } from '../types';

interface VideoCardProps {
  metadata: VideoMetadata;
  onStartDownload: (format: 'mp4' | 'mp3', quality?: string) => void;
  isDownloading: boolean;
}

export function VideoCard({ metadata, onStartDownload, isDownloading }: VideoCardProps) {
  const rawQualities = metadata.qualities || metadata.formats || [];
  const [format, setFormat] = useState<'mp4' | 'mp3'>('mp4');

  // Intelligent default: 1080p or first available
  const defaultVideoQuality =
    rawQualities.find((q) => q.qualityLabel.includes('1080p'))?.qualityLabel ||
    rawQualities[0]?.qualityLabel ||
    '1080p (Full HD)';

  const [selectedVideoQuality, setSelectedVideoQuality] = useState<string>(defaultVideoQuality);
  const [selectedAudioBitrate, setSelectedAudioBitrate] = useState<string>('320 kbps (Ultra Quality)');

  const formatDuration = (seconds: number) => {
    if (!seconds) return 'N/A';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Curated MP3 Audio Bitrate Presets
  const audioBitratePresets = [
    { label: '320 kbps (Ultra Quality)', tag: '320 kbps', desc: 'Studio Master • Max Audio Bitrate', isBest: true },
    { label: '256 kbps (High Quality)', tag: '256 kbps', desc: 'High Fidelity • Crisp Sound' },
    { label: '192 kbps (Standard Quality)', tag: '192 kbps', desc: 'Standard Quality • Balanced File Size' },
    { label: '128 kbps (Compact)', tag: '128 kbps', desc: 'Compact Size • Fast Download' },
  ];

  // Curated Video Quality Presets
  const displayVideoQualities = rawQualities.length > 0
    ? rawQualities
    : [
        { formatId: '2160p', qualityLabel: '2160p (4K Ultra HD)', ext: 'mp4' },
        { formatId: '1080p', qualityLabel: '1080p (Full HD)', ext: 'mp4' },
        { formatId: '720p', qualityLabel: '720p (HD)', ext: 'mp4' },
        { formatId: '480p', qualityLabel: '480p (SD)', ext: 'mp4' },
        { formatId: '360p', qualityLabel: '360p (SD)', ext: 'mp4' },
        { formatId: 'best', qualityLabel: 'Best Available (Max Quality)', ext: 'mp4' },
      ];

  const handleDownload = () => {
    const chosenQuality = format === 'mp4' ? selectedVideoQuality : selectedAudioBitrate;
    onStartDownload(format, chosenQuality);
  };

  const getQualityBadge = (label: string) => {
    if (label.includes('2160p') || label.includes('4K')) return { tag: '4K ULTRA', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    if (label.includes('1080p')) return { tag: 'FULL HD', color: 'bg-violet-500/20 text-violet-300 border-violet-500/40' };
    if (label.includes('720p')) return { tag: 'HD', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
    if (label.includes('Best')) return { tag: 'AUTO MAX', color: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40' };
    return { tag: 'SD', color: 'bg-slate-800 text-slate-400 border-slate-700' };
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-8 relative group">
      {/* Outer Ambient Backdrop Glow */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600/30 via-fuchsia-600/30 to-cyan-500/30 rounded-3xl blur-xl opacity-50 group-hover:opacity-80 transition duration-700 pointer-events-none" />

      {/* Main Glassmorphic Card */}
      <div className="relative w-full bg-slate-950/90 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-7">
        
        {/* Video Header Preview */}
        <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
          {metadata.thumbnail && (
            <div className="relative w-full sm:w-64 h-36 rounded-2xl overflow-hidden bg-slate-900 flex-shrink-0 border border-slate-800/80 shadow-lg group/thumb">
              <img
                src={metadata.thumbnail}
                alt={metadata.title}
                className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
              {metadata.duration > 0 && (
                <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/85 backdrop-blur-md text-white text-xs font-mono font-bold flex items-center gap-1.5 border border-white/10 shadow-md">
                  <Clock className="w-3.5 h-3.5 text-violet-400" />
                  {formatDuration(metadata.duration)}
                </span>
              )}
            </div>
          )}

          <div className="flex-1 space-y-2.5 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-950/60 border border-violet-800/50 text-[10px] uppercase font-black tracking-widest text-violet-300">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>VERIFIED YOUTUBE MEDIA</span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-white line-clamp-2 leading-snug tracking-tight">
              {metadata.title}
            </h3>

            <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
              <div className="p-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                <User className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <span className="truncate">{metadata.uploader}</span>
            </div>
          </div>
        </div>

        {/* Format Selection: MP4 Video vs MP3 Audio */}
        <div className="space-y-3 pt-5 border-t border-slate-900">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-violet-400" />
              <span>Select Media Format</span>
            </label>
            <span className="text-[11px] font-mono text-slate-500">Fast Remuxing Engine</span>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => setFormat('mp4')}
              className={`py-4 px-5 rounded-2xl border font-extrabold text-sm flex items-center justify-between transition-all duration-300 ${
                format === 'mp4'
                  ? 'bg-gradient-to-r from-violet-950/80 via-slate-900 to-fuchsia-950/80 border-violet-500/60 text-white shadow-[0_0_25px_rgba(139,92,246,0.25)] ring-1 ring-violet-500/40'
                  : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${format === 'mp4' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  <Film className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-black">MP4 Video</div>
                  <div className="text-[10px] font-mono text-slate-400">Multi-Resolution HD</div>
                </div>
              </div>
              {format === 'mp4' && <Check className="w-5 h-5 text-violet-400" />}
            </button>

            <button
              type="button"
              onClick={() => setFormat('mp3')}
              className={`py-4 px-5 rounded-2xl border font-extrabold text-sm flex items-center justify-between transition-all duration-300 ${
                format === 'mp3'
                  ? 'bg-gradient-to-r from-fuchsia-950/80 via-slate-900 to-cyan-950/80 border-fuchsia-500/60 text-white shadow-[0_0_25px_rgba(217,70,239,0.25)] ring-1 ring-fuchsia-500/40'
                  : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${format === 'mp3' ? 'bg-fuchsia-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  <Music className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-black">MP3 Audio</div>
                  <div className="text-[10px] font-mono text-slate-400">High Bitrate Audio</div>
                </div>
              </div>
              {format === 'mp3' && <Check className="w-5 h-5 text-fuchsia-400" />}
            </button>
          </div>
        </div>

        {/* Video Quality Selection Grid */}
        {format === 'mp4' && (
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Video Resolution & Quality
              </label>
              <span className="text-[11px] font-mono text-violet-400 font-bold">
                Selected: {selectedVideoQuality.split(' ')[0]}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {displayVideoQualities.map((q: QualityOption) => {
                const isSelected = selectedVideoQuality === q.qualityLabel;
                const badge = getQualityBadge(q.qualityLabel);

                return (
                  <button
                    key={q.formatId || q.qualityLabel}
                    type="button"
                    onClick={() => setSelectedVideoQuality(q.qualityLabel)}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 ${
                      isSelected
                        ? 'bg-gradient-to-br from-slate-900 via-violet-950/60 to-slate-900 border-violet-500/80 shadow-[0_0_20px_rgba(139,92,246,0.3)] ring-1 ring-violet-500/50'
                        : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-md border text-[10px] font-black font-mono tracking-wider ${badge.color}`}>
                        {badge.tag}
                      </span>
                      {isSelected ? (
                        <div className="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center text-white">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-700" />
                      )}
                    </div>

                    <div>
                      <div className="text-xs font-black text-white line-clamp-1">{q.qualityLabel}</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {q.filesizeApprox ? `~${(q.filesizeApprox / 1024 / 1024).toFixed(1)} MB` : 'Standard Stream'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* MP3 Audio Bitrate Selection Grid */}
        {format === 'mp3' && (
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Audio Bitrate & Fidelity
              </label>
              <span className="text-[11px] font-mono text-fuchsia-400 font-bold">
                Selected: {selectedAudioBitrate.split(' ')[0]} {selectedAudioBitrate.split(' ')[1]}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {audioBitratePresets.map((preset) => {
                const isSelected = selectedAudioBitrate === preset.label;

                return (
                  <button
                    key={preset.tag}
                    type="button"
                    onClick={() => setSelectedAudioBitrate(preset.label)}
                    className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all duration-200 ${
                      isSelected
                        ? 'bg-gradient-to-br from-slate-900 via-fuchsia-950/60 to-slate-900 border-fuchsia-500/80 shadow-[0_0_20px_rgba(217,70,239,0.3)] ring-1 ring-fuchsia-500/50'
                        : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-fuchsia-950 border border-fuchsia-800/60 text-fuchsia-300 font-mono text-[11px] font-black">
                          {preset.tag}
                        </span>
                        {preset.isBest && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[9px] font-black uppercase tracking-wider">
                            STUDIO BEST
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-300">{preset.desc}</div>
                    </div>

                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-fuchsia-500 flex items-center justify-center text-white shadow-md">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-slate-700" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Start Download Action Button */}
        <div className="pt-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full py-4.5 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 active:from-violet-700 text-white font-black text-base rounded-2xl transition-all duration-300 shadow-[0_0_35px_rgba(139,92,246,0.4)] hover:shadow-[0_0_50px_rgba(139,92,246,0.6)] flex items-center justify-center gap-3 group/dl border border-white/10"
          >
            <Download className="w-5 h-5 group-hover/dl:scale-110 transition-transform" />
            <span>
              START {format.toUpperCase()} DOWNLOAD ({format === 'mp4' ? selectedVideoQuality.split(' ')[0] : selectedAudioBitrate.split(' ')[0]} {format === 'mp3' ? 'kbps' : ''})
            </span>
          </button>
        </div>

        {/* Trust Footnote */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 font-mono pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>High-Speed Remuxing Engine • Direct Datacenter Transfer</span>
        </div>
      </div>
    </div>
  );
}
