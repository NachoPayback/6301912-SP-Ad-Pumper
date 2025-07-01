// Extension Packaging Script for Developer Mode Installation
// Creates installable package with remote update capabilities

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

class ExtensionPackager {
    constructor() {
        this.version = '2.1.0';
        this.outputDir = './dist';
        this.extensionDir = './';
    }

    async packageExtension() {
        console.log('📦 Packaging Extension for Developer Mode...');
        
        // Create dist directory
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir);
        }

        // Update manifest with remote update URL
        await this.updateManifestForDevMode();
        
        // Create installable folder structure
        await this.createInstallableFolder();
        
        // Create installation guide
        await this.createInstallationGuide();
        
        console.log('✅ Extension packaged successfully!');
        console.log('📁 Files ready in ./dist/');
    }

    async updateManifestForDevMode() {
        const manifest = JSON.parse(fs.readFileSync('./manifest.json', 'utf8'));
        
        // Add update URL for remote updates
        manifest.update_url = 'https://your-vercel-site.vercel.app/updates.xml';
        manifest.version = this.version;
        
        // Add permissions for self-updating
        if (!manifest.permissions.includes('management')) {
            manifest.permissions.push('management');
        }
        
        // Write updated manifest
        fs.writeFileSync(path.join(this.outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
        
        console.log('📝 Manifest updated with remote update capabilities');
    }

    async createInstallableFolder() {
        const extensionFolder = path.join(this.outputDir, 'youtube-speed-booster');
        
        if (!fs.existsSync(extensionFolder)) {
            fs.mkdirSync(extensionFolder, { recursive: true });
        }

        // Copy all extension files
        const filesToCopy = [
            'manifest.json',
            'background/',
            'scripts/',
            'styles/',
            'assets/'
        ];

        for (const file of filesToCopy) {
            const sourcePath = path.join('./', file);
            const destPath = path.join(extensionFolder, file);
            
            if (fs.existsSync(sourcePath)) {
                if (fs.statSync(sourcePath).isDirectory()) {
                    this.copyDirectorySync(sourcePath, destPath);
                } else {
                    fs.copyFileSync(sourcePath, destPath);
                }
            }
        }

        // Copy updated manifest
        fs.copyFileSync(path.join(this.outputDir, 'manifest.json'), path.join(extensionFolder, 'manifest.json'));
        
        console.log('📁 Extension folder created');
    }

    copyDirectorySync(source, destination) {
        if (!fs.existsSync(destination)) {
            fs.mkdirSync(destination, { recursive: true });
        }

        const files = fs.readdirSync(source);
        
        for (const file of files) {
            const sourcePath = path.join(source, file);
            const destPath = path.join(destination, file);
            
            if (fs.statSync(sourcePath).isDirectory()) {
                this.copyDirectorySync(sourcePath, destPath);
            } else {
                fs.copyFileSync(sourcePath, destPath);
            }
        }
    }

    async createInstallationGuide() {
        const guide = `
# 🎥 YouTube Speed Booster - Installation Guide

## Quick Installation (2 minutes)

### Step 1: Enable Developer Mode
1. Open Chrome and go to: chrome://extensions/
2. Toggle "Developer mode" in the top-right corner

### Step 2: Install Extension
1. Download the "youtube-speed-booster" folder
2. Click "Load unpacked" button
3. Select the "youtube-speed-booster" folder
4. Click "Select Folder"

### Step 3: Verify Installation
✅ You should see "YouTube Speed Booster" in your extensions list
✅ The extension will start working immediately on YouTube

## What This Does
- Optimizes YouTube video loading speeds
- Enhances video quality detection
- Improves browser performance on video sites
- Runs silently in the background

## Troubleshooting
**Extension not working?**
- Make sure Developer mode is enabled
- Try restarting Chrome
- Check that the folder contains manifest.json

**Need help?** Contact support@videoenhancer.com

---
*YouTube Speed Booster v${this.version} - Browser Performance Tool*
`;

        fs.writeFileSync(path.join(this.outputDir, 'INSTALLATION.md'), guide);
        
        // Also create a simple HTML guide
        const htmlGuide = `
<!DOCTYPE html>
<html>
<head>
    <title>YouTube Speed Booster - Installation</title>
    <style>
        body { font-family: Arial; max-width: 800px; margin: 50px auto; padding: 20px; }
        .step { background: #f0f8ff; padding: 15px; margin: 15px 0; border-radius: 8px; }
        .highlight { background: #ffeb3b; padding: 2px 5px; border-radius: 3px; }
        img { max-width: 100%; border: 1px solid #ddd; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>🎥 YouTube Speed Booster - Easy Installation</h1>
    
    <div class="step">
        <h3>Step 1: Enable Developer Mode</h3>
        <p>1. Type <span class="highlight">chrome://extensions/</span> in your address bar</p>
        <p>2. Toggle <span class="highlight">"Developer mode"</span> in the top-right</p>
    </div>
    
    <div class="step">
        <h3>Step 2: Install Extension</h3>
        <p>1. Click <span class="highlight">"Load unpacked"</span> button</p>
        <p>2. Select the <span class="highlight">"youtube-speed-booster"</span> folder</p>
        <p>3. Click <span class="highlight">"Select Folder"</span></p>
    </div>
    
    <div class="step">
        <h3>Step 3: Done! 🎉</h3>
        <p>The extension is now working automatically. You'll notice faster YouTube loading immediately!</p>
    </div>
    
    <hr>
    <p><small>YouTube Speed Booster v${this.version} - Browser Performance Enhancement Tool</small></p>
</body>
</html>
`;

        fs.writeFileSync(path.join(this.outputDir, 'installation.html'), htmlGuide);
        
        console.log('📖 Installation guides created');
    }
}

// Run if called directly
if (require.main === module) {
    const packager = new ExtensionPackager();
    packager.packageExtension().catch(console.error);
}

module.exports = ExtensionPackager; 