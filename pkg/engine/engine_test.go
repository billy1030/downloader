package engine

import (
	"strings"
	"testing"

	"omnidrop/pkg/models"
)

func TestDetectPlatform(t *testing.T) {
	tests := []struct {
		url      string
		expected models.Platform
	}{
		{"https://www.youtube.com/watch?v=dQw4w9WgXcQ", models.PlatformYouTube},
		{"https://youtu.be/dQw4w9WgXcQ", models.PlatformYouTube},
		{"https://youtube.com/shorts/abcdef123", models.PlatformYouTube},
		{"https://www.tiktok.com/@user/video/1234567890", models.PlatformTikTok},
		{"https://www.douyin.com/video/7123456789", models.PlatformDouyin},
		{"https://v.douyin.com/iABCxyz/", models.PlatformDouyin},
		{"https://www.instagram.com/reel/C123456789/", models.PlatformInstagram},
		{"https://x.com/username/status/1234567890", models.PlatformTwitter},
		{"https://twitter.com/username/status/1234567890", models.PlatformTwitter},
		{"https://www.facebook.com/watch/?v=123456789", models.PlatformFacebook},
		{"https://fb.watch/abcdef/", models.PlatformFacebook},
		{"https://vimeo.com/123456", models.PlatformGeneric},
		{"invalid-string", models.PlatformUnknown},
	}

	for _, tc := range tests {
		got := DetectPlatform(tc.url)
		if got != tc.expected {
			t.Errorf("DetectPlatform(%q) = %v; want %v", tc.url, got, tc.expected)
		}
	}
}

func TestDetectBinaries(t *testing.T) {
	env, err := DetectBinaries()
	if err != nil {
		t.Fatalf("DetectBinaries failed: %v", err)
	}
	if env.YtDlpPath == "" {
		t.Error("Expected YtDlpPath to be non-empty")
	}
	t.Logf("Detected yt-dlp: %s, ffmpeg: %s", env.YtDlpPath, env.FFmpegPath)
}

func TestBuildFormatArgs(t *testing.T) {
	optsVideo := models.DownloadOptions{
		Resolution: "1080p",
		AudioOnly:  false,
	}
	args := BuildFormatArgs(optsVideo)
	foundFormat := false
	for i, a := range args {
		if a == "-f" && i+1 < len(args) {
			foundFormat = true
			if !strings.Contains(args[i+1], "1080") {
				t.Errorf("Expected 1080 in format string, got %s", args[i+1])
			}
		}
	}
	if !foundFormat {
		t.Error("Did not find -f argument in video format args")
	}

	optsAudio := models.DownloadOptions{
		AudioOnly: true,
		AudioFmt:  "mp3",
	}
	audioArgs := BuildFormatArgs(optsAudio)
	foundAudio := false
	for i, a := range audioArgs {
		if a == "--audio-format" && i+1 < len(audioArgs) && audioArgs[i+1] == "mp3" {
			foundAudio = true
		}
	}
	if !foundAudio {
		t.Error("Did not find --audio-format mp3 in audio format args")
	}
}
