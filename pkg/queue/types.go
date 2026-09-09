package queue

import (
	"context"
	"time"

	"omnidrop/pkg/models"
)

// Status defines current state of a task
type Status string

const (
	StatusQueued      Status = "queued"
	StatusDownloading Status = "downloading"
	StatusCompleted   Status = "completed"
	StatusPaused      Status = "paused"
	StatusFailed      Status = "failed"
	StatusCancelled   Status = "cancelled"
)

// Task represents a queued or active download item
type Task struct {
	ID          string                  `json:"id"`
	URL         string                  `json:"url"`
	Title       string                  `json:"title"`
	Thumbnail   string                  `json:"thumbnail"`
	Platform    models.Platform         `json:"platform"`
	Options     models.DownloadOptions  `json:"options"`
	Status      Status                  `json:"status"`
	Progress    models.DownloadProgress `json:"progress"`
	Error       string                  `json:"error,omitempty"`
	OutputPath  string                  `json:"output_path,omitempty"`
	CreatedAt   time.Time               `json:"created_at"`
	CompletedAt *time.Time              `json:"completed_at,omitempty"`

	// Runtime cancellation handle
	cancel context.CancelFunc
}

// QueueEvent is emitted on any status or progress change
type QueueEvent struct {
	Type string `json:"type"` // "task_added", "task_updated", "task_removed", "progress"
	Task Task   `json:"task"`
}
