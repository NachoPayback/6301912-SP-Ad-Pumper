// Supabase client for Chrome extension
class SupabaseClient {
    constructor() {
        this.url = 'https://ahwfkfowqrjgatsbynds.supabase.co';
        this.key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFod2ZrZm93cXJqZ2F0c2J5bmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzODg0MTAsImV4cCI6MjA2Njk2NDQxMH0.hRTJESyHmSIc7gUqROqkask8ZOHEqjNfzo0u-8GaIhQ';
        this.currentUserId = null;
        this.currentSessionId = null;
    }

    // Make HTTP requests to Supabase REST API
    async request(path, options = {}) {
        const url = `${this.url}/rest/v1${path}`;
        const headers = {
            'apikey': this.key,
            'Authorization': `Bearer ${this.key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
            ...options.headers
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (!response.ok) {
                throw new Error(`Supabase error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Supabase request failed:', error);
            throw error;
        }
    }

    // Create or update user
    async upsertUser(userData) {
        try {
            const response = await this.request('/users', {
                method: 'POST',
                body: JSON.stringify({
                    email: userData.email,
                    real_name: userData.realName,
                    location: userData.location,
                    browser_info: userData.browserInfo,
                    last_seen: new Date().toISOString(),
                    total_sessions: 0
                }),
                headers: {
                    'Prefer': 'resolution=merge-duplicates'
                }
            });

            if (response && response.length > 0) {
                this.currentUserId = response[0].id;
                await this.ensureUserSettings(this.currentUserId);
                return response[0];
            }
        } catch (error) {
            console.error('Failed to upsert user:', error);
            return null;
        }
    }

    // Ensure user has settings record
    async ensureUserSettings(userId) {
        try {
            const existing = await this.request(`/user_settings?user_id=eq.${userId}`);
            
            if (!existing || existing.length === 0) {
                await this.request('/user_settings', {
                    method: 'POST',
                    body: JSON.stringify({
                        user_id: userId,
                        slot_mode: 'normal',
                        banners_per_page: 2,
                        toasts_per_session: 1,
                        preroll_enabled: true,
                        stealth_mode: false
                    })
                });
            }
        } catch (error) {
            console.error('Failed to ensure user settings:', error);
        }
    }

    // Start a new session
    async startSession(userId) {
        try {
            const response = await this.request('/user_sessions', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: userId,
                    session_start: new Date().toISOString(),
                    pages_visited: 0,
                    sites_visited: [window.location.hostname]
                })
            });

            if (response && response.length > 0) {
                this.currentSessionId = response[0].id;
                return response[0];
            }
        } catch (error) {
            console.error('Failed to start session:', error);
            return null;
        }
    }

    // Update session
    async updateSession(sessionId, updates) {
        try {
            await this.request(`/user_sessions?id=eq.${sessionId}`, {
                method: 'PATCH',
                body: JSON.stringify(updates)
            });
        } catch (error) {
            console.error('Failed to update session:', error);
        }
    }

    // Track ad interaction
    async trackAdInteraction(adType, interactionType, adPosition = null) {
        if (!this.currentUserId || !this.currentSessionId) {
            console.warn('No active user/session for ad tracking');
            return;
        }

        try {
            await this.request('/ad_interactions', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: this.currentUserId,
                    session_id: this.currentSessionId,
                    ad_type: adType,
                    ad_position: adPosition,
                    interaction_type: interactionType,
                    site_domain: window.location.hostname,
                    page_url: window.location.href,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (error) {
            console.error('Failed to track ad interaction:', error);
        }
    }

    // Get user settings
    async getUserSettings(userId) {
        try {
            const response = await this.request(`/user_settings?user_id=eq.${userId}`);
            return response && response.length > 0 ? response[0] : null;
        } catch (error) {
            console.error('Failed to get user settings:', error);
            return null;
        }
    }

    // Update user settings
    async updateUserSettings(userId, settings) {
        try {
            await this.request(`/user_settings?user_id=eq.${userId}`, {
                method: 'PATCH',
                body: JSON.stringify(settings)
            });
        } catch (error) {
            console.error('Failed to update user settings:', error);
        }
    }
}

// Export for use in other scripts
window.SupabaseClient = SupabaseClient; 