# Pre-roll Ad System

## 🎯 Overview

The pre-roll system creates YouTube-style video advertisements that appear before videos play on various websites. Unlike traditional pre-roll injection, this uses an **overlay-based approach** that works with existing video players rather than against them.

## 🛠️ How It Works

### 1. **Video Detection**
- Scans page for video players (YouTube, HTML5, Vimeo)
- Sets up event listeners for play actions
- Monitors dynamically loaded content

### 2. **Play Interception**
- Captures play button clicks and video play events
- Pauses the original video before it starts
- Prevents the original play event from proceeding

### 3. **Overlay Creation**
- Creates full-screen overlay positioned over original player
- Embeds unlisted YouTube video via iframe
- Includes authentic YouTube-style controls and UI

### 4. **User Experience**
- Shows "Ad" indicator (top-left)
- Progress bar animation
- Skip button appears after 5 seconds
- "Visit Site" call-to-action button
- Smooth fade-out transition

### 5. **Completion**
- Removes overlay after video ends or skip
- Resumes original video playback
- Returns control to user

## 📁 File Structure

```
scripts/preroll/
├── detector.js     # Video player detection and event handling
├── overlay.js      # Pre-roll overlay UI and interactions
└── README.md       # This documentation
```

## ⚙️ Configuration

### Enable Pre-roll Ads
```javascript
// In main.js
let prerollEnabled = true; // Set to false to disable
```

### Set Your Unlisted Video
```javascript
// In overlay.js
const scammerPaybackVideoId = 'YOUR_VIDEO_ID'; // Replace with actual ID
```

## 🎯 Supported Platforms

### ✅ **Working**
- **YouTube**: Full support with authentic styling
- **HTML5 Videos**: Generic video elements on any site
- **Vimeo**: Basic support for embedded players

### ⚠️ **Limited Support**
- **Protected Players**: Some may resist pausing
- **Autoplay Videos**: Detection timing can be challenging
- **Dynamically Loaded**: May require re-detection

### ❌ **Not Supported**
- **DRM-Protected Content**: Cannot intercept encrypted streams
- **Flash Players**: Legacy technology (rare nowadays)
- **Some Mobile Apps**: Platform-specific restrictions

## 🔧 Technical Details

### Event Interception
```javascript
// YouTube play button detection
playButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    this.triggerPreroll(player, e);
});
```

### Overlay Positioning
```javascript
// Dynamic positioning over original player
const playerRect = player.container.getBoundingClientRect();
overlay.style.cssText = `
    position: fixed;
    top: ${playerRect.top}px;
    left: ${playerRect.left}px;
    width: ${playerRect.width}px;
    height: ${playerRect.height}px;
    z-index: 999999;
`;
```

### YouTube Integration
```javascript
// Embed unlisted video with autoplay
<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&modestbranding=1">
```

## 🚨 Limitations & Considerations

### **Technical Challenges**
- **Timing Sensitivity**: Must pause video at exact moment
- **Cross-Domain**: Limited access to iframe events
- **Platform Updates**: Sites may change player structure
- **Detection Accuracy**: Some players harder to identify

### **User Experience**
- **Performance Impact**: Additional overlay rendering
- **Network Usage**: Loads additional video content
- **Compatibility**: May not work on all sites
- **Detection Risk**: Some sites might detect and block

### **Maintenance Requirements**
- **Regular Updates**: As video players evolve
- **Site-Specific Fixes**: Different platforms need different handling
- **Testing Needed**: Across multiple browsers and devices
- **Monitoring Required**: For broken functionality

## 🧪 Testing

### **Test Sites**
1. **YouTube**: Visit any video page
2. **News Sites**: CNN, BBC with embedded videos
3. **Social Media**: Twitter, Facebook video posts
4. **Educational**: Khan Academy, Coursera

### **Test Scenarios**
- Click play button manually
- Autoplay videos (if enabled)
- Video player in different positions
- Multiple videos on same page
- Mobile vs desktop browsers

### **Expected Behavior**
- Original video pauses immediately
- Pre-roll overlay appears smoothly
- Skip button appears after 5 seconds
- Original video resumes after completion

## 🎯 Future Enhancements

### **Potential Improvements**
- **Better Detection**: More robust video player identification
- **Site-Specific Styling**: Match each platform's native ad style
- **Analytics Integration**: Track views, skips, clicks
- **Smart Targeting**: Show pre-rolls based on content type
- **Multiple Videos**: Rotate different Scammer Payback content

### **Advanced Features**
- **Frequency Capping**: Limit pre-rolls per user session
- **Content Matching**: Different videos for different sites
- **A/B Testing**: Test different pre-roll styles
- **User Preferences**: Allow users to disable pre-rolls

## ⚠️ Ethical Considerations

This pre-roll system is designed to promote Scammer Payback's educational content about scam prevention. It should:

- ✅ Provide clear "Ad" indicator
- ✅ Allow skipping after reasonable time
- ✅ Not interfere with user's intended content
- ✅ Respect user experience and performance
- ❌ Not mislead users about the source
- ❌ Not block access to legitimate content 