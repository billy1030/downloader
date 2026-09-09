# Requirements: Omnidrop Downloader

**Defined:** 2026-09-09  
**Core Value:** Reliable, one-click video and audio downloads across TikTok, Douyin, Instagram, Facebook, X, and YouTube with crisp quality selection and a real-time progress manager.

## v1 Requirements

Requirements for initial release, sliced into coarse delivery phases.

### Platform Extraction (PLAT)

- [x] **PLAT-01**: User can parse and extract video metadata (title, author, thumbnail, formats) from YouTube URLs (standard videos, Shorts).
- [x] **PLAT-02**: User can parse and extract media from TikTok URLs (watermark-free video, audio).
- [x] **PLAT-03**: User can parse and extract media from Douyin URLs (videos, slide notes, audio).
- [x] **PLAT-04**: User can parse and extract media from Instagram URLs (Reels, Feed video/photo posts).
- [x] **PLAT-05**: User can parse and extract media from X (Twitter) URLs.
- [x] **PLAT-06**: User can parse and extract media from Facebook public video/Reel URLs.

### Format & Conversion (FMT)

- [x] **FMT-01**: User can select target video resolution (Best, 4K, 1440p, 1080p, 720p, 480p).
- [x] **FMT-02**: User can select audio-only extraction format (MP3, M4A) with bitrate control.
- [x] **FMT-03**: Engine automatically muxes separate video and audio streams via ffmpeg seamlessly.

### Queue & Download Management (QMAN)

- [x] **QMAN-01**: User can queue multiple downloads with configurable concurrency limit.
- [x] **QMAN-02**: User sees real-time progress for each active download (progress bar, speed in MB/s, ETA, downloaded/total size).
- [x] **QMAN-03**: User can pause, resume, cancel, and remove downloads from the queue.
- [x] **QMAN-04**: User can click to open the completed file or reveal it in the operating system file manager (Finder / Explorer).

### Desktop UI & Automation (DESK)

- [ ] **DESK-01**: Standalone desktop window interface built with Go and Wails v2 with polished dark mode theme.
- [ ] **DESK-02**: Automatic clipboard monitor that detects supported media links and offers instant one-click download.
- [ ] **DESK-03**: Settings view to configure default download directory, max concurrent downloads, and proxy settings.
- [ ] **DESK-04**: In-app one-click check and update mechanism for the embedded yt-dlp engine to withstand platform breakages.

## v2 Requirements

Deferred to future release.

### Batch & Playlists
- **BATCH-01**: Full YouTube playlist / channel ingestion with multi-select checkboxes.
- **BATCH-02**: Bulk URL file import (.txt / .csv).

### Advanced Authentication
- **AUTH-01**: Browser cookie extraction helper or cookie file import for private/age-gated Instagram & Facebook content.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Cloud relay proxy | Standalone client app; no external server hosting or proxy bandwidth costs |
| DRM-protected platform decryption | Widevine/FairPlay decryption (Netflix, Spotify, Apple TV) is out of legal scope |
| Mobile apps (iOS/Android) | Scope strictly desktop (macOS, Windows, Linux) |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLAT-01 | Phase 1 | Complete |
| PLAT-02 | Phase 1 | Complete |
| PLAT-03 | Phase 1 | Complete |
| PLAT-04 | Phase 1 | Complete |
| PLAT-05 | Phase 1 | Complete |
| PLAT-06 | Phase 1 | Complete |
| FMT-01 | Phase 1 | Complete |
| FMT-02 | Phase 1 | Complete |
| FMT-03 | Phase 1 | Complete |
| QMAN-01 | Phase 2 | Complete |
| QMAN-02 | Phase 2 | Complete |
| QMAN-03 | Phase 2 | Complete |
| QMAN-04 | Phase 2 | Complete |
| DESK-01 | Phase 3 | Pending |
| DESK-02 | Phase 3 | Pending |
| DESK-03 | Phase 3 | Pending |
| DESK-04 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---
*Requirements defined: 2026-09-09*
