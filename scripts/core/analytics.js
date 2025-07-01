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
            this.analyticsUrl = 'https://your-analytics-backend.com/api/track'; // Configure this
            this.batchSize = 10;
            this.eventQueue = [];
            this.sessionData = {
                startTime: Date.now(),
                userAgent: navigator.userAgent,
                language: navigator.language,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                screenResolution: `${screen.width}x${screen.height}`,
                domain: window.location.hostname
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

        // Initialize or retrieve user ID
        async initializeUser() {
            try {
                // Get persistent user ID from storage
                const result = await chrome.storage.local.get(['sp_user_id']);
                
                if (result.sp_user_id) {
                    this.userId = result.sp_user_id;
                } else {
                    // Generate new user ID
                    this.userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                    await chrome.storage.local.set({ sp_user_id: this.userId });
                }
                
                console.log('SP Analytics: User ID:', this.userId);
                
                // Track session start
                this.trackEvent('session_start', {
                    userId: this.userId,
                    sessionId: this.sessionId,
                    ...this.sessionData
                });
                
            } catch (error) {
                console.error('SP Analytics: Failed to initialize user:', error);
                // Fallback to session-based tracking
                this.userId = this.sessionId;
            }
        }

        // Track any event
        trackEvent(eventType, data = {}) {
            if (!this.enabled) return;

            const event = {
                eventType,
                userId: this.userId,
                sessionId: this.sessionId,
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

        // Flush events to backend
        async flushEvents(forceSend = false) {
            if (this.eventQueue.length === 0) return;
            
            if (!forceSend && this.eventQueue.length < this.batchSize) return;

            const eventsToSend = [...this.eventQueue];
            this.eventQueue = [];

            try {
                console.log(`SP Analytics: Sending ${eventsToSend.length} events to backend`);
                
                // For now, log to console (replace with actual backend call)
                console.table(eventsToSend);
                
                // Uncomment when backend is ready:
                /*
                const response = await fetch(this.analyticsUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        events: eventsToSend,
                        clientVersion: '2.0.0'
                    })
                });

                if (!response.ok) {
                    throw new Error(`Analytics upload failed: ${response.status}`);
                }
                */
                
                // Store locally as backup
                await this.storeEventsLocally(eventsToSend);
                
            } catch (error) {
                console.error('SP Analytics: Failed to send events:', error);
                
                // Re-queue events for retry
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