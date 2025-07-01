// Core Configuration for Scammer Payback Promoter
// Using global scope instead of ES6 modules for Chrome extension compatibility

(function() {
    'use strict';
    
    console.log('SP: Loading configuration...');

    const CONFIG = {
        scammerPaybackUrl: 'https://www.youtube.com/c/ScammerPayback?sub_confirmation=1',
        rotationTime: 45000 // 45 seconds between ad changes
    };

    // Available banner sizes and images with placement preferences
    const BANNER_TYPES = [
        { 
            size: '160x600', 
            file: 'ad_160x600.png', 
            type: 'skyscraper', 
            width: 160, 
            height: 600,
            preferredPlacements: ['sidebar', 'google-sidebar', 'youtube-sidebar-top', 'reddit-sidebar', 'twitter-sidebar', 'facebook-sidebar', 'sidebar-area']
        },
        { 
            size: '300x250', 
            file: 'ad_300x250.png', 
            type: 'rectangle', 
            width: 300, 
            height: 250,
            preferredPlacements: ['sidebar', 'between', 'article-middle', 'google-sidebar', 'youtube-sidebar-top', 'youtube-main-top', 'sidebar-area', 'content-break']
        },
        { 
            size: '320x50', 
            file: 'ad_320x50.png', 
            type: 'mobile', 
            width: 320, 
            height: 50,
            preferredPlacements: ['between', 'google-between-results', 'article-middle', 'youtube-main-top', 'youtube-before-comments', 'reddit-between', 'content-break', 'section-end']
        },
        { 
            size: '336x280', 
            file: 'ad_336x280.png', 
            type: 'large-rectangle', 
            width: 336, 
            height: 280,
            preferredPlacements: ['sidebar', 'between', 'article-middle', 'google-sidebar', 'youtube-sidebar-top', 'youtube-main-middle', 'sidebar-area', 'content-break']
        },
        { 
            size: '728x90', 
            file: 'ad_728x90.png', 
            type: 'leaderboard', 
            width: 728, 
            height: 90,
            preferredPlacements: ['between', 'google-between-results', 'google-bottom-results', 'article-middle', 'youtube-main-top', 'youtube-main-middle', 'youtube-before-comments', 'content-break', 'section-end']
        },
        { 
            size: '970x250', 
            file: 'ad_970x250.png', 
            type: 'billboard', 
            width: 970, 
            height: 250,
            preferredPlacements: ['between', 'google-bottom-results', 'article-middle', 'youtube-main-middle', 'content-break', 'section-end']
        }
    ];

    // Toast messages for corner notifications
    const TOAST_MESSAGES = [
        {
            icon: '🛡️',
            title: 'Fight Back Against Scammers!',
            subtitle: 'Subscribe to Scammer Payback'
        },
        {
            icon: '⚡',
            title: 'Stop Phone Scams!',
            subtitle: 'Join Scammer Payback'
        },
        {
            icon: '🔥',
            title: 'Hack All Scammers!',
            subtitle: 'Support Scammer Payback'
        },
        {
            icon: '💪',
            title: 'Turn the Tables on Scammers!',
            subtitle: 'Subscribe Now'
        }
    ];

    // Make configuration available globally
    window.SPCONFIG = CONFIG;
    window.SPBANNER_TYPES = BANNER_TYPES;
    window.SPTOAST_MESSAGES = TOAST_MESSAGES;
    
    console.log('SP: Configuration loaded');
})(); 