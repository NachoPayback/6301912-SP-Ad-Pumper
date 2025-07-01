# GitHub Banner Assets Setup

## Quick Setup Steps

### 1. Create GitHub Repository
1. Go to [GitHub.com](https://github.com) and click "New Repository"
2. Name it: `sp-banner-assets` (or any name you prefer)
3. Make it **Public** (required for direct image linking)
4. Create the repository

### 2. Upload Your Banner Files
1. In your new repository, click "uploading an existing file"
2. Drag and drop these files from `extension/assets/banners/`:
   - `ad_160x600.png`
   - `ad_300x250.png` 
   - `ad_320x50.png`
   - `ad_336x280.png`
   - `ad_728x90.png`
   - `ad_970x250.png`
3. Commit the files

### 3. Get Your GitHub URLs
After upload, your banner URLs will be:
```
https://raw.githubusercontent.com/YOUR_USERNAME/sp-banner-assets/main/ad_300x250.png
https://raw.githubusercontent.com/YOUR_USERNAME/sp-banner-assets/main/ad_728x90.png
https://raw.githubusercontent.com/YOUR_USERNAME/sp-banner-assets/main/ad_160x600.png
https://raw.githubusercontent.com/YOUR_USERNAME/sp-banner-assets/main/ad_320x50.png
https://raw.githubusercontent.com/YOUR_USERNAME/sp-banner-assets/main/ad_336x280.png
https://raw.githubusercontent.com/YOUR_USERNAME/sp-banner-assets/main/ad_970x250.png
```

### 4. Update Database URLs
Once uploaded, update your banner URLs in the database:

```sql
-- Update banner URLs in your Supabase database
UPDATE banners SET image_url = 'https://raw.githubusercontent.com/YOUR_USERNAME/sp-banner-assets/main/ad_300x250.png' WHERE size = '300x250';
UPDATE banners SET image_url = 'https://raw.githubusercontent.com/YOUR_USERNAME/sp-banner-assets/main/ad_728x90.png' WHERE size = '728x90';
UPDATE banners SET image_url = 'https://raw.githubusercontent.com/YOUR_USERNAME/sp-banner-assets/main/ad_160x600.png' WHERE size = '160x600';
UPDATE banners SET image_url = 'https://raw.githubusercontent.com/YOUR_USERNAME/sp-banner-assets/main/ad_320x50.png' WHERE size = '320x50';
UPDATE banners SET image_url = 'https://raw.githubusercontent.com/YOUR_USERNAME/sp-banner-assets/main/ad_336x280.png' WHERE size = '336x280';
UPDATE banners SET image_url = 'https://raw.githubusercontent.com/YOUR_USERNAME/sp-banner-assets/main/ad_970x250.png' WHERE size = '970x250';
```

## How It Works Now

✅ **Extension loads banner configs from Supabase database**
✅ **Banner images hosted on GitHub (free, reliable)**  
✅ **You control which banners show via dashboard**
✅ **Easy to add new banners - just update database**
✅ **Fallback to local files if database is down**

## Managing Banners

Use your web dashboard to:
- Enable/disable specific banners
- Change banner chances (0.00 to 1.00)
- Set priority (lower = higher priority)
- Update target URLs
- Add new banner entries

Your extension will automatically use the latest database settings! 