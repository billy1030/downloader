# Phase 3: Wails Desktop Application & UX - Research

**Domain:** Standalone Desktop Application (Go + Wails v2 / Native Webview / UI Bridge)
**Researched:** 2026-09-09
**Confidence:** HIGH

## Key Technical Patterns

### 1. Wails v2 Architecture & Standalone Bridge
- Wails uses native WebKit (macOS) / WebView2 (Windows) embedded directly into Go binary.
- Backend Go struct methods exposed to Javascript via `Bind: []interface{}{app}`.
- Frontend talks to Go via `window.runtime` or generated bindings (`wailsjs/go/main/App`).
- Wails project structure:
  - `main.go`: entrypoint calling `wails.Run()`
  - `app.go`: application service exposing bridge methods
  - `wails.json`: config metadata
  - `frontend/`: modern web application (React, Tailwind CSS, Lucide icons)

### 2. Clipboard Auto-Monitoring
- Use a background goroutine that polls or hooks system clipboard via Go `os/exec` pbpaste (macOS) or clipboard package.
- When valid URL matching `engine.DetectPlatform(url)` is found, emit `clipboard:detected` event to frontend.

### 3. In-App Engine Self-Update
- `yt-dlp -U` updates yt-dlp to latest release.
- App exposes `CheckAndUpdateEngine()` returning status and new version tag.

---
*Phase 3 research complete.*
