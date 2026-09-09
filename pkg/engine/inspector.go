package engine

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
	"strings"

	"omnidrop/pkg/models"
)

// ytDlpFormatRaw matches format objects inside yt-dlp single-json dump
type ytDlpFormatRaw struct {
	FormatID   string  `json:"format_id"`
	Ext        string  `json:"ext"`
	Resolution string  `json:"resolution"`
	Height     int     `json:"height"`
	Width      int     `json:"width"`
	Filesize   int64   `json:"filesize"`
	FilesizeApp int64  `json:"filesize_approx"`
	VCodec     string  `json:"vcodec"`
	ACodec     string  `json:"acodec"`
	TBR        float64 `json:"tbr"`
	FPS        float64 `json:"fps"`
}

type ytDlpMediaRaw struct {
	ID          string           `json:"id"`
	Title       string           `json:"title"`
	Description string           `json:"description"`
	Uploader    string           `json:"uploader"`
	Channel     string           `json:"channel"`
	Duration    float64          `json:"duration"`
	Thumbnail   string           `json:"thumbnail"`
	Formats     []ytDlpFormatRaw `json:"formats"`
}

// InspectURL queries yt-dlp to obtain JSON metadata for the media without downloading it
func InspectURL(ctx context.Context, env *Environment, rawURL string, cookies string) (*models.MediaInfo, error) {
	if env == nil || env.YtDlpPath == "" {
		return nil, fmt.Errorf("yt-dlp binary is not configured")
	}

	args := []string{
		"--dump-single-json",
		"--no-warnings",
		"--no-playlist",
		"--skip-download",
	}

	if cookies != "" {
		if strings.HasPrefix(cookies, "browser:") {
			browser := strings.TrimPrefix(cookies, "browser:")
			args = append(args, "--cookies-from-browser", browser)
		} else {
			args = append(args, "--cookies", cookies)
		}
	}

	args = append(args, rawURL)

	cmd := exec.CommandContext(ctx, env.YtDlpPath, args...)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		errOutput := strings.TrimSpace(stderr.String())
		if errOutput != "" {
			return nil, fmt.Errorf("failed inspecting URL: %s", errOutput)
		}
		return nil, fmt.Errorf("failed inspecting URL: %w", err)
	}

	var raw ytDlpMediaRaw
	if err := json.Unmarshal(stdout.Bytes(), &raw); err != nil {
		return nil, fmt.Errorf("failed decoding metadata JSON: %w", err)
	}

	platform := DetectPlatform(rawURL)
	info := &models.MediaInfo{
		ID:          raw.ID,
		URL:         rawURL,
		Platform:    platform,
		Title:       raw.Title,
		Description: raw.Description,
		Uploader:    raw.Uploader,
		Channel:     raw.Channel,
		Duration:    raw.Duration,
		Thumbnail:   raw.Thumbnail,
		Formats:     make([]models.FormatOption, 0, len(raw.Formats)),
	}

	maxHeight := 0
	for _, f := range raw.Formats {
		size := f.Filesize
		if size == 0 {
			size = f.FilesizeApp
		}

		isVideo := f.VCodec != "" && f.VCodec != "none"
		isAudio := f.ACodec != "" && f.ACodec != "none"

		if isVideo && f.Height > maxHeight {
			maxHeight = f.Height
		}

		info.Formats = append(info.Formats, models.FormatOption{
			FormatID:   f.FormatID,
			Extension:  f.Ext,
			Resolution: f.Resolution,
			Height:     f.Height,
			Width:      f.Width,
			Filesize:   size,
			VCodec:     f.VCodec,
			ACodec:     f.ACodec,
			TBR:        f.TBR,
			FPS:        f.FPS,
			IsVideo:    isVideo,
			IsAudio:    isAudio,
		})
	}

	if maxHeight > 0 {
		info.BestQuality = fmt.Sprintf("%dp", maxHeight)
	} else {
		info.BestQuality = "Original"
	}

	return info, nil
}
