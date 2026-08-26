import axios from 'axios';
import { ProgressState } from '../types';

const rawBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || '';
const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60s timeout for metadata requests
});

export interface HealthResponse {
  status: string;
  ytDlp: { available: boolean; version?: string };
  ffmpeg: { available: boolean; version?: string };
  cookies: { configured: boolean; exists: boolean };
}

export interface AnalyzeResponse {
  type: 'video' | 'playlist' | 'video_playlist';
  videoContext?: any;
  playlistContext?: any;
}

export interface InitiateDownloadPayload {
  url: string;
  mode?: 'video' | 'playlist';
  format: 'mp4' | 'mp3';
  quality?: string;
  selectedItemIds?: string[];
}

export interface InitiateDownloadResponse {
  jobId: string;
  status: string;
  message: string;
}

export const checkHealth = async (): Promise<HealthResponse> => {
  const res = await apiClient.get<HealthResponse>('/api/health');
  return res.data;
};

export const analyzeUrl = async (url: string): Promise<AnalyzeResponse> => {
  const res = await apiClient.post<AnalyzeResponse>('/api/analyze', { url });
  return res.data;
};

export const initiateDownload = async (payload: InitiateDownloadPayload): Promise<InitiateDownloadResponse> => {
  const res = await apiClient.post<InitiateDownloadResponse>('/api/download', payload);
  return res.data;
};

export const cancelDownloadJob = async (jobId: string): Promise<void> => {
  await apiClient.post(`/api/download/cancel/${jobId}`);
};

export const getDownloadFileUrl = (jobId: string): string => {
  const baseUrl = API_BASE_URL ? API_BASE_URL : window.location.origin;
  return `${baseUrl}/api/download/file/${jobId}`;
};

export const createSseConnection = (
  jobId: string,
  onMessage: (data: ProgressState) => void,
  onError: (err: Event) => void
): EventSource => {
  const baseUrl = API_BASE_URL ? API_BASE_URL : window.location.origin;
  const sseUrl = `${baseUrl}/api/progress/${jobId}`;
  const eventSource = new EventSource(sseUrl);

  eventSource.addEventListener('progress', (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data);
      onMessage(data);
    } catch (err) {
      console.error('Failed to parse SSE event data', err);
    }
  });

  eventSource.onerror = (err) => {
    onError(err);
  };

  return eventSource;
};
