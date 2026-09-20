package engine

import (
	"bytes"
	"context"
	"fmt"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

// UpdateResult details the engine update operation
type UpdateResult struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Version string `json:"version"`
}

// GetEngineVersion returns the current yt-dlp version
func GetEngineVersion(env *Environment) string {
	if env == nil || env.YtDlpPath == "" {
		return "unknown"
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, env.YtDlpPath, "--version")
	prepareCmdPlatform(cmd)
	out, err := cmd.Output()
	if err != nil {
		return "unknown"
	}
	return strings.TrimSpace(string(out))
}

// isPipInstalled returns true if yt-dlp was installed via pip (not a standalone binary)
func isPipInstalled(ytDlpPath string) bool {
	// pip-installed binaries live inside a Python framework or site-packages bin
	return strings.Contains(ytDlpPath, "Python.framework") ||
		strings.Contains(ytDlpPath, "site-packages") ||
		strings.Contains(ytDlpPath, "/Library/Python/") ||
		strings.Contains(ytDlpPath, ".local/bin")
}

// findPip attempts to locate pip3 or pip alongside the yt-dlp binary
func findPip(ytDlpPath string) string {
	dir := filepath.Dir(ytDlpPath)
	for _, name := range []string{"pip3", "pip"} {
		candidate := filepath.Join(dir, name)
		if out, err := exec.Command(candidate, "--version").Output(); err == nil {
			_ = out
			return candidate
		}
	}
	// Fallback: search PATH
	for _, name := range []string{"pip3", "pip"} {
		if p, err := exec.LookPath(name); err == nil {
			return p
		}
	}
	return ""
}

// UpdateEngine updates yt-dlp using the appropriate method (self-update or pip)
func UpdateEngine(env *Environment) UpdateResult {
	if env == nil || env.YtDlpPath == "" {
		return UpdateResult{
			Success: false,
			Message: "yt-dlp binary is not configured",
		}
	}

	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()

	// If pip-installed, use pip to update
	if isPipInstalled(env.YtDlpPath) {
		pipPath := findPip(env.YtDlpPath)
		if pipPath == "" {
			return UpdateResult{
				Success: false,
				Message: "yt-dlp is pip-installed but pip/pip3 could not be found. Run: pip3 install -U yt-dlp",
				Version: GetEngineVersion(env),
			}
		}

		cmd := exec.CommandContext(ctx, pipPath, "install", "-U", "yt-dlp")
		prepareCmdPlatform(cmd)
		var stdout, stderr bytes.Buffer
		cmd.Stdout = &stdout
		cmd.Stderr = &stderr

		err := cmd.Run()
		output := strings.TrimSpace(stdout.String() + "\n" + stderr.String())
		version := GetEngineVersion(env)

		if err != nil {
			return UpdateResult{
				Success: false,
				Message: fmt.Sprintf("pip update failed: %s", output),
				Version: version,
			}
		}
		return UpdateResult{
			Success: true,
			Message: output,
			Version: version,
		}
	}

	// Standard self-update (standalone binary)
	cmd := exec.CommandContext(ctx, env.YtDlpPath, "-U")
	prepareCmdPlatform(cmd)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	output := strings.TrimSpace(stdout.String() + "\n" + stderr.String())
	version := GetEngineVersion(env)

	if err != nil {
		// If self-update failed because it's actually pip-managed, give a hint
		if strings.Contains(output, "pip") || strings.Contains(output, "package manager") {
			return UpdateResult{
				Success: false,
				Message: "Run: pip3 install -U yt-dlp",
				Version: version,
			}
		}
		return UpdateResult{
			Success: false,
			Message: fmt.Sprintf("Update failed: %s", output),
			Version: version,
		}
	}

	return UpdateResult{
		Success: true,
		Message: output,
		Version: version,
	}
}
