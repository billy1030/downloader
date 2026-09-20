package engine

import (
	"bytes"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

// PlayURL streams the given social-media URL directly using ffplay.
// For single-file formats it runs:   ffplay <direct-url>
// For DASH (separate video+audio):   ffmpeg -i <video> -i <audio> -f matroska pipe:1 | ffplay -
//
// DetectPlayer returns "ffplay" when ffplay is available, "" otherwise.

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

// findFfplay returns the path to ffplay, deriving it from ffmpegPath when
// possible so the user only needs to have one tool configured.
func findFfplay(ffmpegPath string) string {
	// 1. Sibling of the configured ffmpeg binary
	if ffmpegPath != "" {
		candidate := filepath.Join(filepath.Dir(ffmpegPath), "ffplay")
		if _, err := os.Stat(candidate); err == nil {
			return candidate
		}
	}
	// 2. PATH
	if p, err := exec.LookPath("ffplay"); err == nil {
		return p
	}
	// 3. Homebrew / common locations
	for _, p := range []string{
		"/opt/homebrew/bin/ffplay",
		"/usr/local/bin/ffplay",
	} {
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}
	return ""
}

// DetectPlayer returns "ffplay" when ffplay is available, "" otherwise.
// It intentionally ignores env so the caller can call it before env is ready.
func DetectPlayer() string {
	if findFfplay("") != "" {
		return "ffplay"
	}
	return ""
}

// HasPlayer returns true when ffplay is available (using the configured ffmpeg
// path as a hint). This is what GetEnvironment exposes to the frontend.
func HasPlayer(env *Environment) bool {
	var ffmpegPath string
	if env != nil {
		ffmpegPath = env.FFmpegPath
	}
	return findFfplay(ffmpegPath) != ""
}

// ---------------------------------------------------------------------------
// URL resolution
// ---------------------------------------------------------------------------

// resolveStreamURLs calls yt-dlp -g to get direct CDN HTTP URL(s).
// Returns one URL for single-file formats, two for DASH (video + audio).
// Falls back to []string{pageURL} on any error.
func resolveStreamURLs(env *Environment, pageURL string) []string {
	if env == nil || env.YtDlpPath == "" {
		return []string{pageURL}
	}

	args := []string{
		"-g",
		"-f", "best/bestvideo+bestaudio",
		"--no-playlist",
		"--no-warnings",
		pageURL,
	}
	if env.FFmpegPath != "" {
		args = append(args, "--ffmpeg-location", env.FFmpegPath)
	}

	var out bytes.Buffer
	cmd := exec.Command(env.YtDlpPath, args...)
	cmd.Stdout = &out
	if err := cmd.Run(); err != nil {
		return []string{pageURL}
	}

	var urls []string
	for _, line := range strings.Split(strings.TrimSpace(out.String()), "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "http") {
			urls = append(urls, line)
		}
	}
	if len(urls) == 0 {
		return []string{pageURL}
	}
	return urls
}

// ---------------------------------------------------------------------------
// Playback
// ---------------------------------------------------------------------------

// PlayURL resolves the given social-media URL and streams it in ffplay.
// On Darwin the player window opens without a Dock icon bounce (detached).
func PlayURL(env *Environment, rawURL string) error {
	ffmpegPath := ""
	if env != nil {
		ffmpegPath = env.FFmpegPath
	}

	ffplayPath := findFfplay(ffmpegPath)
	if ffplayPath == "" {
		return fmt.Errorf("ffplay not found — it ships with ffmpeg (brew install ffmpeg)")
	}

	url := NormalizeMediaURL(rawURL)
	streamURLs := resolveStreamURLs(env, url)

	if len(streamURLs) == 1 {
		// ── Single stream ────────────────────────────────────────────────────
		cmd := exec.Command(ffplayPath,
			"-autoexit",        // quit when playback ends
			"-loglevel", "quiet",
			streamURLs[0],
		)
		prepareCmdPlatform(cmd)
		return cmd.Start()
	}

	// ── DASH: separate video + audio ─────────────────────────────────────────
	// Chain:  ffmpeg -i <video> -i <audio> -c copy -f matroska pipe:1
	//                                                      ↓
	//         ffplay -i -   (reads matroska from stdin)
	videoURL := streamURLs[0]
	audioURL := streamURLs[1]

	ffmpegBin := ffmpegPath
	if ffmpegBin == "" {
		ffmpegBin, _ = exec.LookPath("ffmpeg")
		if ffmpegBin == "" {
			ffmpegBin = filepath.Join(filepath.Dir(ffplayPath), "ffmpeg")
		}
	}

	muxer := exec.Command(ffmpegBin,
		"-loglevel", "quiet",
		"-i", videoURL,
		"-i", audioURL,
		"-c:v", "copy",
		"-c:a", "copy",
		"-f", "matroska", // container that ffplay can decode from a pipe
		"pipe:1",
	)
	player := exec.Command(ffplayPath,
		"-autoexit",
		"-loglevel", "quiet",
		"-",
	)

	// Wire muxer stdout → player stdin via an OS pipe
	pr, pw, err := os.Pipe()
	if err != nil {
		return fmt.Errorf("pipe: %w", err)
	}
	muxer.Stdout = pw

	// Capture muxer stderr so errors don't appear in the app window
	muxer.Stderr = io.Discard
	player.Stdin = pr
	player.Stderr = io.Discard

	prepareCmdPlatform(muxer)
	prepareCmdPlatform(player)

	if err := muxer.Start(); err != nil {
		pr.Close()
		pw.Close()
		return fmt.Errorf("ffmpeg: %w", err)
	}
	if err := player.Start(); err != nil {
		pr.Close()
		pw.Close()
		muxer.Process.Kill()
		return fmt.Errorf("ffplay: %w", err)
	}

	// Close write-end in parent so ffplay sees EOF when ffmpeg finishes
	pw.Close()

	// Reap both processes in the background so they don't become zombies
	go func() {
		_ = muxer.Wait()
		pr.Close()
	}()
	go func() { _ = player.Wait() }()

	return nil
}

// osName is used by callers that need to know the runtime (kept for
// compatibility with prepareCmdPlatform which lives in detector.go).
var osName = runtime.GOOS
