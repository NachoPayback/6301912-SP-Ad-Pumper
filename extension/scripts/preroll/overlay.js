// Pre-roll Overlay UI Component
// Using global scope instead of ES6 modules for Chrome extension compatibility

(function() {
    'use strict';
    
    console.log('SP: Loading pre-roll overlay module...');

    function createPrerollOverlay(player, onComplete) {
        console.log('SP: Creating pre-roll overlay for player:', player);
        
        const overlayId = 'sp-preroll-overlay-' + Date.now();
        const showTime = Date.now();
        
        // Get the unlisted YouTube video ID for Scammer Payback
        const scammerPaybackVideoId = 'YV0NfxtK0n0'; // Replace with actual unlisted video ID
        
        // Track preroll impression
        if (window.SPAnalytics) {
            window.SPAnalytics.trackAdImpression('preroll', {
                videoId: scammerPaybackVideoId,
                videoTitle: '🎯 MAIN SCAMMER PAYBACK PROMO VIDEO',
                campaignId: 'main_promo_2024',
                showTime: showTime
            }, {
                platform: player.platform || 'unknown',
                playerType: player.type || 'unknown'
            });
            window.SPAnalytics.updateCounters('impressions');
        }
        
        // Create overlay container
        const overlay = document.createElement('div');
        overlay.id = overlayId;
        overlay.className = 'sp-preroll-overlay';
        overlay.setAttribute('data-sp-preroll', 'true');
        
        // Position overlay over the original player
        const playerRect = player.container.getBoundingClientRect();
        
        overlay.style.cssText = `
            position: fixed;
            top: ${playerRect.top + window.scrollY}px;
            left: ${playerRect.left + window.scrollX}px;
            width: ${playerRect.width}px;
            height: ${playerRect.height}px;
            background: #000;
            z-index: 999999;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        // Create YouTube-style pre-roll content
        overlay.innerHTML = `
            <div class="sp-preroll-content" style="
                width: 100%;
                height: 100%;
                position: relative;
                background: #000;
            ">
                <!-- YouTube iframe for our video -->
                <iframe 
                    id="sp-preroll-video"
                    width="100%" 
                    height="100%"
                    src="https://www.youtube.com/embed/${scammerPaybackVideoId}?autoplay=1&controls=0&modestbranding=1&rel=0&showinfo=0&start=0&enablejsapi=1"
                    frameborder="0" 
                    allow="autoplay; encrypted-media"
                    allowfullscreen
                    style="
                        width: 100%;
                        height: 100%;
                        border: none;
                    ">
                </iframe>
                
                <!-- Ad overlay controls (YouTube-style) -->
                <div class="sp-preroll-controls" style="
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: linear-gradient(transparent, rgba(0,0,0,0.8));
                    padding: 20px;
                    color: white;
                    font-family: 'YouTube Sans', 'Roboto', sans-serif;
                ">
                    <!-- Ad indicator -->
                    <div class="sp-ad-indicator" style="
                        position: absolute;
                        top: 20px;
                        left: 20px;
                        background: rgba(255,255,255,0.2);
                        padding: 4px 8px;
                        border-radius: 3px;
                        font-size: 12px;
                        font-weight: 500;
                    ">
                        Ad
                    </div>
                    
                    <!-- Skip button (appears after 5 seconds) -->
                    <div class="sp-skip-button" style="
                        position: absolute;
                        top: 20px;
                        right: 20px;
                        background: rgba(0,0,0,0.8);
                        color: white;
                        padding: 8px 16px;
                        border-radius: 3px;
                        font-size: 14px;
                        cursor: pointer;
                        border: 1px solid rgba(255,255,255,0.3);
                        display: none;
                        transition: all 0.2s ease;
                    " onmouseover="this.style.background='rgba(255,255,255,0.1)'" 
                       onmouseout="this.style.background='rgba(0,0,0,0.8)'">
                        Skip Ad
                    </div>
                    
                    <!-- Progress bar -->
                    <div class="sp-progress-container" style="
                        width: 100%;
                        height: 4px;
                        background: rgba(255,255,255,0.3);
                        border-radius: 2px;
                        margin-bottom: 15px;
                    ">
                        <div class="sp-progress-bar" style="
                            height: 100%;
                            background: #ff0000;
                            border-radius: 2px;
                            width: 0%;
                            transition: width 0.1s ease;
                        "></div>
                    </div>
                    
                    <!-- Ad info -->
                    <div class="sp-ad-info" style="
                        display: flex;
                        align-items: center;
                        gap: 15px;
                    ">
                        <div class="sp-ad-text" style="
                            flex: 1;
                        ">
                            <div style="font-weight: 500; margin-bottom: 4px;">
                                🛡️ Fight Back Against Scammers
                            </div>
                            <div style="font-size: 13px; opacity: 0.9;">
                                Subscribe to Scammer Payback • scammerpayback.com
                            </div>
                        </div>
                        
                        <div class="sp-visit-button" style="
                            background: #ff0000;
                            color: white;
                            padding: 10px 20px;
                            border-radius: 4px;
                            font-size: 14px;
                            font-weight: 500;
                            cursor: pointer;
                            transition: background 0.2s ease;
                        " onmouseover="this.style.background='#cc0000'" 
                           onmouseout="this.style.background='#ff0000'">
                            Visit Site
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(overlay);
        
        // Setup interactive elements
        setupPrerollInteractions(overlay, onComplete);
        
        // Auto-remove after video duration (fallback)
        setTimeout(() => {
            if (document.getElementById(overlayId)) {
                completePreroll(overlay, onComplete);
            }
        }, 30000); // 30 second max duration
        
        console.log('SP: Pre-roll overlay created and displayed');
    }

    function setupPrerollInteractions(overlay, onComplete) {
        const skipButton = overlay.querySelector('.sp-skip-button');
        const visitButton = overlay.querySelector('.sp-visit-button');
        const progressBar = overlay.querySelector('.sp-progress-bar');
        
        let startTime = Date.now();
        let canSkip = false;
        
        console.log('SP: Setting up pre-roll interactions');
        
        // Show skip button after 5 seconds
        setTimeout(() => {
            if (skipButton) {
                skipButton.style.display = 'block';
                canSkip = true;
                console.log('SP: Skip button now available');
            }
        }, 5000);
        
        // Skip button functionality
        if (skipButton) {
            skipButton.addEventListener('click', () => {
                console.log('SP: Skip button clicked');
                
                // Track skip button click
                if (window.SPAnalytics) {
                    window.SPAnalytics.trackAdClick('preroll', {
                        videoId: 'YV0NfxtK0n0',
                        videoTitle: '🎯 MAIN SCAMMER PAYBACK PROMO VIDEO',
                        campaignId: 'main_promo_2024',
                        showTime: startTime
                    }, 'skip');
                }
                
                if (canSkip) {
                    completePreroll(overlay, onComplete);
                }
            });
        }
        
        // Visit site button
        if (visitButton) {
            visitButton.addEventListener('click', () => {
                console.log('SP: Visit site button clicked');
                
                // Track visit button click
                if (window.SPAnalytics) {
                    window.SPAnalytics.trackAdClick('preroll', {
                        videoId: 'YV0NfxtK0n0',
                        videoTitle: '🎯 MAIN SCAMMER PAYBACK PROMO VIDEO',
                        campaignId: 'main_promo_2024',
                        showTime: startTime
                    }, 'subscribe');
                    window.SPAnalytics.updateCounters('clicks');
                }
                
                const scammerPaybackUrl = 'https://www.youtube.com/c/ScammerPayback';
                window.open(scammerPaybackUrl, '_blank');
                completePreroll(overlay, onComplete);
            });
        }
        
        // Progress bar animation
        const updateProgress = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / 30000) * 100, 100); // 30 second duration
            
            if (progressBar) {
                progressBar.style.width = progress + '%';
            }
            
            if (progress < 100 && overlay.parentNode) {
                requestAnimationFrame(updateProgress);
            } else if (progress >= 100) {
                console.log('SP: Pre-roll completed via progress timer');
                completePreroll(overlay, onComplete);
            }
        };
        
        updateProgress();
        
        // Listen for escape key to close
        const escapeListener = (e) => {
            if (e.key === 'Escape' && canSkip) {
                console.log('SP: Escape key pressed, closing pre-roll');
                completePreroll(overlay, onComplete);
                document.removeEventListener('keydown', escapeListener);
            }
        };
        document.addEventListener('keydown', escapeListener);
        
        // Click outside to close (after skip is available)
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay && canSkip) {
                console.log('SP: Clicked outside overlay, closing pre-roll');
                completePreroll(overlay, onComplete);
            }
        });
    }

    function completePreroll(overlay, onComplete) {
        console.log('SP: Completing pre-roll...');
        
        // Prevent multiple completions
        if (overlay.dataset.completing === 'true') {
            return;
        }
        overlay.dataset.completing = 'true';
        
        // Track preroll completion
        if (window.SPAnalytics) {
            const completionTime = Date.now();
            const startTime = parseInt(overlay.dataset.startTime) || completionTime;
            const watchDuration = completionTime - startTime;
            
            window.SPAnalytics.trackPrerollEvent('completed', {
                videoId: 'YV0NfxtK0n0',
                videoTitle: '🎯 MAIN SCAMMER PAYBACK PROMO VIDEO',
                campaignId: 'main_promo_2024'
            }, {
                watchDuration: watchDuration,
                completedNaturally: !overlay.dataset.userSkipped
            });
        }
        
        // Fade out animation
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            onComplete();
        }, 500);
    }

    // Make function globally available
    window.SPCreatePrerollOverlay = createPrerollOverlay;
    
    console.log('SP: Pre-roll overlay module loaded');
})(); 