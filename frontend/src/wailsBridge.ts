import { MediaInfo, Task, AppSettings, EnvironmentInfo } from './types';

declare global {
  interface Window {
    go?: {
      main?: {
        App?: {
          GetEnvironment: () => Promise<EnvironmentInfo>;
          InspectURL: (url: string) => Promise<MediaInfo>;
          EnqueueDownload: (url: string, title: string, thumbnail: string, resolution: string, audioOnly: boolean, audioFmt: string) => Promise<Task>;
          GetTasks: () => Promise<Task[]>;
          CancelTask: (id: string) => Promise<void>;
          RemoveTask: (id: string) => Promise<void>;
          RevealFile: (path: string) => Promise<void>;
          OpenFile: (path: string) => Promise<void>;
          GetSettings: () => Promise<AppSettings>;
          SaveSettings: (settings: AppSettings) => Promise<void>;
          SelectDirectory: () => Promise<string>;
          SelectCookieFile: () => Promise<string>;
          UpdateEngine: () => Promise<{ success: boolean; message: string; version: string }>;
        };
      };
    };
    runtime?: {
      EventsOn: (eventName: string, callback: (...args: any[]) => void) => () => void;
    };
  }
}

export const bridge = {
  isWails: () => typeof window.go?.main?.App !== 'undefined',

  getEnvironment: async (): Promise<EnvironmentInfo> => {
    if (window.go?.main?.App?.GetEnvironment) {
      return window.go.main.App.GetEnvironment();
    }
    return {
      yt_dlp_path: '/usr/local/bin/yt-dlp',
      ffmpeg_path: '/usr/local/bin/ffmpeg',
      version: '2025.01.26',
      has_ytdlp: true,
      has_ffmpeg: true,
    };
  },

  inspectURL: async (url: string): Promise<MediaInfo> => {
    if (window.go?.main?.App?.InspectURL) {
      return window.go.main.App.InspectURL(url);
    }
    return {
      id: 'demo-123',
      url,
      platform: 'youtube',
      title: 'Demo Video Clip (Webview Preview)',
      description: 'Media downloaded from Omnidrop desktop downloader',
      uploader: 'Omnidrop Creator',
      channel: 'Omnidrop Channel',
      duration: 184,
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      best_quality: '1080p',
      formats: [
        { format_id: '1080', ext: 'mp4', resolution: '1920x1080', height: 1080, width: 1920, filesize: 45000000, vcodec: 'avc1', acodec: 'mp4a', tbr: 2500, fps: 60, is_video: true, is_audio: true },
        { format_id: '720', ext: 'mp4', resolution: '1280x720', height: 720, width: 1280, filesize: 22000000, vcodec: 'avc1', acodec: 'mp4a', tbr: 1200, fps: 30, is_video: true, is_audio: true },
        { format_id: 'audio', ext: 'm4a', resolution: 'audio only', height: 0, width: 0, filesize: 4500000, vcodec: 'none', acodec: 'mp4a', tbr: 128, fps: 0, is_video: false, is_audio: true },
      ]
    };
  },

  enqueueDownload: async (url: string, title: string, thumbnail: string, resolution: string, audioOnly: boolean, audioFmt: string): Promise<Task> => {
    if (window.go?.main?.App?.EnqueueDownload) {
      return window.go.main.App.EnqueueDownload(url, title, thumbnail, resolution, audioOnly, audioFmt);
    }
    return {
      id: `task-${Date.now()}`,
      url,
      title,
      thumbnail,
      platform: 'youtube',
      options: {
        URL: url,
        OutputDir: './downloads',
        Resolution: resolution,
        AudioOnly: audioOnly,
        AudioFmt: audioFmt,
      },
      status: 'downloading',
      progress: {
        percent: 15.4,
        speed_str: '6.4MB/s',
        eta_str: '00:12',
        total_size_str: '45.2MB',
        filename: `${title}.mp4`,
        status: 'downloading',
      },
      created_at: new Date().toISOString(),
    };
  },

  getTasks: async (): Promise<Task[]> => {
    if (window.go?.main?.App?.GetTasks) {
      return window.go.main.App.GetTasks();
    }
    return [];
  },

  cancelTask: async (id: string): Promise<void> => {
    if (window.go?.main?.App?.CancelTask) {
      await window.go.main.App.CancelTask(id);
    }
  },

  removeTask: async (id: string): Promise<void> => {
    if (window.go?.main?.App?.RemoveTask) {
      await window.go.main.App.RemoveTask(id);
    }
  },

  revealFile: async (path: string): Promise<void> => {
    if (window.go?.main?.App?.RevealFile) {
      await window.go.main.App.RevealFile(path);
    }
  },

  openFile: async (path: string): Promise<void> => {
    if (window.go?.main?.App?.OpenFile) {
      await window.go.main.App.OpenFile(path);
    }
  },

  getSettings: async (): Promise<AppSettings> => {
    if (window.go?.main?.App?.GetSettings) {
      return window.go.main.App.GetSettings();
    }
    return {
      output_dir: '~/Downloads/Omnidrop',
      concurrency: 3,
      proxy: '',
      clipboard_auto_detect: true,
      default_audio_format: 'mp3',
      theme: 'day',
    };
  },

  saveSettings: async (settings: AppSettings): Promise<void> => {
    if (window.go?.main?.App?.SaveSettings) {
      await window.go.main.App.SaveSettings(settings);
    }
  },

  selectDirectory: async (): Promise<string> => {
    if (window.go?.main?.App?.SelectDirectory) {
      return window.go.main.App.SelectDirectory();
    }
    return '~/Downloads/Omnidrop';
  },

  selectCookieFile: async (): Promise<string> => {
    if (window.go?.main?.App?.SelectCookieFile) {
      return window.go.main.App.SelectCookieFile();
    }
    return '';
  },

  updateEngine: async (): Promise<{ success: boolean; message: string; version: string }> => {
    if (window.go?.main?.App?.UpdateEngine) {
      return window.go.main.App.UpdateEngine();
    }
    return { success: true, message: 'yt-dlp is up to date (2025.01.26)', version: '2025.01.26' };
  },

  onQueueEvent: (callback: (evt: any) => void) => {
    if (window.runtime?.EventsOn) {
      return window.runtime.EventsOn('queue:event', callback);
    }
    return () => {};
  },

  onClipboardDetected: (callback: (url: string) => void) => {
    if (window.runtime?.EventsOn) {
      return window.runtime.EventsOn('clipboard:detected', callback);
    }
    return () => {};
  },
};
