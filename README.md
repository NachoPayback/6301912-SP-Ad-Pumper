# Simple Ad Extension - LOCAL VERSION

**Simplified Chrome extension that shows local ads on websites.**

## What It Does
- **Banner Ads**: Shows banner images at random positions
- **Preroll Videos**: Overlays YouTube videos before real videos play  
- **Toast Notifications**: Pop-up notifications in bottom-right corner

## Features
- ✅ **LOCAL ONLY** - No remote servers or databases
- ✅ **Simple Configuration** - Hard-coded settings in main.js
- ✅ **Works Offline** - Uses local banner image files
- ✅ **No Permissions Issues** - Minimal Chrome permissions needed

## Installation
1. Open Chrome: `chrome://extensions/`
2. Enable **Developer Mode** (top-right toggle)
3. Click **Load Unpacked**
4. Select the `extension/` folder
5. Extension will start showing ads immediately

## Files Structure
```
extension/
├── manifest.json         # Extension configuration
├── background/
│   └── background.js     # Minimal background script
├── scripts/
│   └── main.js          # Main ad insertion logic
├── assets/
│   ├── banners/         # Local banner image files
│   └── icon*.png        # Extension icons
└── styles/
    └── styles.css       # Basic styling
```

## Configuration
Edit `scripts/main.js` to change:
- Ad frequency and timing
- Banner sizes and positions  
- Toast message content
- Preroll video settings

## Current Settings
- **Banners**: Max 2 concurrent, rotate every 45 seconds
- **Toasts**: Max 1 concurrent, every minute
- **Preroll**: 40% chance on video pages

**Ready to use immediately!** 