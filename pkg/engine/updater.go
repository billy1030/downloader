package engine

import (
	"bytes"
	"context"
	"fmt"
	"os/exec"
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

// UpdateEngine executes yt-dlp self update (yt-dlp -U)
func UpdateEngine(env *Environment) UpdateResult {
	if env == nil || env.YtDlpPath == "" {
		return UpdateResult{
			Success: false,
			Message: "yt-dlp binary is not configured",
		}
	}

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, env.YtDlpPath, "-U")
	prepareCmdPlatform(cmd)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	output := stdout.String() + "\n" + stderr.String()
	version := GetEngineVersion(env)

	if err != nil {
		return UpdateResult{
			Success: false,
			Message: fmt.Sprintf("Update failed: %s", strings.TrimSpace(output)),
			Version: version,
		}
	}

	return UpdateResult{
		Success: true,
		Message: strings.TrimSpace(output),
		Version: version,
	}
}
