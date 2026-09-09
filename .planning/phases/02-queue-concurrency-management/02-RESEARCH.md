# Phase 2: Queue & Concurrency Management - Research

**Domain:** In-memory job queue, concurrent worker pool, task states, event streaming, OS file actions
**Researched:** 2026-09-09
**Confidence:** HIGH

## Key Technical Patterns

### 1. Concurrency Worker Pool Architecture
- Queue requires thread-safe task slice protected by `sync.RWMutex`.
- Configurable worker count (channel-based semaphore `chan struct{}`).
- Task states:
  - `Queued`: In line waiting for an available worker.
  - `Downloading`: Active download with live progress.
  - `Paused`: Suspended by user.
  - `Completed`: Finished successfully.
  - `Failed`: Encountered error.
  - `Cancelled`: Terminated by user.

### 2. Live Event Broadcasting
- Support subscriber pattern: Go channels or event listeners (`RegisterListener(func(event TaskEvent))`).
- Thread-safe updates dispatched on state changes and every progress tick (throttled to max 10 updates/sec per task to avoid flooding UI event loops).

### 3. Native OS Reveal
- macOS: `exec.Command("open", "-R", filePath).Run()`
- Windows: `exec.Command("explorer", "/select,", filePath).Run()`
- Linux: `exec.Command("xdg-open", filepath.Dir(filePath)).Run()`

---
*Phase 2 research complete.*
