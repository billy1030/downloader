package queue

import (
	"sync"
	"testing"
	"time"

	"omnidrop/pkg/engine"
	"omnidrop/pkg/models"
)

func TestQueueLifecycle(t *testing.T) {
	env, err := engine.DetectBinaries()
	if err != nil {
		t.Skipf("Skipping live queue test: %v", err)
	}

	mgr := NewManager(env, 2)
	defer mgr.Close()

	var events []QueueEvent
	var mu sync.Mutex

	mgr.AddListener(func(evt QueueEvent) {
		mu.Lock()
		defer mu.Unlock()
		events = append(events, evt)
	})

	opts := models.DownloadOptions{
		URL:        "https://www.youtube.com/watch?v=invalid_id_testing",
		OutputDir:  t.TempDir(),
		Resolution: "720p",
	}

	task, err := mgr.AddTask(opts, "Test Task", "")
	if err != nil {
		t.Fatalf("Failed adding task: %v", err)
	}

	if task.ID == "" {
		t.Fatal("Task ID should not be empty")
	}

	tasks := mgr.GetTasks()
	if len(tasks) != 1 {
		t.Fatalf("Expected 1 task, got %d", len(tasks))
	}

	// Give it a brief moment to run and fail as invalid ID
	time.Sleep(500 * time.Millisecond)

	err = mgr.CancelTask(task.ID)
	if err != nil {
		t.Logf("Cancel note: %v", err)
	}

	err = mgr.RemoveTask(task.ID)
	if err != nil {
		t.Fatalf("Failed removing task: %v", err)
	}

	if len(mgr.GetTasks()) != 0 {
		t.Fatalf("Expected 0 tasks after removal, got %d", len(mgr.GetTasks()))
	}
}

func TestQueueConcurrencyLimit(t *testing.T) {
	mgr := NewManager(nil, 2)
	defer mgr.Close()

	if mgr.concurrency != 2 {
		t.Errorf("Expected concurrency 2, got %d", mgr.concurrency)
	}

	mgr.SetConcurrency(5)
	if mgr.concurrency != 5 {
		t.Errorf("Expected concurrency 5, got %d", mgr.concurrency)
	}
}
