// Main Content Script - Orchestrates all functionality
// Remote configuration enabled version

(function() {
    'use strict';
    
    console.log('SP: Loading main script with remote configuration...');

    // State management
    let state = {
        prerollDetector: null,
        config: null,
        initialized: false,
        domain: window.location.hostname
    };

    // Load configuration from remote source
    async function loadConfiguration() {
        try {
            if (!window.SPRemoteConfig) {
                console.log('SP: Remote config not loaded yet, retrying...');
                setTimeout(loadConfiguration, 1000);
                return;
            }

            console.log('SP: Loading remote configuration...');
            state.config = await window.SPRemoteConfig.getConfig();
            
            // Check if extension is enabled
            if (!state.config.enabled) {
                console.log('SP: Extension disabled via remote config');
                return false;
            }

            // Check if current domain is allowed
            const domainAllowed = await window.SPRemoteConfig.isDomainAllowed(state.domain);
            if (!domainAllowed) {
                console.log(`SP: Domain ${state.domain} not allowed via remote config`);
                return false;
            }

            console.log('SP: Remote configuration loaded successfully', state.config);
            return true;

        } catch (error) {
            console.error('SP: Failed to load remote configuration:', error);
            console.log('SP: Falling back to local storage settings');
            return await loadLocalConfiguration();
        }
    }

    // Fallback to local storage if remote config fails
    async function loadLocalConfiguration() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['extensionEnabled', 'prerollEnabled'], (result) => {
                const extensionEnabled = result.extensionEnabled !== false;
                const prerollEnabled = result.prerollEnabled || false;
                
                // Create fallback config structure
                state.config = {
                    enabled: extensionEnabled,
                    features: {
                        preroll: prerollEnabled,
                        banners: true,
                        toast: true
                    },
                    preroll: {
                        enabled: prerollEnabled,
                        videoId: 'YV0NfxtK0n0',
                        chance: 0.3,
                        skipDelay: 5000
                    }
                };
                
                console.log('SP: Using local storage configuration', state.config);
                resolve(extensionEnabled);
            });
        });
    }

    async function initPrerollDetection() {
        const prerollConfig = state.config.preroll || {};
        const prerollEnabled = state.config.features?.preroll && prerollConfig.enabled;
        
        if (prerollEnabled && !state.prerollDetector && window.SPVideoPlayerDetector) {
            console.log('SP: Initializing pre-roll video detection with remote config...');
            state.prerollDetector = new window.SPVideoPlayerDetector();
            
            // Pass configuration to detector
            if (state.prerollDetector.setConfig) {
                state.prerollDetector.setConfig(prerollConfig);
            }
            
            state.prerollDetector.init();
        } else if (prerollEnabled && !window.SPVideoPlayerDetector) {
            console.log('SP: Pre-roll enabled but detector not loaded yet, retrying...');
            setTimeout(initPrerollDetection, 1000);
        }
    }

    function clearAllAds() {
        console.log('SP: Clearing all ads...');
        
        // Remove all banners
        const banners = document.querySelectorAll('[data-sp-banner]');
        banners.forEach(banner => {
            if (banner.parentNode) {
                banner.parentNode.removeChild(banner);
            }
        });
        
        // Remove any toast
        const toasts = document.querySelectorAll('[data-sp-toast]');
        toasts.forEach(toast => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
        
        // Remove any pre-roll overlays
        const prerolls = document.querySelectorAll('[data-sp-preroll]');
        prerolls.forEach(preroll => {
            if (preroll.parentNode) {
                preroll.parentNode.removeChild(preroll);
            }
        });
        
        console.log('SP: All ads cleared');
    }

    async function showToastNotification() {
        try {
            const toastConfig = await window.SPRemoteConfig.getToastConfig();
            
            if (!toastConfig.enabled || !toastConfig.messages?.length) {
                console.log('SP: Toast notifications disabled or no messages configured');
                return;
            }

            // Select random message based on weight
            const messages = toastConfig.messages;
            const totalWeight = messages.reduce((sum, msg) => sum + (msg.weight || 1), 0);
            let random = Math.random() * totalWeight;
            
            let selectedMessage = messages[0];
            for (const message of messages) {
                random -= (message.weight || 1);
                if (random <= 0) {
                    selectedMessage = message;
                    break;
                }
            }

            // Track toast impression
            if (window.SPAnalytics) {
                window.SPAnalytics.trackAdImpression('toast', selectedMessage, {
                    position: toastConfig.position,
                    showTime: Date.now()
                });
                window.SPAnalytics.updateCounters('impressions');
            }

            // Create toast element
            const toast = document.createElement('div');
            toast.setAttribute('data-sp-toast', 'true');
            toast.style.cssText = `
                position: fixed;
                ${toastConfig.position === 'top-right' ? 'top: 20px; right: 20px;' : 'bottom: 20px; right: 20px;'}
                background: #2196F3;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                z-index: 999999;
                font-family: Arial, sans-serif;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                max-width: 300px;
                cursor: pointer;
                animation: slideIn 0.3s ease-out;
            `;
            
            toast.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 5px;">
                    ${selectedMessage.icon || '🛡️'} ${selectedMessage.title || 'Fight Back Against Scammers!'}
                </div>
                <div style="font-size: 13px; opacity: 0.9;">
                    ${selectedMessage.subtitle || 'Subscribe to Scammer Payback'}
                </div>
            `;
            
            // Track click event
            const showTime = Date.now();
            selectedMessage.showTime = showTime;
            
            // Click handler with analytics
            toast.addEventListener('click', () => {
                // Track toast click
                if (window.SPAnalytics) {
                    window.SPAnalytics.trackAdClick('toast', selectedMessage, 'subscribe');
                    window.SPAnalytics.updateCounters('clicks');
                }
                
                const channelUrl = state.config.urls?.channel || 'https://www.youtube.com/c/ScammerPayback?sub_confirmation=1';
                window.open(channelUrl, '_blank');
                toast.remove();
            });
            
            document.body.appendChild(toast);
            
            // Auto-remove after configured time
            const displayTime = toastConfig.displayTime || 8000;
            setTimeout(() => {
                if (toast.parentNode) {
                    // Track display completion
                    if (window.SPAnalytics) {
                        window.SPAnalytics.trackToastDisplay(selectedMessage, displayTime);
                    }
                    toast.remove();
                }
            }, displayTime);
            
            console.log('SP: Toast notification displayed:', selectedMessage.title);

        } catch (error) {
            console.error('SP: Failed to show toast notification:', error);
            if (window.SPAnalytics) {
                window.SPAnalytics.trackError('toast_display_error', error.message);
            }
        }
    }

    async function showAds() {
        try {
            console.log('SP: Starting ad display with remote config...');
            
            if (!state.config) {
                console.log('SP: No configuration loaded, skipping ads');
                return;
            }
            
            // Clear any existing ads first
            clearAllAds();
            
            // Check feature flags
            const prerollEnabled = state.config.features?.preroll && state.config.preroll?.enabled;
            const toastEnabled = state.config.features?.toast && state.config.toast?.enabled;
            const bannersEnabled = state.config.features?.banners && state.config.banners?.enabled;
            
            if (prerollEnabled) {
                console.log('SP: Pre-roll mode active - video detection running');
                // Pre-roll detector will handle video detection automatically
            } else if (toastEnabled) {
                console.log('SP: Pre-roll disabled, showing toast notification');
                await showToastNotification();
            }
            
            // Banner functionality can be added here later
            if (bannersEnabled) {
                console.log('SP: Banner ads enabled in config');
                // TODO: Implement banner display with remote config
            }
            
        } catch (error) {
            console.error('SP: Error in showAds:', error);
        }
    }

    async function init() {
        console.log('SP: Initializing Scammer Payback Promoter with remote config...');
        
        // Wait for page to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }
        
        if (state.initialized) {
            console.log('SP: Already initialized, skipping');
            return;
        }
        
        try {
            // Load configuration (remote or fallback to local)
            const configLoaded = await loadConfiguration();
            
            if (!configLoaded) {
                console.log('SP: Extension disabled or domain not allowed, not initializing');
                return;
            }
            
            console.log('SP: Configuration loaded, initializing features...');
            
            // Initialize pre-roll detection if enabled
            const prerollEnabled = state.config.features?.preroll && state.config.preroll?.enabled;
            if (prerollEnabled) {
                // Small delay to ensure all scripts are loaded
                setTimeout(initPrerollDetection, 500);
            }
            
            // Small delay to let page settle
            setTimeout(async () => {
                await showAds();
                
                // Start rotation timer for ads based on config
                const rotationTime = state.config.banners?.rotationTime || 60000;
                setInterval(showAds, rotationTime);
                
                state.initialized = true;
                console.log('SP: Extension fully initialized with remote config');
            }, 1000);
            
        } catch (error) {
            console.error('SP: Failed to initialize extension:', error);
        }
    }

    // Minimal message handler (stealth mode)
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'clearAds') {
            clearAllAds();
            sendResponse({success: true});
        }
        // No popup interface in stealth mode
    });

    // Test function to manually trigger pre-roll (for debugging)
    window.SPTestPreroll = function() {
        console.log('SP: Manual pre-roll test triggered');
        if (window.SPVideoPlayerDetector) {
            const detector = new window.SPVideoPlayerDetector();
            const testPlayer = {
                type: 'test',
                container: document.body,
                video: null,
                platform: 'test'
            };
            
            if (window.SPCreatePrerollOverlay) {
                window.SPCreatePrerollOverlay(testPlayer, () => {
                    console.log('SP: Test pre-roll completed');
                });
            }
        }
    };

    // Make some functions globally available for other scripts
    window.SPClearAllAds = clearAllAds;
    window.SPShowAds = showAds;

    // Start the extension
    init();
    
    console.log('SP: Main script loaded');
})(); 