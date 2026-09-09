package clipboard

import (
	"context"
	"os/exec"
	"runtime"
	"strings"
	"sync"
	"time"

	"omnidrop/pkg/engine"
)

// Callback is invoked when a supported media URL is detected in clipboard
type Callback func(url string)

// Watcher monitors OS clipboard for media URLs
type Watcher struct {
	mu       sync.Mutex
	lastText string
	active   bool
	cancel   context.CancelFunc
	onDetect Callback
}

// NewWatcher creates a clipboard monitor
func NewWatcher(onDetect Callback) *Watcher {
	return &Watcher{
		onDetect: onDetect,
	}
}

func readClipboard() (string, error) {
	switch runtime.GOOS {
	case "darwin":
		cmd := exec.Command("pbpaste")
		out, err := cmd.Output()
		return string(out), err
	case "windows":
		cmd := exec.Command("powershell", "-command", "Get-Clipboard")
		out, err := cmd.Output()
		return string(out), err
	case "linux":
		cmd := exec.Command("xclip", "-selection", "clipboard", "-o")
		out, err := cmd.Output()
		return string(out), err
	default:
		return "", nil
	}
}

// Start begins the polling loop (every 1 second)
func (w *Watcher) Start() {
	w.mu.Lock()
	if w.active {
		w.mu.Unlock()
		return
	}
	ctx, cancel := context.WithCancel(context.Background())
	w.cancel = cancel
	w.active = true
	w.mu.Unlock()

	go func() {
		ticker := time.NewTicker(1 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				text, err := readClipboard()
				if err != nil {
					continue
				}
				text = strings.TrimSpace(text)
				if text == "" {
					continue
				}

				w.mu.Lock()
				isNew := text != w.lastText
				if isNew {
					w.lastText = text
				}
				w.mu.Unlock()

				if isNew && engine.IsSupported(text) {
					if w.onDetect != nil {
						w.onDetect(text)
					}
				}
			}
		}
	}()
}

// Stop stops the watcher
func (w *Watcher) Stop() {
	w.mu.Lock()
	defer w.mu.Unlock()
	if w.cancel != nil {
		w.cancel()
		w.active = false
	}
}
