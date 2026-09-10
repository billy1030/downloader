package engine

import (
	"errors"
	"os"
	"os/exec"
	"path/filepath"
)

// Environment contains paths to detected CLI binaries
type Environment struct {
	YtDlpPath  string
	FFmpegPath string
	NodePath   string
}

// DetectBinaries checks system PATH and local directories for yt-dlp, ffmpeg, and node
func DetectBinaries() (*Environment, error) {
	env := &Environment{}

	// Check yt-dlp
	ytPath, err := exec.LookPath("yt-dlp")
	if err == nil {
		env.YtDlpPath = ytPath
	} else {
		// Common Windows fallbacks
		home, _ := os.UserHomeDir()
		candidates := []string{
			filepath.Join(home, "AppData", "Local", "Microsoft", "WindowsApps", "yt-dlp.exe"),
			filepath.Join(home, "scoop", "shims", "yt-dlp.exe"),
			`C:\ProgramData\chocolatey\bin\yt-dlp.exe`,
		}
		wingetBase := filepath.Join(home, "AppData", "Local", "Microsoft", "WinGet", "Packages")
		if entries, err := filepath.Glob(filepath.Join(wingetBase, "*yt-dlp*", "yt-dlp.exe")); err == nil && len(entries) > 0 {
			candidates = append([]string{entries[0]}, candidates...)
		}
		for _, c := range candidates {
			if _, err := os.Stat(c); err == nil {
				env.YtDlpPath = c
				break
			}
		}
	}

	// Check ffmpeg
	ffPath, err := exec.LookPath("ffmpeg")
	if err == nil {
		env.FFmpegPath = ffPath
	} else {
		home, _ := os.UserHomeDir()
		candidates := []string{
			filepath.Join(home, "scoop", "shims", "ffmpeg.exe"),
			`C:\ProgramData\chocolatey\bin\ffmpeg.exe`,
		}
		// Also scan winget Gyan.FFmpeg package folder
		wingetBase := filepath.Join(home, "AppData", "Local", "Microsoft", "WinGet", "Packages")
		if entries, err := filepath.Glob(filepath.Join(wingetBase, "*FFmpeg*", "ffmpeg-*", "bin", "ffmpeg.exe")); err == nil && len(entries) > 0 {
			candidates = append(candidates, entries[0])
		}
		for _, c := range candidates {
			if _, err := os.Stat(c); err == nil {
				env.FFmpegPath = c
				break
			}
		}
	}

	// Check node for JS challenge solving
	nodePath, err := exec.LookPath("node")
	if err == nil {
		env.NodePath = nodePath
	} else if _, err := exec.Command("/opt/homebrew/bin/node", "--version").Output(); err == nil {
		env.NodePath = "/opt/homebrew/bin/node"
	}

	if env.YtDlpPath == "" {
		return env, errors.New("yt-dlp binary not found in PATH")
	}

	return env, nil
}
