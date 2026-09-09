//go:build !windows

package engine

import (
	"os/exec"
	"syscall"
)

// prepareCmdPlatform sets up Unix process group isolation for clean cancellation
func prepareCmdPlatform(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
}

// killProcessGroup kills the child process group on Unix
func killProcessGroup(pid int) {
	if pid > 0 {
		_ = syscall.Kill(-pid, syscall.SIGKILL)
	}
}
