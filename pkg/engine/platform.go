package engine

import (
	"net/url"
	"strings"

	"omnidrop/pkg/models"
)

// DetectPlatform matches a URL to a supported platform
func DetectPlatform(rawURL string) models.Platform {
	rawURL = strings.TrimSpace(rawURL)
	if rawURL == "" {
		return models.PlatformUnknown
	}

	u, err := url.Parse(rawURL)
	if err != nil || u.Host == "" {
		// Try prefixing with https:// if it looks like a domain (contains dot, no spaces)
		if !strings.Contains(rawURL, "://") && strings.Contains(rawURL, ".") && !strings.Contains(rawURL, " ") {
			u, err = url.Parse("https://" + rawURL)
			if err != nil {
				return models.PlatformUnknown
			}
		} else {
			return models.PlatformUnknown
		}
	}

	if u.Host == "" || !strings.Contains(u.Host, ".") {
		return models.PlatformUnknown
	}

	host := strings.ToLower(u.Host)
	if idx := strings.Index(host, ":"); idx != -1 {
		host = host[:idx]
	}

	switch {
	case strings.Contains(host, "youtube.com") || strings.Contains(host, "youtu.be"):
		return models.PlatformYouTube
	case strings.Contains(host, "tiktok.com"):
		return models.PlatformTikTok
	case strings.Contains(host, "douyin.com") || strings.Contains(host, "iesdouyin.com"):
		return models.PlatformDouyin
	case strings.Contains(host, "instagram.com") || strings.Contains(host, "instagr.am"):
		return models.PlatformInstagram
	case strings.Contains(host, "twitter.com") || strings.Contains(host, "x.com"):
		return models.PlatformTwitter
	case strings.Contains(host, "facebook.com") || strings.Contains(host, "fb.watch") || strings.Contains(host, "fb.com"):
		return models.PlatformFacebook
	default:
		if u.Scheme == "http" || u.Scheme == "https" {
			return models.PlatformGeneric
		}
		return models.PlatformUnknown
	}
}

// IsSupported returns true if the platform is known/handled
func IsSupported(rawURL string) bool {
	p := DetectPlatform(rawURL)
	return p != models.PlatformUnknown
}

// NormalizeMediaURL cleans and resolves platform-specific URLs (e.g., Douyin modal_id to video URL)
func NormalizeMediaURL(rawURL string) string {
	rawURL = strings.TrimSpace(rawURL)
	if rawURL == "" {
		return rawURL
	}

	u, err := url.Parse(rawURL)
	if err != nil {
		return rawURL
	}

	host := strings.ToLower(u.Host)
	// Handle Douyin modal_id or search URLs: e.g. modal_id=7682351689475697657
	if strings.Contains(host, "douyin.com") || strings.Contains(host, "iesdouyin.com") {
		q := u.Query()
		if modalID := q.Get("modal_id"); modalID != "" {
			return "https://www.douyin.com/video/" + modalID
		}
	}

	// Handle YouTube list parameter stripping when it's just a radio mix or individual video
	if (strings.Contains(host, "youtube.com") || strings.Contains(host, "youtu.be")) && strings.Contains(u.Path, "/watch") {
		q := u.Query()
		// If it's a radio mix (e.g., list=RD...), keep only the v parameter to prevent playlist extraction issues
		if strings.HasPrefix(q.Get("list"), "RD") && q.Get("v") != "" {
			return "https://www.youtube.com/watch?v=" + q.Get("v")
		}
	}

	return rawURL
}
