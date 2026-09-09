package main

import (
	"context"
	"flag"
	"fmt"
	"os"

	"omnidrop/pkg/config"
	"omnidrop/pkg/engine"
	"omnidrop/pkg/models"
)

func main() {
	inspectOnly := flag.Bool("info", false, "Inspect URL metadata without downloading")
	audioOnly := flag.Bool("audio", false, "Extract audio only (MP3)")
	resolution := flag.String("res", "best", "Target resolution (best, 1080p, 720p, 480p)")
	outDir := flag.String("out", "./downloads", "Output directory")
	cookies := flag.String("cookies", "", "Path to cookies.txt file (or defaults to configured cookie file)")
	flag.Parse()

	args := flag.Args()
	if len(args) == 0 {
		fmt.Println("Usage: omnidrop-cli [options] <URL>")
		flag.PrintDefaults()
		os.Exit(1)
	}
	targetURL := args[0]

	env, err := engine.DetectBinaries()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}

	platform := engine.DetectPlatform(targetURL)
	fmt.Printf("[Omnidrop] Platform detected: %s\n", platform)

	ctx := context.Background()

	if *inspectOnly {
		fmt.Printf("[Omnidrop] Inspecting metadata for: %s ...\n", targetURL)
		cookieFile := *cookies
		if cookieFile == "" {
			cookieFile = config.NewStore().Get().CookieFile
		}
		info, err := engine.InspectURL(ctx, env, targetURL, cookieFile)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Inspect error: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("Title:    %s\n", info.Title)
		fmt.Printf("Author:   %s\n", info.Uploader)
		fmt.Printf("Duration: %.0fs\n", info.Duration)
		fmt.Printf("Max Res:  %s\n", info.BestQuality)
		fmt.Printf("Formats:  %d available\n", len(info.Formats))
		return
	}

	cookieFile := *cookies
	if cookieFile == "" {
		cookieFile = config.NewStore().Get().CookieFile
	}

	opts := models.DownloadOptions{
		URL:        targetURL,
		OutputDir:  *outDir,
		Resolution: *resolution,
		AudioOnly:  *audioOnly,
		Cookies:    cookieFile,
	}

	fmt.Printf("[Omnidrop] Starting download to %s (Res: %s, AudioOnly: %v)...\n", *outDir, *resolution, *audioOnly)
	err = engine.Download(ctx, env, opts, func(p models.DownloadProgress) {
		if p.Status == "finished" {
			fmt.Printf("\n[Omnidrop] Download complete!\n")
		} else {
			fmt.Printf("\r[Omnidrop] Progress: %5.1f%% | Speed: %10s | ETA: %6s | Size: %10s",
				p.Percent, p.SpeedStr, p.ETAStr, p.TotalSizeStr)
		}
	})

	if err != nil {
		fmt.Fprintf(os.Stderr, "\nDownload failed: %v\n", err)
		os.Exit(1)
	}
}
