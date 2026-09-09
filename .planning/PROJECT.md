# Omnidrop Downloader

## What This Is

A fast, modern standalone desktop application built with Go and Wails v2 to download videos, audio, and playlists from TikTok, Instagram, Facebook, X (formerly Twitter), and YouTube. It combines a sleek desktop interface with an integrated hybrid download engine powered by yt-dlp and ffmpeg.

## Core Value

Reliable, one-click video and audio downloads across all major social media platforms with crisp quality selection and a real-time progress manager.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Multi-Platform URL Support: TikTok, Douyin, Instagram (Reels/Posts/Stories), Facebook, X, and YouTube (Videos/Shorts/Playlists)
- [ ] Format & Quality Engine: Resolution picker (4K, 1080p, 720p, etc.) and audio-only extraction (MP3, M4A) with auto-merging via ffmpeg
- [ ] Clipboard Auto-Detection: Instantly detects supported URLs copied to clipboard and prompts for download
- [ ] Download & Queue Manager: Concurrent downloads, pause/resume, cancel, retry, and progress status (speed, ETA, size)
- [ ] Playlist & Batch Mode: URL list parsing and bulk downloading with custom naming schemes
- [ ] Authentication & Cookie Storage: Import browser cookies or session data for private/restricted posts
- [ ] Standalone Desktop GUI: Built with Go + Wails v2, responsive modern UI, dark theme, and native OS notifications

### Out of Scope

- [ ] Mobile Apps (iOS/Android) — Initial milestone focuses strictly on desktop (macOS, Windows, Linux)
- [ ] Cloud-hosted SaaS relay / video proxy — App runs strictly client-side/standalone on the user's machine
- [ ] DRM-bypassing of protected subscription content (Netflix, Spotify, etc.) — Out of legal and technical scope

## Context

- Target operating systems: macOS, Windows, Linux
- Primary language: Go (backend core + Wails desktop bridge)
- Frontend: Modern Webview UI (TypeScript / Tailwind CSS / Lucide icons)
- Engine: Embedded/managed `yt-dlp` binary with auto-update mechanism + `ffmpeg` for post-processing/muxing

## Constraints

- **Platform rate limits & anti-bot**: Social platforms frequently update bot detection. Must support user-agent rotation, proxy options, and cookie headers.
- **Dependency bundling**: Standalone distribution should either bundle or automatically manage local downloads of `yt-dlp` and `ffmpeg` binaries.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Go backend | High concurrency, fast execution, small memory footprint, easy cross-compilation | — Pending |
| Wails v2 desktop framework | Native webview efficiency, modern UI tooling, smaller binary size than Electron | — Pending |
| Hybrid yt-dlp engine | High maintenance burden to hand-roll custom scrapers for 5 dynamic platforms; yt-dlp provides community-maintained extraction | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-09-09 after initialization*
