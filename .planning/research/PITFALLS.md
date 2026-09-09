# Pitfalls Research

**Domain:** Social Media Video Downloader  
**Researched:** 2026-09-09  
**Confidence:** HIGH  

## Critical Pitfalls & Mitigations

### 1. Platform Extractor Breakages
- **Pitfall**: TikTok, Instagram, and YouTube constantly tweak frontend endpoints and anti-scraping tokens (e.g. YouTube SABR/PoToken, Instagram GraphQL shifts).
- **Mitigation**: Implement an in-app "Update Download Engine" button that runs `yt-dlp -U` or fetches the latest GitHub release directly, without needing to recompile or update the entire desktop app.

### 2. YouTube Separate Video/Audio Streams (Adaptive Formats)
- **Pitfall**: YouTube 1080p, 1440p, and 4K streams do NOT contain audio in a single stream. If downloaded without ffmpeg, user gets a silent video file.
- **Mitigation**: Require ffmpeg for formats > 720p. Validate ffmpeg presence at startup and notify the user if remuxing capability is unavailable.

### 3. Rate Limiting & Bot Blocking (429 / 403 HTTP Errors)
- **Pitfall**: Batch downloading 50 videos from Instagram or TikTok triggers IP/session rate limits or CAPTCHAs.
- **Mitigation**:
  - Add configurable download delay between batch items (e.g. 1-3 seconds).
  - Support browser cookie import (`--cookies-from-browser` or custom cookie file).
  - Support proxy settings (HTTP/SOCKS5).

### 4. Process Leaks & Zombie Processes
- **Pitfall**: If a user cancels a download or closes the app while yt-dlp and ffmpeg are running, orphaned CLI processes will continue consuming 100% CPU.
- **Mitigation**: Bind process lifetimes to Go `context.Context`. Attach process group signals (`syscall.Kill(-pgid, syscall.SIGKILL)` on Unix) to kill the entire process tree on cancellation or app shutdown.

---
*Pitfalls research for: Omnidrop Downloader*
