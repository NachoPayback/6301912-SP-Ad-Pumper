// Generic Ad Placement Logic
import { isValidAdContainer, isGoodContentBreak, isHeaderFooterNav, isUIElement } from '../core/utils.js';

export function findGenericAdPlacements() {
    const points = [];
    
    // Find content breaks, sidebar areas, and section ends
    const contentBreaks = findContentBreaks();
    const sidebarAreas = findSidebarAreas();
    const sectionEnds = findSectionEnds();
    
    points.push(...contentBreaks, ...sidebarAreas, ...sectionEnds);
    
    console.log(`SP: Found ${points.length} total generic ad placement points`);
    return points;
}

// Find natural content breaks in page content
function findContentBreaks() {
    const points = [];
    const contentElements = document.querySelectorAll('p, div, article, section, main');
    
    contentElements.forEach((element, index) => {
        if (index > 0 && isGoodContentBreak(element)) {
            points.push({
                element: element,
                type: 'content-break',
                score: 6
            });
        }
    });
    
    console.log(`SP: Found ${points.length} generic content breaks`);
    return points;
}

// Find sidebar-like areas
function findSidebarAreas() {
    const points = [];
    const sidebarSelectors = [
        'aside', '.sidebar', '.side', '#sidebar',
        '.widget-area', '.secondary', '.complementary'
    ];
    
    sidebarSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            if (isValidAdContainer(element) && 
                !isHeaderFooterNav(element) && 
                !isUIElement(element)) {
                points.push({
                    element: element,
                    type: 'sidebar-area',
                    score: 8
                });
            }
        });
    });
    
    console.log(`SP: Found ${points.length} generic sidebar areas`);
    return points;
}

// Find natural section endings
function findSectionEnds() {
    const points = [];
    const sections = document.querySelectorAll('section, article, .post, .entry');
    
    sections.forEach(section => {
        if (isValidAdContainer(section) && section.getBoundingClientRect().height > 200) {
            points.push({
                element: section,
                type: 'section-end',
                score: 5
            });
        }
    });
    
    console.log(`SP: Found ${points.length} generic section ends`);
    return points;
} 