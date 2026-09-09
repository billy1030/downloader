package queue

import (
	"context"
	"fmt"
	"path/filepath"
	"sync"
	"time"

	"omnidrop/pkg/engine"
	"omnidrop/pkg/models"
)

// EventListener is invoked on task lifecycle and progress events
type EventListener func(event QueueEvent)

// Manager coordinates concurrent downloads, worker queue, and state
type Manager struct {
	mu           sync.RWMutex
	tasks        []*Task
	env          *engine.Environment
	concurrency  int
	sem          chan struct{}
	listeners    []EventListener
	listenersMu  sync.Mutex
	ctx          context.Context
	cancelAll    context.CancelFunc
}

// NewManager creates a queue manager with the given concurrency limit
func NewManager(env *engine.Environment, concurrency int) *Manager {
	if concurrency <= 0 {
		concurrency = 3
	}
	ctx, cancel := context.WithCancel(context.Background())
	m := &Manager{
		tasks:       make([]*Task, 0),
		env:         env,
		concurrency: concurrency,
		sem:         make(chan struct{}, concurrency),
		listeners:   make([]EventListener, 0),
		ctx:         ctx,
		cancelAll:   cancel,
	}
	return m
}

// AddListener registers an event subscriber
func (m *Manager) AddListener(l EventListener) {
	m.listenersMu.Lock()
	defer m.listenersMu.Unlock()
	m.listeners = append(m.listeners, l)
}

func (m *Manager) emit(evt QueueEvent) {
	m.listenersMu.Lock()
	defer m.listenersMu.Unlock()
	for _, l := range m.listeners {
		go l(evt)
	}
}

// SetConcurrency dynamically updates the maximum active workers
func (m *Manager) SetConcurrency(n int) {
	if n <= 0 {
		return
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	m.concurrency = n
	m.sem = make(chan struct{}, n)
}

// AddTask enqueues a new download job
func (m *Manager) AddTask(opts models.DownloadOptions, title, thumbnail string) (*Task, error) {
	m.mu.Lock()
	id := fmt.Sprintf("task-%d", time.Now().UnixNano())
	task := &Task{
		ID:        id,
		URL:       opts.URL,
		Title:     title,
		Thumbnail: thumbnail,
		Platform:  engine.DetectPlatform(opts.URL),
		Options:   opts,
		Status:    StatusQueued,
		CreatedAt: time.Now(),
	}
	m.tasks = append(m.tasks, task)
	m.mu.Unlock()

	m.emit(QueueEvent{Type: "task_added", Task: *task})
	go m.processNext()
	return task, nil
}

// GetTasks returns a snapshot of all tasks
func (m *Manager) GetTasks() []Task {
	m.mu.RLock()
	defer m.mu.RUnlock()
	out := make([]Task, len(m.tasks))
	for i, t := range m.tasks {
		out[i] = *t
	}
	return out
}

// GetTask returns a single task by ID
func (m *Manager) GetTask(id string) (*Task, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	for _, t := range m.tasks {
		if t.ID == id {
			copy := *t
			return &copy, true
		}
	}
	return nil, false
}

// CancelTask terminates an active or pending task
func (m *Manager) CancelTask(id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	for _, t := range m.tasks {
		if t.ID == id {
			if t.cancel != nil {
				t.cancel()
			}
			t.Status = StatusCancelled
			m.emit(QueueEvent{Type: "task_updated", Task: *t})
			return nil
		}
	}
	return fmt.Errorf("task %s not found", id)
}

// RemoveTask removes a finished, cancelled, or failed task from the queue
func (m *Manager) RemoveTask(id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	idx := -1
	for i, t := range m.tasks {
		if t.ID == id {
			idx = i
			if t.cancel != nil {
				t.cancel()
			}
			break
		}
	}

	if idx == -1 {
		return fmt.Errorf("task %s not found", id)
	}

	removed := *m.tasks[idx]
	m.tasks = append(m.tasks[:idx], m.tasks[idx+1:]...)
	m.emit(QueueEvent{Type: "task_removed", Task: removed})
	return nil
}

// processNext checks queued tasks and runs them if concurrency permits
func (m *Manager) processNext() {
	m.mu.Lock()
	var next *Task
	for _, t := range m.tasks {
		if t.Status == StatusQueued {
			next = t
			break
		}
	}
	m.mu.Unlock()

	if next == nil {
		return
	}

	select {
	case m.sem <- struct{}{}:
		// Acquired worker slot
		go func(t *Task) {
			defer func() {
				<-m.sem
				m.processNext()
			}()
			m.runTask(t)
		}(next)
	default:
		// All worker slots are currently busy
		return
	}
}

func (m *Manager) runTask(t *Task) {
	ctx, cancel := context.WithCancel(m.ctx)

	m.mu.Lock()
	// If task was cancelled while queued
	if t.Status == StatusCancelled {
		m.mu.Unlock()
		cancel()
		return
	}
	t.Status = StatusDownloading
	t.cancel = cancel
	m.mu.Unlock()

	m.emit(QueueEvent{Type: "task_updated", Task: *t})

	lastProgressUpdate := time.Now()
	err := engine.Download(ctx, m.env, t.Options, func(p models.DownloadProgress) {
		m.mu.Lock()
		t.Progress = p
		if p.Filename != "" {
			t.OutputPath = filepath.Join(t.Options.OutputDir, p.Filename)
		}
		m.mu.Unlock()

		// Throttle progress events to max 10 updates per second per task
		if time.Since(lastProgressUpdate) > 100*time.Millisecond || p.Status == "finished" {
			lastProgressUpdate = time.Now()
			m.emit(QueueEvent{Type: "progress", Task: *t})
		}
	})

	m.mu.Lock()
	defer m.mu.Unlock()

	now := time.Now()
	t.CompletedAt = &now
	t.cancel = nil

	if err != nil {
		if ctx.Err() != nil {
			t.Status = StatusCancelled
		} else {
			t.Status = StatusFailed
			t.Error = err.Error()
		}
	} else {
		t.Status = StatusCompleted
		t.Progress.Percent = 100.0
	}

	m.emit(QueueEvent{Type: "task_updated", Task: *t})
}

// Close gracefully stops the manager and cancels all running tasks
func (m *Manager) Close() {
	m.cancelAll()
}
