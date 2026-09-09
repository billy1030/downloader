# Stack Research

**Domain:** Universal Media Downloader Desktop App (Go + Wails v2)  
**Researched:** 2026-09-09  
**Confidence:** HIGH  

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Go** | 1.22+ | Backend runtime, concurrency, process execution | Native performance, goroutines for concurrent downloads, tiny memory footprint. |
| **Wails v2** | v2.9+ | Desktop application framework | Uses native webview (WebKit on macOS, WebView2 on Windows), avoiding heavy Chromium/Electron overhead (~15MB vs 150MB+). Generates TypeScript bindings from Go structs. |
| **yt-dlp** | latest release | Media extractor & video info resolver | The de-facto community gold standard extractor supporting 1000+ sites including TikTok, IG, FB, X, YouTube. Frequently updated against site breaking changes. |
| **ffmpeg / ffprobe** | 6.0+ / 7.0+ | Video/audio remuxing, transcoding, metadata | Essential for merging separate adaptive video/audio streams (1080p/4K YouTube/TikTok), thumbnail extraction, MP3 conversion. |
| **Frontend UI (React/TS + Tailwind)** | React 18+, TailwindCSS v3.4+ | Desktop UI layer | Clean reactive state management, high component ecosystem density, polished dark mode UI. |

### Supporting Libraries & Go Modules

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `golang.design/x/clipboard` | latest | Native system clipboard access & watch | Auto-detecting social media URLs copied to clipboard. |
| `github.com/wailsapp/wails/v2/pkg/runtime` | v2.9+ | Window management, events, dialogs | Native file picker dialogs, system notifications, event bus to frontend. |
| `lucide-react` | latest | Iconography | Crisp modern UI icons for media platforms, download states, status indicators. |
| `github.com/google/uuid` | v1.6+ | Unique task tracking | Generating unique queue item IDs. |

### Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Wails v2 (Go) | Tauri v2 (Rust) | When strictly requiring Rust or mobile targets (Tauri v2 supports iOS/Android). |
| Wails v2 (Go) | Fyne (Pure Go) | When avoiding webviews entirely, though Fyne offers much less flexible styling for modern rich media dashboards. |
| yt-dlp managed binary | Custom hand-written Go scrapers | Only if targeting a single, stable API. For 5 major social networks that change constantly, custom scrapers require massive weekly maintenance. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Electron | Excessively heavy binary size (~180MB+ empty) and massive RAM footprint | Wails v2 |
| Outdated `youtube-dl` | Abandoned / severely throttled by YouTube and unsupported on newer platform APIs | `yt-dlp` |
| Shelling out to raw unmanaged terminal without progress parsing | Freezes UI, provides zero feedback to user | Structured stdout parser reading yt-dlp `--newline` / JSON progress |

---
*Stack research for: Omnidrop Downloader*
