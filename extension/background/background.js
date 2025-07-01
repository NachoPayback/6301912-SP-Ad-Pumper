// Enhanced Stealth Extension - Background Service Worker
// Remote config fetching and management

console.log('SP: Enhanced stealth background script loaded');

// Configuration management
class ConfigManager {
    constructor() {
        this.configUrl = 'https://raw.githubusercontent.com/NachoPayback/6301912-SP-Ad-Pumper/master/config.json';
        this.updateInterval = 5 * 60 * 1000; // 5 minutes
        this.lastFetch = 0;
        this.init();
    }

    async init() {
        // Fetch config immediately on startup
        await this.fetchAndCacheConfig();
        
        // Set up periodic updates
        setInterval(() => this.fetchAndCacheConfig(), this.updateInterval);
    }

    async fetchAndCacheConfig() {
        try {
            console.log('🔄 Fetching remote config...');
            
            const response = await fetch(this.configUrl + '?t=' + Date.now());
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const config = await response.json();
            
            // Cache the config
            await chrome.storage.local.set({
                sp_remote_config: config,
                sp_config_last_updated: Date.now()
            });
            
            this.lastFetch = Date.now();
            console.log('✅ Remote config updated successfully');
            
            // Check for emergency disable
            if (config.emergency_disable) {
                console.log('🚨 Emergency disable triggered');
                this.triggerEmergencyShutdown();
            }
            
        } catch (error) {
            console.warn('⚠️ Remote config fetch failed:', error.message);
            
            // Ensure we have at least a local fallback
            const stored = await chrome.storage.local.get(['sp_remote_config']);
            if (!stored.sp_remote_config) {
                await this.loadLocalFallback();
            }
        }
    }

    async loadLocalFallback() {
        try {
            console.log('📋 Loading local config fallback...');
            const response = await fetch(chrome.runtime.getURL('config.json'));
            const config = await response.json();
            
            await chrome.storage.local.set({
                sp_remote_config: config,
                sp_config_last_updated: Date.now(),
                sp_config_source: 'local_fallback'
            });
            
            console.log('✅ Local fallback config loaded');
        } catch (error) {
            console.error('❌ Local config fallback failed:', error);
        }
    }

    triggerEmergencyShutdown() {
        // Send shutdown signal to all tabs
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { action: 'emergency_shutdown' }).catch(() => {
                    // Tab might not have content script, ignore errors
                });
            });
        });
    }
}

// Initialize config manager
const configManager = new ConfigManager();

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('SP: Enhanced stealth extension installed');
        
        // Set minimal default settings
        chrome.storage.local.set({
            sp_extension_installed: true,
            sp_installation_date: Date.now()
        });
        
        // Immediately fetch config on install
        configManager.fetchAndCacheConfig();
        
    } else if (details.reason === 'update') {
        console.log('SP: Enhanced stealth extension updated');
        // Fetch fresh config on update
        configManager.fetchAndCacheConfig();
    }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'get_config') {
        // Return cached config to content script
        chrome.storage.local.get(['sp_remote_config', 'sp_config_last_updated', 'sp_config_source'])
            .then(stored => {
                sendResponse({
                    success: true,
                    config: stored.sp_remote_config || null,
                    lastUpdated: stored.sp_config_last_updated || 0,
                    source: stored.sp_config_source || 'remote'
                });
            })
            .catch(error => {
                sendResponse({
                    success: false,
                    error: error.message
                });
            });
        return true; // Keep message channel open for async response
    }
    
    if (request.action === 'force_config_refresh') {
        // Force immediate config refresh
        configManager.fetchAndCacheConfig()
            .then(() => {
                sendResponse({success: true});
            })
            .catch(error => {
                sendResponse({success: false, error: error.message});
            });
        return true; // Keep message channel open for async response
    }
    
    if (request.action === 'emergency_shutdown') {
        console.log('SP: Emergency shutdown received');
        
        // Clear all stored data
        chrome.storage.local.clear();
        
        // Send shutdown signal to all tabs
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { action: 'emergency_shutdown' }).catch(() => {
                    // Tab might not have content script, ignore errors
                });
            });
        });
        
        sendResponse({success: true});
    }
    
    return true; // Keep message channel open
});

// Minimal tab tracking for analytics
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // Log tab changes for potential analytics
        console.log('SP: Tab updated:', tab.url);
    }
}); 