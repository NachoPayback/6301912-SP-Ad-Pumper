# 🚀 GitHub Remote Configuration Setup

This guide walks you through setting up remote configuration for your Scammer Payback Chrome extension using GitHub as the backend.

## 📋 **Prerequisites**

- GitHub account
- Basic understanding of JSON
- Chrome extension with remote config code installed

---

## 🛠️ **Step 1: Create GitHub Repository**

### **1.1 Create Repository**
1. Go to GitHub and create a new repository
2. Name it: `scammer-payback-config` (or your preferred name)
3. Set it to **Public** (required for free raw file access)
4. Add a README if desired

### **1.2 Repository Structure**
Create this folder structure in your repo:
```
scammer-payback-config/
├── config.json              # Main configuration file
├── banners/                  # Banner ad images
│   ├── medium_rectangle.png  # 300x250
│   ├── leaderboard.png       # 728x90
│   ├── wide_skyscraper.png   # 160x600
│   └── mobile_banner.png     # 320x50
└── README.md                 # Documentation
```

---

## 📝 **Step 2: Create Configuration File**

### **2.1 Upload config.json**
Copy the example configuration and create `config.json` in your repo root:

```json
{
  "version": "1.2.0",
  "enabled": true,
  "lastUpdated": "2024-01-15T10:30:00Z",
  "features": {
    "preroll": true,
    "banners": true,
    "toast": true
  },
  "preroll": {
    "enabled": true,
    "videoId": "YV0NfxtK0n0",
    "chance": 0.4,
    "skipDelay": 5000,
    "minDuration": 10000,
    "title": "Help Fight Scammers!",
    "description": "Watch how we take down scammer operations"
  },
  "banners": {
    "enabled": true,
    "baseUrl": "https://raw.githubusercontent.com/YOUR_USERNAME/scammer-payback-config/main/banners",
    "types": [
      {
        "size": "300x250",
        "file": "medium_rectangle.png",
        "chance": 0.35,
        "priority": 1
      },
      {
        "size": "728x90",
        "file": "leaderboard.png",
        "chance": 0.30,
        "priority": 2
      }
    ],
    "rotationTime": 45000,
    "fadeTransition": true
  },
  "toast": {
    "enabled": true,
    "displayTime": 8000,
    "position": "bottom-right",
    "messages": [
      {
        "id": "subscribe_main",
        "icon": "🛡️",
        "title": "Fight Back Against Scammers!",
        "subtitle": "Subscribe to Scammer Payback",
        "weight": 5
      }
    ]
  },
  "targeting": {
    "enabledDomains": ["*"],
    "disabledDomains": [
      "banking.example.com",
      "secure-payment.example.com"
    ],
    "enabledOnYouTube": true,
    "enabledOnGoogle": true
  },
  "urls": {
    "channel": "https://www.youtube.com/c/ScammerPayback?sub_confirmation=1",
    "website": "https://scammerpayback.com"
  }
}
```

**⚠️ Important**: Replace `YOUR_USERNAME` with your actual GitHub username!

### **2.2 Upload Banner Images**
1. Create `banners/` folder in your repo
2. Upload your banner images with exact filenames from config
3. Recommended sizes:
   - `medium_rectangle.png` - 300x250px
   - `leaderboard.png` - 728x90px  
   - `wide_skyscraper.png` - 160x600px
   - `mobile_banner.png` - 320x50px

---

## ⚙️ **Step 3: Update Extension Code**

### **3.1 Update Repository URL**
Edit `scripts/core/remote-config.js` line 11:

```javascript
this.baseUrl = 'https://raw.githubusercontent.com/YOUR_USERNAME/scammer-payback-config/main';
```

Replace `YOUR_USERNAME` with your GitHub username.

### **3.2 Reload Extension**
1. Go to `chrome://extensions/`
2. Click "Reload" on your extension
3. Test on any website

---

## 🧪 **Step 4: Testing & Verification**

### **4.1 Console Testing**
Open browser console (F12) and run:

```javascript
// Test configuration loading
SPGetConfig().then(config => console.log('Config loaded:', config));

// Test preroll config
SPGetPrerollConfig().then(config => console.log('Preroll config:', config));

// Test banner config  
SPGetBannerConfig().then(config => console.log('Banner config:', config));

// Force refresh config
window.SPRemoteConfig.forceRefresh().then(config => console.log('Fresh config:', config));
```

