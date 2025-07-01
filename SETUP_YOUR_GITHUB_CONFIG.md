# 🚀 Quick Setup for Your GitHub Config

Your extension is now configured to use: **https://github.com/NachoPayback/6301912-SP-Ad-Pumper**

## ⚡ **Next Steps (5 minutes)**

### **1. Upload Configuration File**
1. Go to your repository: [https://github.com/NachoPayback/6301912-SP-Ad-Pumper](https://github.com/NachoPayback/6301912-SP-Ad-Pumper)
2. Click **"Add file"** → **"Create new file"**
3. Name it: `config.json`
4. Copy and paste the contents from `config-for-github.json` (in your local folder)
5. Click **"Commit new file"**

### **2. Upload Banner Images**
1. In your repository, click **"Add file"** → **"Upload files"**
2. Create a folder called `banners/` 
3. Upload these banner images with exact names:
   - `medium_rectangle.png` (300x250px)
   - `leaderboard.png` (728x90px)
   - `wide_skyscraper.png` (160x600px)
   - `mobile_banner.png` (320x50px)

### **3. Test Your Setup**
1. Go to `chrome://extensions/`
2. Click **"Reload"** on your Scammer Payback extension
3. Visit any website
4. Open browser console (F12) and look for:
   ```
   SP: Loading remote configuration...
   SP: Remote config loaded successfully
   ```

---

## 🎯 **Your Configuration URLs**

- **Config**: `https://raw.githubusercontent.com/NachoPayback/6301912-SP-Ad-Pumper/main/config.json`
- **Banners**: `https://raw.githubusercontent.com/NachoPayback/6301912-SP-Ad-Pumper/main/banners/`

---

## 🛠️ **Quick Controls**

### **Turn Extension On/Off**
Edit `config.json` in GitHub and change:
```json
{
  "enabled": false  // Disables everywhere instantly
}
```

### **Toggle Pre-roll Videos**
```json
{
  "features": {
    "preroll": false  // Disables pre-roll ads
  }
}
```

### **Change Pre-roll Video**
```json
{
  "preroll": {
    "videoId": "NEW_YOUTUBE_VIDEO_ID_HERE"
  }
}
```

---

## 🚨 **Important Notes**

- Changes take effect within **5 minutes** (cache expiry)
- Repository must be **public** for free access
- All banner files must be exactly named as in config
- Check browser console for errors if something doesn't work

---

## 🧪 **Test Commands**

Open any website, press F12, and run:

```javascript
// Test config loading
SPGetConfig().then(config => console.log('Config:', config));

// Force refresh
window.SPRemoteConfig.forceRefresh();

// Test specific features
SPGetPrerollConfig().then(config => console.log('Preroll:', config));
SPGetToastConfig().then(config => console.log('Toast:', config));
```

---

## ✅ **You're Ready!**

Once you upload `config.json`, your extension will pull settings from GitHub instead of local storage. You can update any setting by editing the file in GitHub!

**Benefits:**
- ✅ Update settings without new extension versions
- ✅ Emergency disable from anywhere
- ✅ A/B test different configurations
- ✅ Real-time control over all features 