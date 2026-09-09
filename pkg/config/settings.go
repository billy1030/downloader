package config

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
)

// AppSettings stores user preferences
type AppSettings struct {
	OutputDir           string `json:"output_dir"`
	Concurrency         int    `json:"concurrency"`
	Proxy               string `json:"proxy"`
	ClipboardAutoDetect bool   `json:"clipboard_auto_detect"`
	DefaultAudioFormat  string `json:"default_audio_format"`
	Theme               string `json:"theme"`
}

// Store handles persistence of settings
type Store struct {
	mu       sync.RWMutex
	filePath string
	settings AppSettings
}

func getDefaultOutputDir() string {
	home, err := os.UserHomeDir()
	if err == nil {
		downloads := filepath.Join(home, "Downloads")
		if _, err := os.Stat(downloads); err == nil {
			return filepath.Join(downloads, "Omnidrop")
		}
	}
	return "./downloads"
}

// NewStore initializes settings storage from ~/.omnidrop/config.json
func NewStore() *Store {
	configDir := "."
	home, err := os.UserHomeDir()
	if err == nil {
		configDir = filepath.Join(home, ".omnidrop")
		_ = os.MkdirAll(configDir, 0755)
	}

	configFile := filepath.Join(configDir, "config.json")
	store := &Store{
		filePath: configFile,
		settings: AppSettings{
			OutputDir:           getDefaultOutputDir(),
			Concurrency:         3,
			Proxy:               "",
			ClipboardAutoDetect: true,
			DefaultAudioFormat:  "mp3",
			Theme:               "dark",
		},
	}

	store.load()
	return store
}

func (s *Store) load() {
	data, err := os.ReadFile(s.filePath)
	if err == nil {
		var loaded AppSettings
		if err := json.Unmarshal(data, &loaded); err == nil {
			if loaded.OutputDir != "" {
				s.settings.OutputDir = loaded.OutputDir
			}
			if loaded.Concurrency > 0 {
				s.settings.Concurrency = loaded.Concurrency
			}
			s.settings.Proxy = loaded.Proxy
			s.settings.ClipboardAutoDetect = loaded.ClipboardAutoDetect
			if loaded.DefaultAudioFormat != "" {
				s.settings.DefaultAudioFormat = loaded.DefaultAudioFormat
			}
			if loaded.Theme != "" {
				s.settings.Theme = loaded.Theme
			}
		}
	}
	_ = os.MkdirAll(s.settings.OutputDir, 0755)
}

// Get returns current settings copy
func (s *Store) Get() AppSettings {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.settings
}

// Update saves new settings
func (s *Store) Update(newSettings AppSettings) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.settings = newSettings

	data, err := json.MarshalIndent(s.settings, "", "  ")
	if err != nil {
		return err
	}
	_ = os.MkdirAll(filepath.Dir(s.filePath), 0755)
	_ = os.MkdirAll(s.settings.OutputDir, 0755)
	return os.WriteFile(s.filePath, data, 0644)
}
