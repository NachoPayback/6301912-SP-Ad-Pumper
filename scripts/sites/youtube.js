// YouTube Ad Placement Logic
import { isValidAdContainer } from '../core/utils.js';

export function findYouTubeAdPlacements() {
    const points = [];
    
    // Main content area - target major sections, not individual videos
    const primaryContent = document.querySelector('#primary') || 
                          document.querySelector('#contents') ||
                          document.querySelector('ytd-browse[role="main"]') ||
                          document.querySelector('#page-manager');
    
    if (primaryContent) {
        // Look for the main video grid container
        const videoGrid = primaryContent.querySelector('#contents') ||
                         primaryContent.querySelector('.ytd-rich-grid-renderer') ||
                         primaryContent.querySelector('#grid-container');
        
        if (videoGrid && isValidAdContainer(videoGrid)) {
            // Get all video container sections
            const videoContainers = videoGrid.querySelectorAll(
                'ytd-rich-item-renderer, ytd-video-renderer, .ytd-rich-grid-row'
            );
            
            if (videoContainers.length > 3) {
                // Insert after first few videos (top of main content)
                points.push({
                    element: videoContainers[2], // After 3rd video
                    type: 'youtube-main-top',
                    score: 9
                });
                
                // Insert in middle of content if enough videos
                if (videoContainers.length > 12) {
                    const middleIndex = Math.floor(videoContainers.length / 2);
                    points.push({
                        element: videoContainers[middleIndex],
                        type: 'youtube-main-middle', 
                        score: 8
                    });
                }
                
                console.log(`SP: Found ${points.filter(p => p.type.includes('youtube-main')).length} YouTube main content positions`);
            }
        }
    }
    
    // Sidebar area (treat as one unit)
    const sidebar = document.querySelector('#secondary') ||
                   document.querySelector('#related') ||
                   document.querySelector('ytd-watch-next-secondary-results-renderer');
    
    if (sidebar && isValidAdContainer(sidebar)) {
        // Insert at top of sidebar
        const sidebarContent = sidebar.querySelector('#contents') || sidebar;
        if (sidebarContent) {
            points.push({
                element: sidebarContent,
                type: 'youtube-sidebar-top',
                score: 7
            });
            console.log('SP: Found YouTube sidebar position');
        }
    }
    
    // Comments section area
    const commentsSection = document.querySelector('#comments') ||
                           document.querySelector('ytd-comments') ||
                           document.querySelector('#comment-teaser');
    
    if (commentsSection && isValidAdContainer(commentsSection)) {
        points.push({
            element: commentsSection,
            type: 'youtube-before-comments',
            score: 6
        });
        console.log('SP: Found YouTube before-comments position');
    }
    
    // Channel page specific areas
    if (window.location.href.includes('/channel/') || window.location.href.includes('/c/') || window.location.href.includes('/@')) {
        const channelContent = document.querySelector('#page-header') ||
                             document.querySelector('.channel-header');
        
        if (channelContent && isValidAdContainer(channelContent)) {
            points.push({
                element: channelContent,
                type: 'youtube-channel-header',
                score: 8
            });
            console.log('SP: Found YouTube channel header position');
        }
    }
    
    console.log(`SP: Found ${points.length} total YouTube ad placement points`);
    return points;
} 