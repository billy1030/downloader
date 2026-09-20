package engine

import (
	"fmt"
	"strings"

	"omnidrop/pkg/models"
)

// BuildFormatArgs constructs yt-dlp arguments for quality selection and audio conversion
func BuildFormatArgs(opts models.DownloadOptions) []string {
	var args []string

	if opts.AudioOnly {
		args = append(args, "-x")
		audioFmt := strings.ToLower(opts.AudioFmt)
		if audioFmt == "" {
			audioFmt = "mp3"
		}
		args = append(args, "--audio-format", audioFmt)
		args = append(args, "--audio-quality", "0") // highest VBR quality
		return args
	}

	// Format selection: prefer mp4 video + any audio, fall back to bestvideo+bestaudio,
	// then any single best format. This handles YouTube (m4a audio) and Instagram (m4a DASH
	// audio) without rejecting valid streams due to codec/ext restrictions.
	res := strings.ToLower(strings.TrimSpace(opts.Resolution))
	switch res {
	case "4k", "2160p":
		args = append(args, "-f", "bestvideo[height<=2160][ext=mp4]+bestaudio/bestvideo[height<=2160]+bestaudio/best[height<=2160]/best")
	case "1440p", "2k":
		args = append(args, "-f", "bestvideo[height<=1440][ext=mp4]+bestaudio/bestvideo[height<=1440]+bestaudio/best[height<=1440]/best")
	case "1080p":
		args = append(args, "-f", "bestvideo[height<=1080][ext=mp4]+bestaudio/bestvideo[height<=1080]+bestaudio/best[height<=1080]/best")
	case "720p":
		args = append(args, "-f", "bestvideo[height<=720][ext=mp4]+bestaudio/bestvideo[height<=720]+bestaudio/best[height<=720]/best")
	case "480p":
		args = append(args, "-f", "bestvideo[height<=480][ext=mp4]+bestaudio/bestvideo[height<=480]+bestaudio/best[height<=480]/best")
	case "best", "":
		args = append(args, "-f", "bestvideo[ext=mp4]+bestaudio/bestvideo+bestaudio/best")
	default:
		// Try custom format id or custom height string
		if strings.HasSuffix(res, "p") {
			var h int
			if _, err := fmt.Sscanf(res, "%dp", &h); err == nil && h > 0 {
				args = append(args, "-f", fmt.Sprintf("bestvideo[height<=%d][ext=mp4]+bestaudio/bestvideo[height<=%d]+bestaudio/best[height<=%d]/best", h, h, h))
				break
			}
		}
		args = append(args, "-f", res)
	}

	// Merge to mp4 when separate streams are selected (requires ffmpeg)
	args = append(args, "--merge-output-format", "mp4")
	return args
}
