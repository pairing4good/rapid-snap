# 📸 Rapid Snap

**Capture photos at lightning speed.** Snap multiple shots back-to-back without delay, then edit and upload. Perfect for fast-moving moments. Built with React + Vite.

## Quick Start

```bash
# 1. Install
npm install

# 2. Start server
npm run dev

# 3. Open Network URL on phone (e.g., https://192.168.1.100:8443/)
#    Accept security warning - safe for local development
```

**Done!** Grant camera permission and start taking photos.

---

## Features

⚡ **Rapid-fire capture** - shoot continuously without delay • 🎨 6 filters • 🔧 Brightness/Contrast/Saturation • ✂️ Crop • 🔄 Reset • 📱 Mobile & Desktop

---

## Setup Details

### Requirements
- Node.js 16+ ([download](https://nodejs.org/))
- Phone and computer on same WiFi network

### Find Your IP Address

**Mac:** `ifconfig | grep "inet " | grep -v 127.0.0.1`  
**Windows:** `ipconfig` (look for IPv4 like `192.168.x.x`)  
**Linux:** `hostname -I`

### Connect from Phone

1. Same WiFi network as computer
2. Open browser → `https://YOUR_IP:8443/`
3. Accept security warning (safe for local dev)
4. Allow camera permissions

---

## Usage

**Capture:** Tap ⚪ to shoot instantly → Keep tapping for rapid-fire shots → "Done" when finished  
**Gallery:** Tap ❌ to delete or tap photo to edit  
**Edit:** Apply filters, adjust sliders, crop, or reset  
**Upload:** Implement backend in `src/App.jsx`

---

## Troubleshooting

**Camera denied:** Check browser permissions, ensure HTTPS  
**Can't connect:** Verify same WiFi, correct IP address  
**Security warning:** Normal for self-signed cert, safe to bypass  
**Port in use:** Change port in `vite.config.js`

---

## Deploy to GitHub Pages

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for full instructions.

**Quick:** Push to GitHub → Enable Pages → Live at `https://username.github.io/repo-name/`

---

## Development

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run deploy   # Deploy to GitHub Pages
```

---

## Project Structure

```
rapid-snap/
├── src/
│   ├── App.jsx              # Main app & state management
│   └── components/
│       ├── CameraView.jsx   # Camera interface
│       ├── GalleryView.jsx  # Photo gallery
│       └── EditorView.jsx   # Photo editor with filters
├── vite.config.js           # Vite config with HTTPS
└── package.json
```

---

**Tech:** React 18 • Vite • Canvas API • MediaDevices API • Self-signed SSL
