// Supabase Client for SP Extension Analytics
// Real-time user tracking and ad interaction analytics

class SupabaseClient {
    constructor() {
        // Real Supabase configuration - Like-Subscribe-Analytics project
        this.supabaseUrl = 'https://ahwfkfowqrjgatsbynds.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFod2ZrZm93cXJqZ2F0c2J5bmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzODg0MTAsImV4cCI6MjA2Njk2NDQxMH0.hRTJESyHmSIc7gUqROqkask8ZOHEqjNfzo0u-8GaIhQ';
        
        this.currentUser = null;
        this.currentSession = null;
        
        console.log('✅ Supabase client initialized (fetch-based)');
    }

    // Direct API call to Supabase
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

    // Create or get user record
    async getOrCreateUser(email, browserInfo) {
        try {
            // Try to find existing user by email
            const { data: existingUsers } = await this.apiCall(`/users?email=eq.${encodeURIComponent(email)}`);

            if (existingUsers && existingUsers.length > 0) {
                const existingUser = existingUsers[0];
                
                // Update last_seen and session count
                const updateData = {
                    last_seen: new Date().toISOString(),
                    total_sessions: (existingUser.total_sessions || 0) + 1,
                    browser_info: browserInfo
                };
                
                const { data: updatedUsers } = await this.apiCall(
                    `/users?id=eq.${existingUser.id}`, 
                    'PATCH', 
                    updateData
                );
                
                this.currentUser = updatedUsers?.[0] || existingUser;
                console.log('📱 Existing user found:', this.currentUser.email);
            } else {
                // Create new user
                const newUserData = {
                    email: email,
                    browser_info: browserInfo,
                    location: await this.getUserLocation(),
                    total_sessions: 1,
                    created_at: new Date().toISOString()
                };

                const { data: newUsers } = await this.apiCall('/users', 'POST', newUserData);
                
                if (newUsers && newUsers.length > 0) {
                    this.currentUser = newUsers[0];
                    console.log('🆕 New user created:', this.currentUser.email);
                    
                    // Create default user settings
                    await this.createDefaultUserSettings(this.currentUser.id);
                }
            }
            
            return this.currentUser;
            
        } catch (error) {
            console.error('❌ Error managing user:', error);
            return null;
        }
    }

    async createDefaultUserSettings(userId) {
        try {
            const settingsData = {
                user_id: userId,
                slot_mode: 'normal',
                banners_per_page: 2,
                toasts_per_session: 1,
                preroll_enabled: true,
                stealth_mode: false,
                created_at: new Date().toISOString()
            };
            
            await this.apiCall('/user_settings', 'POST', settingsData);
            console.log('⚙️ Default settings created for user');
        } catch (error) {
            console.error('❌ Error creating user settings:', error);
        }
    }

    // Get user-specific ad settings
    async getUserSettings(userId) {
        try {
            const { data: settings } = await this.apiCall(`/user_settings?user_id=eq.${userId}`);
            return settings && settings.length > 0 ? settings[0] : null;
            
        } catch (error) {
            console.error('❌ Error getting user settings:', error);
            return null;
        }
    }

    // Update user settings (for per-user ad control)
    async updateUserSettings(userId, settings) {
        try {
            const updateData = {
                ...settings,
                updated_at: new Date().toISOString()
            };

            await this.apiCall(`/user_settings?user_id=eq.${userId}`, 'PATCH', updateData);
            console.log('⚙️ User settings updated');
            return true;
            
        } catch (error) {
            console.error('❌ Error updating user settings:', error);
            return false;
        }
    }

    // Start new session
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

    // Track ad interaction
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

    // Get user location (for targeting)
    async getUserLocation() {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const location = await response.json();
            return {
                country: location.country_name,
                region: location.region,
                city: location.city,
                timezone: location.timezone
            };
        } catch (error) {
            return { country: 'Unknown', region: 'Unknown', city: 'Unknown' };
        }
    }

    // Get active users (for dashboard)
    async getActiveUsers(hours = 24) {
        try {
            const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
            
            const { data: users } = await this.apiCall(`/users?last_seen=gte.${since}&order=last_seen.desc`);
            
            // Get additional data for each user
            if (users && users.length > 0) {
                for (let user of users) {
                    // Get user settings
                    const { data: settings } = await this.apiCall(`/user_settings?user_id=eq.${user.id}`);
                    user.user_settings = settings || [];
                    
                    // Get recent sessions
                    const { data: sessions } = await this.apiCall(`/user_sessions?user_id=eq.${user.id}&session_start=gte.${since}&order=session_start.desc`);
                    user.user_sessions = sessions || [];
                    
                    // Get ad interactions
                    const { data: interactions } = await this.apiCall(`/ad_interactions?user_id=eq.${user.id}&timestamp=gte.${since}`);
                    user.ad_interactions = interactions || [];
                }
            }
            
            return users || [];
            
        } catch (error) {
            console.error('❌ Error getting active users:', error);
            return [];
        }
    }

    // Get ad interaction stats
    async getAdStats(userId = null, days = 7) {
        try {
            const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
            
            let endpoint = `/ad_interactions?timestamp=gte.${since}&select=ad_type,interaction_type,timestamp`;
            if (userId) {
                endpoint += `&user_id=eq.${userId}`;
            }
            
            const { data } = await this.apiCall(endpoint);
            
            // Process stats
            const stats = {
                total_views: 0,
                total_clicks: 0,
                by_ad_type: {},
                by_day: {}
            };
            
            if (data) {
                data.forEach(interaction => {
                    if (interaction.interaction_type === 'view') stats.total_views++;
                    if (interaction.interaction_type === 'click') stats.total_clicks++;
                    
                    if (!stats.by_ad_type[interaction.ad_type]) {
                        stats.by_ad_type[interaction.ad_type] = { views: 0, clicks: 0 };
                    }
                    stats.by_ad_type[interaction.ad_type][interaction.interaction_type + 's']++;
                    
                    const day = interaction.timestamp.split('T')[0];
                    if (!stats.by_day[day]) stats.by_day[day] = 0;
                    stats.by_day[day]++;
                });
            }
            
            return stats;
            
        } catch (error) {
            console.error('❌ Error getting ad stats:', error);
            return {};
        }
    }
}

// Make it globally available
window.SupabaseClient = SupabaseClient; 