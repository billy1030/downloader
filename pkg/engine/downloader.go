package engine

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"

	"omnidrop/pkg/models"
)

// ProgressFunc is called whenever download metrics update
type ProgressFunc func(progress models.DownloadProgress)

// Download executes yt-dlp to download media matching options and streams progress
func Download(ctx context.Context, env *Environment, opts models.DownloadOptions, onProgress ProgressFunc) error {
	if env == nil || env.YtDlpPath == "" {
		return fmt.Errorf("yt-dlp binary is not configured")
	}

	outDir := opts.OutputDir
	if outDir == "" {
		outDir = "."
	}
	if err := os.MkdirAll(outDir, 0755); err != nil {
		return fmt.Errorf("failed creating output directory: %w", err)
	}

	outputTemplate := filepath.Join(outDir, "%(title)s [%(id)s].%(ext)s")

	// Progress delimiter format: PERCENT|SPEED|ETA|SIZE|FILENAME
	progressTemplate := "%(progress._percent_str)s|%(progress._speed_str)s|%(progress._eta_str)s|%(progress._total_bytes_str)s|%(progress.filename)s"

	args := []string{
		"--newline",
		"--no-colors",
		"--progress-template", progressTemplate,
		"--print", "after_move:FINAL_PATH:%(filepath)s",
		"-o", outputTemplate,
	}

	if env.NodePath != "" {
		args = append(args, "--js-runtimes", fmt.Sprintf("node:%s", env.NodePath))
	}

	// Cookies
	if opts.Cookies != "" {
		if strings.HasPrefix(opts.Cookies, "browser:") {
			args = append(args, "--cookies-from-browser", strings.TrimPrefix(opts.Cookies, "browser:"))
		} else {
			args = append(args, "--cookies", opts.Cookies)
		}
	}

	// Proxy
	if opts.Proxy != "" {
		args = append(args, "--proxy", opts.Proxy)
	}

	// Formats & FFmpeg options
	args = append(args, BuildFormatArgs(opts)...)

	// Target URL
	cleanURL := NormalizeMediaURL(opts.URL)
	args = append(args, cleanURL)

	cmd := exec.CommandContext(ctx, env.YtDlpPath, args...)
	prepareCmdPlatform(cmd)

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return fmt.Errorf("failed creating stdout pipe: %w", err)
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return fmt.Errorf("failed creating stderr pipe: %w", err)
	}

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed starting yt-dlp: %w", err)
	}

	// Monitor cancellation and kill process group
	done := make(chan struct{})
	defer close(done)

	go func() {
		select {
		case <-ctx.Done():
			if cmd.Process != nil && cmd.Process.Pid > 0 {
				killProcessGroup(cmd.Process.Pid)
			}
		case <-done:
		}
	}()

	var finalFilePath string

	scanner := bufio.NewScanner(stdout)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}

		if strings.HasPrefix(line, "FINAL_PATH:") {
			finalFilePath = strings.TrimPrefix(line, "FINAL_PATH:")
			continue
		}

		parts := strings.Split(line, "|")
		if len(parts) >= 5 {
			pctStr := strings.Trim(strings.TrimSpace(parts[0]), "%")
			pct, _ := strconv.ParseFloat(pctStr, 64)
			speed := strings.TrimSpace(parts[1])
			eta := strings.TrimSpace(parts[2])
			totalSize := strings.TrimSpace(parts[3])
			fname := filepath.Base(strings.TrimSpace(parts[4]))

			if onProgress != nil {
				onProgress(models.DownloadProgress{
					Percent:      pct,
					SpeedStr:     speed,
					ETAStr:       eta,
					TotalSizeStr: totalSize,
					Filename:     fname,
					Status:       "downloading",
				})
			}
		}
	}

	var errBuf strings.Builder
	errScanner := bufio.NewScanner(stderr)
	for errScanner.Scan() {
		errBuf.WriteString(errScanner.Text() + "\n")
	}

	if err := cmd.Wait(); err != nil {
		if ctx.Err() != nil {
			return ctx.Err()
		}
		return fmt.Errorf("download error: %s (%w)", strings.TrimSpace(errBuf.String()), err)
	}

	if onProgress != nil {
		onProgress(models.DownloadProgress{
			Percent:  100.0,
			Filename: filepath.Base(finalFilePath),
			Status:   "finished",
		})
	}

	return nil
}
