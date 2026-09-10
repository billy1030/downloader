//go:build windows

package engine

import (
	"os/exec"
	"strconv"
	"syscall"
)

// prepareCmdPlatform sets up Windows process execution without opening console windows
func prepareCmdPlatform(cmd *exec.Cmd) {
	if cmd.SysProcAttr == nil {
		cmd.SysProcAttr = &syscall.SysProcAttr{}
	}
	// 0x08000000 = CREATE_NO_WINDOW
	cmd.SysProcAttr.CreationFlags |= 0x08000000
	cmd.SysProcAttr.HideWindow = true
}

// killProcessGroup terminates the process on Windows
func killProcessGroup(pid int) {
	if pid > 0 {
		cmd := exec.Command("taskkill", "/F", "/T", "/PID", strconv.Itoa(pid))
		prepareCmdPlatform(cmd)
		_ = cmd.Run()
	}
}
