import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, Settings, Folder, RefreshCw, X, Play, Trash2, CheckCircle2, 
  AlertCircle, ArrowDownToLine, Copy, Film, Music, ShieldCheck,
  Sun, Moon, Flame, FlaskConical, ChevronDown, ChevronUp
} from 'lucide-react';
import { bridge } from './wailsBridge';
import { Task, MediaInfo, AppSettings, EnvironmentInfo } from './types';
import { themes, ThemeMode } from './themes';

// ── Platform sample URLs for quick connectivity tests ──────────────────────
const PLATFORM_SAMPLES: { id: string; label: string; emoji: string; url: string }[] = [
  { id: 'youtube',   label: 'YouTube',   emoji: '▶️',  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { id: 'tiktok',    label: 'TikTok',    emoji: '🎵',  url: 'https://www.tiktok.com/@zachking/video/6768504823336815877' },
  { id: 'instagram', label: 'Instagram', emoji: '📸',  url: 'https://www.instagram.com/reel/C4pR3_mPzUl/' },
  { id: 'twitter',   label: 'X/Twitter', emoji: '🐦',  url: 'https://x.com/twitter/status/1445066953054588929' },
  { id: 'facebook',  label: 'Facebook',  emoji: '👍',  url: 'https://www.facebook.com/watch/?v=1195840074291348' },
  { id: 'douyin',    label: 'Douyin',    emoji: '🎬',  url: 'https://v.douyin.com/iRNBho6U/' },
];

type TestStatus = 'idle' | 'loading' | 'pass' | 'fail';

export default function App() {
  const [urlInput, setUrlInput] = useState('');
  const [loadingInspect, setLoadingInspect] = useState(false);
  const [inspectModal, setInspectModal] = useState<MediaInfo | null>(null);
  const [selectedFormat, setSelectedFormat] = useState('best');
  const [audioOnly, setAudioOnly] = useState(false);
  const [audioFmt, setAudioFmt] = useState('mp3');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskViewLimit, setTaskViewLimit] = useState<'recent5' | 'all'>('recent5');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>('day');
  const [showSettings, setShowSettings] = useState(false);
  const [env, setEnv] = useState<EnvironmentInfo | null>(null);
  const [updatingEngine, setUpdatingEngine] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [testStatuses, setTestStatuses] = useState<Record<string, TestStatus>>({});
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const cookieFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Initial data load
    bridge.getEnvironment().then(setEnv);
    bridge.getSettings().then(st => {
      setSettings(st);
      if (st && (st.theme === 'night' || st.theme === 'warm' || st.theme === 'day')) {
        setCurrentTheme(st.theme as ThemeMode);
      } else {
        setCurrentTheme('day');
      }
    });

    // Helper to merge and sort tasks newest first
    const mergeTasks = (existing: Task[], incoming: Task[]): Task[] => {
      const map = new Map<string, Task>();
      // Preserve existing
      for (const t of existing) {
        map.set(t.id, t);
      }
      // Upsert incoming
      for (const t of incoming) {
        map.set(t.id, t);
      }
      return Array.from(map.values()).sort((a, b) => {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return timeB - timeA;
      });
    };

    bridge.getTasks().then(initialTasks => {
      if (initialTasks && Array.isArray(initialTasks)) {
        setTasks(prev => mergeTasks(prev, initialTasks));
      }
    });

    // Listen to queue events from Go backend
    const unbindQueue = bridge.onQueueEvent((evt: { type: string; task: Task }) => {
      if (!evt || !evt.task) return;
      setTasks(prev => {
        if (evt.type === 'task_removed') {
          return prev.filter(t => t.id !== evt.task.id);
        }
        const idx = prev.findIndex(t => t.id === evt.task.id);
        if (idx === -1) {
          // Put new task at the top
          return [evt.task, ...prev];
        }
        const updated = [...prev];
        updated[idx] = evt.task;
        return updated;
      });
    });

    return () => {
      unbindQueue();
    };
  }, []);

  const handleThemeChange = (theme: ThemeMode) => {
    setCurrentTheme(theme);
    if (settings) {
      const updated = { ...settings, theme };
      setSettings(updated);
      bridge.saveSettings(updated);
    }
  };

  const handleInspect = async (targetURL: string) => {
    const cleanUrl = targetURL.trim();
    if (!cleanUrl) return;
    setLoadingInspect(true);
    try {
      const info = await bridge.inspectURL(cleanUrl);
      setInspectModal(info);
      setSelectedFormat(info.best_quality || 'best');
    } catch (err: any) {
      alert(`Could not inspect URL: ${err?.message || err}`);
    } finally {
      setLoadingInspect(false);
    }
  };

  const handleStartDownload = async () => {
    if (!inspectModal) return;
    try {
      const newTask = await bridge.enqueueDownload(
        inspectModal.url,
        inspectModal.title,
        inspectModal.thumbnail,
        selectedFormat,
        audioOnly,
        audioFmt
      );
      if (newTask) {
        setTasks(prev => {
          const filtered = prev.filter(t => t.id !== newTask.id);
          return [newTask, ...filtered];
        });
      }
      setInspectModal(null);
      setUrlInput('');
    } catch (err: any) {
      alert(`Failed to enqueue: ${err?.message || err}`);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await bridge.pasteFromClipboard();
      if (!text?.trim()) return;
      setUrlInput(text.trim());
      handleInspect(text.trim());
    } catch (e: any) {
      alert(`Could not read clipboard: ${e?.message || e}`);
    }
  };

  const handlePlay = async () => {
    if (!inspectModal) return;
    try {
      await bridge.playURL(inspectModal.url);
      setInspectModal(null);
    } catch (err: any) {
      alert(`Could not open player: ${err?.message || err}\n\nInstall ffplay (brew install ffmpeg) to use this feature.`);
    }
  };

  const handlePlatformTest = async (sample: typeof PLATFORM_SAMPLES[0]) => {
    setTestStatuses(prev => ({ ...prev, [sample.id]: 'loading' }));
    try {
      await bridge.inspectURL(sample.url);
      setTestStatuses(prev => ({ ...prev, [sample.id]: 'pass' }));
    } catch {
      setTestStatuses(prev => ({ ...prev, [sample.id]: 'fail' }));
    }
  };

  const handleTestAll = () => {
    // Reset all to loading then fire in parallel
    const init: Record<string, TestStatus> = {};
    PLATFORM_SAMPLES.forEach(s => { init[s.id] = 'loading'; });
    setTestStatuses(init);
    PLATFORM_SAMPLES.forEach(s => handlePlatformTest(s));
  };

  const handleUpdateEngine = async () => {
    setUpdatingEngine(true);
    setUpdateStatus('Checking for latest yt-dlp release...');
    try {
      const res = await bridge.updateEngine();
      setUpdateStatus(res.message);
      setEnv(prev => prev ? { ...prev, version: res.version } : prev);
    } catch (e: any) {
      setUpdateStatus(`Error: ${e?.message || e}`);
    } finally {
      setUpdatingEngine(false);
    }
  };

  const t = themes[currentTheme] || themes.day;
  const activeCount = tasks.filter(t => t.status === 'downloading' || t.status === 'queued').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const visibleTasks = taskViewLimit === 'recent5' ? tasks.slice(0, 5) : tasks;

  return (
    <div className={`flex flex-col h-screen ${t.bg} ${t.textPrimary} transition-colors duration-200`}>
      {/* Top Navbar */}
      <header 
        style={{ '--wails-draggable': 'drag' } as any}
        className={`h-16 border-b ${t.headerBorder} ${t.headerBg} backdrop-blur-md pl-[110px] pr-6 flex items-center justify-between z-10 shrink-0 select-none`}
      >
        <div style={{ '--wails-draggable': 'no-drag' } as any} className="flex items-center gap-3">
          <img 
            src="./appicon.png" 
            alt="Omnidrop" 
            className="w-10 h-10 rounded-xl shadow-lg object-cover ring-1 ring-white/10" 
          />
          <div>
            <h1 className="font-bold text-lg tracking-tight">
              Omnidrop
            </h1>
            <div className={`flex items-center gap-2 text-xs ${t.textSecondary}`}>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Standalone Engine (yt-dlp {env?.version || 'ready'})</span>
            </div>
          </div>
        </div>

        <div style={{ '--wails-draggable': 'no-drag' } as any} className="flex items-center gap-3">
          {/* Theme Quick Switcher */}
          <div className={`flex items-center p-1 rounded-xl border ${t.cardBorder} ${t.bgSubtle}`}>
            <button
              onClick={() => handleThemeChange('day')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition ${
                currentTheme === 'day' 
                  ? 'bg-white shadow text-indigo-600 font-semibold' 
                  : `${t.textSecondary} hover:${t.textPrimary}`
              }`}
              title="Day theme (Default)"
            >
              <Sun className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Day</span>
            </button>
            <button
              onClick={() => handleThemeChange('night')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition ${
                currentTheme === 'night' 
                  ? 'bg-slate-800 shadow text-indigo-400 font-semibold' 
                  : `${t.textSecondary} hover:${t.textPrimary}`
              }`}
              title="Night theme"
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Night</span>
            </button>
            <button
              onClick={() => handleThemeChange('warm')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition ${
                currentTheme === 'warm' 
                  ? 'bg-[#fffdfa] shadow text-amber-700 font-semibold' 
                  : `${t.textSecondary} hover:${t.textPrimary}`
              }`}
              title="Warm color theme"
            >
              <Flame className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Warm</span>
            </button>
          </div>

          <button 
            onClick={() => setShowSettings(true)}
            className={`p-2.5 rounded-xl border ${t.cardBorder} ${t.textSecondary} hover:${t.textPrimary} hover:${t.bgSubtle} transition`}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>


      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto w-full">
        {/* URL Input Hero */}
        <section className={`border ${t.cardBorder} ${t.card} rounded-2xl p-6 shadow-sm relative overflow-hidden transition-colors`}>
          <div className={`absolute top-0 right-0 w-80 h-80 ${t.brandGlow} rounded-full blur-3xl pointer-events-none`}></div>

          <div className="space-y-4">
            <div>
              <h2 className={`text-base font-semibold ${t.textPrimary}`}>Download from Any Platform</h2>
              <p className={`text-xs ${t.textSecondary} mt-0.5`}>Paste links from TikTok, 抖音 (Douyin), Instagram, X (Twitter), YouTube, or Facebook</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleInspect(urlInput)}
                  placeholder="Paste URL here (e.g. https://www.tiktok.com/@user/video/... or https://v.douyin.com/...)"
                  className={`w-full ${t.inputBg} border ${t.inputBorder} rounded-xl px-4 py-3.5 text-sm ${t.textPrimary} ${t.inputFocusRing} focus:outline-none focus:ring-2 transition pr-24`}
                />
                <button
                  type="button"
                  onClick={handlePaste}
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg ${t.bgSubtle} border ${t.cardBorder} ${t.textSecondary} hover:${t.textPrimary} text-xs font-medium flex items-center gap-1.5 transition`}
                >
                  <Copy className="w-3.5 h-3.5" />
                  Paste
                </button>
              </div>

              <button
                disabled={loadingInspect || !urlInput.trim()}
                onClick={() => handleInspect(urlInput)}
                className={`px-6 py-3.5 ${t.brandBtn} disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold rounded-xl flex items-center gap-2 shadow-lg transition shrink-0`}
              >
                {loadingInspect ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Fetch Info
              </button>
            </div>

            {/* Platform pills + Quick Test toggle */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`font-medium ${t.textSecondary}`}>Supported:</span>
                <span className={`px-2 py-0.5 rounded-md ${t.pillBg} border ${t.pillBorder} ${t.pillText}`}>YouTube</span>
                <span className={`px-2 py-0.5 rounded-md ${t.pillBg} border ${t.pillBorder} ${t.pillText}`}>TikTok</span>
                <span className={`px-2 py-0.5 rounded-md ${t.pillBg} border ${t.pillBorder} ${t.pillText}`}>抖音 Douyin</span>
                <span className={`px-2 py-0.5 rounded-md ${t.pillBg} border ${t.pillBorder} ${t.pillText}`}>Instagram</span>
                <span className={`px-2 py-0.5 rounded-md ${t.pillBg} border ${t.pillBorder} ${t.pillText}`}>X / Twitter</span>
                <span className={`px-2 py-0.5 rounded-md ${t.pillBg} border ${t.pillBorder} ${t.pillText}`}>Facebook</span>
              </div>
              <button
                onClick={() => setShowTests(v => !v)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${t.cardBorder} ${t.bgSubtle} ${t.textSecondary} hover:${t.textPrimary} transition text-[11px] font-semibold shrink-0`}
              >
                <FlaskConical className="w-3.5 h-3.5" />
                Quick Test
                {showTests ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* ── Quick Test Panel ── */}
            {showTests && (
              <div className={`mt-3 p-4 rounded-xl border ${t.cardBorder} ${t.bgSubtle} space-y-3`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FlaskConical className={`w-4 h-4 ${t.accent}`} />
                    <span className={`text-xs font-bold ${t.textPrimary}`}>Platform Connectivity Tests</span>
                  </div>
                  <button
                    onClick={handleTestAll}
                    disabled={Object.values(testStatuses).some(s => s === 'loading')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${t.brandBtn} text-[11px] font-semibold transition disabled:opacity-50 disabled:cursor-wait shrink-0`}
                  >
                    {Object.values(testStatuses).some(s => s === 'loading')
                      ? <><RefreshCw className="w-3 h-3 animate-spin" /> Testing…</>
                      : <><FlaskConical className="w-3 h-3" /> Test All</>}
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PLATFORM_SAMPLES.map(sample => {
                    const status = testStatuses[sample.id] ?? 'idle';
                    return (
                      <div
                        key={sample.id}
                        className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold ${
                          status === 'pass'
                            ? 'border-emerald-400 bg-emerald-500/10 text-emerald-600'
                            : status === 'fail'
                            ? 'border-rose-400 bg-rose-500/10 text-rose-600'
                            : status === 'loading'
                            ? `${t.cardBorder} ${t.card} ${t.textMuted}`
                            : `${t.cardBorder} ${t.card} ${t.textSecondary}`
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>{sample.emoji}</span>
                          <span>{sample.label}</span>
                        </span>
                        <span className="ml-auto shrink-0">
                          {status === 'idle'    && <span className={`text-[10px] ${t.textMuted}`}>—</span>}
                          {status === 'loading' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                          {status === 'pass'    && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {status === 'fail'    && <AlertCircle className="w-3.5 h-3.5" />}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className={`text-[11px] ${t.textSecondary}`}>
                  ✓ pass = yt-dlp can reach the platform &nbsp;·&nbsp; ✗ fail = blocked / needs cookies / video removed
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Task Queue Dashboard */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className={`text-base font-semibold ${t.textPrimary}`}>Download Queue</h2>
              <span className={`px-2.5 py-0.5 text-xs rounded-full ${t.bgSubtle} border ${t.cardBorder} ${t.textSecondary} font-medium`}>
                {activeCount} Active • {completedCount} Done
              </span>
            </div>

            {tasks.length > 5 && (
              <div className={`flex items-center p-0.5 rounded-lg border ${t.cardBorder} ${t.bgSubtle} text-xs`}>
                <button
                  onClick={() => setTaskViewLimit('recent5')}
                  className={`px-2.5 py-1 rounded-md transition font-medium ${
                    taskViewLimit === 'recent5'
                      ? 'bg-white dark:bg-slate-800 shadow text-indigo-600 font-semibold'
                      : `${t.textSecondary} hover:${t.textPrimary}`
                  }`}
                >
                  Recent 5
                </button>
                <button
                  onClick={() => setTaskViewLimit('all')}
                  className={`px-2.5 py-1 rounded-md transition font-medium ${
                    taskViewLimit === 'all'
                      ? 'bg-white dark:bg-slate-800 shadow text-indigo-600 font-semibold'
                      : `${t.textSecondary} hover:${t.textPrimary}`
                  }`}
                >
                  All ({tasks.length})
                </button>
              </div>
            )}
          </div>

          {tasks.length === 0 ? (
            <div className={`border border-dashed ${t.cardBorder} rounded-2xl p-12 text-center ${t.textMuted} space-y-3`}>
              <ArrowDownToLine className="w-8 h-8 mx-auto opacity-50" />
              <p className={`text-sm font-medium ${t.textSecondary}`}>No downloads yet</p>
              <p className="text-xs max-w-sm mx-auto">Paste any social video or audio URL above to begin downloading in high quality.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleTasks.map(task => (
                <div 
                  key={task.id}
                  className={`border ${t.cardBorder} ${t.card} ${t.cardHover} rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {task.thumbnail ? (
                      <img 
                        src={task.thumbnail} 
                        alt="" 
                        className={`w-16 h-12 rounded-lg object-cover ${t.bgSubtle} shrink-0 border ${t.cardBorder}`} 
                      />
                    ) : (
                      <div className={`w-16 h-12 rounded-lg ${t.bgSubtle} border ${t.cardBorder} flex items-center justify-center shrink-0`}>
                        {task.options.AudioOnly ? <Music className={`w-5 h-5 ${t.accent}`} /> : <Film className={`w-5 h-5 ${t.accent}`} />}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className={`text-sm font-semibold ${t.textPrimary} truncate`}>{task.title || task.url}</h4>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs">
                        <span className={`capitalize px-1.5 py-0.5 rounded ${t.pillBg} border ${t.pillBorder} ${t.accent} font-semibold`}>
                          {task.platform}
                        </span>
                        {task.options.AudioOnly ? (
                          <span className="text-emerald-600 font-medium">Audio ({task.options.AudioFmt?.toUpperCase() || 'MP3'})</span>
                        ) : (
                          <span className={t.textSecondary}>Res: {task.options.Resolution || 'Best'}</span>
                        )}
                        {task.status === 'downloading' && (
                          <span className={`${t.accent} font-mono font-medium`}>
                            {task.progress.speed_str} • ETA {task.progress.eta_str}
                          </span>
                        )}
                        {task.status === 'completed' && (
                          <span className="text-emerald-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Finished
                          </span>
                        )}
                        {task.status === 'failed' && (
                          <span className="text-rose-600 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Failed
                          </span>
                        )}
                      </div>
                      {task.status === 'failed' && task.error && (
                        <div className="mt-2 text-xs text-rose-600/90 dark:text-rose-400/90 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2 flex flex-col gap-1">
                          <span className="font-mono text-[11px] break-all leading-tight">
                            {task.error}
                          </span>
                          {(task.error.toLowerCase().includes('cookie') || task.error.toLowerCase().includes('403') || task.error.toLowerCase().includes('bot') || task.error.toLowerCase().includes('sign in')) && (
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-rose-500 dark:text-rose-300 pt-0.5">
                              <span>💡 Tip: Add your browser cookies in</span>
                              <button 
                                onClick={() => setShowSettings(true)}
                                className="underline font-semibold hover:opacity-80 inline-flex items-center gap-0.5"
                              >
                                Settings
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Progress Bar */}
                      {task.status === 'downloading' && (
                        <div className={`w-full ${t.bgSubtle} rounded-full h-1.5 mt-2.5 overflow-hidden`}>
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-300 ${currentTheme === 'warm' ? 'bg-amber-500' : 'bg-indigo-600'}`}
                            style={{ width: `${Math.max(task.progress.percent || 0, 5)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {(task.status === 'completed' || task.progress?.percent >= 100 || task.progress?.status === 'finished') ? (
                      <>
                        <button
                          onClick={() => {
                            const target = task.output_path || task.options?.OutputDir || '';
                            if (target) bridge.openFile(target);
                          }}
                          className={`px-3 py-1.5 rounded-lg border ${t.cardBorder} ${t.bgSubtle} hover:${t.card} text-xs font-semibold flex items-center gap-1.5 transition ${t.accent}`}
                        >
                          <Play className="w-3.5 h-3.5" /> Open
                        </button>
                        <button
                          onClick={() => {
                            const target = task.output_path || task.options?.OutputDir || '';
                            if (target) bridge.revealFile(target);
                          }}
                          className={`p-1.5 rounded-lg border ${t.cardBorder} ${t.bgSubtle} hover:${t.card} ${t.textSecondary} transition`}
                          title="Show in Finder / Explorer"
                        >
                          <Folder className="w-4 h-4" />
                        </button>
                      </>
                    ) : task.status === 'downloading' ? (
                      <button
                        onClick={() => bridge.cancelTask(task.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 text-xs font-semibold transition"
                      >
                        Cancel
                      </button>
                    ) : null}

                    <button
                      onClick={() => bridge.removeTask(task.id)}
                      className={`p-1.5 rounded-lg hover:${t.bgSubtle} ${t.textMuted} hover:${t.textSecondary} transition`}
                      title="Dismiss"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Inspect Quality Selector Modal */}
      {inspectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`${t.modalBg} border rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150`}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <span className={`text-xs uppercase tracking-wider font-bold ${t.accent}`}>Media Ready</span>
                <h3 className={`text-base font-bold ${t.textPrimary} truncate mt-0.5`}>{inspectModal.title}</h3>
                <p className={`text-xs ${t.textSecondary} mt-0.5`}>{inspectModal.uploader || inspectModal.channel} • {Math.round(inspectModal.duration)}s</p>
              </div>
              <button 
                onClick={() => setInspectModal(null)}
                className={`p-1 ${t.textMuted} hover:${t.textPrimary} rounded-lg hover:${t.bgSubtle}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inspectModal.thumbnail && (
              <img 
                src={inspectModal.thumbnail} 
                alt="" 
                className={`w-full h-44 object-cover rounded-xl border ${t.cardBorder}`} 
              />
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className={`text-xs font-semibold ${t.textPrimary}`}>Format Mode</label>
                <div className={`flex items-center gap-1 ${t.bgSubtle} p-1 rounded-lg border ${t.cardBorder}`}>
                  <button
                    onClick={() => setAudioOnly(false)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition ${!audioOnly ? `${t.brandBtn}` : `${t.textSecondary}`}`}
                  >
                    Video
                  </button>
                  <button
                    onClick={() => setAudioOnly(true)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition ${audioOnly ? `${t.brandBtn}` : `${t.textSecondary}`}`}
                  >
                    Audio Only
                  </button>
                </div>
              </div>

              {!audioOnly ? (
                <div>
                  <label className={`text-xs font-semibold ${t.textPrimary} block mb-1.5`}>Select Quality</label>
                  <select
                    value={selectedFormat}
                    onChange={e => setSelectedFormat(e.target.value)}
                    className={`w-full ${t.inputBg} border ${t.inputBorder} ${t.textPrimary} rounded-xl px-3.5 py-2.5 text-sm focus:outline-none`}
                  >
                    <option value="best">Best Available (Auto)</option>
                    <option value="2160p">4K (2160p)</option>
                    <option value="1440p">2K (1440p)</option>
                    <option value="1080p">Full HD (1080p)</option>
                    <option value="720p">HD (720p)</option>
                    <option value="480p">SD (480p)</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className={`text-xs font-semibold ${t.textPrimary} block mb-1.5`}>Audio Encoding</label>
                  <select
                    value={audioFmt}
                    onChange={e => setAudioFmt(e.target.value)}
                    className={`w-full ${t.inputBg} border ${t.inputBorder} ${t.textPrimary} rounded-xl px-3.5 py-2.5 text-sm focus:outline-none`}
                  >
                    <option value="mp3">MP3 (High Quality)</option>
                    <option value="m4a">M4A (AAC)</option>
                    <option value="wav">WAV (Lossless)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setInspectModal(null)}
                className={`px-4 py-2.5 rounded-xl border ${t.cardBorder} hover:${t.bgSubtle} ${t.textSecondary} text-sm font-semibold transition`}
              >
                Cancel
              </button>
              {env?.has_player && (
                <button
                  onClick={handlePlay}
                  className={`px-4 py-2.5 rounded-xl border ${t.cardBorder} hover:${t.bgSubtle} ${t.textSecondary} text-sm font-semibold transition flex items-center gap-2`}
                  title="Stream in media player without downloading"
                >
                  <Play className="w-4 h-4" /> Play
                </button>
              )}
              <button
                onClick={handleStartDownload}
                className={`px-5 py-2.5 rounded-xl ${t.brandBtn} text-sm font-semibold shadow-lg transition flex items-center gap-2`}
              >
                <Download className="w-4 h-4" /> Start Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Drawer */}
      {showSettings && settings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className={`${t.drawerBg} border-l w-full max-w-md h-full p-6 flex flex-col justify-between animate-in slide-in-from-right duration-200 shadow-2xl`}>
            <div className="space-y-6">
              <div className={`flex items-center justify-between border-b ${t.cardBorder} pb-4`}>
                <div className="flex items-center gap-2">
                  <Settings className={`w-5 h-5 ${t.accent}`} />
                  <h3 className={`font-bold text-base ${t.textPrimary}`}>Preferences</h3>
                </div>
                <button onClick={() => setShowSettings(false)} className={`p-1 ${t.textMuted} hover:${t.textPrimary}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Theme Selector */}
              <div className="space-y-2">
                <label className={`text-xs font-semibold ${t.textPrimary}`}>App Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleThemeChange('day')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition ${
                      currentTheme === 'day' 
                        ? 'border-indigo-600 bg-indigo-50/50 font-bold text-indigo-700 ring-2 ring-indigo-500/20' 
                        : `${t.cardBorder} ${t.bgSubtle} ${t.textSecondary}`
                    }`}
                  >
                    <Sun className="w-5 h-5 text-amber-500" />
                    <span className="text-xs">Day (Default)</span>
                  </button>
                  <button
                    onClick={() => handleThemeChange('night')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition ${
                      currentTheme === 'night' 
                        ? 'border-indigo-500 bg-slate-900 font-bold text-indigo-300 ring-2 ring-indigo-500/20' 
                        : `${t.cardBorder} ${t.bgSubtle} ${t.textSecondary}`
                    }`}
                  >
                    <Moon className="w-5 h-5 text-indigo-400" />
                    <span className="text-xs">Night</span>
                  </button>
                  <button
                    onClick={() => handleThemeChange('warm')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition ${
                      currentTheme === 'warm' 
                        ? 'border-amber-600 bg-amber-50/60 font-bold text-amber-800 ring-2 ring-amber-500/20' 
                        : `${t.cardBorder} ${t.bgSubtle} ${t.textSecondary}`
                    }`}
                  >
                    <Flame className="w-5 h-5 text-amber-600" />
                    <span className="text-xs">Warm Color</span>
                  </button>
                </div>
              </div>

              {/* Download Directory */}
              <div className="space-y-2">
                <label className={`text-xs font-semibold ${t.textPrimary}`}>Download Directory</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={settings.output_dir}
                    className={`flex-1 ${t.inputBg} border ${t.inputBorder} rounded-xl px-3 py-2 text-xs ${t.textSecondary} font-mono truncate`}
                  />
                  <button
                    onClick={async () => {
                      const dir = await bridge.selectDirectory();
                      if (dir) {
                        const updated = { ...settings, output_dir: dir };
                        setSettings(updated);
                        bridge.saveSettings(updated);
                      }
                    }}
                    className={`p-2 ${t.bgSubtle} hover:${t.card} border ${t.cardBorder} rounded-xl ${t.textSecondary}`}
                    title="Change directory"
                  >
                    <Folder className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Concurrency limit */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className={`font-semibold ${t.textPrimary}`}>Max Concurrent Downloads</span>
                  <span className={`${t.accent} font-bold`}>{settings.concurrency}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={settings.concurrency}
                  onChange={e => {
                    const updated = { ...settings, concurrency: parseInt(e.target.value) };
                    setSettings(updated);
                    bridge.saveSettings(updated);
                  }}
                  className={`w-full ${currentTheme === 'warm' ? 'accent-amber-600' : 'accent-indigo-600'}`}
                />
              </div>

              {/* Cookie / Authentication */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className={`text-xs font-semibold ${t.textPrimary}`}>Authentication / Cookies</label>
                  {settings.cookie_file && (
                    <button
                      onClick={() => {
                        const updated = { ...settings, cookie_file: '' };
                        setSettings(updated);
                        bridge.saveSettings(updated);
                      }}
                      className="text-[11px] text-rose-500 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className={`text-[11px] ${t.textSecondary}`}>
                  Bypass YouTube "Sign in to confirm you're not a bot" checks. Choose direct browser cookies (Chrome, Brave, Edge, Safari) or import a cookies.txt file.
                </p>

                {/* Quick Browser Cookie Presets */}
                <div className="pt-1">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    <span className={`text-[11px] font-medium ${t.textMuted} shrink-0 mr-0.5`}>Preset:</span>
                    {[
                      { id: 'browser:chrome', label: '🌐 Chrome' },
                      { id: 'browser:brave', label: '🦁 Brave' },
                      { id: 'browser:edge', label: '🌊 Edge' },
                      { id: 'browser:safari', label: '🧭 Safari' },
                    ].map(b => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          const updated = { ...settings, cookie_file: b.id };
                          setSettings(updated);
                          bridge.saveSettings(updated);
                        }}
                        className={`px-2 py-1 rounded-lg text-xs font-medium border shrink-0 transition whitespace-nowrap ${
                          settings.cookie_file === b.id
                            ? `${t.accent} border-indigo-500 bg-indigo-500/10 font-semibold`
                            : `${t.bgSubtle} ${t.textSecondary} ${t.cardBorder} hover:${t.textPrimary}`
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {/* Hidden fallback file input for browser mode or when native dialog fails */}
                  <input
                    ref={cookieFileInputRef}
                    type="file"
                    accept=".txt,text/plain"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const content = await file.text();
                        // Try saving content to ~/.omnidrop/cookies.txt
                        const savedPath = await bridge.saveCookieContent(content);
                        const finalPath = savedPath || file.name;
                        const updated = { ...settings, cookie_file: finalPath };
                        setSettings(updated);
                        bridge.saveSettings(updated);
                      } catch (err) {
                        console.error('Failed reading cookie file:', err);
                      }
                      // Reset file input value so selecting the same file again triggers onChange
                      e.target.value = '';
                    }}
                  />

                  <input
                    type="text"
                    placeholder="Enter path (e.g. C:\cookies.txt) or select file"
                    value={settings.cookie_file || ''}
                    onChange={(e) => {
                      const updated = { ...settings, cookie_file: e.target.value };
                      setSettings(updated);
                      bridge.saveSettings(updated);
                    }}
                    className={`flex-1 ${t.inputBg} border ${t.inputBorder} rounded-xl px-3 py-2 text-xs ${t.textSecondary} font-mono truncate focus:outline-none focus:border-indigo-500`}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      // Attempt native desktop file picker first
                      try {
                        const file = await bridge.selectCookieFile();
                        if (file) {
                          const updated = { ...settings, cookie_file: file };
                          setSettings(updated);
                          bridge.saveSettings(updated);
                          return;
                        }
                      } catch (err) {
                        console.warn('Native picker error, opening browser file dialog:', err);
                      }
                      // Fallback: trigger HTML file input for browser / web mode
                      cookieFileInputRef.current?.click();
                    }}
                    className={`px-3 py-2 ${t.bgSubtle} hover:${t.card} active:scale-95 border ${t.cardBorder} rounded-xl text-xs font-semibold ${t.textSecondary} transition-all cursor-pointer`}
                    title="Import Netscape cookies.txt file"
                  >
                    Select .txt
                  </button>
                </div>
              </div>

              {/* Engine Updater Box */}
              <div className={`p-4 rounded-xl ${t.bgSubtle} border ${t.cardBorder} space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className={`text-xs font-semibold ${t.textPrimary}`}>Download Engine</span>
                  </div>
                  <span className={`text-[11px] font-mono ${t.textSecondary}`}>v{env?.version || '2025+'}</span>
                </div>
                <p className={`text-[11px] ${t.textSecondary}`}>If downloads on TikTok or Instagram stop working due to site updates, update the engine here.</p>
                <button
                  disabled={updatingEngine}
                  onClick={handleUpdateEngine}
                  className={`w-full py-2 ${t.card} border ${t.cardBorder} hover:${t.bgSubtle} disabled:opacity-50 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${updatingEngine ? 'animate-spin' : ''}`} />
                  {updatingEngine ? 'Updating...' : 'Check & Update yt-dlp'}
                </button>
                {updateStatus && (
                  <p className={`text-[11px] ${t.accent} font-mono truncate`}>{updateStatus}</p>
                )}
              </div>
            </div>

            <div className={`pt-4 border-t ${t.cardBorder}`}>
              <button
                onClick={() => setShowSettings(false)}
                className={`w-full py-2.5 ${t.brandBtn} text-xs font-semibold rounded-xl transition`}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
