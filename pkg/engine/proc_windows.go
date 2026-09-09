//go:build windows

package engine

import (
	"os/exec"
)

// prepareCmdPlatform sets up Windows process execution
func prepareCmdPlatform(cmd *exec.Cmd) {
	// No Setpgid on Windows
}

// killProcessGroup terminates the process on Windows
func killProcessGroup(pid int) {
	if pid > 0 {
		cmd := exec.Command("taskkill", "/F", "/T", "/PID", string(rune(pid)))
		_ = cmd.Run()
	}
}
