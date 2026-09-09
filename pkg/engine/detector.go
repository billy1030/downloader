package engine

import (
	"errors"
	"os/exec"
)

// Environment contains paths to detected CLI binaries
type Environment struct {
	YtDlpPath  string
	FFmpegPath string
}

// DetectBinaries checks system PATH and local directories for yt-dlp and ffmpeg
func DetectBinaries() (*Environment, error) {
	env := &Environment{}

	// Check yt-dlp
	ytPath, err := exec.LookPath("yt-dlp")
	if err == nil {
		env.YtDlpPath = ytPath
	}

	// Check ffmpeg
	ffPath, err := exec.LookPath("ffmpeg")
	if err == nil {
		env.FFmpegPath = ffPath
	}

	if env.YtDlpPath == "" {
		return env, errors.New("yt-dlp binary not found in PATH")
	}

	return env, nil
}
