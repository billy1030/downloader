package engine

import (
	"fmt"
	"os"
	"os/exec"
	"runtime"
)

// playerInfo describes a detected media player
type playerInfo struct {
	name string // "mpv", "iina", "vlc"
	path string // executable path
}

// detectPlayerInfo returns the best available media player
func detectPlayerInfo() *playerInfo {
	// mpv: works on all platforms, best yt-dlp integration
	if p, err := exec.LookPath("mpv"); err == nil {
		return &playerInfo{"mpv", p}
	}
	for _, p := range []string{"/opt/homebrew/bin/mpv", "/usr/local/bin/mpv"} {
		if _, err := os.Stat(p); err == nil {
			return &playerInfo{"mpv", p}
		}
	}

	if runtime.GOOS == "darwin" {
		// IINA
		if _, err := os.Stat("/Applications/IINA.app"); err == nil {
			return &playerInfo{"iina", "/Applications/IINA.app"}
		}
		// VLC
		if _, err := os.Stat("/Applications/VLC.app"); err == nil {
			return &playerInfo{"vlc", "/Applications/VLC.app"}
		}
	}
	return nil
}

// DetectPlayer returns "mpv", "iina", "vlc", or "" if none found
func DetectPlayer() string {
	p := detectPlayerInfo()
	if p == nil {
		return ""
	}
	return p.name
}

// PlayURL opens the given URL in the best available media player for streaming
func PlayURL(env *Environment, rawURL string) error {
	player := detectPlayerInfo()
	if player == nil {
		return fmt.Errorf("no supported media player found — install mpv, IINA, or VLC")
	}

	url := NormalizeMediaURL(rawURL)

	switch player.name {
	case "mpv":
		args := []string{}
		if env != nil && env.YtDlpPath != "" {
			args = append(args, fmt.Sprintf("--ytdl-path=%s", env.YtDlpPath))
		}
		args = append(args, url)
		cmd := exec.Command(player.path, args...)
		prepareCmdPlatform(cmd)
		return cmd.Start()

	case "iina":
		// Use iina-cli if available, else open -a IINA
		iinaCliPath := "/Applications/IINA.app/Contents/MacOS/iina-cli"
		if _, err := os.Stat(iinaCliPath); err == nil {
			args := []string{url}
			if env != nil && env.YtDlpPath != "" {
				args = append([]string{"--mpv-ytdl-path=" + env.YtDlpPath}, args...)
			}
			cmd := exec.Command(iinaCliPath, args...)
			prepareCmdPlatform(cmd)
			return cmd.Start()
		}
		// Fallback: open -a IINA
		cmd := exec.Command("open", "-a", "IINA", url)
		prepareCmdPlatform(cmd)
		return cmd.Start()

	case "vlc":
		// open -a VLC is the most reliable on macOS
		cmd := exec.Command("open", "-a", "VLC", url)
		prepareCmdPlatform(cmd)
		return cmd.Start()
	}

	return fmt.Errorf("unknown player: %s", player.name)
}
