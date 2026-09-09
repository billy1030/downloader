package engine

import (
	"errors"
	"os/exec"
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
	}

	// Check ffmpeg
	ffPath, err := exec.LookPath("ffmpeg")
	if err == nil {
		env.FFmpegPath = ffPath
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
