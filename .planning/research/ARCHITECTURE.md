# Architecture Research

**Domain:** Standalone Media Downloader (Go + Wails v2)  
**Researched:** 2026-09-09  
**Confidence:** HIGH  

## System Architecture Overview

```
+-------------------------------------------------------------+
|                 Frontend UI (React / Tailwind)              |
|  - URL Input Bar & Clipboard Banner                         |
|  - Quality Selector Modal (Metadata inspection)             |
|  - Active Downloads Queue & Progress Cards                  |
|  - Settings Drawer (Paths, Cookies, Concurrency, Theme)      |
+------------------------------+------------------------------+
                               | Wails Event Bus / IPC Bridge
                               v
+-------------------------------------------------------------+
|                     Go Backend Core                         |
|                                                             |
|  [App Service]               [Queue Manager]                |
|  - Window / Lifecycle        - Concurrency Worker Pool      |
|  - Config / Settings Store   - Job State (Pending/Active/   |
|  - Clipboard Watcher           Paused/Completed/Failed)     |
|                                                             |
|  [Downloader Engine]         [Binary Manager]               |
|  - yt-dlp Wrapper Process    - yt-dlp / ffmpeg detection    |
|  - JSON metadata inspector   - Local runtime cache & update |
|  - stdout progress streaming                                |
+------------------------------+------------------------------+
                               | exec.CommandContext / stdin-stdout
                               v
+-------------------------------------------------------------+
|              System CLI Processes (yt-dlp / ffmpeg)         |
|  - Media stream extraction                                  |
|  - Video/Audio muxing & transcode                           |
+-------------------------------------------------------------+
```

## Core Subsystems

### 1. Engine & Process Management
- Execute `yt-dlp --dump-single-json <url>` to fetch metadata (title, thumbnails, available video/audio formats) before downloading.
- Spawn download execution via `exec.CommandContext` using `--newline` and custom progress template `--progress-template "%(progress._percent_str)s|%(progress._speed_str)s|%(progress._eta_str)s|%(progress._total_bytes_str)s"`.
- Stream line-by-line output to parse percentage, speed, and ETA, broadcasting to frontend via `runtime.EventsEmit`.

### 2. Queue & Concurrency Architecture
- A worker pool in Go with configurable worker count (default: 3).
- Jobs maintain states: `Queued`, `FetchingInfo`, `Downloading`, `Processing` (ffmpeg muxing), `Completed`, `Paused`, `Failed`, `Cancelled`.
- Cancellation uses Go `context.WithCancel()` to cleanly kill child processes without orphaned zombies.

### 3. Binary Dependency Strategy
- On startup, check PATH for `yt-dlp` and `ffmpeg`.
- If not found or if standalone isolated mode is enabled, download official release binaries into the user's application data folder (`~/.omnidrop/bin/`).

---
*Architecture research for: Omnidrop Downloader*
