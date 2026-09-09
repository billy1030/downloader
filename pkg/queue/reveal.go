package queue

import (
	"fmt"
	"os/exec"
	"path/filepath"
	"runtime"
)

// RevealInFileManager opens the host OS file explorer selecting the target file
func RevealInFileManager(path string) error {
	absPath, err := filepath.Abs(path)
	if err != nil {
		absPath = path
	}

	switch runtime.GOOS {
	case "darwin":
		return exec.Command("open", "-R", absPath).Start()
	case "windows":
		return exec.Command("explorer", "/select,", absPath).Start()
	case "linux":
		// Linux file managers vary; open directory via xdg-open
		dir := filepath.Dir(absPath)
		return exec.Command("xdg-open", dir).Start()
	default:
		return fmt.Errorf("unsupported operating system: %s", runtime.GOOS)
	}
}

// OpenFile opens the downloaded media directly with default system player
func OpenFile(path string) error {
	absPath, err := filepath.Abs(path)
	if err != nil {
		absPath = path
	}

	switch runtime.GOOS {
	case "darwin":
		return exec.Command("open", absPath).Start()
	case "windows":
		return exec.Command("cmd", "/c", "start", "", absPath).Start()
	case "linux":
		return exec.Command("xdg-open", absPath).Start()
	default:
		return fmt.Errorf("unsupported operating system: %s", runtime.GOOS)
	}
}
