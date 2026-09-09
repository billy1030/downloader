package models

// Platform represents the identified media host
type Platform string

const (
	PlatformYouTube   Platform = "youtube"
	PlatformTikTok    Platform = "tiktok"
	PlatformDouyin    Platform = "douyin"
	PlatformInstagram Platform = "instagram"
	PlatformTwitter   Platform = "x"
	PlatformFacebook  Platform = "facebook"
	PlatformGeneric   Platform = "generic"
	PlatformUnknown   Platform = "unknown"
)

// FormatOption represents an available stream/format for downloading
type FormatOption struct {
	FormatID   string  `json:"format_id"`
	Extension  string  `json:"ext"`
	Resolution string  `json:"resolution"`
	Height     int     `json:"height"`
	Width      int     `json:"width"`
	Filesize   int64   `json:"filesize"`
	VCodec     string  `json:"vcodec"`
	ACodec     string  `json:"acodec"`
	TBR        float64 `json:"tbr"`
	FPS        float64 `json:"fps"`
	IsVideo    bool    `json:"is_video"`
	IsAudio    bool    `json:"is_audio"`
}

// MediaInfo contains comprehensive metadata for a requested URL
type MediaInfo struct {
	ID          string         `json:"id"`
	URL         string         `json:"url"`
	Platform    Platform       `json:"platform"`
	Title       string         `json:"title"`
	Description string         `json:"description"`
	Uploader    string         `json:"uploader"`
	Channel     string         `json:"channel"`
	Duration    float64        `json:"duration"`
	Thumbnail   string         `json:"thumbnail"`
	Formats     []FormatOption `json:"formats"`
	BestQuality string         `json:"best_quality"`
}

// DownloadProgress represents a point-in-time progress snapshot
type DownloadProgress struct {
	Percent      float64 `json:"percent"`
	SpeedStr     string  `json:"speed_str"`
	ETAStr       string  `json:"eta_str"`
	TotalSizeStr string  `json:"total_size_str"`
	Filename     string  `json:"filename"`
	Status       string  `json:"status"` // "downloading", "processing", "finished", "error"
}

// DownloadOptions defines configuration for a download task
type DownloadOptions struct {
	URL        string
	OutputDir  string
	Resolution string // e.g. "best", "1080p", "720p", "480p"
	AudioOnly  bool   // if true, extract audio
	AudioFmt   string // "mp3", "m4a", "wav"
	Cookies    string // path to cookie file or browser name
	Proxy      string // optional proxy string
}
