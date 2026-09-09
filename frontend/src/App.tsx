import React, { useState, useEffect } from 'react';
import { 
  Download, Settings, Folder, RefreshCw, X, Play, Trash2, CheckCircle2, 
  AlertCircle, ArrowDownToLine, Copy, Film, Music, ShieldCheck, Sparkles,
  Sun, Moon, Flame
} from 'lucide-react';
import { bridge } from './wailsBridge';
import { Task, MediaInfo, AppSettings, EnvironmentInfo } from './types';
import { themes, ThemeMode } from './themes';

export default function App() {
  const [urlInput, setUrlInput] = useState('');
  const [loadingInspect, setLoadingInspect] = useState(false);
  const [inspectModal, setInspectModal] = useState<MediaInfo | null>(null);
  const [selectedFormat, setSelectedFormat] = useState('best');
  const [audioOnly, setAudioOnly] = useState(false);
  const [audioFmt, setAudioFmt] = useState('mp3');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>('day');
  const [showSettings, setShowSettings] = useState(false);
  const [env, setEnv] = useState<EnvironmentInfo | null>(null);
  const [clipboardUrl, setClipboardUrl] = useState<string | null>(null);
  const [updatingEngine, setUpdatingEngine] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);

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
    bridge.getTasks().then(setTasks);

    // Listen to queue events from Go backend
    const unbindQueue = bridge.onQueueEvent((evt: { type: string; task: Task }) => {
      if (!evt || !evt.task) return;
      setTasks(prev => {
        const idx = prev.findIndex(t => t.id === evt.task.id);
        if (evt.type === 'task_removed') {
          return prev.filter(t => t.id !== evt.task.id);
        }
        if (idx === -1) {
          return [evt.task, ...prev];
        }
        const updated = [...prev];
        updated[idx] = evt.task;
        return updated;
      });
    });

    // Listen to clipboard auto-detect
    const unbindClip = bridge.onClipboardDetected((url: string) => {
      setClipboardUrl(url);
    });

    return () => {
      unbindQueue();
      unbindClip();
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
      setClipboardUrl(null);
    } catch (err: any) {
      alert(`Could not inspect URL: ${err?.message || err}`);
    } finally {
      setLoadingInspect(false);
    }
  };

  const handleStartDownload = async () => {
    if (!inspectModal) return;
    try {
      await bridge.enqueueDownload(
        inspectModal.url,
        inspectModal.title,
        inspectModal.thumbnail,
        selectedFormat,
        audioOnly,
        audioFmt
      );
      setInspectModal(null);
      setUrlInput('');
    } catch (err: any) {
      alert(`Failed to enqueue: ${err?.message || err}`);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrlInput(text);
      handleInspect(text);
    } catch (e) {
      // Browser permissions fallback
    }
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

  return (
    <div className={`flex flex-col h-screen ${t.bg} ${t.textPrimary} transition-colors duration-200`}>
      {/* Top Navbar */}
      <header 
        style={{ '--wails-draggable': 'drag' } as any}
        className={`h-16 border-b ${t.headerBorder} ${t.headerBg} backdrop-blur-md pl-20 pr-6 flex items-center justify-between z-10 shrink-0 select-none`}
      >
        <div style={{ '--wails-draggable': 'no-drag' } as any} className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-colors ${
            currentTheme === 'warm'
              ? 'bg-gradient-to-tr from-amber-600 to-amber-500 shadow-amber-500/25'
              : 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 shadow-indigo-500/25'
          }`}>
            <ArrowDownToLine className="w-5 h-5 text-white" />
          </div>
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

      {/* Clipboard Toast Banner */}
      {clipboardUrl && (
        <div className={`border-b ${t.cardBorder} ${t.bgSubtle} px-6 py-3 flex items-center justify-between text-sm animate-in slide-in-from-top duration-200 shrink-0`}>
          <div className="flex items-center gap-3 truncate">
            <Sparkles className={`w-4 h-4 ${t.accent} shrink-0`} />
            <span className={`font-medium ${t.textPrimary}`}>Link detected in clipboard:</span>
            <span className={`truncate max-w-md font-mono text-xs ${t.accent}`}>{clipboardUrl}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleInspect(clipboardUrl)}
              className={`px-3 py-1 ${t.brandBtn} text-xs font-semibold rounded-lg shadow-sm transition`}
            >
              Inspect & Download
            </button>
            <button
              onClick={() => setClipboardUrl(null)}
              className={`p-1 ${t.textMuted} hover:${t.textPrimary}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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

            {/* Platform pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className={`font-medium ${t.textSecondary}`}>Supported:</span>
              <span className={`px-2 py-0.5 rounded-md ${t.pillBg} border ${t.pillBorder} ${t.pillText}`}>YouTube</span>
              <span className={`px-2 py-0.5 rounded-md ${t.pillBg} border ${t.pillBorder} ${t.pillText}`}>TikTok</span>
              <span className={`px-2 py-0.5 rounded-md ${t.pillBg} border ${t.pillBorder} ${t.pillText}`}>抖音 Douyin</span>
              <span className={`px-2 py-0.5 rounded-md ${t.pillBg} border ${t.pillBorder} ${t.pillText}`}>Instagram</span>
              <span className={`px-2 py-0.5 rounded-md ${t.pillBg} border ${t.pillBorder} ${t.pillText}`}>X / Twitter</span>
              <span className={`px-2 py-0.5 rounded-md ${t.pillBg} border ${t.pillBorder} ${t.pillText}`}>Facebook</span>
            </div>
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
          </div>

          {tasks.length === 0 ? (
            <div className={`border border-dashed ${t.cardBorder} rounded-2xl p-12 text-center ${t.textMuted} space-y-3`}>
              <ArrowDownToLine className="w-8 h-8 mx-auto opacity-50" />
              <p className={`text-sm font-medium ${t.textSecondary}`}>No downloads yet</p>
              <p className="text-xs max-w-sm mx-auto">Paste any social video or audio URL above to begin downloading in high quality.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => (
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
                            <AlertCircle className="w-3.5 h-3.5" /> Failed
                          </span>
                        )}
                      </div>
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
                    {task.status === 'completed' && task.output_path && (
                      <>
                        <button
                          onClick={() => bridge.openFile(task.output_path!)}
                          className={`px-3 py-1.5 rounded-lg border ${t.cardBorder} ${t.bgSubtle} hover:${t.card} text-xs font-semibold flex items-center gap-1.5 transition ${t.accent}`}
                        >
                          <Play className="w-3.5 h-3.5" /> Open
                        </button>
                        <button
                          onClick={() => bridge.revealFile(task.output_path!)}
                          className={`p-1.5 rounded-lg border ${t.cardBorder} ${t.bgSubtle} hover:${t.card} ${t.textSecondary} transition`}
                          title="Show in Finder / Explorer"
                        >
                          <Folder className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {task.status === 'downloading' && (
                      <button
                        onClick={() => bridge.cancelTask(task.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 text-xs font-semibold transition"
                      >
                        Cancel
                      </button>
                    )}

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

              {/* Clipboard auto detect toggle */}
              <div className={`flex items-center justify-between p-3 rounded-xl ${t.bgSubtle} border ${t.cardBorder}`}>
                <div>
                  <h4 className={`text-xs font-semibold ${t.textPrimary}`}>Auto-Detect Clipboard URLs</h4>
                  <p className={`text-[11px] ${t.textMuted} mt-0.5`}>Prompt when copying media links</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.clipboard_auto_detect}
                  onChange={e => {
                    const updated = { ...settings, clipboard_auto_detect: e.target.checked };
                    setSettings(updated);
                    bridge.saveSettings(updated);
                  }}
                  className={`w-4 h-4 ${currentTheme === 'warm' ? 'accent-amber-600' : 'accent-indigo-600'} rounded`}
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
                  Bypass YouTube "Sign in to confirm you're not a bot" checks or access member/age-restricted media.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    placeholder="No cookies file selected"
                    value={settings.cookie_file || ''}
                    className={`flex-1 ${t.inputBg} border ${t.inputBorder} rounded-xl px-3 py-2 text-xs ${t.textSecondary} font-mono truncate`}
                  />
                  <button
                    onClick={async () => {
                      const file = await bridge.selectCookieFile();
                      if (file) {
                        const updated = { ...settings, cookie_file: file };
                        setSettings(updated);
                        bridge.saveSettings(updated);
                      }
                    }}
                    className={`px-3 py-2 ${t.bgSubtle} hover:${t.card} border ${t.cardBorder} rounded-xl text-xs font-semibold ${t.textSecondary}`}
                    title="Import Netscape cookies.txt"
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
