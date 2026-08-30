import { useState, useRef } from 'react';
import { Header } from './components/Header';
import { UrlForm } from './components/UrlForm';
import { ModeSelector } from './components/ModeSelector';
import { VideoCard } from './components/VideoCard';
import { PlaylistCard } from './components/PlaylistCard';
import { ProgressCard } from './components/ProgressCard';
import { ErrorAlert } from './components/ErrorAlert';
import { PremiumIntro } from './components/PremiumIntro';
import {
  analyzeUrl,
  initiateDownload,
  cancelDownloadJob,
  getDownloadFileUrl,
  createSseConnection,
  AnalyzeResponse,
} from './services/api';
import { ProgressState } from './types';

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [analyzedResult, setAnalyzedResult] = useState<AnalyzeResponse | null>(null);
  const [dualMode, setDualMode] = useState<'video' | 'playlist'>('video');
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [progressState, setProgressState] = useState<ProgressState | null>(null);
  const [errorMessage, setErrorMessage] = useState<{ message: string; code?: string } | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  const handleAnalyze = async (url: string) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalyzedResult(null);
    setProgressState(null);
    setCurrentUrl(url);

    try {
      const data = await analyzeUrl(url);
      setAnalyzedResult(data);
      if (data.type === 'video_playlist') {
        setDualMode('video');
      }
    } catch (err: any) {
      const apiErr = err.response?.data?.error;
      setErrorMessage({
        message: apiErr?.message || 'Failed to analyze YouTube URL.',
        code: apiErr?.code,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartDownload = async (
    format: 'mp4' | 'mp3',
    quality?: string,
    selectedItemIds?: string[]
  ) => {
    if (isDownloading || !analyzedResult) return;

    setIsDownloading(true);
    setErrorMessage(null);
    setProgressState(null);

    const mode = analyzedResult.type === 'video_playlist' ? dualMode : analyzedResult.type === 'playlist' ? 'playlist' : 'video';

    try {
      const response = await initiateDownload({
        url: currentUrl,
        mode,
        format,
        quality,
        selectedItemIds,
      });

      const jobId = response.jobId;
      setActiveJobId(jobId);
      setProgressState({ jobId, status: 'queued', percent: 0 });

      // Connect to SSE Progress Stream
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      eventSourceRef.current = createSseConnection(
        jobId,
        (progress) => {
          setProgressState(progress);
          if (progress.status === 'completed' || progress.status === 'failed' || progress.status === 'cancelled') {
            setIsDownloading(false);
            if (eventSourceRef.current) {
              eventSourceRef.current.close();
              eventSourceRef.current = null;
            }
          }
        },
        (_err) => {
          // SSE Error handling
        }
      );
    } catch (err: any) {
      setIsDownloading(false);
      const apiErr = err.response?.data?.error;
      setErrorMessage({
        message: apiErr?.message || 'Failed to initiate download job.',
        code: apiErr?.code,
      });
    }
  };

  const handleCancelDownload = async () => {
    if (!activeJobId) return;

    try {
      await cancelDownloadJob(activeJobId);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsDownloading(false);
      setProgressState((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
    } catch (err: any) {
      console.error('Failed to cancel download', err);
    }
  };

  const handleDownloadFile = () => {
    if (!activeJobId) return;
    const downloadUrl = getDownloadFileUrl(activeJobId);
    window.location.href = downloadUrl;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between pb-12 relative overflow-x-hidden">
      {/* Premium Cinematic Intro Overlay */}
      {showIntro && <PremiumIntro onComplete={() => setShowIntro(false)} />}

      <div className="w-full">
        <Header onReplayIntro={() => setShowIntro(true)} />

        <main className="px-4 max-w-5xl mx-auto">
          <UrlForm onAnalyze={handleAnalyze} isLoading={isAnalyzing} disabled={isDownloading} />

          {errorMessage && (
            <ErrorAlert
              message={errorMessage.message}
              code={errorMessage.code}
              onDismiss={() => setErrorMessage(null)}
            />
          )}

          {analyzedResult && (
            <>
              {analyzedResult.type === 'video_playlist' && (
                <ModeSelector
                  activeMode={dualMode}
                  onSelectMode={(mode) => setDualMode(mode)}
                  videoTitle={analyzedResult.videoContext?.title}
                  playlistTitle={analyzedResult.playlistContext?.title}
                  playlistItemCount={analyzedResult.playlistContext?.totalItems}
                />
              )}

              {(analyzedResult.type === 'video' || (analyzedResult.type === 'video_playlist' && dualMode === 'video')) &&
                analyzedResult.videoContext && (
                  <VideoCard
                    metadata={analyzedResult.videoContext}
                    onStartDownload={(format, quality) => handleStartDownload(format, quality)}
                    isDownloading={isDownloading}
                  />
                )}

              {(analyzedResult.type === 'playlist' || (analyzedResult.type === 'video_playlist' && dualMode === 'playlist')) &&
                analyzedResult.playlistContext && (
                  <PlaylistCard
                    metadata={analyzedResult.playlistContext}
                    onStartDownload={(format, selectedItemIds, quality) =>
                      handleStartDownload(format, quality, selectedItemIds)
                    }
                    isDownloading={isDownloading}
                  />
                )}
            </>
          )}

          {progressState && (
            <ProgressCard
              progress={progressState}
              onCancel={handleCancelDownload}
              onDownloadFile={handleDownloadFile}
            />
          )}
        </main>
      </div>

      <footer className="mt-12 text-center text-xs text-slate-500 font-mono space-y-1">
        <div>YouTube Downloader Engine • Decoupled Vercel + Render Architecture</div>
        <div className="text-violet-400/80 font-bold">Created by Shiyam S</div>
      </footer>
    </div>
  );
}
