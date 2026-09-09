# Phase 1: Core Extraction & Download Engine - Research

**Domain:** Media extraction & format downloading using Go, yt-dlp, and ffmpeg
**Researched:** 2026-09-09
**Confidence:** HIGH

## Key Technical Patterns

### 1. yt-dlp Metadata Extraction (`--dump-single-json`)
To fetch video details without downloading:
```bash
yt-dlp --dump-single-json --no-warnings --flat-playlist <URL>
```
Output JSON contains:
- `id`, `title`, `description`, `thumbnail`
- `uploader` / `channel`
- `duration` (seconds)
- `formats`: array of format items containing `format_id`, `ext`, `resolution`, `filesize` or `filesize_approx`, `vcodec`, `acodec`, `tbr`, `fps`.

### 2. Format Selection Specifiers
- **Best Video with Audio (muxed if separate)**:
  `bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best`
- **Target Resolution (e.g. 1080p, 720p)**:
  `bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=1080]+bestaudio/best[height<=1080]`
- **Audio Only (MP3 extraction with ffmpeg)**:
  `-x --audio-format mp3 --audio-quality 0` (or `--audio-quality 320k`)

### 3. Execution & Real-Time Progress Parsing
Run with:
```bash
yt-dlp --newline --progress-template "%(progress._percent_str)s|%(progress._speed_str)s|%(progress._eta_str)s|%(progress._total_bytes_str)s|%(progress.filename)s" ...
```
Go reads stdout using `bufio.Scanner` scanning line-by-line, parsing pipe-delimited tokens into progress callbacks.

### 4. Process Context & Cleanup
In Go:
```go
cmd := exec.CommandContext(ctx, binaryPath, args...)
// Unix process group termination to prevent zombie ffmpeg/yt-dlp child processes:
cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
```

---
*Phase 1 research complete.*
