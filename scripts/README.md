# Scammer Payback Extension - Modular Architecture

## Directory Structure

```
scripts/
├── main.js              # Main orchestrator - imports and coordinates all modules
├── core/                # Core functionality shared across all features
│   ├── config.js        # Configuration constants and banner definitions
│   ├── utils.js         # Shared utility functions for element validation
│   └── placement.js     # Main ad placement engine and insertion logic
├── sites/               # Site-specific ad placement logic
│   ├── google.js        # Google Search placement logic
│   ├── youtube.js       # YouTube placement logic (improved major sections)
│   ├── reddit.js        # Reddit placement logic
│   ├── twitter.js       # Twitter/X placement logic
│   ├── facebook.js      # Facebook placement logic
│   └── generic.js       # Generic placement for other sites
└── ui/                  # UI component management
    ├── banner.js        # Banner creation, sizing, and event handling
    └── toast.js         # Toast notification management
```

## Key Improvements

### 1. Separation of Concerns
- **Site Logic**: Each site has its own placement logic, preventing interference
- **UI Components**: Banner and toast logic separated for easier maintenance
- **Core Utilities**: Shared functions available to all modules
- **Configuration**: Centralized settings and constants

### 2. No More Interference
- YouTube logic only runs on YouTube
- Google logic only runs on Google
- Generic fallback for unknown sites
- Each module is self-contained

### 3. Better YouTube Targeting
- Fixed over-granular targeting (was finding 1,420+ individual videos)
- Now targets major content sections: `youtube-main-top`, `youtube-main-middle`, `youtube-sidebar-top`
- Respects YouTube's layout structure

### 4. Unified Banner Sizing
- `calculateOptimalBannerSize()` handles all sizing logic
- Placement-specific constraints (sidebar max 400px, main content max 1000px)
- Proper aspect ratio maintenance
- No more cut-off banners

## Module Dependencies

```
main.js
├── core/config.js
├── core/placement.js ──── sites/* (all site modules)
├── ui/banner.js ───────── core/config.js
├── ui/toast.js ────────── core/config.js
└── core/utils.js
```

## How to Add New Sites

1. Create new file in `scripts/sites/newsite.js`
2. Export function `findNewSiteAdPlacements()`
3. Import and add to `scripts/core/placement.js`
4. Follow existing pattern for element detection

## Testing

Use `test.html` to verify functionality:
1. Load extension in Chrome
2. Open `test.html`
3. Check console for "✅ Extension is working!"
4. Verify banners appear in appropriate locations

## Benefits

- **Maintainable**: Each feature is in its own file
- **Debuggable**: Easy to isolate site-specific issues
- **Scalable**: Simple to add new sites or features
- **Reliable**: No cross-site interference
- **Performance**: Only loads relevant code per site 