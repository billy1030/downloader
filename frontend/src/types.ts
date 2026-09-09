export type Platform = 'youtube' | 'tiktok' | 'douyin' | 'instagram' | 'x' | 'facebook' | 'generic' | 'unknown';

export interface FormatOption {
  format_id: string;
  ext: string;
  resolution: string;
  height: number;
  width: number;
  filesize: number;
  vcodec: string;
  acodec: string;
  tbr: number;
  fps: number;
  is_video: boolean;
  is_audio: boolean;
}

export interface MediaInfo {
  id: string;
  url: string;
  platform: Platform;
  title: string;
  description: string;
  uploader: string;
  channel: string;
  duration: number;
  thumbnail: string;
  formats: FormatOption[];
  best_quality: string;
}

export interface DownloadProgress {
  percent: number;
  speed_str: string;
  eta_str: string;
  total_size_str: string;
  filename: string;
  status: string;
}

export interface DownloadOptions {
  URL: string;
  OutputDir: string;
  Resolution: string;
  AudioOnly: boolean;
  AudioFmt: string;
  Cookies?: string;
  Proxy?: string;
}

export interface Task {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  platform: Platform;
  options: DownloadOptions;
  status: 'queued' | 'downloading' | 'completed' | 'paused' | 'failed' | 'cancelled';
  progress: DownloadProgress;
  error?: string;
  output_path?: string;
  created_at: string;
  completed_at?: string;
}

export interface AppSettings {
  output_dir: string;
  concurrency: number;
  proxy: string;
  clipboard_auto_detect: boolean;
  default_audio_format: string;
  theme: string;
}

export interface EnvironmentInfo {
  yt_dlp_path: string;
  ffmpeg_path: string;
  version: string;
  has_ytdlp: boolean;
  has_ffmpeg: boolean;
}
