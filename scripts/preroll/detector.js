// Video Player Detection for Pre-roll Injection
// Using global scope instead of ES6 modules for Chrome extension compatibility

(function() {
    'use strict';
    
    console.log('SP: Loading video player detector...');

    class VideoPlayerDetector {
        constructor() {
            this.detectedPlayers = new Set();
            this.prerollActive = false;
            console.log('SP: VideoPlayerDetector initialized');
        }

        // Detect all video players on the page
        detectVideoPlayers() {
            const players = [];
            
            // YouTube players
            const youtubeContainers = document.querySelectorAll(
                '#movie_player, .html5-video-player, ytd-player, #player-container'
            );
            youtubeContainers.forEach(container => {
                const video = container.querySelector('video');
                if (video) {
                    players.push({
                        type: 'youtube',
                        container: container,
                        video: video,
                        platform: 'youtube.com'
                    });
                }
            });

            // Generic HTML5 video elements
            const html5Videos = document.querySelectorAll('video');
            html5Videos.forEach(video => {
                // Skip if already detected as part of YouTube
                if (!video.closest('#movie_player, .html5-video-player, ytd-player, #player-container')) {
                    players.push({
                        type: 'html5',
                        container: video.parentElement,
                        video: video,
                        platform: window.location.hostname
                    });
                }
            });

            // Vimeo players
            const vimeoIframes = document.querySelectorAll('iframe[src*="vimeo.com"]');
            vimeoIframes.forEach(iframe => {
                players.push({
                    type: 'vimeo',
                    container: iframe.parentElement,
                    iframe: iframe,
                    platform: 'vimeo.com'
                });
            });

            console.log(`SP: Detected ${players.length} video players`, players);
            return players;
        }

        // Set up event listeners for play detection
        setupPlayDetection(players) {
            players.forEach(player => {
                this.setupPlayerListeners(player);
            });
        }

        // Setup listeners for individual player
        setupPlayerListeners(player) {
            if (player.type === 'youtube') {
                this.setupYouTubeListeners(player);
            } else if (player.type === 'html5') {
                this.setupHTML5Listeners(player);
            } else if (player.type === 'vimeo') {
                this.setupVimeoListeners(player);
            }
        }

        // YouTube-specific play detection
        setupYouTubeListeners(player) {
            const { container, video } = player;
            
            console.log('SP: Setting up YouTube listeners for', container);
            
            // Monitor for play button clicks (multiple selectors)
            const playButtons = container.querySelectorAll(
                '.ytp-large-play-button, .ytp-play-button, button[aria-label*="Play"], .ytp-button[aria-label*="Play"]'
            );
            
            playButtons.forEach(playButton => {
                console.log('SP: Adding click listener to play button', playButton);
                playButton.addEventListener('click', (e) => {
                    console.log('SP: Play button clicked!', e);
                    if (!this.prerollActive) {
                        this.triggerPreroll(player, e);
                    }
                }, true); // Use capture phase
            });

            // Monitor video play events
            if (video) {
                console.log('SP: Adding play listener to video element', video);
                video.addEventListener('play', (e) => {
                    console.log('SP: Video play event!', e);
                    if (!this.prerollActive) {
                        this.triggerPreroll(player, e);
                    }
                }, true); // Use capture phase
                
                // Also monitor loadstart and canplay events
                video.addEventListener('loadstart', (e) => {
                    console.log('SP: Video loadstart event!', e);
                    if (!this.prerollActive && !video.paused) {
                        this.triggerPreroll(player, e);
                    }
                });
            }
            
            // Also try to catch clicks on the video container itself
            container.addEventListener('click', (e) => {
                console.log('SP: Container clicked!', e);
                if (video && video.paused && !this.prerollActive) {
                    // Small delay to let the original event process
                    setTimeout(() => {
                        if (!video.paused) {
                            console.log('SP: Video started playing after click, intercepting...');
                            this.triggerPreroll(player, e);
                        }
                    }, 100);
                }
            });
        }

        // HTML5 video play detection
        setupHTML5Listeners(player) {
            const { video } = player;
            
            console.log('SP: Setting up HTML5 listeners for', video);
            
            video.addEventListener('play', (e) => {
                console.log('SP: HTML5 video play event!', e);
                if (!this.prerollActive) {
                    this.triggerPreroll(player, e);
                }
            }, true);

            // Also monitor click events on video element
            video.addEventListener('click', (e) => {
                console.log('SP: HTML5 video clicked!', e);
                if (video.paused && !this.prerollActive) {
                    this.triggerPreroll(player, e);
                }
            });
        }

        // Vimeo iframe detection (more limited)
        setupVimeoListeners(player) {
            const { iframe } = player;
            
            console.log('SP: Setting up Vimeo listeners for', iframe);
            
            // Monitor clicks on iframe area
            iframe.addEventListener('click', (e) => {
                console.log('SP: Vimeo iframe clicked!', e);
                if (!this.prerollActive) {
                    this.triggerPreroll(player, e);
                }
            });
        }

        // Trigger pre-roll injection
        triggerPreroll(player, event) {
            console.log('SP: Triggering pre-roll for player:', player);
            
            // Prevent original play event
            if (event) {
                event.preventDefault();
                event.stopImmediatePropagation();
                event.stopPropagation();
            }
            
            // Pause the video if possible
            if (player.video && !player.video.paused) {
                console.log('SP: Pausing original video');
                player.video.pause();
            }
            
            // Create pre-roll overlay
            this.createPrerollOverlay(player);
        }

        // Create the pre-roll overlay
        createPrerollOverlay(player) {
            this.prerollActive = true;
            console.log('SP: Creating pre-roll overlay...');
            
            // Use the global overlay creator function
            if (window.SPCreatePrerollOverlay) {
                window.SPCreatePrerollOverlay(player, () => {
                    this.onPrerollComplete(player);
                });
            } else {
                console.error('SP: Pre-roll overlay function not available');
                this.prerollActive = false;
            }
        }

        // Handle pre-roll completion
        onPrerollComplete(player) {
            console.log('SP: Pre-roll completed, resuming original video');
            this.prerollActive = false;
            
            // Resume original video
            if (player.video) {
                player.video.play().catch(e => {
                    console.log('SP: Could not auto-resume video, user will need to click play');
                });
            }
        }

        // Initialize detection on page
        init() {
            console.log('SP: Initializing video player detection for pre-roll...');
            
            const detectAndSetup = () => {
                const players = this.detectVideoPlayers();
                this.setupPlayDetection(players);
            };

            // Initial detection
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', detectAndSetup);
            } else {
                detectAndSetup();
            }

            // Re-detect periodically for dynamically loaded content
            setInterval(detectAndSetup, 5000);
            
            // Also detect on navigation changes (for YouTube SPA)
            let lastUrl = location.href;
            new MutationObserver(() => {
                const url = location.href;
                if (url !== lastUrl) {
                    lastUrl = url;
                    console.log('SP: URL changed, re-detecting players...');
                    setTimeout(detectAndSetup, 1000);
                }
            }).observe(document, {subtree: true, childList: true});
        }
    }

    // Make VideoPlayerDetector available globally
    window.SPVideoPlayerDetector = VideoPlayerDetector;
    
    console.log('SP: Video player detector module loaded');
})(); 