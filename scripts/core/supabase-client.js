// Supabase Client for SP Extension Analytics
// Real-time user tracking and ad interaction analytics

class SupabaseClient {
    constructor() {
        // Real Supabase configuration - Like-Subscribe-Analytics project
        this.supabaseUrl = 'https://ahwfkfowqrjgatsbynds.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFod2ZrZm93cXJqZ2F0c2J5bmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzODg0MTAsImV4cCI6MjA2Njk2NDQxMH0.hRTJESyHmSIc7gUqROqkask8ZOHEqjNfzo0u-8GaIhQ';
        
        this.client = null;
        this.currentUser = null;
        this.currentSession = null;
        
        this.init();
    }

    async init() {
        try {
            // Load Supabase library if not already loaded
            if (typeof window.supabase === 'undefined') {
                await this.loadSupabaseLibrary();
            }
            
            this.client = window.supabase.createClient(this.supabaseUrl, this.supabaseKey);
            console.log('✅ Connected to Supabase database');
            
        } catch (error) {
            console.error('❌ Failed to initialize Supabase:', error);
        }
    }

    async loadSupabaseLibrary() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@supabase/supabase-js@2';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Create or get user record
    async getOrCreateUser(email, browserInfo) {
        if (!this.client) await this.init();
        
        try {
            // Try to find existing user by email
            let { data: existingUser, error } = await this.client
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (existingUser) {
                // Update last_seen and session count
                const { data: updatedUser } = await this.client
                    .from('users')
                    .update({ 
                        last_seen: new Date().toISOString(),
                        total_sessions: existingUser.total_sessions + 1,
                        browser_info: browserInfo
                    })
                    .eq('id', existingUser.id)
                    .select()
                    .single();
                
                this.currentUser = updatedUser || existingUser;
                console.log('📱 Existing user found:', this.currentUser.email);
            } else {
                // Create new user
                const { data: newUser, error: createError } = await this.client
                    .from('users')
                    .insert({
                        email: email,
                        browser_info: browserInfo,
                        location: await this.getUserLocation(),
                        total_sessions: 1
                    })
                    .select()
                    .single();

                if (createError) throw createError;
                
                this.currentUser = newUser;
                console.log('🆕 New user created:', this.currentUser.email);
                
                // Create default user settings
                await this.createDefaultUserSettings(newUser.id);
            }
            
            return this.currentUser;
            
        } catch (error) {
            console.error('❌ Error managing user:', error);
            return null;
        }
    }

    async createDefaultUserSettings(userId) {
        try {
            await this.client
                .from('user_settings')
                .insert({
                    user_id: userId,
                    slot_mode: 'normal',
                    banners_per_page: 2,
                    toasts_per_session: 1,
                    preroll_enabled: true,
                    stealth_mode: false
                });
            
            console.log('⚙️ Default settings created for user');
        } catch (error) {
            console.error('❌ Error creating user settings:', error);
        }
    }

    // Get user-specific ad settings
    async getUserSettings(userId) {
        if (!this.client) return null;
        
        try {
            const { data, error } = await this.client
                .from('user_settings')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) throw error;
            return data;
            
        } catch (error) {
            console.error('❌ Error getting user settings:', error);
            return null;
        }
    }

    // Update user settings (for per-user ad control)
    async updateUserSettings(userId, settings) {
        if (!this.client) return false;
        
        try {
            const { error } = await this.client
                .from('user_settings')
                .update({
                    ...settings,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId);

            if (error) throw error;
            console.log('⚙️ User settings updated');
            return true;
            
        } catch (error) {
            console.error('❌ Error updating user settings:', error);
            return false;
        }
    }

    // Start new session
    async startSession(userId) {
        if (!this.client || !userId) return;
        
        try {
            const { data, error } = await this.client
                .from('user_sessions')
                .insert({
                    user_id: userId,
                    session_start: new Date().toISOString(),
                    pages_visited: 1,
                    sites_visited: [window.location.hostname]
                })
                .select()
                .single();

            if (error) throw error;
            
            this.currentSession = data;
            console.log('🚀 Session started:', this.currentSession.id);
            return this.currentSession;
            
        } catch (error) {
            console.error('❌ Error starting session:', error);
        }
    }

    // Track ad interaction
    async trackAdInteraction(adType, interactionType, adPosition = null) {
        if (!this.client || !this.currentUser || !this.currentSession) return;
        
        try {
            await this.client
                .from('ad_interactions')
                .insert({
                    user_id: this.currentUser.id,
                    session_id: this.currentSession.id,
                    ad_type: adType,
                    ad_position: adPosition,
                    interaction_type: interactionType,
                    site_domain: window.location.hostname,
                    page_url: window.location.href
                });

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
        if (!this.client) return [];
        
        try {
            const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
            
            const { data, error } = await this.client
                .from('users')
                .select(`
                    *,
                    user_settings (*),
                    user_sessions!inner (session_start, session_end, pages_visited),
                    ad_interactions (ad_type, interaction_type)
                `)
                .gte('last_seen', since)
                .order('last_seen', { ascending: false });

            if (error) throw error;
            return data;
            
        } catch (error) {
            console.error('❌ Error getting active users:', error);
            return [];
        }
    }

    // Get ad interaction stats
    async getAdStats(userId = null, days = 7) {
        if (!this.client) return {};
        
        try {
            const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
            
            let query = this.client
                .from('ad_interactions')
                .select('ad_type, interaction_type, timestamp')
                .gte('timestamp', since);
                
            if (userId) {
                query = query.eq('user_id', userId);
            }
            
            const { data, error } = await query;
            if (error) throw error;
            
            // Process stats
            const stats = {
                total_views: 0,
                total_clicks: 0,
                by_ad_type: {},
                by_day: {}
            };
            
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
            
            return stats;
            
        } catch (error) {
            console.error('❌ Error getting ad stats:', error);
            return {};
        }
    }
}

// Make it globally available
window.SupabaseClient = SupabaseClient; 