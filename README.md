# Omnidrop

<div align="center">
  <img src="./frontend/public/appicon.png" width="128" height="128" alt="Omnidrop Logo" style="border-radius: 28px;" />
  <h3>Modern, Fast, Standalone Social Media Downloader for macOS</h3>
  <p>Engineered with Go 1.26, Wails v2, React 18, and TailwindCSS.</p>
</div>

---

> [!IMPORTANT]
> **Educational and Personal Research Disclaimer**
> 
> Omnidrop is created strictly for **educational, experimental, and personal learning purposes**. It serves as an architectural demonstration of integrating high-performance Go backend worker queues with modern embedded web technology (Wails v2) and open-source media extraction pipelines.
> 
> Users must respect the Terms of Service and Intellectual Property rights of all platforms and content creators. Do not use this tool to download copyrighted material without proper authorization.

---

## 🌟 Key Features

- **Multi-Platform Support**: Direct parsing and downloading for **TikTok**, **抖音 (Douyin)**, **Instagram**, **X (Twitter)**, **YouTube**, and **Facebook**.
- **Smart URL Normalization**: Automatically extracts canonical video IDs from complex search modal URLs (e.g. Douyin `/jingxuan/search/nova?modal_id=...`) and strips radio mix playlist pollution.
- **Concurrent Queue System**:
  - Independent worker pool with configurable concurrency (default: 3 simultaneous downloads).
  - Clean pause, resume, cancel, and dismiss actions.
  - Retains download history with quick **"Recent 5"** and **"All"** views.
  - Direct **"Open"** and **"Show in Finder"** actions upon download completion.
- **JavaScript Challenge Solver**: Automatically hooks into system Node.js (`node`) for solving YouTube client signature and SABR bot detection challenges.
- **Beautiful macOS UI**:
  - 3 Crafted Themes: **Day** (Default), **Night**, and **Warm**.
  - Non-overlapping safe-area padding (`pl-[110px]`) designed specifically for macOS traffic lights (🔴 🟡 🟢).
  - Background clipboard auto-detection banner.

---

## 🍪 Managing Authentication & Cookies

Some platforms (such as YouTube with bot verification or age/member-restricted media) require valid session cookies to stream content. Omnidrop provides two methods to supply cookies:

### Method 1: Direct 1-Click Browser Session (Recommended)

Omnidrop can read session cookies directly from your local browser without needing to export files:
1. In Omnidrop, click the **Settings (Gear icon)** in the top right corner.
2. Under **Authentication / Cookies**, click any of the quick preset buttons:
   - `🌐 Chrome`
   - `🦁 Brave`
   - `🌊 Edge`
   - `🧭 Safari`
3. Omnidrop will automatically extract the session token for the target URL directly from your browser profile.

---

### Method 2: Exporting Netscape `cookies.txt` Locally

If you prefer using an isolated cookie file:

#### Step 1: Install a Cookie Exporter Extension
Use an open-source, local-only Chrome / Firefox extension such as:
- **Get cookies.txt LOCALLY** ([Chrome Web Store](https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc))

> [!TIP]
> Ensure you use extensions that operate strictly on-device without sending cookie data to third-party servers.

#### Step 2: Export Cookies for the Desired Site
1. Log in to the service in your browser (e.g. [YouTube](https://www.youtube.com)).
2. Open the **Get cookies.txt LOCALLY** extension from your browser toolbar.
3. Click **Export** to save a file named `www.youtube.com_cookies.txt`.
4. *Important note on YouTube bot checks*: Because YouTube frequently rotates session tokens (`__Secure-1PSIDTS` / `__Secure-3PSIDTS`), ensure you do not log out of your browser session after exporting.

#### Step 3: Load Cookies into Omnidrop
1. Open Omnidrop **Settings**.
2. Click **Select .txt** under **Authentication / Cookies**.
3. Pick your exported `.txt` file. The path will be saved in `~/.omnidrop/config.json`.

---

## 🛠️ Prerequisites & Installation

### Requirements
- **macOS** (Apple Silicon arm64 or Intel x86_64)
- **Go**: `1.22+` (Go 1.26 recommended)
- **Node.js**: `v18+` (via Homebrew: `brew install node`)
- **FFmpeg**: (via Homebrew: `brew install ffmpeg`)
- **yt-dlp**: (via Homebrew or pip: `brew install yt-dlp`)

### Building from Source

```bash
# 1. Clone repository
git clone https://github.com/your-repo/omnidrop.git
cd omnidrop

# 2. Compile frontend and desktop binary
make build

# 3. Launch application
./bin/Omnidrop
```

Or run the CLI test script directly:
```bash
# Test metadata inspection
./bin/omnidrop-cli -info "https://www.youtube.com/watch?v=..."

# Download audio (MP3)
./bin/omnidrop-cli -audio -out ./downloads "https://www.douyin.com/video/..."
```

---

## 📜 License & Acknowledgements

- Powered by [yt-dlp](https://github.com/yt-dlp/yt-dlp) and [FFmpeg](https://ffmpeg.org/).
- Built with [Wails](https://wails.io/).
- Released under the MIT License for educational purposes.
