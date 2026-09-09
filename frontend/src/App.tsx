import React, { useState, useEffect } from 'react';
import { 
  Download, Settings, Folder, RefreshCw, X, Play, Trash2, CheckCircle2, 
  AlertCircle, ArrowDownToLine, Copy, Film, Music, ShieldCheck, Sparkles
} from 'lucide-react';
import { bridge } from './wailsBridge';
import { Task, MediaInfo, AppSettings, EnvironmentInfo } from './types';

export default function App() {
  const [urlInput, setUrlInput] = useState('');
  const [loadingInspect, setLoadingInspect] = useState(false);
  const [inspectModal, setInspectModal] = useState<MediaInfo | null>(null);
  const [selectedFormat, setSelectedFormat] = useState('best');
  const [audioOnly, setAudioOnly] = useState(false);
  const [audioFmt, setAudioFmt] = useState('mp3');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [env, setEnv] = useState<EnvironmentInfo | null>(null);
  const [clipboardUrl, setClipboardUrl] = useState<string | null>(null);
  const [updatingEngine, setUpdatingEngine] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);

  useEffect(() => {
    // Initial data load
    bridge.getEnvironment().then(setEnv);
    bridge.getSettings().then(setSettings);
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

  const activeCount = tasks.filter(t => t.status === 'downloading' || t.status === 'queued').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="flex flex-col h-screen bg-[#07090e] text-slate-100 selection:bg-indigo-500/30">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-800/80 bg-[#0c1017]/90 backdrop-blur-md px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <ArrowDownToLine className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
              Omnidrop
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Standalone Engine (yt-dlp {env?.version || 'ready'})</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2.5 rounded-xl hover:bg-slate-800/80 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Clipboard Toast Banner */}
      {clipboardUrl && (
        <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/80 border-b border-indigo-500/30 px-6 py-3 flex items-center justify-between text-sm animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-3 truncate">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-slate-300 font-medium">Link detected in clipboard:</span>
            <span className="text-indigo-300 truncate max-w-md font-mono text-xs">{clipboardUrl}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleInspect(clipboardUrl)}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              Inspect & Download
            </button>
            <button
              onClick={() => setClipboardUrl(null)}
              className="p-1 text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto w-full">
        {/* URL Input Hero */}
        <section className="bg-gradient-to-b from-[#0f141d] to-[#0c1017] border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-200">Download from Any Platform</h2>
              <p className="text-xs text-slate-400 mt-0.5">Paste links from TikTok, Douyin, Instagram, X (Twitter), YouTube, or Facebook</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleInspect(urlInput)}
                  placeholder="Paste URL here (e.g. https://www.tiktok.com/@user/video/... or https://youtube.com/watch?v=...)"
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition pr-24"
                />
                <button
                  type="button"
                  onClick={handlePaste}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Paste
                </button>
              </div>

              <button
                disabled={loadingInspect || !urlInput.trim()}
                onClick={() => handleInspect(urlInput)}
                className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition shrink-0"
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
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
              <span className="font-medium text-slate-400">Supported:</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800/60 border border-slate-800 text-slate-400">YouTube</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800/60 border border-slate-800 text-slate-400">TikTok</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800/60 border border-slate-800 text-slate-400">抖音 Douyin</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800/60 border border-slate-800 text-slate-400">Instagram</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800/60 border border-slate-800 text-slate-400">X / Twitter</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800/60 border border-slate-800 text-slate-400">Facebook</span>
            </div>
          </div>
        </section>

        {/* Task Queue Dashboard */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-slate-200">Download Queue</h2>
              <span className="px-2 py-0.5 text-xs rounded-full bg-slate-800 text-slate-300 font-medium">
                {activeCount} Active • {completedCount} Done
              </span>
            </div>
          </div>

          {tasks.length === 0 ? (
            <div className="border border-dashed border-slate-800/80 rounded-2xl p-12 text-center text-slate-500 space-y-3">
              <ArrowDownToLine className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
              <p className="text-sm font-medium">No downloads yet</p>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">Paste any social video or audio URL above to begin downloading in high quality.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => (
                <div 
                  key={task.id}
                  className="bg-[#0c1017] border border-slate-800/80 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {task.thumbnail ? (
                      <img 
                        src={task.thumbnail} 
                        alt="" 
                        className="w-16 h-12 rounded-lg object-cover bg-slate-900 shrink-0 border border-slate-800" 
                      />
                    ) : (
                      <div className="w-16 h-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                        {task.options.AudioOnly ? <Music className="w-5 h-5 text-indigo-400" /> : <Film className="w-5 h-5 text-indigo-400" />}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-slate-200 truncate">{task.title || task.url}</h4>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
                        <span className="capitalize px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-medium">
                          {task.platform}
                        </span>
                        {task.options.AudioOnly ? (
                          <span className="text-emerald-400">Audio ({task.options.AudioFmt?.toUpperCase() || 'MP3'})</span>
                        ) : (
                          <span>Res: {task.options.Resolution || 'Best'}</span>
                        )}
                        {task.status === 'downloading' && (
                          <span className="text-indigo-400 font-mono">
                            {task.progress.speed_str} • ETA {task.progress.eta_str}
                          </span>
                        )}
                        {task.status === 'completed' && (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Finished
                          </span>
                        )}
                        {task.status === 'failed' && (
                          <span className="text-rose-400 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Failed
                          </span>
                        )}
                      </div>
                      {/* Progress Bar */}
                      {task.status === 'downloading' && (
                        <div className="w-full bg-slate-800/80 rounded-full h-1.5 mt-2.5 overflow-hidden">
                          <div 
                            className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
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
                          className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <Play className="w-3.5 h-3.5" /> Open
                        </button>
                        <button
                          onClick={() => bridge.revealFile(task.output_path!)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          title="Show in Finder / Explorer"
                        >
                          <Folder className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {task.status === 'downloading' && (
                      <button
                        onClick={() => bridge.cancelTask(task.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold transition"
                      >
                        Cancel
                      </button>
                    )}

                    <button
                      onClick={() => bridge.removeTask(task.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition"
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c1017] border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <span className="text-xs uppercase tracking-wider font-semibold text-indigo-400">Media Ready</span>
                <h3 className="text-base font-bold text-slate-100 truncate mt-0.5">{inspectModal.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{inspectModal.uploader || inspectModal.channel} • {Math.round(inspectModal.duration)}s</p>
              </div>
              <button 
                onClick={() => setInspectModal(null)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inspectModal.thumbnail && (
              <img 
                src={inspectModal.thumbnail} 
                alt="" 
                className="w-full h-44 object-cover rounded-xl border border-slate-800" 
              />
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Format Mode</label>
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setAudioOnly(false)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition ${!audioOnly ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Video
                  </button>
                  <button
                    onClick={() => setAudioOnly(true)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition ${audioOnly ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Audio Only
                  </button>
                </div>
              </div>

              {!audioOnly ? (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Select Quality</label>
                  <select
                    value={selectedFormat}
                    onChange={e => setSelectedFormat(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
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
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Audio Encoding</label>
                  <select
                    value={audioFmt}
                    onChange={e => setAudioFmt(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
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
                className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleStartDownload}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/20 transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Start Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Drawer */}
      {showSettings && settings && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-[#0c1017] border-l border-slate-800 w-full max-w-md h-full p-6 flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-base text-slate-100">Preferences</h3>
                </div>
                <button onClick={() => setShowSettings(false)} className="p-1 text-slate-400 hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Download Directory */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Download Directory</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={settings.output_dir}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono truncate"
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
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300"
                    title="Change directory"
                  >
                    <Folder className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Concurrency limit */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-300">Max Concurrent Downloads</span>
                  <span className="text-indigo-400 font-bold">{settings.concurrency}</span>
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
                  className="w-full accent-indigo-500"
                />
              </div>

              {/* Clipboard auto detect toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Auto-Detect Clipboard URLs</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Prompt when copying media links</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.clipboard_auto_detect}
                  onChange={e => {
                    const updated = { ...settings, clipboard_auto_detect: e.target.checked };
                    setSettings(updated);
                    bridge.saveSettings(updated);
                  }}
                  className="w-4 h-4 accent-indigo-500 rounded"
                />
              </div>

              {/* Engine Updater Box */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-slate-200">Download Engine</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">v{env?.version || '2025+'}</span>
                </div>
                <p className="text-[11px] text-slate-400">If downloads on TikTok or Instagram stop working due to site updates, update the engine here.</p>
                <button
                  disabled={updatingEngine}
                  onClick={handleUpdateEngine}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${updatingEngine ? 'animate-spin' : ''}`} />
                  {updatingEngine ? 'Updating...' : 'Check & Update yt-dlp'}
                </button>
                {updateStatus && (
                  <p className="text-[11px] text-indigo-300 font-mono truncate">{updateStatus}</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => setShowSettings(false)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition"
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
