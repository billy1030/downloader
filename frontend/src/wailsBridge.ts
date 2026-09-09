import * as AppBindings from '../wailsjs/go/main/App';
import * as WailsRuntime from '../wailsjs/runtime/runtime';
import { MediaInfo, Task, AppSettings, EnvironmentInfo } from './types';

export const bridge = {
  getEnvironment: async (): Promise<EnvironmentInfo> => {
    try {
      const env = await AppBindings.GetEnvironment();
      return env as EnvironmentInfo;
    } catch {
      return {
        yt_dlp_path: '/usr/local/bin/yt-dlp',
        ffmpeg_path: '/usr/local/bin/ffmpeg',
        version: '2025.01.26',
        has_ytdlp: true,
        has_ffmpeg: true,
      };
    }
  },

  inspectURL: async (url: string): Promise<MediaInfo> => {
    return AppBindings.InspectURL(url) as unknown as MediaInfo;
  },

  enqueueDownload: async (url: string, title: string, thumbnail: string, resolution: string, audioOnly: boolean, audioFmt: string): Promise<Task> => {
    const task = await AppBindings.EnqueueDownload(url, title, thumbnail, resolution, audioOnly, audioFmt);
    return task as unknown as Task;
  },

  getTasks: async (): Promise<Task[]> => {
    try {
      const tasks = await AppBindings.GetTasks();
      return (tasks || []) as unknown as Task[];
    } catch {
      return [];
    }
  },

  cancelTask: async (id: string): Promise<void> => {
    await AppBindings.CancelTask(id);
  },

  removeTask: async (id: string): Promise<void> => {
    await AppBindings.RemoveTask(id);
  },

  revealFile: async (path: string): Promise<void> => {
    await AppBindings.RevealFile(path);
  },

  openFile: async (path: string): Promise<void> => {
    await AppBindings.OpenFile(path);
  },

  getSettings: async (): Promise<AppSettings> => {
    try {
      const s = await AppBindings.GetSettings();
      return s as unknown as AppSettings;
    } catch {
      return {
        output_dir: '~/Downloads/Omnidrop',
        concurrency: 3,
        proxy: '',
        clipboard_auto_detect: true,
        default_audio_format: 'mp3',
        theme: 'day',
      };
    }
  },

  saveSettings: async (settings: AppSettings): Promise<void> => {
    await AppBindings.SaveSettings(settings as any);
  },

  selectDirectory: async (): Promise<string> => {
    return AppBindings.SelectDirectory();
  },

  selectCookieFile: async (): Promise<string> => {
    return AppBindings.SelectCookieFile();
  },

  updateEngine: async (): Promise<{ success: boolean; message: string; version: string }> => {
    return AppBindings.UpdateEngine() as unknown as { success: boolean; message: string; version: string };
  },

  onQueueEvent: (callback: (evt: any) => void) => {
    try {
      return WailsRuntime.EventsOn('queue:event', callback);
    } catch {
      return () => {};
    }
  },

  onClipboardDetected: (callback: (url: string) => void) => {
    try {
      return WailsRuntime.EventsOn('clipboard:detected', callback);
    } catch {
      return () => {};
    }
  },
};
