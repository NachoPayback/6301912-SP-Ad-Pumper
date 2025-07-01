// Remote Configuration System using GitHub
// Fetches configuration and assets from GitHub repository

(function() {
    'use strict';
    
    console.log('SP: Loading remote configuration system...');

    class RemoteConfig {
        constructor() {
            this.baseUrl = 'https://raw.githubusercontent.com/NachoPayback/6301912-SP-Ad-Pumper/main';
            this.configCache = null;
            this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
            this.lastFetch = 0;
        }

        // Main config fetcher with caching
        async getConfig() {
            const now = Date.now();
            
            // Return cached config if still fresh
            if (this.configCache && (now - this.lastFetch) < this.cacheExpiry) {
                console.log('SP: Using cached remote config');
                return this.configCache;
            }

            try {
                console.log('SP: Fetching fresh remote config...');
                const response = await fetch(`${this.baseUrl}/config.json`, {
                    cache: 'no-cache',
                    headers: {
                        'Cache-Control': 'no-cache'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Config fetch failed: ${response.status}`);
                }

                const config = await response.json();
                
                // Validate config structure
                if (!this.validateConfig(config)) {
                    throw new Error('Invalid config structure');
                }

                // Update cache
                this.configCache = config;
                this.lastFetch = now;
                
                console.log('SP: Remote config loaded successfully', config);
                return config;

            } catch (error) {
                console.error('SP: Failed to fetch remote config:', error);
                
                // Return fallback config if remote fails
                return this.getFallbackConfig();
            }
        }

        // Validate config structure
        validateConfig(config) {
            const required = ['version', 'enabled', 'features', 'preroll', 'banners', 'toast'];
            return required.every(key => key in config);
        }

        // Fallback config when remote fails
        getFallbackConfig() {
            console.log('SP: Using fallback configuration');
            return {
                version: '1.0.0',
                enabled: true,
                features: {
                    preroll: false,
                    banners: true,
                    toast: true
                },
                preroll: {
                    enabled: false,
                    videoId: 'YV0NfxtK0n0',
                    chance: 0.3,
                    skipDelay: 5000
                },
                banners: {
                    enabled: true,
                    baseUrl: 'https://raw.githubusercontent.com/NachoPayback/6301912-SP-Ad-Pumper/main/banners',
                    types: [
                        { size: '300x250', file: 'ad_300x250.png', chance: 0.4 },
                        { size: '728x90', file: 'ad_728x90.png', chance: 0.3 },
                        { size: '160x600', file: 'ad_160x600.png', chance: 0.3 }
                    ],
                    rotationTime: 45000
                },
                toast: {
                    enabled: true,
                    messages: [
                        {
                            icon: '🛡️',
                            title: 'Fight Back Against Scammers!',
                            subtitle: 'Subscribe to Scammer Payback'
                        }
                    ],
                    displayTime: 8000
                },
                targeting: {
                    enabledDomains: ['*'],
                    disabledDomains: [],
                    enabledOnYouTube: true,
                    enabledOnGoogle: true
                },
                urls: {
                    channel: 'https://www.youtube.com/c/ScammerPayback?sub_confirmation=1',
                    website: 'https://scammerpayback.com'
                }
            };
        }

        // Get specific config section
        async getSection(section) {
            const config = await this.getConfig();
            return config[section] || {};
        }

        // Get preroll configuration
        async getPrerollConfig() {
            const config = await this.getConfig();
            return {
                enabled: config.features?.preroll && config.preroll?.enabled,
                videoId: config.preroll?.videoId || 'YV0NfxtK0n0',
                chance: config.preroll?.chance || 0.3,
                skipDelay: config.preroll?.skipDelay || 5000
            };
        }

        // Get banner configuration with full URLs
        async getBannerConfig() {
            const config = await this.getConfig();
            const bannerConfig = config.banners || {};
            
            // Add full URLs to banner types
            if (bannerConfig.types) {
                bannerConfig.types = bannerConfig.types.map(banner => ({
                    ...banner,
                    url: `${bannerConfig.baseUrl}/${banner.file}`
                }));
            }

            return {
                enabled: config.features?.banners && bannerConfig.enabled,
                ...bannerConfig
            };
        }

        // Get toast configuration
        async getToastConfig() {
            const config = await this.getConfig();
            return {
                enabled: config.features?.toast && config.toast?.enabled,
                messages: config.toast?.messages || [],
                displayTime: config.toast?.displayTime || 8000
            };
        }

        // Check if extension should be active
        async isExtensionEnabled() {
            const config = await this.getConfig();
            return config.enabled === true;
        }

        // Check if domain is allowed
        async isDomainAllowed(domain) {
            const config = await this.getConfig();
            const targeting = config.targeting || {};
            
            // Check disabled domains first
            if (targeting.disabledDomains?.includes(domain)) {
                return false;
            }
            
            // Check enabled domains
            if (targeting.enabledDomains?.includes('*')) {
                return true;
            }
            
            return targeting.enabledDomains?.includes(domain) || false;
        }

        // Force refresh config (bypass cache)
        async forceRefresh() {
            console.log('SP: Force refreshing remote config...');
            this.configCache = null;
            this.lastFetch = 0;
            return await this.getConfig();
        }

        // Get asset URL (for banners, etc.)
        getAssetUrl(filename) {
            return `${this.baseUrl}/assets/${filename}`;
        }

        // Set custom base URL (for testing or different repos)
        setBaseUrl(url) {
            this.baseUrl = url;
            this.configCache = null; // Clear cache
            console.log('SP: Remote config base URL changed to:', url);
        }
    }

    // Create global instance
    window.SPRemoteConfig = new RemoteConfig();
    
    // Convenience functions
    window.SPGetConfig = () => window.SPRemoteConfig.getConfig();
    window.SPGetPrerollConfig = () => window.SPRemoteConfig.getPrerollConfig();
    window.SPGetBannerConfig = () => window.SPRemoteConfig.getBannerConfig();
    window.SPGetToastConfig = () => window.SPRemoteConfig.getToastConfig();
    
    console.log('SP: Remote configuration system loaded');
})(); 