### **4.2 Check Network Tab**
1. Open Developer Tools → Network tab
2. Refresh page
3. Look for request to `raw.githubusercontent.com`
4. Verify it returns your config.json

---

## 🔧 **Step 5: Managing Configuration**

### **5.1 Quick Updates via GitHub Web Interface**
1. Go to your repository
2. Click on `config.json`
3. Click the pencil icon (Edit)
4. Make changes
5. Commit directly to main branch
6. Changes take effect within 5 minutes (cache expiry)

### **5.2 Common Updates**

#### **Enable/Disable Extension**
```json
{
  "enabled": false  // Disables entire extension
}
```

#### **Toggle Features**
```json
{
  "features": {
    "preroll": false,    // Disable pre-roll ads
    "banners": true,     // Keep banners
    "toast": true        // Keep toast notifications
  }
}
```

#### **Update Pre-roll Video**
```json
{
  "preroll": {
    "videoId": "NEW_YOUTUBE_VIDEO_ID",
    "chance": 0.5,       // 50% chance to show
    "skipDelay": 3000    // 3 second skip delay
  }
}
```

#### **Block Specific Domains**
```json
{
  "targeting": {
    "disabledDomains": [
      "banking.example.com",
      "payment-processor.com",
      "sensitive-site.org"
    ]
  }
}
```

---

## 📊 **Step 6: Advanced Features**

### **6.1 A/B Testing**
```json
{
  "a_b_tests": {
    "preroll_frequency": {
      "enabled": true,
      "variants": {
        "control": { "chance": 0.3, "weight": 0.5 },
        "increased": { "chance": 0.5, "weight": 0.5 }
      }
    }
  }
}
```

### **6.2 Session Limits**
```json
{
  "limits": {
    "maxToastsPerSession": 3,
    "maxBannersPerPage": 2,
    "cooldownBetweenToasts": 300000
  }
}
```

### **6.3 Multiple Toast Messages**
```json
{
  "toast": {
    "messages": [
      {
        "id": "subscribe",
        "icon": "🛡️",
        "title": "Fight Back Against Scammers!",
        "subtitle": "Subscribe to Scammer Payback",
        "weight": 5
      },
      {
        "id": "new_video",
        "icon": "🎬", 
        "title": "New Scammer Takedown!",
        "subtitle": "Watch the latest investigation",
        "weight": 3
      }
    ]
  }
}
```

---

## 🚨 **Troubleshooting**

### **Config Not Loading**
1. Check browser console for errors
2. Verify GitHub repo is public
3. Check URL in `remote-config.js` matches your repo
4. Ensure `config.json` is in repo root

### **Images Not Displaying**
1. Verify image files are in `banners/` folder
2. Check filenames match exactly (case-sensitive)
3. Ensure images are web-compatible (PNG, JPG, WebP)

### **Changes Not Applying**
1. Wait 5 minutes for cache to expire
2. Use `window.SPRemoteConfig.forceRefresh()` in console
3. Reload extension in `chrome://extensions/`

### **CORS Errors**
- GitHub raw files don't have CORS issues
- If using different CDN, ensure CORS headers are set

---

## 🎯 **Best Practices**

### **1. Version Control**
- Always update `version` field when making changes
- Use semantic versioning (1.0.0 → 1.0.1 → 1.1.0)

### **2. Gradual Rollouts**
- Test changes with low `chance` values first
- Gradually increase after confirming functionality

### **3. Backup Strategy**
- Keep previous config versions as git tags
- Document major changes in commit messages

### **4. Monitoring**
- Check browser console logs regularly
- Monitor user feedback for issues

### **5. Security**
- Never include sensitive data in public repo
- Use environment-specific configs if needed

---

## 🔗 **URLs You'll Need**

- **Config URL**: `https://raw.githubusercontent.com/YOUR_USERNAME/scammer-payback-config/main/config.json`
- **Banner Base URL**: `https://raw.githubusercontent.com/YOUR_USERNAME/scammer-payback-config/main/banners`
- **Repo Management**: `https://github.com/YOUR_USERNAME/scammer-payback-config`

---

## 🎉 **You're All Set!**

Your Chrome extension now pulls configuration from GitHub! 

**Benefits:**
- ✅ Update settings without releasing new extension versions
- ✅ A/B test different configurations
- ✅ Emergency disable capabilities
- ✅ Centralized asset management
- ✅ Version controlled changes

**Need help?** Check the console logs or create an issue in your config repository. 