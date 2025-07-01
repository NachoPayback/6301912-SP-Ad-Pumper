// SP Extension Dashboard Configuration
// Set these environment variables in Vercel or uncomment and set manually

// window.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_TOKEN';
// window.GITHUB_CONFIG_URL = 'https://raw.githubusercontent.com/NachoPayback/6301912-SP-Ad-Pumper/master/config.json';
// window.DATA_ENDPOINT = 'https://your-api-endpoint.com/api';

// Dashboard Configuration
// Connects to Supabase for real-time data

window.DASHBOARD_CONFIG = {
    // Supabase Configuration
    supabase: {
        url: 'https://ahwfkfowqrjgatsbynds.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFod2ZrZm93cXJqZ2F0c2J5bmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyMTk4OTEsImV4cCI6MjA1MDc5NTg5MX0.3q0NF2u-EmdMdlxMjPuJKy_LjY5L_bTJb8A7KGOV5jM',
        projectId: 'ahwfkfowqrjgatsbynds'
    },
    
    // Discord Integration 
    discord: {
        webhookUrl: window.DISCORD_WEBHOOK_URL || null,
        commandsGistUrl: 'https://api.github.com/gists/bf51c4e8a41e48d2cf3b89c1d1b6d12d'
    },
    
    // GitHub Config Repository
    github: {
        configUrl: window.GITHUB_CONFIG_URL || 'https://raw.githubusercontent.com/NachoPayback/6301912-SP-Ad-Pumper/master/config.json',
        rawBaseUrl: 'https://raw.githubusercontent.com/NachoPayback/6301912-SP-Ad-Pumper/master/'
    },
    
    // Default slot configurations
    slotPresets: {
        light: {
            name: 'Light Mode',
            bannersPerPage: 1,
            toastsPerSession: 0,
            prerollEnabled: true,
            stealthMode: false
        },
        normal: {
            name: 'Normal Mode',
            bannersPerPage: 2,
            toastsPerSession: 1,
            prerollEnabled: true,
            stealthMode: false
        },
        aggressive: {
            name: 'Aggressive Mode',
            bannersPerPage: 5,
            toastsPerSession: 3,
            prerollEnabled: true,
            stealthMode: false
        },
        stealth: {
            name: 'Stealth Mode',
            bannersPerPage: 0,
            toastsPerSession: 0,
            prerollEnabled: true,
            stealthMode: true
        }
    },
    
    // Update intervals
    updateIntervals: {
        userList: 15000,     // 15 seconds
        analytics: 30000,     // 30 seconds
        heartbeat: 60000      // 1 minute
    }
};

// Supabase REST API Client for Dashboard
class DashboardSupabase {
    constructor(config) {
        this.url = config.url;
        this.key = config.anonKey;
        this.headers = {
            'apikey': this.key,
            'Authorization': `Bearer ${this.key}`,
            'Content-Type': 'application/json'
        };
    }
    
    async getActiveUsers() {
        try {
            const response = await fetch(`${this.url}/rest/v1/users?select=*&order=last_seen.desc`, {
                headers: this.headers
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const users = await response.json();
            
            // Transform to dashboard format
            return users.map(user => ({
                id: user.id,
                email: user.email || 'N/A',
                domain: user.current_domain || 'unknown',
                lastSeen: this.formatLastSeen(user.last_seen),
                impressions: user.total_impressions || 0,
                targeted: user.is_targeted || false,
                status: user.is_active ? 'Active' : 'Inactive',
                location: user.location || 'Unknown',
                browser: user.browser_info || 'Unknown'
            }));
            
        } catch (error) {
            console.error('Failed to fetch active users:', error);
            return [];
        }
    }
    
    async getUserSettings(userId) {
        try {
            const response = await fetch(`${this.url}/rest/v1/user_settings?user_id=eq.${userId}`, {
                headers: this.headers
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const settings = await response.json();
            return settings[0] || null;
            
        } catch (error) {
            console.error('Failed to fetch user settings:', error);
            return null;
        }
    }
    
    async updateUserSettings(userId, settings) {
        try {
            const payload = {
                user_id: userId,
                slot_mode: settings.slotMode,
                banners_per_page: settings.bannersPerPage,
                toasts_per_session: settings.toastsPerSession,
                preroll_enabled: settings.prerollEnabled,
                stealth_mode: settings.stealthMode,
                updated_at: new Date().toISOString()
            };
            
            // Try to update first
            let response = await fetch(`${this.url}/rest/v1/user_settings?user_id=eq.${userId}`, {
                method: 'PATCH',
                headers: this.headers,
                body: JSON.stringify(payload)
            });
            
            // If no rows affected, insert new record
            if (response.ok) {
                const result = await response.text();
                if (!result) {
                    // No existing record, insert new one
                    response = await fetch(`${this.url}/rest/v1/user_settings`, {
                        method: 'POST',
                        headers: this.headers,
                        body: JSON.stringify(payload)
                    });
                }
            }
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return true;
            
        } catch (error) {
            console.error('Failed to update user settings:', error);
            return false;
        }
    }
    
    async getAnalyticsSummary() {
        try {
            const response = await fetch(`${this.url}/rest/v1/rpc/get_analytics_summary`, {
                method: 'POST',
                headers: this.headers
            });
            
            if (!response.ok) {
                // If RPC doesn't exist, calculate manually
                return await this.calculateAnalyticsSummary();
            }
            
            return await response.json();
            
        } catch (error) {
            console.error('Failed to fetch analytics summary:', error);
            return await this.calculateAnalyticsSummary();
        }
    }
    
    async calculateAnalyticsSummary() {
        try {
            // Get basic counts
            const [usersResponse, sessionsResponse, adsResponse] = await Promise.all([
                fetch(`${this.url}/rest/v1/users?select=count`, { headers: this.headers }),
                fetch(`${this.url}/rest/v1/user_sessions?select=count`, { headers: this.headers }),
                fetch(`${this.url}/rest/v1/ad_interactions?select=count`, { headers: this.headers })
            ]);
            
            const usersCount = await usersResponse.json();
            const sessionsCount = await sessionsResponse.json();
            const adsCount = await adsResponse.json();
            
            return {
                activeUsers: usersCount[0]?.count || 0,
                totalImpressions: adsCount[0]?.count || 0,
                sessionsToday: sessionsCount[0]?.count || 0,
                clickThrough: 2.5 // Placeholder - would need more complex calculation
            };
            
        } catch (error) {
            console.error('Failed to calculate analytics summary:', error);
            return {
                activeUsers: 0,
                totalImpressions: 0,
                sessionsToday: 0,
                clickThrough: 0
            };
        }
    }
    
    formatLastSeen(timestamp) {
        if (!timestamp) return 'Never';
        
        const now = new Date();
        const lastSeen = new Date(timestamp);
        const diffMs = now - lastSeen;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    }
}

// Initialize Supabase client
window.dashboardSupabase = new DashboardSupabase(window.DASHBOARD_CONFIG.supabase);

console.log('📊 Dashboard configuration loaded'); 