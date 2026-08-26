export type DownloadMode = 'single' | 'playlist';
export type MediaType = 'video' | 'audio';
export type VideoFormat = 'mp4' | 'webm';
export type AudioFormat = 'mp3' | 'm4a';

export interface QualityOption {
  formatId: string;
  qualityLabel: string;
  ext: string;
  filesizeApprox?: number;
}

export interface VideoMetadata {
  id: string;
  title: string;
  duration: number;
  thumbnail: string;
  uploader: string;
  isPlaylist?: boolean;
  qualities: QualityOption[];
  formats?: QualityOption[];
}

export interface PlaylistItem {
  id: string;
  title: string;
  duration: number;
  thumbnail: string;
  position: number;
  availability?: 'available' | 'private' | 'deleted' | 'unavailable';
}

export interface PlaylistMetadata {
  id: string;
  title: string;
  uploader: string;
  totalItems: number;
  isPlaylist: true;
  items: PlaylistItem[];
}

export type MediaMetadata = VideoMetadata | PlaylistMetadata;

export type DownloadStatus = 
  | 'idle'
  | 'queued'
  | 'analyzing'
  | 'downloading'
  | 'processing'
  | 'converting'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ProgressState {
  jobId: string;
  status: DownloadStatus;
  percent: number;
  downloadedBytes?: number;
  totalBytes?: number;
  speed?: string;
  eta?: string;
  currentItemIndex?: number;
  totalItems?: number;
  message?: string;
  error?: string;
  downloadUrl?: string;
}
