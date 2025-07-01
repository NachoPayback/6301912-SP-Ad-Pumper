// SP Extension - Real Extension with Supabase Analytics
// Ads: Banners, Toast notifications, Preroll videos
// Analytics: User tracking, email collection, ad interactions

(function() {
    'use strict';
    
    console.log('🎯 SP Extension starting...');

    class SPExtension {
        constructor() {
            this.configUrl = 'https://raw.githubusercontent.com/NachoPayback/6301912-SP-Ad-Pumper/master/config.json';
            this.config = {};
            this.supabase = null;
            this.currentUser = null;
            this.currentSession = null;
            this.disabled = false;
            
            // Concurrent ad tracking
            this.activeBanners = new Set();
            this.activeToasts = new Set();
            
            this.init();
        }

        async init() {
            try {
                // Initialize Supabase connection
                await this.initSupabase();
                
                // Load configuration
                await this.loadConfig();
                
                if (this.disabled) return;
                
                // Get or create user with email collection
                await this.setupUser();
                
                // Start session tracking
                await this.startSession();
                
                // Start ad systems
                this.startAdSystems();
                
                // Regular config updates
                setInterval(() => this.loadConfig(), 30000);
                
            } catch (error) {
                console.error('❌ Extension init failed:', error);
            }
        }

        async initSupabase() {
            try {
                // Embed SupabaseClient directly (avoids script loading issues in content scripts)
                this.supabase = new (class SupabaseClient {
                    constructor() {
                        this.supabaseUrl = 'https://ahwfkfowqrjgatsbynds.supabase.co';
                        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFod2ZrZm93cXJqZ2F0c2J5bmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzODg0MTAsImV4cCI6MjA2Njk2NDQxMH0.hRTJESyHmSIc7gUqROqkask8ZOHEqjNfzo0u-8GaIhQ';
                        this.currentUser = null;
                        this.currentSession = null;
                    }

                    async apiCall(endpoint, method = 'GET', data = null) {
                        const url = `${this.supabaseUrl}/rest/v1${endpoint}`;
                        const headers = {
                            'apikey': this.supabaseKey,
                            'Authorization': `Bearer ${this.supabaseKey}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        };

                        const options = { method, headers };
                        if (data && method !== 'GET') {
                            options.body = JSON.stringify(data);
                        }

                        try {
                            const response = await fetch(url, options);
                            if (!response.ok) {
                                throw new Error(`API call failed: ${response.status}`);
                            }
                            
                            const result = await response.json();
                            return { data: result, error: null };
                            
                        } catch (error) {
                            console.error('❌ Supabase API call failed:', error);
                            return { data: null, error };
                        }
                    }

                    async getOrCreateUser(email, browserInfo) {
                        try {
                            const { data: existingUsers } = await this.apiCall(`/users?email=eq.${encodeURIComponent(email)}`);

                            if (existingUsers && existingUsers.length > 0) {
                                const existingUser = existingUsers[0];
                                const updateData = {
                                    last_seen: new Date().toISOString(),
                                    total_sessions: (existingUser.total_sessions || 0) + 1,
                                    browser_info: browserInfo
                                };
                                
                                const { data: updatedUsers } = await this.apiCall(`/users?id=eq.${existingUser.id}`, 'PATCH', updateData);
                                this.currentUser = updatedUsers?.[0] || existingUser;
                                console.log('📱 Existing user found:', this.currentUser.email);
                            } else {
                                const newUserData = {
                                    email: email,
                                    browser_info: browserInfo,
                                    total_sessions: 1,
                                    created_at: new Date().toISOString()
                                };

                                const { data: newUsers } = await this.apiCall('/users', 'POST', newUserData);
                                if (newUsers && newUsers.length > 0) {
                                    this.currentUser = newUsers[0];
                                    console.log('🆕 New user created:', this.currentUser.email);
                                }
                            }
                            
                            return this.currentUser;
                            
                        } catch (error) {
                            console.error('❌ Error managing user:', error);
                            return null;
                        }
                    }

                    async startSession(userId) {
                        if (!userId) return;
                        
                        try {
                            const sessionData = {
                                user_id: userId,
                                session_start: new Date().toISOString(),
                                pages_visited: 1,
                                sites_visited: [window.location.hostname],
                                created_at: new Date().toISOString()
                            };

                            const { data: sessions } = await this.apiCall('/user_sessions', 'POST', sessionData);
                            
                            if (sessions && sessions.length > 0) {
                                this.currentSession = sessions[0];
                                console.log('🚀 Session started:', this.currentSession.id);
                                return this.currentSession;
                            }
                            
                        } catch (error) {
                            console.error('❌ Error starting session:', error);
                        }
                    }

                    async trackAdInteraction(adType, interactionType, adPosition = null) {
                        if (!this.currentUser || !this.currentSession) return;
                        
                        try {
                            const interactionData = {
                                user_id: this.currentUser.id,
                                session_id: this.currentSession.id,
                                ad_type: adType,
                                ad_position: adPosition,
                                interaction_type: interactionType,
                                site_domain: window.location.hostname,
                                page_url: window.location.href,
                                timestamp: new Date().toISOString()
                            };

                            await this.apiCall('/ad_interactions', 'POST', interactionData);
                            console.log(`📊 Tracked ${adType} ${interactionType} on ${window.location.hostname}`);
                            
                        } catch (error) {
                            console.error('❌ Error tracking ad interaction:', error);
                        }
                    }
                })();
                
                console.log('✅ Supabase initialized (embedded)');
                
            } catch (error) {
                console.error('❌ Supabase init failed:', error);
            }
        }

        async loadConfig() {
            try {
                const response = await fetch(this.configUrl + '?t=' + Date.now());
                this.config = await response.json();
                
                // Emergency disable check
                if (this.config.emergency_disable) {
                    this.disabled = true;
                    this.clearEverything();
                    return;
                }
                
                console.log('📁 Config loaded');
                
            } catch (error) {
                console.error('❌ Config load failed:', error);
                // Use default config
                this.config = {
                    features: { preroll: true, banners: true, toast: true },
                    preroll: { enabled: true, videoId: "YV0NfxtK0n0", chance: 0.3 },
                    banners: { enabled: true, maxPerPage: 2 },
                    toast: { enabled: true, maxPerSession: 1 }
                };
            }
        }

        async setupUser() {
            try {
                // Get stored email or collect real Chrome email
                let email = await this.getStoredEmail();
                
                if (!email) {
                    email = await this.getChromeUserEmail();
                }
                
                if (email && this.supabase) {
                    // Get browser info for fingerprinting
                    const browserInfo = {
                        userAgent: navigator.userAgent,
                        language: navigator.language,
                        platform: navigator.platform,
                        screen: { width: screen.width, height: screen.height },
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    };
                    
                    this.currentUser = await this.supabase.getOrCreateUser(email, browserInfo);
                    console.log('👤 User setup complete:', email);
                }
                
            } catch (error) {
                console.error('❌ User setup failed:', error);
            }
        }

        async getStoredEmail() {
            try {
                const result = await chrome.storage.local.get(['sp_user_email']);
                return result.sp_user_email || null;
            } catch (error) {
                return null;
            }
        }

        async getChromeUserEmail() {
            try {
                // Try to get the real Chrome user email
                if (chrome.identity && chrome.identity.getProfileUserInfo) {
                    const userInfo = await chrome.identity.getProfileUserInfo({accountStatus: 'ANY'});
                    if (userInfo && userInfo.email) {
                        console.log('✅ Got Chrome email:', userInfo.email);
                        await chrome.storage.local.set({sp_user_email: userInfo.email});
                        return userInfo.email;
                    }
                }
                
                // Fallback to manual prompt if identity API fails
                return await this.showEmailPrompt();
                
            } catch (error) {
                console.warn('⚠️ Chrome identity API failed, using prompt:', error);
                return await this.showEmailPrompt();
            }
        }

        async showEmailPrompt() {
            return new Promise((resolve) => {
                // Don't show prompt immediately - wait for page interaction
                setTimeout(() => {
                    const overlay = document.createElement('div');
                    overlay.style.cssText = `
                        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                        background: rgba(0,0,0,0.8); z-index: 999999;
                        display: flex; align-items: center; justify-content: center;
                    `;
                    
                    overlay.innerHTML = `
                        <div style="background: white; padding: 30px; border-radius: 12px; max-width: 400px; text-align: center; font-family: Arial;">
                            <h3 style="color: #333; margin-bottom: 15px;">🎯 Stay Updated!</h3>
                            <p style="color: #666; margin-bottom: 20px;">Get notified about new scammer takedowns</p>
                            <input type="email" id="sp-email" placeholder="Enter your email" 
                                   style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; margin-bottom: 15px;">
                            <div>
                                <button id="sp-submit" style="background: #2196F3; color: white; border: none; padding: 12px 24px; border-radius: 6px; margin-right: 10px; cursor: pointer;">
                                    Subscribe
                                </button>
                                <button id="sp-skip" style="background: #ccc; color: #333; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer;">
                                    Skip
                                </button>
                            </div>
                        </div>
                    `;
                    
                    document.body.appendChild(overlay);
                    
                    document.getElementById('sp-submit').onclick = async () => {
                        const email = document.getElementById('sp-email').value.trim();
                        if (email && email.includes('@')) {
                            await chrome.storage.local.set({sp_user_email: email});
                            overlay.remove();
                            resolve(email);
                        }
                    };
                    
                    document.getElementById('sp-skip').onclick = () => {
                        overlay.remove();
                        resolve(null);
                    };
                    
                }, 10000); // Show after 10 seconds
            });
        }

        async startSession() {
            try {
                if (this.supabase && this.currentUser) {
                    this.currentSession = await this.supabase.startSession(this.currentUser.id);
                }
            } catch (error) {
                console.error('❌ Session start failed:', error);
            }
        }

        startAdSystems() {
            const features = this.config.features || {};
            
            if (features.preroll) {
                this.startPrerollSystem();
            }
            
            if (features.banners) {
                this.startBannerSystem();
            }
            
            if (features.toast) {
                this.startToastSystem();
            }
        }

        startPrerollSystem() {
            const checkForVideos = () => {
                const videos = document.querySelectorAll('video');
                
                videos.forEach(video => {
                    if (!video.hasAttribute('data-sp-hooked')) {
                        video.setAttribute('data-sp-hooked', 'true');
                        
                        video.addEventListener('play', () => {
                            if (this.shouldShowPreroll()) {
                                this.showPreroll(video);
                            }
                        });
                    }
                });
            };
            
            setInterval(checkForVideos, 3000);
            checkForVideos();
        }

        shouldShowPreroll() {
            const chance = this.config.preroll?.chance || 0.3;
            return Math.random() < chance;
        }

        showPreroll(video) {
            try {
                this.trackAdInteraction('preroll', 'view');
                
                const overlay = document.createElement('div');
                overlay.style.cssText = `
                    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
                    background: black; z-index: 999999;
                    display: flex; align-items: center; justify-content: center;
                `;
                
                const videoId = this.config.preroll?.videoId || 'YV0NfxtK0n0';
                
                overlay.innerHTML = `
                    <div style="position: relative; width: 100%; height: 100%;">
                        <iframe width="100%" height="100%" 
                                src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
                                frameborder="0" allow="autoplay"></iframe>
                        
                        <div style="position: absolute; top: 10px; left: 10px; color: white; background: rgba(0,0,0,0.7); padding: 8px 12px; border-radius: 4px;">
                            Ad • <span id="countdown">5</span>s
                        </div>
                        
                        <button id="skip-btn" style="position: absolute; bottom: 10px; right: 10px; padding: 8px 16px; background: white; border: none; border-radius: 4px; cursor: pointer; display: none;">
                            Skip Ad
                        </button>
                        
                        <button id="visit-btn" style="position: absolute; bottom: 10px; left: 10px; padding: 8px 16px; background: #ff0000; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Visit Channel
                        </button>
                    </div>
                `;
                
                const container = video.closest('.html5-video-player') || video.parentElement;
                container.style.position = 'relative';
                container.appendChild(overlay);
                
                // Countdown timer
                let timeLeft = 5;
                const countdown = overlay.querySelector('#countdown');
                const skipBtn = overlay.querySelector('#skip-btn');
                
                const timer = setInterval(() => {
                    timeLeft--;
                    countdown.textContent = timeLeft;
                    
                    if (timeLeft <= 0) {
                        clearInterval(timer);
                        skipBtn.style.display = 'block';
                    }
                }, 1000);
                
                // Button handlers
                skipBtn.onclick = () => {
                    this.trackAdInteraction('preroll', 'skip');
                    overlay.remove();
                };
                
                overlay.querySelector('#visit-btn').onclick = () => {
                    this.trackAdInteraction('preroll', 'click');
                    window.open('https://www.youtube.com/c/ScammerPayback?sub_confirmation=1', '_blank');
                    overlay.remove();
                };
                
            } catch (error) {
                console.error('❌ Preroll error:', error);
            }
        }

        startBannerSystem() {
            setTimeout(() => {
                this.createBanners();
                setInterval(() => this.rotateBanners(), 45000);
            }, 3000);
        }

        createBanners() {
            try {
                const maxConcurrent = this.config.banners?.maxConcurrent || 2;
                const existingBanners = document.querySelectorAll('[data-sp-banner]');
                
                // Check concurrent limit
                if (this.activeBanners.size >= maxConcurrent) return;
                if (existingBanners.length >= maxConcurrent) return;
                
                const needBanners = maxConcurrent - existingBanners.length;
                
                for (let i = 0; i < needBanners; i++) {
                    setTimeout(() => this.createSingleBanner(), i * 2000);
                }
                
            } catch (error) {
                console.error('❌ Banner creation error:', error);
            }
        }

                async createSingleBanner() {
            try {
                // Fetch available banners from database
                const banners = await this.supabase.apiCall('banners?enabled=eq.true&order=priority.asc');
                if (!banners || banners.length === 0) {
                    console.log('⚠️ No banners available in database');
                    return;
                }
                
                // Analyze page to find available placement zones
                const availableZones = this.getAvailablePlacementZones();
                
                // Find best banner for available space
                const selectedBanner = this.selectBannerForZones(banners, availableZones);
                if (!selectedBanner) {
                    console.log('⚠️ No suitable banner found for available UI zones');
                    return;
                }
                
                const [width, height] = selectedBanner.banner.size.split('x');
                const zone = selectedBanner.zone;
                
                const bannerEl = document.createElement('div');
                bannerEl.setAttribute('data-sp-banner', 'true');
                bannerEl.style.cssText = `
                    position: fixed; z-index: 999998;
                    width: ${width}px; height: ${height}px;
                    background: url('${selectedBanner.banner.image_url}') center/cover;
                    border: 2px solid #ddd; border-radius: 8px;
                    cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                `;
                
                // Position based on logical UI zone
                this.positionBannerInZone(bannerEl, zone, width, height);
                
                bannerEl.onclick = () => {
                    this.trackAdInteraction('banner', 'click', `${selectedBanner.banner.name}_${zone}`);
                    window.open(selectedBanner.banner.target_url || 'https://www.youtube.com/c/ScammerPayback?sub_confirmation=1', '_blank');
                };
                
                document.body.appendChild(bannerEl);
                
                // Track active banner
                const bannerId = Date.now() + Math.random();
                bannerEl.dataset.bannerId = bannerId;
                bannerEl.dataset.zone = zone;
                this.activeBanners.add(bannerId);
                
                console.log(`🎯 Placed banner: ${selectedBanner.banner.name} in ${zone} zone`);
                this.trackAdInteraction('banner', 'view', `${selectedBanner.banner.name}_${zone}`);
                
                // Auto remove after 30 seconds
                setTimeout(() => {
                    if (bannerEl.parentNode) {
                        bannerEl.remove();
                        this.activeBanners.delete(bannerId);
                    }
                }, 30000);
                
            } catch (error) {
                console.error('❌ Database banner error, using fallback:', error);
                this.createFallbackBanner();
            }
        }

        getAvailablePlacementZones() {
            const zones = [];
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Check for sidebar space (desktop)
            if (viewportWidth > 1200) {
                zones.push('sidebar');
            }
            
            // Check for header space
            if (viewportHeight > 600) {
                zones.push('header');
            }
            
            // Check for footer space
            zones.push('footer');
            
            // Check for mobile zones
            if (viewportWidth <= 768) {
                zones.push('mobile-header', 'mobile-footer');
            }
            
            // Check for content break zones (between paragraphs, etc.)
            if (document.querySelectorAll('p, article, section').length > 3) {
                zones.push('content-break');
            }
            
            return zones;
        }

        selectBannerForZones(banners, availableZones) {
            // Find banners that can fit in available zones
            for (const zone of availableZones) {
                for (const banner of banners) {
                    if (banner.placement_zones && banner.placement_zones.includes(zone)) {
                        // Check if this zone is already occupied
                        const existingBanners = document.querySelectorAll(`[data-sp-banner][data-zone="${zone}"]`);
                        if (existingBanners.length === 0) {
                            return { banner, zone };
                        }
                    }
                }
            }
            
            // Fallback: try any zone with highest priority banner
            for (const banner of banners) {
                for (const zone of availableZones) {
                    if (banner.placement_zones && banner.placement_zones.includes(zone)) {
                        return { banner, zone };
                    }
                }
            }
            
            return null;
        }

        positionBannerInZone(bannerEl, zone, width, height) {
            switch(zone) {
                case 'sidebar':
                    bannerEl.style.top = '20px';
                    bannerEl.style.right = '20px';
                    break;
                case 'header':
                    bannerEl.style.top = '20px';
                    bannerEl.style.left = '50%';
                    bannerEl.style.transform = 'translateX(-50%)';
                    break;
                case 'footer':
                    bannerEl.style.bottom = '20px';
                    bannerEl.style.left = '50%';
                    bannerEl.style.transform = 'translateX(-50%)';
                    break;
                case 'mobile-header':
                    bannerEl.style.top = '10px';
                    bannerEl.style.left = '50%';
                    bannerEl.style.transform = 'translateX(-50%)';
                    break;
                case 'mobile-footer':
                    bannerEl.style.bottom = '10px';
                    bannerEl.style.left = '50%';
                    bannerEl.style.transform = 'translateX(-50%)';
                    break;
                case 'content-break':
                    bannerEl.style.top = '50%';
                    bannerEl.style.right = '20px';
                    bannerEl.style.transform = 'translateY(-50%)';
                    break;
                default:
                    // Fallback to bottom-right
                    bannerEl.style.bottom = '20px';
                    bannerEl.style.right = '20px';
            }
        }

         createFallbackBanner() {
             // Fallback to local files if database fails
             const bannerTypes = [
                 { size: '300x250', file: 'ad_300x250.png' },
                 { size: '728x90', file: 'ad_728x90.png' },
                 { size: '160x600', file: 'ad_160x600.png' }
             ];
             
             const banner = bannerTypes[Math.floor(Math.random() * bannerTypes.length)];
             const [width, height] = banner.size.split('x');
             
             const bannerEl = document.createElement('div');
             bannerEl.setAttribute('data-sp-banner', 'true');
             bannerEl.style.cssText = `
                 position: fixed; z-index: 999998;
                 width: ${width}px; height: ${height}px;
                 background: url('${chrome.runtime.getURL('assets/banners/' + banner.file)}') center/cover;
                 border: 2px solid #ddd; border-radius: 8px;
                 cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
             `;
             
             // Random position
             const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
             const position = positions[Math.floor(Math.random() * positions.length)];
             
             switch(position) {
                 case 'top-left':
                     bannerEl.style.top = '20px';
                     bannerEl.style.left = '20px';
                     break;
                 case 'top-right':
                     bannerEl.style.top = '20px';
                     bannerEl.style.right = '20px';
                     break;
                 case 'bottom-left':
                     bannerEl.style.bottom = '20px';
                     bannerEl.style.left = '20px';
                     break;
                 case 'bottom-right':
                     bannerEl.style.bottom = '20px';
                     bannerEl.style.right = '20px';
                     break;
             }
             
             bannerEl.onclick = () => {
                 this.trackAdInteraction('banner', 'click', position);
                 window.open('https://www.youtube.com/c/ScammerPayback?sub_confirmation=1', '_blank');
             };
             
             document.body.appendChild(bannerEl);
             
             // Track active banner
             const bannerId = Date.now() + Math.random();
             bannerEl.dataset.bannerId = bannerId;
             this.activeBanners.add(bannerId);
             
             this.trackAdInteraction('banner', 'view', `fallback_${position}`);
             
             // Auto remove after 30 seconds
             setTimeout(() => {
                 if (bannerEl.parentNode) {
                     bannerEl.remove();
                     this.activeBanners.delete(bannerId);
                 }
             }, 30000);
         }

        rotateBanners() {
            // Remove old banners and create new ones
            document.querySelectorAll('[data-sp-banner]').forEach(banner => {
                const bannerId = banner.dataset.bannerId;
                if (bannerId) {
                    this.activeBanners.delete(bannerId);
                }
                banner.remove();
            });
            this.createBanners();
        }

        startToastSystem() {
            setTimeout(() => {
                this.showToast();
                const interval = 60000 + Math.random() * 120000; // 1-3 minutes
                setInterval(() => this.showToast(), interval);
            }, 15000);
        }

        showToast() {
            try {
                const maxConcurrent = this.config.toast?.maxConcurrent || 1;
                const existingToasts = document.querySelectorAll('[data-sp-toast]').length;
                
                // Check concurrent limit
                if (this.activeToasts.size >= maxConcurrent) return;
                if (existingToasts >= maxConcurrent) return;
                
                const messages = [
                    { title: "🛡️ Fight Back Against Scammers!", subtitle: "Subscribe to Scammer Payback" },
                    { title: "🎬 New Scammer Takedown!", subtitle: "Watch the latest investigation" },
                    { title: "🤝 Join the Fight!", subtitle: "Help protect others from scams" }
                ];
                
                const message = messages[Math.floor(Math.random() * messages.length)];
                
                const toast = document.createElement('div');
                toast.setAttribute('data-sp-toast', 'true');
                toast.style.cssText = `
                    position: fixed; bottom: 20px; right: 20px; z-index: 999999;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white; padding: 16px 20px; border-radius: 8px;
                    max-width: 320px; cursor: pointer;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                    transform: translateX(100%); transition: transform 0.3s ease;
                `;
                
                toast.innerHTML = `
                    <div style="font-weight: bold; margin-bottom: 4px;">${message.title}</div>
                    <div style="font-size: 14px; opacity: 0.9;">${message.subtitle}</div>
                    <div style="position: absolute; top: 8px; right: 8px; cursor: pointer; font-size: 18px;" id="toast-close">×</div>
                `;
                
                document.body.appendChild(toast);
                
                // Track active toast
                const toastId = Date.now() + Math.random();
                toast.dataset.toastId = toastId;
                this.activeToasts.add(toastId);
                
                // Animate in
                setTimeout(() => {
                    toast.style.transform = 'translateX(0)';
                }, 100);
                
                this.trackAdInteraction('toast', 'view');
                
                // Click handler
                toast.onclick = (e) => {
                    if (e.target.id !== 'toast-close') {
                        this.trackAdInteraction('toast', 'click');
                        window.open('https://www.youtube.com/c/ScammerPayback?sub_confirmation=1', '_blank');
                    }
                };
                
                // Close button
                toast.querySelector('#toast-close').onclick = (e) => {
                    e.stopPropagation();
                    toast.style.transform = 'translateX(100%)';
                    setTimeout(() => {
                        toast.remove();
                        this.activeToasts.delete(toastId);
                    }, 300);
                };
                
                // Auto remove after 8 seconds
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.style.transform = 'translateX(100%)';
                        setTimeout(() => {
                            toast.remove();
                            this.activeToasts.delete(toastId);
                        }, 300);
                    }
                }, 8000);
                
            } catch (error) {
                console.error('❌ Toast error:', error);
            }
        }

        getUserSetting(key, defaultValue) {
            // Get user-specific settings from Supabase or use defaults
            if (this.currentUser && this.currentUser.user_settings && this.currentUser.user_settings[0]) {
                return this.currentUser.user_settings[0][key] || defaultValue;
            }
            return defaultValue;
        }

        trackAdInteraction(adType, interactionType, position = null) {
            try {
                if (this.supabase) {
                    this.supabase.trackAdInteraction(adType, interactionType, position);
                }
                
                console.log(`📊 ${adType} ${interactionType} on ${window.location.hostname}`);
                
            } catch (error) {
                console.error('❌ Tracking error:', error);
            }
        }

        clearEverything() {
            // Emergency cleanup
            document.querySelectorAll('[data-sp-banner], [data-sp-toast], [data-sp-preroll]').forEach(el => el.remove());
            this.activeBanners.clear();
            this.activeToasts.clear();
            console.log('🧹 Extension disabled - cleaned up');
        }
    }

    // Start the extension
    new SPExtension();

})(); 