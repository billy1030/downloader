package clipboard

// Callback is invoked when a supported media URL is detected in clipboard
type Callback func(url string)

// Watcher monitors OS clipboard for media URLs (disabled)
type Watcher struct{}

// NewWatcher creates a clipboard monitor dummy
func NewWatcher(onDetect Callback) *Watcher {
	return &Watcher{}
}

// Start does nothing since clipboard monitoring is disabled
func (w *Watcher) Start() {}

// Stop does nothing since clipboard monitoring is disabled
func (w *Watcher) Stop() {}
