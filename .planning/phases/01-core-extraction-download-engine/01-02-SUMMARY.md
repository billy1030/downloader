# Plan 01-02 Summary: Media Downloader & Format Muxer

## What Was Done
1. Implemented format specifier builder (`pkg/engine/formats.go`) generating optimal adaptive video/audio stream specs for 4K, 1440p, 1080p, 720p, 480p, or audio extraction (MP3/M4A).
2. Implemented download runner (`pkg/engine/downloader.go`) wrapping `yt-dlp` and `ffmpeg` with line-by-line real-time progress parsing (`Percent`, `Speed`, `ETA`, `TotalSize`).
3. Added process group lifecycle management (`syscall.Setpgid` and `syscall.Kill(-pgid, SIGKILL)`) to eliminate zombie child processes on cancellation.
4. Built standalone CLI tool `bin/omnidrop-cli` supporting info inspection, custom resolution downloading, and audio-only extraction.

## Requirements Satisfied
- FMT-01 (Resolution selection)
- FMT-02 (Audio-only extraction)
- FMT-03 (Automatic stream muxing via ffmpeg)
