import React, { useState } from 'react';
import { Search, Loader2, X, Sparkles } from 'lucide-react';

interface UrlFormProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function UrlForm({ onAnalyze, isLoading, disabled }: UrlFormProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isLoading && !disabled) {
      onAnalyze(url.trim());
    }
  };

  const handleClear = () => {
    setUrl('');
  };

  return (
    <section className="w-full max-w-4xl mx-auto my-8 px-4 text-center space-y-6">
      {/* Hero Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>High-Speed Extractor Engine</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
          Download Videos & Playlists in the Format You Want
        </h2>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Paste any YouTube video or playlist link below to inspect formats, convert to MP3 audio, or download high-definition MP4 videos.
        </p>
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
        <div className="relative flex items-center shadow-2xl rounded-2xl group">
          <div className="absolute left-4 text-slate-500 group-focus-within:text-red-400 transition-colors">
            <Search className="w-5 h-5" aria-hidden="true" />
          </div>

          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste YouTube video or playlist URL (e.g. https://www.youtube.com/watch?v=...)"
            disabled={isLoading || disabled}
            autoComplete="off"
            aria-label="YouTube URL Input"
            className="w-full pl-12 pr-32 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-white placeholder-slate-500 text-sm sm:text-base focus:outline-none focus:border-red-500/80 focus:ring-4 focus:ring-red-500/10 transition-all shadow-inner disabled:opacity-50"
          />

          {url && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear input field"
              className="absolute right-32 p-1.5 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            disabled={!url.trim() || isLoading || disabled}
            aria-label="Analyze YouTube Link"
            className="absolute right-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg flex items-center gap-2 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Analyzing...</span>
              </>
            ) : (
              <span>Analyze</span>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
