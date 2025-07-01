# Scammer Payback Promoter Chrome Extension

A Chrome extension that generates promotional banners to help grow the Scammer Payback community and fight against scammers.

## Features

- 🛡️ **Unobtrusive banners** that appear in corners of websites
- ⚙️ **Customizable settings** for frequency and display time
- 🎯 **Smart positioning** alternating between top-right and bottom-right
- 📱 **Responsive design** that works on all screen sizes
- 🔒 **Privacy-focused** with no data collection
- ✨ **Smooth animations** and modern UI design

## Installation

### Method 1: Developer Mode (Recommended)

1. **Download the extension files** to a folder on your computer
2. **Open Chrome** and go to `chrome://extensions/`
3. **Enable Developer mode** by toggling the switch in the top-right corner
4. **Click "Load unpacked"** and select the folder containing the extension files
5. **Pin the extension** by clicking the puzzle piece icon and pinning "Scammer Payback Promoter"

### Method 2: Chrome Web Store (Future)
*This extension could be published to the Chrome Web Store for easier installation.*

## How It Works

The extension uses intelligent site-specific ad placement logic:

- **Site-aware placement** - different logic for Google, YouTube, Reddit, Twitter, Facebook, and generic sites
- **Safe ad locations** - never interferes with navigation, search boxes, or UI elements
- **Random rotation** - every 25 seconds, randomly shows either:
  - **2 banner ads** (70% chance) - placed in proper ad locations only
  - **1 corner toast** (30% chance) - text notification in screen corner
- **6 different banner sizes** - uses standard web advertising formats (160x600, 300x250, 320x50, 336x280, 728x90, 970x250)
- **Google-specific logic** - prioritizes right sidebar, creates dedicated ad areas if needed
- **Proper document flow** - banners are part of page content, not overlays
- **Actual ad sizing** - banners display at their true pixel dimensions
- **Persistent presence** - if closed, new content appears within seconds
- **Click-to-subscribe** functionality that opens Scammer Payback's channel

## Settings

Access settings by clicking the extension icon in your browser toolbar:

- **Enable/Disable** the extension
- **Banner Frequency** (10% - 80% chance)
- **Display Duration** (3-15 seconds)
- **Cooldown Time** (1-10 minutes)

## File Structure

```
├── manifest.json          # Extension manifest
├── content.js            # Main content script
├── styles.css           # Banner styles
├── background.js        # Background service worker
├── popup.html          # Settings popup HTML
├── popup.js            # Settings popup JavaScript
├── assets/             # Extension icons
└── README.md          # This file
```

## Customization

### Changing the Promoted Channel

To promote a different channel, edit the `scammerPaybackUrl` in `content.js`:

```javascript
scammerPaybackUrl: 'https://www.youtube.com/c/YourChannel?sub_confirmation=1'
```

### Modifying Banner Appearance

Edit `styles.css` to change:
- Colors and gradients
- Size and positioning
- Animation effects
- Typography

### Adjusting Behavior

Modify `content.js` to change:
- Display probability
- Timing settings
- Banner messages
- Positioning logic

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Permissions**: `activeTab`, `storage`
- **Content Script**: Runs on all URLs
- **Background Script**: Service worker for settings management
- **Storage**: Chrome sync storage for settings

## Browser Compatibility

- ✅ **Chrome** 88+ (Manifest V3)
- ✅ **Edge** 88+ (Chromium-based)
- ✅ **Brave** (Chromium-based)
- ❌ **Firefox** (uses different manifest format)
- ❌ **Safari** (uses different extension system)

## Privacy & Security

- **No data collection** - extension works entirely locally
- **No external requests** - only opens YouTube when clicked
- **Minimal permissions** - only needs tab access and storage
- **Open source** - all code is visible and auditable

## Development

### Testing

1. Load the extension in developer mode
2. Visit any website (except YouTube)
3. Banners should appear based on probability settings
4. Test the settings popup by clicking the extension icon

### Debugging

1. Open Chrome DevTools on any page
2. Check the Console tab for any errors
3. Use `localStorage.getItem('spPromoterLastShown')` to check timing
4. Force a banner by running `localStorage.removeItem('spPromoterLastShown')` and reloading

## Contributing

To improve this extension:

1. Fork the project
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

This project is provided as-is for educational and promotional purposes. Feel free to modify and distribute while respecting YouTube's terms of service.

## Disclaimer

This extension is not officially associated with Scammer Payback. It's a fan-made tool to help promote the channel and support the fight against scammers.

---

**Help fight scammers by supporting Scammer Payback! 🛡️** 