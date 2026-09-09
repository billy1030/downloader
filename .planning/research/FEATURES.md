# Features Research

**Domain:** Universal Media Downloader Desktop App  
**Researched:** 2026-09-09  
**Confidence:** HIGH  

## Feature Categorization

### 1. Table Stakes (Must-Have or App is Incomplete)
- **Multi-Platform Support**: Full URL parsing and extraction for:
  - YouTube (Standard Videos, Shorts, Music)
  - TikTok (Watermark-free video, audio, photo slides)
  - Instagram (Reels, Feed Posts, Stories)
  - X / Twitter (Video clips, GIFs)
  - Facebook (Public videos & Reels)
- **Format & Quality Selection**:
  - Video resolution choice: Best available, 4K, 1440p, 1080p, 720p, 480p
  - Audio-only extraction: MP3, M4A, WAV with quality selection (320kbps, 192kbps)
- **Live Progress Reporting**:
  - Download percentage, current transfer speed (MB/s), ETA countdown, and file size
- **File System Integration**:
  - Configurable download destination folder
  - Open file / Show in Finder (macOS) / Explorer (Windows) actions upon completion

### 2. Differentiators (High User Value)
- **Smart Clipboard Monitor**:
  - Background clipboard watcher that automatically detects when a TikTok, YouTube, IG, X, or FB link is copied and prompts "Download this video?"
- **Download Queue & Concurrency Controls**:
  - Multi-item download queue with max concurrent job limit (e.g. 1 to 5 parallel downloads)
  - Pause, Resume, Cancel, and Retry failed downloads
- **Playlist & Batch Ingestion**:
  - Paste multiple links or whole YouTube playlists / channel tabs with selective checkbox downloading
- **Cookie & Session Management**:
  - Ability to pass cookies (via file or browser extraction) to download age-restricted or private/follower-only content
- **Engine Auto-Update / Self-Healing**:
  - One-click check and update for embedded `yt-dlp` to immediately resolve broken platform extractors without waiting for an app release

### 3. Anti-Features (Deliberately NOT Built)
- **Cloud Proxy / Server Relay**: Downloading through a remote SaaS server adds latency, hosting costs, and legal liability. Everything runs direct-to-machine.
- **DRM Decryption**: Attempting to bypass Widevine/FairPlay for Netflix/Spotify violates DMCA and is out of scope.
- **Embedded Web Browser**: We provide a dedicated clean desktop utility, not a bloated mini-browser.

---
*Features research for: Omnidrop Downloader*
