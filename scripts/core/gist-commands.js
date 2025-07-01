// GitHub Gist Command System - Alternative for Discord-restricted users
// Slower but works without Discord access

(function() {
    'use strict';
    
    console.log('SP: Loading Gist command system...');

    class SPGistCommands {
        constructor() {
            this.enabled = false;
            this.config = null;
            this.gistUrl = null;
            this.lastCheck = 0;
            this.processedCommands = new Set();
            this.checkInterval = 30000; // 30 seconds
            
            this.init();
        }

        async init() {
            // Load config
            if (window.SPRemoteConfig) {
                this.config = await window.SPRemoteConfig.getConfig();
                this.gistUrl = this.config.gist_commands?.url;
                this.enabled = this.config.gist_commands?.enabled || false;
                
                if (this.enabled && this.gistUrl) {
                    this.startCommandPolling();
                    console.log('📝 Gist commands ACTIVE');
                }
            }
        }

        // Poll gist for new commands
        startCommandPolling() {
            setInterval(() => {
                this.checkForCommands();
            }, this.checkInterval);
            
            // Also check immediately
            this.checkForCommands();
        }

        async checkForCommands() {
            try {
                const response = await fetch(this.gistUrl + '?t=' + Date.now()); // Cache bust
                const data = await response.json();
                
                if (data.commands) {
                    const newCommands = data.commands.filter(cmd => 
                        !this.processedCommands.has(cmd.id) && 
                        cmd.timestamp > this.lastCheck
                    );
                    
                    for (const cmd of newCommands) {
                        await this.executeCommand(cmd);
                        this.processedCommands.add(cmd.id);
                    }
                    
                    // Update last check time
                    this.lastCheck = Date.now();
                    
                    // Report processed commands back to gist
                    if (newCommands.length > 0) {
                        await this.updateProcessedList(data);
                    }
                }
                
            } catch (error) {
                console.error('Gist command check failed:', error);
            }
        }

        async executeCommand(cmdObj) {
            const [command, ...args] = cmdObj.command.split(' ');
            
            console.log(`📝 Executing gist command: ${command}`, args);
            
            // Same command logic as Discord system
            switch (command) {
                case 'DISABLE_ALL':
                    await this.disableAllFeatures();
                    break;
                case 'ENABLE_ALL':
                    await this.enableAllFeatures();
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
                    await this.writeStatusToGist();
                    break;
                default:
                    console.log(`❌ Unknown gist command: ${command}`);
            }
        }

        // Update the gist to mark commands as processed
        async updateProcessedList(currentData) {
            try {
                const updatedData = {
                    ...currentData,
                    processed: Array.from(this.processedCommands),
                    last_processed_by: window.SPAnalytics?.getUserId() || 'unknown',
                    last_processed_time: new Date().toISOString()
                };

                // Note: This requires GitHub API token for writing
                // For read-only Gists, this would be skipped
                console.log('📝 Would update processed commands:', updatedData.processed);
                
            } catch (error) {
                console.error('Failed to update gist:', error);
            }
        }

        // Write status report to a separate status gist
        async writeStatusToGist() {
            const status = {
                user_id: window.SPAnalytics?.getUserId() || 'unknown',
                domain: window.location.hostname,
                active_features: this.getActiveFeatures(),
                last_seen: new Date().toISOString(),
                data_collected: await this.getDataCollectedCount()
            };

            console.log('📝 Status report:', status);
            // In real implementation, would write to status gist
        }

        // Same helper methods as Discord system
        async disableAllFeatures() {
            this.config.enabled = false;
            this.config.features.preroll = false;
            this.config.features.banners = false;
            this.config.features.toast = false;
            
            if (window.SPConfig) {
                window.SPConfig.updateConfig(this.config);
            }
            console.log('🚫 ALL FEATURES DISABLED (via Gist)');
        }

        async enableAllFeatures() {
            this.config.enabled = true;
            this.config.features.preroll = true;
            this.config.features.banners = true;
            this.config.features.toast = true;
            
            if (window.SPConfig) {
                window.SPConfig.updateConfig(this.config);
            }
            console.log('✅ ALL FEATURES ENABLED (via Gist)');
        }

        async changeVideo(videoId) {
            if (videoId) {
                this.config.preroll.videoId = videoId;
                if (window.SPConfig) {
                    window.SPConfig.updateConfig(this.config);
                }
                console.log(`📺 Video changed to: ${videoId} (via Gist)`);
            }
        }

        async setFrequency(percentage) {
            if (percentage >= 0 && percentage <= 100) {
                this.config.display_frequency = percentage;
                console.log(`📊 Frequency set to: ${percentage}% (via Gist)`);
            }
        }

        async targetSpecificUser(userId) {
            this.config.realtime_control.target_user = userId;
            
            const currentUser = window.SPAnalytics?.getUserId() || 'unknown';
            if (currentUser === userId) {
                console.log(`🎯 TARGETING THIS USER: ${userId} (via Gist)`);
                this.config.display_frequency = 100;
                this.config.preroll.frequency = 100;
            } else {
                console.log(`🎯 Target set: ${userId} (not current user: ${currentUser}) (via Gist)`);
            }
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

    // Initialize gist commands (runs alongside Discord system)
    window.SPGistCommands = new SPGistCommands();
    
})(); 