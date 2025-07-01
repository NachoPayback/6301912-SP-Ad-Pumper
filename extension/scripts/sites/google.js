// Google Search Ad Placement Logic
import { isValidAdContainer } from '../core/utils.js';

export function findGoogleAdPlacements() {
    const points = [];
    
    // Right sidebar area (where Google normally shows shopping ads)
    const rightColumn = document.querySelector('#rhs') || 
                       document.querySelector('.rhsvw') ||
                       document.querySelector('[data-st-cnt="rhs"]') ||
                       document.querySelector('#rhs_block');
    
    if (rightColumn && isValidAdContainer(rightColumn)) {
        points.push({
            element: rightColumn,
            type: 'google-sidebar',
            score: 10
        });
        console.log('SP: Found Google right sidebar for ads');
    }
    
    // Between search results (in body content area)
    const searchResults = document.querySelectorAll('.g, [data-hveid]');
    const searchContainer = document.querySelector('#search') || document.querySelector('#res');
    
    if (searchContainer && searchResults.length >= 3) {
        searchResults.forEach((result, index) => {
            // Insert after every 3rd result, but only in the main search body
            if (index > 0 && index % 3 === 0 && 
                searchContainer.contains(result) && 
                isValidAdContainer(result)) {
                
                points.push({
                    element: result,
                    type: 'google-between-results',
                    score: 8
                });
            }
        });
        console.log(`SP: Found ${points.filter(p => p.type === 'google-between-results').length} Google between-results positions`);
    }
    
    // Bottom of search results
    const bottomResults = document.querySelector('#botstuff') || 
                         document.querySelector('.AaVjTc') ||
                         document.querySelector('#extrares');
    
    if (bottomResults && isValidAdContainer(bottomResults)) {
        points.push({
            element: bottomResults,
            type: 'google-bottom-results',
            score: 6
        });
        console.log('SP: Found Google bottom results area');
    }
    
    // Shopping results area (if present)
    const shoppingResults = document.querySelector('.shopping-results') ||
                           document.querySelector('[data-st-cnt="shopping"]');
    
    if (shoppingResults && isValidAdContainer(shoppingResults)) {
        points.push({
            element: shoppingResults,
            type: 'google-shopping',
            score: 7
        });
        console.log('SP: Found Google shopping results area');
    }
    
    console.log(`SP: Found ${points.length} total Google ad placement points`);
    return points;
} 