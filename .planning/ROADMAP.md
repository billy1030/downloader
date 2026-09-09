# Roadmap: Omnidrop Downloader

## Overview

Omnidrop Downloader is built in 3 coarse phases from the ground up: starting with the core Go downloader engine that parses metadata and executes downloads with ffmpeg merging across TikTok, Instagram, Facebook, X, and YouTube; followed by the concurrent download queue and lifecycle manager; concluding with the standalone Wails v2 desktop user interface, clipboard watcher, and dynamic binary updater.

## Phases

- [x] **Phase 1: Core Extraction - [ ] **Phase 1: Core Extraction & Download Engine** Download Engine** - Go backend wrapper over yt-dlp & ffmpeg with multi-platform URL inspection and quality remuxing
- [ ] **Phase 2: Queue & Concurrency Management** - Worker pool, job states, live progress streaming, pause/resume, and file system integration
- [ ] **Phase 3: Wails Desktop Application & UX** - Native desktop window, modern dark-mode frontend, clipboard auto-detection, and engine self-updater

## Phase Details

### Phase 1: Core Extraction & Download Engine
**Goal**: Build a rock-solid Go engine that validates URLs, inspects video/audio streams via yt-dlp JSON dumping, and executes downloads with ffmpeg remuxing.
**Depends on**: Nothing (first phase)
**Requirements**: PLAT-01, PLAT-02, PLAT-03, PLAT-04, PLAT-05, PLAT-06, FMT-01, FMT-02, FMT-03
**Success Criteria** (what must be TRUE):
  1. Engine correctly parses URLs and extracts titles, thumbnails, and format lists for YouTube, TikTok, Douyin, Instagram, X, and Facebook.
  2. Engine downloads high-resolution video (1080p/4K) and automatically merges separate audio streams with ffmpeg.
  3. Engine supports audio-only extraction (MP3/M4A) with clean metadata tagging.
**Plans**: 2 plans

Plans:
- [x] 01-01: Engine foundation: yt-dlp/ffmpeg detection, URL validator, and JSON metadata extractor
- [x] 01-02: Media downloader: format selection builder, execution process runner, and output file management

### Phase 2: Queue & Concurrency Management
**Goal**: Create a robust multi-task download manager with live speed/ETA tracking, cancellation, and concurrency limits.
**Depends on**: Phase 1
**Requirements**: QMAN-01, QMAN-02, QMAN-03, QMAN-04
**Success Criteria** (what must be TRUE):
  1. Multiple download jobs can be queued with configurable concurrency (e.g. 2 parallel downloads).
  2. Stdout from downloader processes streams live percent, transfer speed, and ETA metrics to the job manager.
  3. Jobs can be paused, resumed, or cancelled without leaving orphaned child processes.
  4. Completed downloads can be revealed directly in the host OS file manager (Finder / Explorer).
**Plans**: 2 plans

Plans:
- [ ] 02-01: Concurrency queue worker pool, job state machine, and process context cancellation
- [ ] 02-02: Real-time progress parser, status event broadcasting, and OS file reveal handlers

### Phase 3: Wails Desktop Application & UX
**Goal**: Package the entire system into a standalone desktop application with a modern dark-mode GUI, clipboard auto-detection, and engine updater.
**Depends on**: Phase 2
**Requirements**: DESK-01, DESK-02, DESK-03, DESK-04
**Success Criteria** (what must be TRUE):
  1. Desktop application launches as a standalone native window powered by Wails v2.
  2. Frontend provides a premium dark-themed dashboard showing active downloads, quality selector, and download history.
  3. Clipboard monitor auto-detects copied media links and triggers a quick-download modal.
  4. User can trigger an in-app check and update of the yt-dlp engine.
**Plans**: 2 plans

Plans:
- [ ] 03-01: Wails v2 project setup, Go-to-Frontend IPC binding, clipboard watcher, and updater service
- [ ] 03-02: Modern desktop UI implementation (React/Tailwind), quality modal, queue cards, and settings drawer

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Core Extraction | 1. Core Extraction & Download Engine | 0/2 | Not started | - | Download Engine | 2/2 | Complete | 2026-09-09 |
| 2. Queue & Concurrency Management | 0/2 | Not started | - |
| 3. Wails Desktop Application & UX | 0/2 | Not started | - |

---
*Roadmap created: 2026-09-09*
