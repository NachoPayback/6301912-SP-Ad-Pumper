// Reddit Ad Placement Logic
import { isValidAdContainer } from '../core/utils.js';

export function findRedditAdPlacements() {
    const points = [];
    
    // Reddit sidebar
    const sidebar = document.querySelector('.side') ||
                   document.querySelector('[data-testid="subreddit-sidebar"]') ||
                   document.querySelector('.sidebar');
    
    if (sidebar && isValidAdContainer(sidebar)) {
        points.push({
            element: sidebar,
            type: 'reddit-sidebar',
            score: 8
        });
        console.log('SP: Found Reddit sidebar');
    }
    
    // Between posts
    const posts = document.querySelectorAll('.Post, [data-testid="post-container"], .thing');
    
    if (posts.length >= 3) {
        posts.forEach((post, index) => {
            if (index > 0 && index % 4 === 0 && isValidAdContainer(post)) {
                points.push({
                    element: post,
                    type: 'reddit-between',
                    score: 7
                });
            }
        });
        console.log(`SP: Found ${points.filter(p => p.type === 'reddit-between').length} Reddit between-posts positions`);
    }
    
    console.log(`SP: Found ${points.length} total Reddit ad placement points`);
    return points;
} 