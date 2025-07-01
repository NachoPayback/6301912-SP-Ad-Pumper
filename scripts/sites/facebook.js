// Facebook Ad Placement Logic
import { isValidAdContainer } from '../core/utils.js';

export function findFacebookAdPlacements() {
    const points = [];
    
    // Facebook right sidebar
    const sidebar = document.querySelector('[data-pagelet="RightRail"]') ||
                   document.querySelector('.ego_column') ||
                   document.querySelector('#rightCol');
    
    if (sidebar && isValidAdContainer(sidebar)) {
        points.push({
            element: sidebar,
            type: 'facebook-sidebar',
            score: 8
        });
        console.log('SP: Found Facebook sidebar');
    }
    
    console.log(`SP: Found ${points.length} total Facebook ad placement points`);
    return points;
} 