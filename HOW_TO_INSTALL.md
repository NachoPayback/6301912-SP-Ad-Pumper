# 🎯 SP Extension - Installation Guide

## 📁 Project Structure

```
Like+Subscribe/
├── 📁 extension/          ← THE CHROME EXTENSION (select this folder)
│   ├── manifest.json      ← Main extension file
│   ├── config.json        ← Extension settings
│   ├── scripts/           ← Extension code
│   ├── background/        ← Background worker
│   ├── assets/           ← Icons and banner images
│   └── styles/           ← Extension CSS
│
├── 📁 management/         ← DASHBOARD & TOOLS (for you to use)
│   ├── web-dashboard/     ← User management dashboard
│   └── docs/             ← Documentation
│
├── 📁 development/        ← Development files (ignore)
│   ├── test-*.html        ← Test files
│   ├── package-extension.js ← Packaging script
│   ├── backups/          ← File backups
│   └── config-for-github.json ← GitHub config
│
├── 📄 HOW_TO_INSTALL.md   ← This installation guide
└── 📄 *.md files          ← Documentation files
```

## 🔧 How to Install the Extension

1. **Open Chrome** → Navigate to `chrome://extensions/`
2. **Enable "Developer mode"** (toggle in top right)
3. **Click "Load unpacked"**
4. **Select the `extension/` folder** ⭐ (NOT the root folder)
5. **Extension loads** - you'll see "Enhanced Browsing Assistant" in your extensions

## 🖥️ How to Use the Dashboard

1. **Navigate to**: `management/web-dashboard/`
2. **Double-click**: `index.html`
3. **Opens in browser** - shows your extension users and analytics
4. **Monitor**: Real users, ad interactions, enable/disable per user

## ⚡ Key Features

- **Real email collection** from Chrome users
- **Supabase analytics** tracking all ad interactions  
- **Concurrent ad limits** (max banners/toasts at once)
- **Per-user controls** (enable/disable specific users)
- **Live dashboard** showing active users and stats

## 🎯 What Each Part Does

**Extension (`extension/` folder):**
- Runs on websites users visit
- Shows ads (banners, toasts, preroll videos)
- Collects user emails and tracks interactions
- Sends data to your Supabase database

**Dashboard (`management/web-dashboard/`):**
- Shows all extension users in real-time
- Displays ad view/click statistics
- Allows per-user enable/disable control
- Set concurrent ad limits globally

## 🚀 Ready to Test

After installation, visit any website and you should see:
- Console message: `✅ Supabase initialized (embedded)`
- Email collection prompt after 10 seconds
- Ads appearing based on your config settings

Check the dashboard to see users and analytics flowing in! 