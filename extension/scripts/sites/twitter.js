// Twitter/X Ad Placement Logic
import { isValidAdContainer } from '../core/utils.js';

export function findTwitterAdPlacements() {
    const points = [];
    
    // Twitter sidebar
    const sidebar = document.querySelector('[data-testid="sidebarColumn"]') ||
                   document.querySelector('.r-yfoy6g') ||
                   document.querySelector('#react-root aside');
    
    if (sidebar && isValidAdContainer(sidebar)) {
        points.push({
            element: sidebar,
            type: 'twitter-sidebar',
            score: 8
        });
        console.log('SP: Found Twitter sidebar');
    }
    
    console.log(`SP: Found ${points.length} total Twitter ad placement points`);
    return points;
} 