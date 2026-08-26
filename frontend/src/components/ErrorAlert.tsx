import { AlertOctagon, X } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  code?: string;
  onDismiss: () => void;
}

export function ErrorAlert({ message, code, onDismiss }: ErrorAlertProps) {
  const getFriendlyMessage = (): string => {
    switch (code) {
      case 'INVALID_URL':
      case 'UNSUPPORTED_URL':
        return 'Please enter a valid YouTube video or playlist URL (e.g. https://www.youtube.com/watch?v=...).';
      case 'PRIVATE_VIDEO':
        return 'This YouTube video is private and cannot be extracted.';
      case 'VIDEO_UNAVAILABLE':
        return 'This YouTube video or playlist is unavailable or has been deleted.';
      case 'AGE_RESTRICTED':
        return 'This video is age-restricted and requires YouTube authentication.';
      case 'BOT_DETECTION':
      case 'AUTHENTICATION_REQUIRED':
        return 'YouTube bot detection triggered. Authentication cookies required on server.';
      case 'FFMPEG_MISSING':
        return 'Server configuration error: FFmpeg binary is unavailable on the backend system.';
      case 'FORMAT_UNAVAILABLE':
        return 'The requested video quality or audio format is unavailable for this content.';
      case 'RATE_LIMIT_EXCEEDED':
        return 'Too many requests. Please wait a moment before trying again.';
      default:
        return message || 'An unexpected error occurred during URL extraction.';
    }
  };

  return (
    <div
      className="w-full max-w-3xl mx-auto my-4 p-4 rounded-2xl bg-red-950/70 border border-red-800/80 text-red-200 flex items-start justify-between gap-3 shadow-xl"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertOctagon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <h4 className="text-sm font-bold text-red-300">Extraction Notice</h4>
          <p className="text-xs text-red-200/90 leading-relaxed mt-0.5 font-medium">{getFriendlyMessage()}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss error notice"
        className="text-red-400 hover:text-white p-1 rounded-lg transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
