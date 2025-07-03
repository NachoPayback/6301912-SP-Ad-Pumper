// SP Extension - Local Ad Insertion Only
(function() {
    'use strict';
    
    // Simple local configuration
    const CONFIG = {
        enabled: true,
        preroll: {
            enabled: true,
            videoId: "YV0NfxtK0n0",
            chance: 1.0
        },
        banners: {
            enabled: true,
            maxConcurrent: 2,
            minConcurrent: 2,
            rotationTime: 45000
        },
        toast: {
            enabled: true,
            maxConcurrent: 1,
            displayTime: 8000
        }
    };

    class SimpleAdExtension {
        constructor() {
            this.activeToasts = new Set();
            this.init();
        }

        async init() {
            if (!CONFIG.enabled) return;
            
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.startAdSystems());
            } else {
                this.startAdSystems();
            }
        }

        startAdSystems() {
            console.log('🔧 DEBUG: startAdSystems called');
            console.log('🔧 DEBUG: Current URL:', window.location.href);
            console.log('🔧 DEBUG: Hostname:', window.location.hostname);
            console.log('🔧 DEBUG: Pathname:', window.location.pathname);
            
            // Check if we're on YouTube home/subscriptions - use completely different logic
            const isYouTube = window.location.hostname.includes('youtube.com');
            const isHomePage = window.location.pathname === '/' || window.location.pathname === '';
            const isSubscriptions = window.location.pathname.includes('/feed/subscriptions');
            
            console.log('🔧 DEBUG: Page detection:', { isYouTube, isHomePage, isSubscriptions });
            
            if (isYouTube && (isHomePage || isSubscriptions)) {
                console.log('🏠 YouTube home/subscriptions detected - using specialized logic');
                this.startYouTubeHomeSystem();
                return; // Don't run any other systems
            }
            
            console.log('🔧 DEBUG: Running normal systems for this page');
            
            // For all other pages, run normal systems
            if (CONFIG.preroll.enabled) {
                console.log('🔧 DEBUG: Starting preroll system');
                this.startPrerollSystem();
            }
            
            if (CONFIG.banners.enabled) {
                console.log('🔧 DEBUG: Starting banner system');
                this.startBannerSystem();
            }
            
            if (CONFIG.toast.enabled) {
                console.log('🔧 DEBUG: Starting toast system');
                this.startToastSystem();
            }
        }

        startYouTubeHomeSystem() {
            console.log('🎬 Starting YouTube home/subscriptions specialized system');
            
            // Only start once per page load
            if (!this.youtubeHomeSystemStarted) {
                // Start both systems as planned
                this.startThumbnailInterceptor();
                
                // Slot hijacking - 4% chance (1 in 25) but avoid conflicts
                setTimeout(() => {
                    if (Math.random() < 0.04) { // 4% chance
                        console.log('🎯 Slot hijacking triggered (4% chance)');
                        this.hijackExistingResult();
                    } else {
                        console.log('🎲 Slot hijacking not triggered this time (4% chance)');
                    }
                }, 3000); // Start after 3 seconds to let thumbnail system run first
                
                this.youtubeHomeSystemStarted = true;
                console.log('🎯 Started both systems: thumbnail replacement + slot hijacking');
            }
        }

        startThumbnailInterceptor() {
            console.log('🔍 Starting real-time thumbnail interception');
            
            // Track replacements: GUARANTEED 1 in first 8, then 5% beyond that
            this.guaranteedReplacementDone = false; // One guaranteed in first 8
            this.videosProcessed = 0;
            
            // Initialize retry counters
            this.thumbnailRetries = 0;
            this.hijackRetries = 0;
            this.maxRetries = 20; // Max 20 retries (20-30 seconds)
            
            // Start with guaranteed replacement in first 8
            this.replaceGuaranteedThumbnail();
            
            // Watch for new content being added as YouTube loads
            const observer = new MutationObserver((mutations) => {
                for (let mutation of mutations) {
                    for (let node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if this is a video item being added
                            if (node.matches && node.matches('ytd-rich-item-renderer')) {
                                this.processNewVideoItem(node);
                            }
                            
                            // Also check for video items within the added node
                            const videoItems = node.querySelectorAll ? node.querySelectorAll('ytd-rich-item-renderer') : [];
                            videoItems.forEach(item => this.processNewVideoItem(item));
                        }
                    }
                }
            });
            
            // Start observing the main content area
            const gridContainer = document.querySelector('ytd-rich-grid-renderer #contents') || document.body;
            observer.observe(gridContainer, {
                childList: true,
                subtree: true
            });
            
            console.log('✅ Real-time thumbnail interceptor active');
        }

        replaceGuaranteedThumbnail() {
            console.log('🎯 GUARANTEED: Replacing one of first 8 thumbnails');
            
            // Skip if guaranteed replacement already done
            if (this.guaranteedReplacementDone) return;
            
            // Find grid container and get first 8 video items
            const gridContainer = document.querySelector('ytd-rich-grid-renderer #contents') || 
                                document.querySelector('ytd-rich-grid-renderer') ||
                                document.querySelector('#contents');
            
            if (!gridContainer) {
                console.log('❌ No grid container found yet - will retry via MutationObserver');
                return false;
            }
            
            // Get first 8 video items
            const videoItems = Array.from(gridContainer.querySelectorAll('ytd-rich-item-renderer')).slice(0, 8);
            console.log(`🔧 Found ${videoItems.length} video items in first 8`);
            
            if (videoItems.length === 0) {
                console.log('❌ No video items found yet - will retry via MutationObserver');
                return false;
            }
            
            // Pick any one from first 8 (just pick the first available)
            for (let i = 0; i < videoItems.length; i++) {
                const thumbnail = videoItems[i].querySelector('yt-image img');
                
                if (thumbnail && !thumbnail.hasAttribute('data-sp-replaced')) {
                    const contentFiles = ['yt_ad_1920x1080_1.png', 'yt_ad_1920x1080_2.png'];
                    const randomFile = contentFiles[Math.floor(Math.random() * contentFiles.length)];
                    const testUrl = chrome.runtime.getURL('assets/banners/' + randomFile);
                    
                    console.log(`🔧 Replacing thumbnail ${i + 1}/8 with URL:`, testUrl);
                    
                    // Replace the ENTIRE img element, not just src
                    const newThumbnail = document.createElement('img');
                    newThumbnail.src = testUrl;
                    newThumbnail.alt = thumbnail.alt;
                    newThumbnail.className = thumbnail.className;
                    newThumbnail.style.cssText = thumbnail.style.cssText;
                    newThumbnail.setAttribute('data-sp-replaced', 'true');
                    
                    // Replace the entire element
                    thumbnail.parentNode.replaceChild(newThumbnail, thumbnail);
                    videoItems[i].setAttribute('data-sp-guaranteed', 'true'); // Mark the video item too
                    this.guaranteedReplacementDone = true;
                    
                    console.log(`✅ GUARANTEED: Replaced thumbnail ${i + 1} of first 8`);
                    return true;
                }
            }
            
            console.log('❌ No replaceable thumbnails in first 8 - will retry via MutationObserver');
            return false;
        }
        
        processNewVideoItem(videoItem) {
            this.videosProcessed++;
            
            // Check if this video is in first 8 positions
            if (this.videosProcessed <= 8) {
                // Handle guaranteed replacement for first 8
                if (!this.guaranteedReplacementDone) {
                    const thumbnail = videoItem.querySelector('yt-image img');
                    
                    if (thumbnail && !thumbnail.hasAttribute('data-sp-replaced')) {
                        const contentFiles = ['yt_ad_1920x1080_1.png', 'yt_ad_1920x1080_2.png'];
                        const randomFile = contentFiles[Math.floor(Math.random() * contentFiles.length)];
                        const testUrl = chrome.runtime.getURL('assets/banners/' + randomFile);
                        
                        console.log(`🔧 GUARANTEED: Replacing thumbnail at position ${this.videosProcessed}/8 with URL:`, testUrl);
                        
                        // Replace the ENTIRE img element
                        const newThumbnail = document.createElement('img');
                        newThumbnail.src = testUrl;
                        newThumbnail.alt = thumbnail.alt;
                        newThumbnail.className = thumbnail.className;
                        newThumbnail.style.cssText = thumbnail.style.cssText;
                        newThumbnail.setAttribute('data-sp-replaced', 'true');
                        
                        // Replace the entire element
                        thumbnail.parentNode.replaceChild(newThumbnail, thumbnail);
                        videoItem.setAttribute('data-sp-guaranteed', 'true');
                        this.guaranteedReplacementDone = true;
                        
                        console.log(`✅ GUARANTEED: Replaced thumbnail at position ${this.videosProcessed} of first 8`);
                    }
                }
            } else {
                // Handle 5% chance replacement for positions beyond 8
                if (Math.random() < 0.05) { // 5% chance (1 in 20)
                    const thumbnail = videoItem.querySelector('yt-image img');
                    
                    if (thumbnail && !thumbnail.hasAttribute('data-sp-replaced')) {
                        const contentFiles = ['yt_ad_1920x1080_1.png', 'yt_ad_1920x1080_2.png'];
                        const randomFile = contentFiles[Math.floor(Math.random() * contentFiles.length)];
                        const testUrl = chrome.runtime.getURL('assets/banners/' + randomFile);
                        
                        console.log(`🎲 5% CHANCE: Replacing thumbnail at position ${this.videosProcessed} with URL:`, testUrl);
                        
                        // Replace the ENTIRE img element
                        const newThumbnail = document.createElement('img');
                        newThumbnail.src = testUrl;
                        newThumbnail.alt = thumbnail.alt;
                        newThumbnail.className = thumbnail.className;
                        newThumbnail.style.cssText = thumbnail.style.cssText;
                        newThumbnail.setAttribute('data-sp-replaced', 'true');
                        
                        // Replace the entire element
                        thumbnail.parentNode.replaceChild(newThumbnail, thumbnail);
                        
                        console.log(`✅ 5% CHANCE: Replaced thumbnail at position ${this.videosProcessed}`);
                    }
                } else {
                    console.log(`🎲 Position ${this.videosProcessed}: 5% chance not triggered`);
                }
            }
        }



        // PREROLL VIDEO SYSTEM - YOUTUBE ONLY
        startPrerollSystem() {
            if (!window.location.hostname.includes('youtube.com')) return;

            const checkForYouTubeVideos = () => {
                // Target actual YouTube player based on HTML structure
                const playerContainer = document.querySelector('#player');
                if (!playerContainer) return;
                
                const video = playerContainer.querySelector('video:not([data-sp-processed])');
                
                if (video && video.videoWidth > 400 && video.videoHeight > 200) {
                    const rect = video.getBoundingClientRect();
                    const isMainVideo = rect.width > 400 && rect.height > 200 && 
                                       !video.closest('[class*="hover"], [class*="preview"], [class*="thumbnail"]');
                    
                    if (isMainVideo && this.shouldShowPreroll()) {
                        this.showPreroll(video, playerContainer);
                        video.setAttribute('data-sp-processed', 'true');
                    }
                }
            };
            
            checkForYouTubeVideos();
            setInterval(checkForYouTubeVideos, 3000);
            
            let lastUrl = location.href;
            new MutationObserver(() => {
                const url = location.href;
                if (url !== lastUrl) {
                    lastUrl = url;
                    setTimeout(checkForYouTubeVideos, 1500);
                }
            }).observe(document, { subtree: true, childList: true });
        }

        shouldShowPreroll() {
            return Math.random() < CONFIG.preroll.chance;
        }

        showPreroll(video, playerContainer) {
            const overlay = document.createElement('div');
            overlay.setAttribute('data-sp-preroll', 'true');
            overlay.style.cssText = `
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background: #000 !important;
                z-index: 1000 !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
                align-items: center !important;
                color: white !important;
                font-family: "YouTube Sans", "Roboto", sans-serif !important;
            `;

            // Create a placeholder video using a proper source
            const adVideo = document.createElement('div');
            adVideo.style.cssText = `
                width: 100% !important;
                height: 100% !important;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                flex-direction: column !important;
            `;
            
            // Add content to the placeholder
            const adTitle = document.createElement('h2');
            adTitle.textContent = 'Scammer Payback';
            adTitle.style.cssText = `
                color: white !important;
                font-size: 28px !important;
                margin: 0 0 10px 0 !important;
                text-align: center !important;
                font-weight: bold !important;
            `;
            
            const adSubtext = document.createElement('p');
            adSubtext.textContent = 'Protecting people from scams';
            adSubtext.style.cssText = `
                color: rgba(255,255,255,0.9) !important;
                font-size: 16px !important;
                margin: 0 !important;
                text-align: center !important;
            `;
            
            adVideo.appendChild(adTitle);
            adVideo.appendChild(adSubtext);

            const adInfo = document.createElement('div');
            adInfo.textContent = 'Advertisement • Scammer Payback';
            adInfo.style.cssText = `
                position: absolute !important;
                top: 20px !important;
                left: 20px !important;
                background: rgba(0,0,0,0.8) !important;
                color: white !important;
                padding: 8px 12px !important;
                border-radius: 4px !important;
                font-size: 14px !important;
                z-index: 1001 !important;
            `;

            const skipBtn = document.createElement('button');
            skipBtn.textContent = 'Skip Ad in 5s';
            skipBtn.style.cssText = `
                position: absolute !important;
                bottom: 80px !important;
                right: 20px !important;
                padding: 8px 16px !important;
                background: rgba(255,255,255,0.2) !important;
                color: white !important;
                border: 1px solid rgba(255,255,255,0.3) !important;
                border-radius: 2px !important;
                cursor: not-allowed !important;
                font-size: 14px !important;
                font-weight: 500 !important;
                opacity: 0.7 !important;
                z-index: 1001 !important;
            `;

            overlay.appendChild(adVideo);
            overlay.appendChild(adInfo);
            overlay.appendChild(skipBtn);

            if (playerContainer.style.position !== 'relative' && playerContainer.style.position !== 'absolute') {
                playerContainer.style.position = 'relative';
            }
            
            playerContainer.appendChild(overlay);

            let countdown = 5;
            const countdownInterval = setInterval(() => {
                countdown--;
                if (countdown > 0) {
                    skipBtn.textContent = `Skip Ad in ${countdown}s`;
                } else {
                    skipBtn.textContent = 'Skip Ad';
                    skipBtn.style.cursor = 'pointer !important';
                    skipBtn.style.opacity = '1 !important';
                    skipBtn.style.background = 'rgba(255,255,255,0.9) !important';
                    skipBtn.style.color = '#000 !important';
                    skipBtn.onclick = () => {
                        overlay.remove();
                        clearInterval(countdownInterval);
                    };
                    clearInterval(countdownInterval);
                }
            }, 1000);

            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.remove();
                    clearInterval(countdownInterval);
                }
            }, 30000);
        }

        // BANNER AD SYSTEM  
        startBannerSystem() {
            console.log('🚀 TESTING: Starting banner system for non-YouTube-home pages');
            console.log('🔧 Current URL:', window.location.href);
            console.log('🔧 Hostname:', window.location.hostname);
            console.log('🔧 Pathname:', window.location.pathname);
            
            // This system should NEVER run on YouTube home/subscriptions
            const isYouTube = window.location.hostname.includes('youtube.com');
            const isHomePage = window.location.pathname === '/' || window.location.pathname === '';
            const isSubscriptions = window.location.pathname.includes('/feed/subscriptions');
            
            console.log('🔧 Page detection:', { isYouTube, isHomePage, isSubscriptions });
            
            if (isYouTube && (isHomePage || isSubscriptions)) {
                console.log('❌ Banner system skipping YouTube home/subscriptions - should use specialized system');
                return; // Completely skip banner system
            }
            
            console.log('✅ Banner system should run on this page');
            
            // Create initial banners with staggered timing
            setTimeout(() => {
                console.log('🎯 Creating first banner');
                this.createSingleBanner();
            }, 1000);
            
            setTimeout(() => {
                console.log('🎯 Creating second banner');
                this.createSingleBanner();
            }, 3000);

            // Maintain exactly 2 banners at all times - more frequent checks
            setInterval(() => {
                const currentBanners = document.querySelectorAll('.sp-media-content').length;
                const targetCount = CONFIG.banners.minConcurrent || 2;
                
                console.log(`🔄 Banner maintenance check: ${currentBanners}/${targetCount}`);
                
                if (currentBanners < targetCount) {
                    const needed = targetCount - currentBanners;
                    console.log(`⚡ Need ${needed} more banners`);
                    
                    for (let i = 0; i < needed; i++) {
                        setTimeout(() => {
                            console.log(`🔧 Creating replacement banner ${i+1}/${needed}`);
                            this.createSingleBanner();
                        }, i * 1000);
                    }
                }
            }, 2000); // Check every 2 seconds instead of 3
        }

        createSingleBanner() {
            // This function should NEVER be called for YouTube home/subscriptions
            if (window.location.hostname.includes('youtube.com')) {
                const isHomePage = window.location.pathname === '/' || window.location.pathname === '';
                const isSubscriptions = window.location.pathname.includes('/feed/subscriptions');
                
                if (isHomePage || isSubscriptions) {
                    console.log('❌ createSingleBanner should not run on YouTube home/subscriptions!');
                    return false; // Don't create banners here
                }
            }
            
            const currentCount = document.querySelectorAll('.sp-media-content').length;
            console.log(`🎯 Creating banner: Current count = ${currentCount}, Max = ${CONFIG.banners.maxConcurrent}`);
            
            if (currentCount >= CONFIG.banners.maxConcurrent) {
                console.log('❌ Hit max banner limit, stopping');
                return false;
            }
                
            const success = this.createSafeBanner();
            if (success) {
                console.log('✅ Banner created successfully');
                return true;
            } else {
                console.log('❌ Banner creation failed');
                return false;
            }
        }

        createSafeBanner() {
            // Only place banners in the safest possible locations
            const bannerTypes = [
                { size: '300x250', file: 'ad_300x250.png', type: 'rectangle' },
                { size: '728x90', file: 'ad_728x90.png', type: 'leaderboard' },
                { size: '336x280', file: 'ad_336x280.png', type: 'rectangle' },
                { size: '160x600', file: 'ad_160x600.png', type: 'skyscraper' },
                { size: '320x50', file: 'ad_320x50.png', type: 'mobile' },
                { size: '970x250', file: 'ad_970x250.png', type: 'billboard' }
            ];

            const currentBannerCount = document.querySelectorAll('.sp-media-content').length;
            console.log(`🔍 Current banner count: ${currentBannerCount}`);

            // STRICT duplicate prevention - get currently active banner files
            const activeBannerFiles = new Set();
            document.querySelectorAll('.sp-media-content img').forEach(banner => {
                const src = banner.src;
                const filename = src.substring(src.lastIndexOf('/') + 1);
                activeBannerFiles.add(filename);
                console.log(`📋 Active banner: ${filename}`);
            });

            // Always filter out duplicate banner types  
            const availableBanners = bannerTypes.filter(banner => !activeBannerFiles.has(banner.file));
            console.log(`🎯 Available banners: ${availableBanners.length}`, availableBanners.map(b => b.file));

            if (availableBanners.length === 0) {
                console.log('❌ No unique banners available, all types already active');
                return false;
            }

            const randomBanner = availableBanners[Math.floor(Math.random() * availableBanners.length)];
            console.log(`✅ Selected banner: ${randomBanner.file}`);
            return this.placeBannerByType(randomBanner);
        }

        placeBannerByType(bannerInfo) {
            // Route to specialized handlers based on site and banner type
            if (window.location.hostname.includes('youtube.com')) {
                return this.createYouTubeBanner(bannerInfo);
            } else if (window.location.hostname.includes('google.') && window.location.pathname.includes('/search')) {
                return this.createGoogleSearchAd(bannerInfo);
            } else {
                return this.createUniversalContent(bannerInfo);
            }
        }

        createSkyscraperBanner(bannerInfo) {
            console.log('🏗️ Creating skyscraper content');
            return this.createUniversalContent(bannerInfo);
        }

        createLeaderboardBanner(bannerInfo) {
            console.log('📊 Creating leaderboard content');
            return this.createUniversalContent(bannerInfo);
        }

        createBillboardBanner(bannerInfo) {
            console.log('📰 Creating billboard content');
            return this.createUniversalContent(bannerInfo);
        }

        createGeneralBanner(bannerInfo) {
            console.log('📄 Creating general content');
            return this.createUniversalContent(bannerInfo);
        }

        createUniversalContent(bannerInfo) {
            // Look for natural website structure breaks and padding areas
            console.log('🌐 Looking for content placement areas');
            
            // Find content containers that look natural
            const safeContainers = [
                ...document.querySelectorAll('#center_col, #main, .main, .content, main, #content'),
                ...document.querySelectorAll('article, section'),
                ...document.querySelectorAll('div[id], div[class]')
            ].filter(container => {
                const rect = container.getBoundingClientRect();
                
                return rect.width >= 200 && rect.height >= 100 && 
                       container.children.length >= 1 &&
                       !container.querySelector('.sp-media-content') &&
                       !this.isHeaderOrNav(container) &&
                       !container.matches('footer, .footer, nav, header') &&
                       rect.top >= 150 && rect.top < window.innerHeight * 0.5;
            }).sort((a, b) => {
                // Sort by position - TOPMOST CONTAINERS FIRST
                return a.getBoundingClientRect().top - b.getBoundingClientRect().top;
            });
            
            console.log(`🎯 Found ${safeContainers.length} content containers`);
            
            for (let container of safeContainers.slice(0, 3)) { // Try first 3 containers (topmost)
                try {
                    const content = this.createContentElement(bannerInfo.size, bannerInfo.file);
                    
                    // Smart insertion - never at the very end
                    if (container.children.length === 1) {
                        container.appendChild(content);
                    } else if (container.children.length === 2) {
                        container.insertBefore(content, container.children[1]);
                    } else {
                        // Insert in first third of container
                        const insertIndex = Math.floor(container.children.length / 3);
                        const insertBefore = container.children[insertIndex];
                        container.insertBefore(content, insertBefore);
                    }
                    
                    console.log(`✅ Universal content placement successful in ${container.tagName}`);
                    return true;
                    
                } catch (e) {
                    console.log(`❌ Content placement failed for container:`, e.message);
                    continue;
                }
            }
            
            console.log('❌ Universal content placement failed completely');
            return false;
        }

        createGoogleSearchAd(bannerInfo) {
            console.log('🔍 Creating Google search content block that looks like real result');
            console.log('🔧 Current URL:', window.location.href);
            console.log('🔧 Banner info:', bannerInfo);
            
            // Find Google's search results container
            const searchResultsContainer = document.querySelector('#center_col') || document.querySelector('#search');
            console.log('🔧 Search container found:', !!searchResultsContainer);
            
            if (!searchResultsContainer) {
                console.log('❌ No Google search results container found - trying fallback');
                return this.createUniversalContent(bannerInfo);
            }
            
            // Debug: check what search results exist
            const possibleSelectors = ['.g', '[data-sokoban-container]', 'div[class]', '.tF2Cxc', '.s', '.rc'];
            for (let selector of possibleSelectors) {
                const results = searchResultsContainer.querySelectorAll(selector);
                console.log(`🔧 Found ${results.length} results with selector '${selector}'`);
            }
            
            // Create a content block that looks like a regular search result
            const contentSlot = document.createElement('div');
            contentSlot.className = 'g sp-media-content';  // Use Google's own 'g' class
            contentSlot.setAttribute('data-content-type', 'search-result');
            contentSlot.setAttribute('data-content-id', 'search-' + Date.now());
            
            contentSlot.innerHTML = `
                <div class="tF2Cxc">
                    <div class="yuRUbf">
                        <a href="https://www.youtube.com/c/ScammerPayback?sub_confirmation=1" target="_blank">
                            <h3 class="LC20lb MBeuO DKV0Md">Scammer Payback - Stop Phone Scammers</h3>
                            <div class="TbwUpd NJjxre iUh30 ojE3Fd">
                                <cite class="iUh30 qLRx3b tjvcx GvPZzd cHaqb" role="text">
                                    youtube.com › ScammerPayback
                                </cite>
                            </div>
                        </a>
                    </div>
                    <div class="VwiC3b yXK7lf lVm3ye r025kc hJNv6b Hdw6tb">
                        <span>Learn how to stop phone scammers and protect yourself from fraud. Educational content about scam prevention and cybersecurity awareness.</span>
                    </div>
                </div>
            `;
            
            // Try multiple insertion strategies
            const searchResults = searchResultsContainer.querySelectorAll('.g, [data-sokoban-container], .tF2Cxc');
            console.log(`🔧 Found ${searchResults.length} potential insertion points`);
            
            if (searchResults.length >= 2) {
                // Insert after 2nd result (safer position)
                const insertAfter = searchResults[1];
                insertAfter.parentNode.insertBefore(contentSlot, insertAfter.nextSibling);
                console.log('✅ Google search result inserted after 2nd result');
                return true;
            } else if (searchResults.length >= 1) {
                // Insert after first result
                const insertAfter = searchResults[0];
                insertAfter.parentNode.insertBefore(contentSlot, insertAfter.nextSibling);
                console.log('✅ Google search result inserted after first result');
                return true;
            } else {
                // Fallback to universal content placement
                console.log('❌ Not enough search results - using universal placement');
                return this.createUniversalContent(bannerInfo);
            }
        }

        hasAdjacentBanner(element) {
            // Only check if element itself has banners - be less restrictive
            return element.querySelector('.sp-media-content') !== null;
        }

        createYouTubeBanner(bannerInfo) {
            // Detect YouTube page type for specialized handling
            const isHomePage = window.location.pathname === '/' || window.location.pathname === '';
            const isSubscriptions = window.location.pathname.includes('/feed/subscriptions');
            const isWatchPage = window.location.pathname.includes('/watch');
            
            console.log(`🎬 YouTube page detected: Home=${isHomePage}, Subs=${isSubscriptions}, Watch=${isWatchPage}`);
            
            // HOME/SUBSCRIPTIONS should NEVER reach here - banner system should skip them
            if (isHomePage || isSubscriptions) {
                console.log('❌ ERROR: createYouTubeBanner should not run on home/subscriptions! Banner system bug!');
                return false; // This should never happen
            }
            
            // For watch pages, use sidebar/below-video placement
            if (isWatchPage) {
                return this.createYouTubeWatchAd(bannerInfo);
            }
            
            // For other YouTube pages (search, channel pages, etc.), create fake video ads
            return this.createYouTubeGridAd(bannerInfo);
        }



        hijackExistingResult() {
            console.log('🎯 Slot hijacking: Picking random slot avoiding thumbnail conflicts');
            
            // Find the main grid container - try multiple selectors
            const gridContainer = document.querySelector('ytd-rich-grid-renderer #contents') || 
                                document.querySelector('ytd-rich-grid-renderer') ||
                                document.querySelector('#contents');
            if (!gridContainer) {
                this.hijackRetries++;
                if (this.hijackRetries < this.maxRetries) {
                    console.log(`❌ No grid container found - scheduling hijack retry ${this.hijackRetries}/${this.maxRetries} in 1.5 seconds`);
                    setTimeout(() => this.hijackExistingResult(), 1500);
                } else {
                    console.log('⚠️ Max hijack retries reached - giving up');
                }
                return false;
            }
            
            // Found grid container!
            if (this.hijackRetries > 0) {
                console.log(`✅ Grid container found for hijacking after ${this.hijackRetries} retries!`);
            }
            
            // Get all video results, but avoid those that have thumbnail replacements
            const allVideoResults = Array.from(gridContainer.querySelectorAll('ytd-rich-item-renderer'));
            const videoResults = allVideoResults.filter(item => 
                !item.hasAttribute('data-sp-hijacked') && 
                !item.hasAttribute('data-sp-replaced') && 
                !item.hasAttribute('data-sp-guaranteed')
            );
            
            console.log(`📊 Found ${videoResults.length} available results for hijacking`);
            console.log(`🔧 All videos found: ${allVideoResults.length}, filtering out thumbnail conflicts`);
            
            if (videoResults.length === 0) {
                console.log('❌ No available results to hijack (all have thumbnail conflicts)');
                return false;
            }
            
            // Pick a random one from available results
            const targetResult = videoResults[Math.floor(Math.random() * videoResults.length)];
            if (!targetResult) return false;
            
            // Mark as hijacked
            targetResult.setAttribute('data-sp-hijacked', 'true');
            
            // Find the elements we need to replace
            const thumbnail = targetResult.querySelector('yt-image img');
            const titleLink = targetResult.querySelector('a#video-title-link, a[href*="/watch"]');
            const channelLink = targetResult.querySelector('a[href*="/@"], a[href*="/c/"], a[href*="/channel/"]');
            const avatarImg = targetResult.querySelector('#avatar yt-image img, #avatar img');
            const metadataLine = targetResult.querySelector('#metadata-line, [id*="metadata"]');
            
            console.log('🔍 Found elements:', {
                thumbnail: !!thumbnail,
                titleLink: !!titleLink, 
                channelLink: !!channelLink,
                avatarImg: !!avatarImg,
                metadataLine: !!metadataLine
            });
            
            // Replace thumbnail
            if (thumbnail) {
                const contentFiles = ['yt_ad_1920x1080_1.png', 'yt_ad_1920x1080_2.png'];
                const randomFile = contentFiles[Math.floor(Math.random() * contentFiles.length)];
                thumbnail.src = chrome.runtime.getURL('assets/banners/' + randomFile);
                thumbnail.alt = 'HACK ALL SCAMMERS - Subscribe to Scammer Payback';
                console.log('✅ Replaced thumbnail');
            }
            
            // Replace title link and text
            if (titleLink) {
                titleLink.href = 'https://www.youtube.com/c/ScammerPayback?sub_confirmation=1';
                titleLink.target = '_blank';
                
                // Replace title text
                const titleSpan = titleLink.querySelector('span, h3');
                if (titleSpan) {
                    titleSpan.textContent = 'HACK ALL SCAMMERS - Subscribe to Scammer Payback';
                }
                console.log('✅ Replaced title and link');
            }
            
            // Replace channel name and link
            if (channelLink) {
                channelLink.href = 'https://www.youtube.com/c/ScammerPayback?sub_confirmation=1';
                channelLink.target = '_blank';
                
                const channelSpan = channelLink.querySelector('span');
                if (channelSpan) {
                    channelSpan.textContent = 'Scammer Payback';
                }
                console.log('✅ Replaced channel name and link');
            }
            
            // Replace avatar with profile photo
            if (avatarImg) {
                avatarImg.src = chrome.runtime.getURL('assets/other/profile_photo_800x800.png');
                avatarImg.alt = 'Scammer Payback';
                console.log('✅ Replaced avatar');
            }
            
            // Remove/replace metadata (views, date)
            if (metadataLine) {
                metadataLine.innerHTML = '<span class="style-scope ytd-video-meta-block">Educational Content</span>';
                console.log('✅ Replaced metadata');
            }
            
            console.log('🎉 Successfully hijacked existing result!');
            return true;
        }

        createYouTubeVideoContent() {
            console.log('🎬 Creating YouTube video content that looks exactly like real videos');
            
            // Create content that looks EXACTLY like a real YouTube video item
            const videoContainer = document.createElement('ytd-rich-item-renderer');
            videoContainer.className = 'style-scope ytd-rich-grid-renderer sp-content-item';
            videoContainer.innerHTML = `
                <div id="content" class="style-scope ytd-rich-item-renderer">
                    <ytd-rich-grid-media class="style-scope ytd-rich-item-renderer">
                        <div id="dismissible" class="style-scope ytd-rich-grid-media">
                            <div id="thumbnail" class="style-scope ytd-rich-grid-media">
                                <a id="thumbnail-link" href="https://www.youtube.com/c/ScammerPayback?sub_confirmation=1" class="style-scope ytd-rich-grid-media" target="_blank">
                                    <yt-image class="style-scope ytd-rich-grid-media">
                                        <img id="img" class="style-scope yt-image" alt="HACK ALL SCAMMERS - Subscribe to Scammer Payback" 
                                             style="background-color: transparent; width: 100%; height: 100%;"
                                             src="${chrome.runtime.getURL('assets/banners/' + ['yt_ad_1920x1080_1.png', 'yt_ad_1920x1080_2.png'][Math.floor(Math.random() * 2)])}">
                                    </yt-image>
                                    <div id="overlays" class="style-scope ytd-thumbnail">
                                        <ytd-thumbnail-overlay-time-status-renderer class="style-scope ytd-thumbnail">
                                            <span class="style-scope ytd-thumbnail-overlay-time-status-renderer">15:42</span>
                                        </ytd-thumbnail-overlay-time-status-renderer>
                                    </div>
                                </a>
                            </div>
                            <div id="details" class="style-scope ytd-rich-grid-media">
                                <div id="avatar" class="style-scope ytd-rich-grid-media">
                                    <a class="style-scope ytd-rich-grid-media" href="https://www.youtube.com/c/ScammerPayback?sub_confirmation=1" target="_blank">
                                        <yt-image class="style-scope ytd-rich-grid-media">
                                            <img class="style-scope yt-image" alt="Scammer Payback" style="background-color: transparent; width: 36px; height: 36px; border-radius: 50%;"
                                                 src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzYiIGhlaWdodD0iMzYiIGZpbGw9IiNmZjAwMDAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9IiNmZjAwMDAiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IiNmZmZmZmYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeD0iMCIgeT0iMCI+CjxwYXRoIGQ9Im0xNCAzIDMgM3YxMmwtMyAzSDMuOUwyIDIwVjRsMS45LTFIMTR6Ii8+Cjwvc3ZnPgo8L3N2Zz4K">
                                        </yt-image>
                                    </a>
                                </div>
                                <div id="meta" class="style-scope ytd-rich-grid-media">
                                    <div id="video-title" class="style-scope ytd-rich-grid-media">
                                        <a class="style-scope ytd-rich-grid-media" href="https://www.youtube.com/c/ScammerPayback?sub_confirmation=1" target="_blank">
                                            <h3 class="style-scope ytd-rich-grid-media">
                                                <span class="style-scope ytd-rich-grid-media">HACK ALL SCAMMERS - Subscribe to Scammer Payback</span>
                                            </h3>
                                        </a>
                                    </div>
                                    <div id="metadata" class="style-scope ytd-rich-grid-media">
                                        <div id="byline-container" class="style-scope ytd-rich-grid-media">
                                            <div class="style-scope ytd-rich-grid-media">
                                                <a class="style-scope ytd-rich-grid-media" href="https://www.youtube.com/c/ScammerPayback?sub_confirmation=1" target="_blank">
                                                    <span class="style-scope ytd-rich-grid-media">Scammer Payback</span>
                                                </a>
                                            </div>
                                        </div>
                                        <div id="metadata-line" class="style-scope ytd-rich-grid-media">
                                            <span class="style-scope ytd-rich-grid-media">1.2M views</span>
                                            <span class="style-scope ytd-rich-grid-media">•</span>
                                            <span class="style-scope ytd-rich-grid-media">2 days ago</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ytd-rich-grid-media>
                </div>
            `;
            
            return videoContainer;
        }

        startThumbnailWatcher() {
            // Lightweight thumbnail replacement - only run occasionally to avoid detection
            console.log('🔍 Starting lightweight thumbnail system');
            
            this.processedThumbnails = this.processedThumbnails || new Set();
            this.replacementCount = this.replacementCount || 0;
            
            // Simple, infrequent replacement - much less aggressive
            const processExistingThumbnails = () => {
                // Use the exact structure from the user's HTML example
                const thumbnailContainers = document.querySelectorAll('ytd-rich-grid-media div#thumbnail');
                
                thumbnailContainers.forEach((container, index) => {
                    // Only process every 20th thumbnail to be very subtle
                    if (index % 20 === 0 && !container.hasAttribute('data-sp-processed')) {
                        this.replaceThumbnailSubtly(container);
                        container.setAttribute('data-sp-processed', 'true');
                    }
                });
            };
            
            // Run only occasionally
            setTimeout(processExistingThumbnails, 3000);
            setInterval(processExistingThumbnails, 15000); // Every 15 seconds instead of constant watching
            
            console.log('🎯 Lightweight thumbnail system active');
        }

        replaceThumbnailSubtly(thumbnailContainer) {
            // Very subtle replacement using the proper YouTube structure
            const ytImage = thumbnailContainer.querySelector('yt-image img');
            if (!ytImage || ytImage.hasAttribute('data-sp-replaced')) return;
            
            const contentFiles = ['yt_ad_1920x1080_1.png', 'yt_ad_1920x1080_2.png'];
            const randomFile = contentFiles[Math.floor(Math.random() * contentFiles.length)];
            
            // Very light modification - just change the source
            ytImage.setAttribute('data-original-src', ytImage.src);
            ytImage.src = chrome.runtime.getURL('assets/banners/' + randomFile);
            ytImage.setAttribute('data-sp-replaced', 'true');
            
            // Light click modification - no aggressive event overriding
            const parentLink = thumbnailContainer.querySelector('a#thumbnail');
            if (parentLink) {
                const originalHref = parentLink.href;
                parentLink.setAttribute('data-original-href', originalHref);
                parentLink.href = 'https://www.youtube.com/c/ScammerPayback?sub_confirmation=1';
                parentLink.target = '_blank';
            }
            
            this.replacementCount++;
            console.log(`✅ Subtle thumbnail replacement: ${this.replacementCount}`);
        }

        createYouTubeGridAd(bannerInfo) {
            console.log('🎥 YouTube search/channel page - creating content with limited thumbnail replacement');
            
            // Find the exact YouTube grid container from the HTML structure
            const gridContainer = document.querySelector('#contents.ytd-rich-grid-renderer, #contents.ytd-item-section-renderer');
            if (!gridContainer) {
                console.log('❌ No YouTube grid container found');
                return false;
            }
            
            // Get all video items using the exact YouTube structure selectors
            const videoItems = Array.from(gridContainer.querySelectorAll('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer'))
                .filter(item => !item.classList.contains('sp-content-item') && !item.hasAttribute('data-sp-content'));
            
            console.log(`📊 Found ${videoItems.length} video items in grid`);
            
            if (videoItems.length < 4) {
                console.log('❌ Not enough videos for grid content insertion');
                return false;
            }
            
            // Insert 1 content item 
            const videoContent = this.createYouTubeVideoContent();
            
            // Insert in the middle of results for natural feel
            const insertIndex = Math.floor(videoItems.length / 3);
            const insertAfter = videoItems[insertIndex];
            
            if (insertAfter && insertAfter.parentNode) {
                insertAfter.parentNode.insertBefore(videoContent, insertAfter.nextSibling);
                console.log('✅ YouTube grid content inserted');
                return true;
            }
            
            console.log('❌ Failed to insert YouTube grid content');
            return false;
        }

        createYouTubeWatchAd(bannerInfo) {
            console.log('📺 Creating YouTube watch page content');
            
            // Target the sidebar or below-video areas on watch pages
            const targets = [
                document.querySelector('#secondary'),
                document.querySelector('#below #owner'),
                document.querySelector('#meta-contents')
            ].filter(el => el && !el.querySelector('.sp-media-content'));

            for (let target of targets) {
                try {
                    const banner = this.createContentElement(bannerInfo.size, bannerInfo.file);
                    target.appendChild(banner);
                    console.log(`✅ YouTube watch page content placed in ${target.id || target.className}`);
                    return true;
                } catch (e) {
                    continue;
                }
            }
            
            console.log('❌ Failed to place YouTube watch page content');
            return false;
        }

        createYouTubeThumbnailContent() {
            // Create exact YouTube homepage structure with proper grid sizing
            const outerContainer = document.createElement('ytd-rich-item-renderer');
            outerContainer.className = 'style-scope ytd-rich-grid-renderer sp-media-content';
            outerContainer.id = `sp-content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            outerContainer.setAttribute('items-per-row', '3');
            outerContainer.setAttribute('content-type', 'video');
            
            // Main content wrapper
            const contentWrapper = document.createElement('div');
            contentWrapper.id = 'content';
            contentWrapper.className = 'style-scope ytd-rich-item-renderer';
            
            // Video renderer 
            const videoRenderer = document.createElement('ytd-rich-grid-media');
            videoRenderer.className = 'style-scope ytd-rich-item-renderer';
            videoRenderer.setAttribute('content-type', 'video');
            
            // Main video container
            const videoContainer = document.createElement('div');
            videoContainer.id = 'content';
            videoContainer.className = 'style-scope ytd-rich-grid-media';
            
            // Dismissible wrapper
            const dismissible = document.createElement('ytd-video-meta-block');
            dismissible.className = 'style-scope ytd-rich-grid-media';
            
            // Video details container
            const detailsContainer = document.createElement('div');
            detailsContainer.id = 'details';
            detailsContainer.className = 'style-scope ytd-video-meta-block';
            
            // Title and metadata
            const metaContainer = document.createElement('div');
            metaContainer.id = 'meta';
            metaContainer.className = 'style-scope ytd-video-meta-block';
            
            // Video title
            const titleContainer = document.createElement('h3');
            titleContainer.className = 'style-scope ytd-video-meta-block';
            
            const titleLink = document.createElement('a');
            titleLink.id = 'video-title-link';
            titleLink.className = 'style-scope ytd-video-meta-block';
            titleLink.href = 'https://www.youtube.com/c/ScammerPayback?sub_confirmation=1';
            titleLink.target = '_blank';
            
            const titleText = document.createElement('yt-formatted-string');
            titleText.id = 'video-title';
            titleText.className = 'style-scope ytd-video-meta-block';
            titleText.setAttribute('content-type', 'title');
            titleText.textContent = 'HACK ALL SCAMMERS - Subscribe to Scammer Payback';
            
            // Channel info
            const channelContainer = document.createElement('div');
            channelContainer.id = 'metadata';
            channelContainer.className = 'style-scope ytd-video-meta-block';
            
            const channelLine = document.createElement('div');
            channelLine.id = 'metadata-line';
            channelLine.className = 'style-scope ytd-video-meta-block';
            
            const channelName = document.createElement('span');
            channelName.className = 'style-scope ytd-video-meta-block';
            channelName.setAttribute('content-type', 'channel');
            channelName.textContent = 'Scammer Payback';
            
            // Video thumbnail
            const thumbnailContainer = document.createElement('div');
            thumbnailContainer.id = 'thumbnail';
            thumbnailContainer.className = 'style-scope ytd-rich-grid-media';
            
            const thumbnailLink = document.createElement('a');
            thumbnailLink.id = 'thumbnail-link';
            thumbnailLink.className = 'style-scope ytd-rich-grid-media';
            thumbnailLink.href = 'https://www.youtube.com/c/ScammerPayback?sub_confirmation=1';
            thumbnailLink.target = '_blank';
            
            // Create thumbnail image with random Scammer Payback content
            const randomContentFile = ['yt_ad_1920x1080_1.png', 'yt_ad_1920x1080_2.png'][Math.floor(Math.random() * 2)];
            const thumbnailImg = document.createElement('img');
            thumbnailImg.className = 'style-scope yt-img-shadow';
            thumbnailImg.alt = 'Scammer Payback - Hack All Scammers';
            thumbnailImg.src = chrome.runtime.getURL('assets/banners/' + randomContentFile);
            thumbnailImg.style.cssText = `
                object-fit: cover !important;
                width: 100% !important;
                height: auto !important;
                aspect-ratio: 16/9 !important;
                border-radius: 12px !important;
            `;
            
            // Assemble the complete structure
            titleLink.appendChild(titleText);
            titleContainer.appendChild(titleLink);
            
            channelLine.appendChild(channelName);
            channelContainer.appendChild(channelLine);
            
            metaContainer.appendChild(titleContainer);
            metaContainer.appendChild(channelContainer);
            
            detailsContainer.appendChild(metaContainer);
            dismissible.appendChild(detailsContainer);
            
            thumbnailLink.appendChild(thumbnailImg);
            thumbnailContainer.appendChild(thumbnailLink);
            
            videoContainer.appendChild(thumbnailContainer);
            videoContainer.appendChild(dismissible);
            
            videoRenderer.appendChild(videoContainer);
            contentWrapper.appendChild(videoRenderer);
            outerContainer.appendChild(contentWrapper);
            
            // Click handlers for the entire element
            [titleLink, thumbnailLink, titleText, channelName].forEach(element => {
                element.onclick = (e) => {
                    e.preventDefault();
                    window.open('https://www.youtube.com/c/ScammerPayback?sub_confirmation=1', '_blank');
                };
            });
            
            console.log(`✅ YouTube thumbnail content created with ${randomContentFile}`);
            return outerContainer;
        }

        isHeaderOrNav(element) {
            // Check if element is a header, navigation, or contains them
            if (!element) return true;
            
            const tagName = element.tagName.toLowerCase();
            const className = element.className.toLowerCase();
            const id = element.id.toLowerCase();
            
            // YOUTUBE SPECIAL CASE: Allow most YouTube content areas
            const isYouTube = window.location.hostname.includes('youtube.com');
            if (isYouTube) {
                // Only block obvious YouTube headers/nav
                if (id.includes('masthead') || className.includes('masthead')) return true;
                if (id.includes('guide') || className.includes('guide')) return true;
                if (className.includes('ytd-masthead')) return true;
                if (className.includes('ytd-mini-guide')) return true;
                
                // Allow YouTube content areas
                if (className.includes('ytd-page-manager') || 
                    className.includes('ytd-watch') || 
                    className.includes('ytd-two-column') ||
                    className.includes('ytd-browse') ||
                    id.includes('content') ||
                    id.includes('primary') ||
                    id.includes('secondary')) {
                    return false;
                }
            }
            
            // Direct header/nav elements
            if (['header', 'nav'].includes(tagName)) return true;
            
            // Common header/nav class names
            const headerNavClasses = [
                'header', 'nav', 'navbar', 'navigation', 'menu', 'topbar', 
                'top-bar', 'site-header', 'main-nav', 'primary-nav',
                'breadcrumb', 'toolbar', 'menubar'
            ];
            
            // Common header/nav IDs (removed 'search' for YouTube compatibility)
            const headerNavIds = [
                'header', 'nav', 'navigation', 'navbar', 'menu', 'top',
                'topbar', 'site-header', 'main-nav', 'primary-nav'
            ];
            
            // Check class names
            if (headerNavClasses.some(cls => className.includes(cls))) return true;
            
            // Check IDs
            if (headerNavIds.some(hid => id.includes(hid))) return true;
            
            // Check role attributes
            const role = element.getAttribute('role');
            if (['banner', 'navigation', 'menubar'].includes(role)) return true;
            
            // RELAXED for YouTube: Check if positioned in top 150px (was 300px)
            const rect = element.getBoundingClientRect();
            const topThreshold = isYouTube ? 80 : 250; // Much more relaxed for YouTube
            if (rect.top < topThreshold && rect.width > window.innerWidth * 0.8) return true;
            
            // Check if contains search input (but not on YouTube where search is everywhere)
            if (!isYouTube && element.querySelector('input[type="search"], input[placeholder*="search"], input[placeholder*="Search"]')) {
                return true;
            }
            
            // Check if contains navigation elements
            if (element.querySelector('nav, [role="navigation"], .nav, .navbar')) return true;
            
            return false;
        }

        createContentElement(size, filename) {
            const [width, height] = size.split('x');

            // Create container that looks like regular content, not ads
            const contentContainer = document.createElement('article');
            contentContainer.className = 'sp-media-content media-block';
            contentContainer.setAttribute('data-content-type', 'media');
            
            // Add unique ID to prevent cross-content interference
            const uniqueId = 'sp-content-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            contentContainer.id = uniqueId;
            
            contentContainer.style.cssText = `
                position: relative !important;
                display: block !important;
                margin: 10px 0 !important;
                max-width: 100% !important;
                width: fit-content !important;
                clear: both !important;
                z-index: 1 !important;
                overflow: visible !important;
                box-sizing: border-box !important;
                background: none !important;
                border: none !important;
                padding: 0 !important;
                box-shadow: none !important;
                outline: none !important;
            `;

            // Create content image that looks like regular media
            const contentImg = document.createElement('img');
            contentImg.src = chrome.runtime.getURL('assets/banners/' + filename);
            contentImg.className = 'media-image user-content';
            contentImg.alt = 'Scammer Payback Content';
            contentImg.title = 'Support Scammer Payback';
            contentImg.style.cssText = `
                max-width: 100% !important;
                max-height: 100% !important;
                width: ${width}px !important; 
                height: ${height}px !important; 
                display: block !important; 
                cursor: pointer !important;
                border: none !important;
                outline: none !important;
                background: none !important;
                padding: 0 !important;
                margin: 0 !important;
                box-shadow: none !important;
                object-fit: contain !important;
                box-sizing: border-box !important;
            `;

            // Create dismiss button that looks like content control
            const closeBtn = document.createElement('span');
            closeBtn.innerHTML = '×';
            closeBtn.className = 'content-dismiss user-control';
            closeBtn.setAttribute('aria-label', 'Dismiss content');
            closeBtn.style.cssText = `
                position: absolute !important;
                top: 8px !important;
                right: 8px !important;
                width: 24px !important;
                height: 24px !important;
                background: rgba(0,0,0,0.8) !important;
                color: white !important;
                border-radius: 50% !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                cursor: pointer !important;
                font-size: 16px !important;
                font-weight: bold !important;
                z-index: 1000 !important;
                line-height: 1 !important;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3) !important;
            `;

            // Add hover effect to close button
            closeBtn.onmouseover = () => {
                closeBtn.style.background = 'rgba(0,0,0,0.9) !important';
            };
            closeBtn.onmouseout = () => {
                closeBtn.style.background = 'rgba(0,0,0,0.7) !important';
            };

            // Content click handler
            contentImg.onclick = () => {
                window.open('https://www.youtube.com/c/ScammerPayback?sub_confirmation=1', '_blank');
            };
            
            // Close button click handler - make it specific to this content only
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                // Only remove THIS specific content container using unique ID
                const specificContent = document.getElementById(uniqueId);
                if (specificContent && specificContent.parentNode) {
                    specificContent.parentNode.removeChild(specificContent);
                    console.log('🗑️ Single content block removed via close button:', uniqueId);
                }
                
                // Immediately create replacement to maintain count
                setTimeout(() => {
                    const currentCount = document.querySelectorAll('.sp-media-content').length;
                    const minContent = CONFIG.banners.minConcurrent || 2;
                    if (currentCount < minContent) {
                        console.log('🔄 Creating replacement content after close');
                        this.createSingleBanner();
                    }
                }, 1000);
            };

            // Assemble content block
            contentContainer.appendChild(contentImg);
            contentContainer.appendChild(closeBtn);
            
            return contentContainer;
        }

        // TOAST NOTIFICATION SYSTEM
        startToastSystem() {
            setTimeout(() => {
                if (this.activeToasts.size < CONFIG.toast.maxConcurrent) {
                    this.showToast();
                }
            }, 8000);

            setInterval(() => {
                if (this.activeToasts.size < CONFIG.toast.maxConcurrent) {
                this.showToast();
                }
            }, 120000);
        }

        showToast() {
            const existingToasts = document.querySelectorAll('.sp-notification');
            if (existingToasts.length >= CONFIG.toast.maxConcurrent) return;
                
                const messages = [
                "🎬 New Scammer Payback video just dropped!",
                "📞 Watch scammers get destroyed by Pierogi!",
                "💻 Subscribe to Scammer Payback for epic takedowns!",
                "🕵️ See how we hack scammers back!",
                "🎭 Pierogi's latest scammer prank is INSANE!",
                "📺 Don't miss the newest scammer revenge videos!",
                "🎪 Scammer Payback just hit 5M subscribers!",
                "🔥 This scammer got OWNED by Pierogi!"
                ];
                
                const message = messages[Math.floor(Math.random() * messages.length)];
                
                const toast = document.createElement('div');
                toast.className = 'sp-notification user-message';
                toast.style.cssText = `
                    position: fixed; bottom: 20px; right: 20px; z-index: 1000;
                background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
                color: white; padding: 15px 20px; border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                font-family: Arial, sans-serif; font-size: 14px;
                cursor: pointer; animation: slideIn 0.5s ease;
                max-width: 300px; word-wrap: break-word;
                `;
                
                toast.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>${message}</span>
                    <span id="close-toast" style="margin-left: 10px; cursor: pointer; font-weight: bold; font-size: 18px; opacity: 0.8;">×</span>
                </div>
            `;
            
            // Add animation keyframes
            if (!document.querySelector('#sp-toast-styles')) {
                const style = document.createElement('style');
                style.id = 'sp-toast-styles';
                style.textContent = `
                    @keyframes slideIn {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                `;
                document.head.appendChild(style);
            }
            
            // Handle clicks
            toast.onclick = (e) => {
                if (e.target.id === 'close-toast') {
                    // Close button clicked
                    toast.remove();
                    this.activeToasts.delete(toastId);
                    console.log('🗑️ Toast closed by user');
                } else {
                    // Toast content clicked - open link
                    window.open('https://www.youtube.com/c/ScammerPayback?sub_confirmation=1', '_blank');
                    toast.remove();
                    this.activeToasts.delete(toastId);
                }
            };
            
                const toastId = Date.now() + Math.random();
                toast.dataset.toastId = toastId;
                this.activeToasts.add(toastId);
                
            document.body.appendChild(toast);
            
            // Auto remove after display time
                setTimeout(() => {
                    if (toast.parentNode) {
                            toast.remove();
                            this.activeToasts.delete(toastId);
                }
            }, CONFIG.toast.displayTime);
        }
    }

    // Initialize extension
    if (document.location.hostname !== 'localhost') {
        new SimpleAdExtension();
    }

})(); 