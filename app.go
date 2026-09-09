package main

import (
	"context"
	"fmt"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	"omnidrop/pkg/clipboard"
	"omnidrop/pkg/config"
	"omnidrop/pkg/engine"
	"omnidrop/pkg/models"
	"omnidrop/pkg/queue"
)

// App struct manages desktop lifecycle and IPC
type App struct {
	ctx          context.Context
	env          *engine.Environment
	queueMgr     *queue.Manager
	configStore  *config.Store
	clipWatcher  *clipboard.Watcher
}

// NewApp creates a new App application struct
func NewApp() *App {
	env, _ := engine.DetectBinaries()
	cfg := config.NewStore()
	settings := cfg.Get()

	mgr := queue.NewManager(env, settings.Concurrency)

	app := &App{
		env:         env,
		queueMgr:    mgr,
		configStore: cfg,
	}

	// Connect queue events to Wails frontend event bus
	mgr.AddListener(func(evt queue.QueueEvent) {
		if app.ctx != nil {
			runtime.EventsEmit(app.ctx, "queue:event", evt)
		}
	})

	// Clipboard monitor
	app.clipWatcher = clipboard.NewWatcher(func(detectedURL string) {
		if app.ctx != nil && app.configStore.Get().ClipboardAutoDetect {
			runtime.EventsEmit(app.ctx, "clipboard:detected", detectedURL)
		}
	})

	return app
}

// startup is called when the app starts
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	if a.configStore.Get().ClipboardAutoDetect {
		a.clipWatcher.Start()
	}
}

// shutdown is called at termination
func (a *App) shutdown(ctx context.Context) {
	a.clipWatcher.Stop()
	a.queueMgr.Close()
}

// GetEnvironment returns detected binary paths and versions
func (a *App) GetEnvironment() map[string]interface{} {
	version := engine.GetEngineVersion(a.env)
	return map[string]interface{}{
		"yt_dlp_path": a.env.YtDlpPath,
		"ffmpeg_path": a.env.FFmpegPath,
		"version":     version,
		"has_ytdlp":   a.env.YtDlpPath != "",
		"has_ffmpeg":  a.env.FFmpegPath != "",
	}
}

// InspectURL analyzes a URL and returns media metadata & formats
func (a *App) InspectURL(url string) (*models.MediaInfo, error) {
	if a.env == nil || a.env.YtDlpPath == "" {
		return nil, fmt.Errorf("yt-dlp is not installed or detected")
	}
	settings := a.configStore.Get()
	return engine.InspectURL(a.ctx, a.env, url, settings.CookieFile)
}

// EnqueueDownload schedules a media download
func (a *App) EnqueueDownload(url, title, thumbnail, resolution string, audioOnly bool, audioFmt string) (*queue.Task, error) {
	settings := a.configStore.Get()
	opts := models.DownloadOptions{
		URL:        url,
		OutputDir:  settings.OutputDir,
		Resolution: resolution,
		AudioOnly:  audioOnly,
		AudioFmt:   audioFmt,
		Cookies:    settings.CookieFile,
		Proxy:      settings.Proxy,
	}

	return a.queueMgr.AddTask(opts, title, thumbnail)
}

// GetTasks returns all active and historical downloads in queue
func (a *App) GetTasks() []queue.Task {
	return a.queueMgr.GetTasks()
}

// CancelTask cancels an active task
func (a *App) CancelTask(id string) error {
	return a.queueMgr.CancelTask(id)
}

// RemoveTask removes a task from view
func (a *App) RemoveTask(id string) error {
	return a.queueMgr.RemoveTask(id)
}

// RevealFile reveals file in Finder/Explorer
func (a *App) RevealFile(path string) error {
	return queue.RevealInFileManager(path)
}

// OpenFile opens file with system default player
func (a *App) OpenFile(path string) error {
	return queue.OpenFile(path)
}

// GetSettings returns current preferences
func (a *App) GetSettings() config.AppSettings {
	return a.configStore.Get()
}

// SaveSettings updates preferences
func (a *App) SaveSettings(settings config.AppSettings) error {
	err := a.configStore.Update(settings)
	if err == nil {
		a.queueMgr.SetConcurrency(settings.Concurrency)
		if settings.ClipboardAutoDetect {
			a.clipWatcher.Start()
		} else {
			a.clipWatcher.Stop()
		}
	}
	return err
}

// SelectDirectory opens native folder picker
func (a *App) SelectDirectory() (string, error) {
	return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Download Directory",
	})
}

// SelectCookieFile opens file picker for Netscape cookies.txt
func (a *App) SelectCookieFile() (string, error) {
	return runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Netscape cookies.txt file",
		Filters: []runtime.FileFilter{
			{DisplayName: "Text Files (*.txt)", Pattern: "*.txt"},
		},
	})
}

// UpdateEngine executes yt-dlp -U
func (a *App) UpdateEngine() engine.UpdateResult {
	return engine.UpdateEngine(a.env)
}
