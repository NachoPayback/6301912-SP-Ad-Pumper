// Core Utility Functions

// Check if element is in header, footer, or navigation
export function isHeaderFooterNav(element) {
    if (!element || !element.tagName) return false;
    
    const tag = element.tagName.toLowerCase();
    if (['header', 'footer', 'nav'].includes(tag)) return true;
    
    const className = element.className ? element.className.toString().toLowerCase() : '';
    const id = element.id ? element.id.toLowerCase() : '';
    
    const patterns = [
        'header', 'footer', 'nav', 'menu', 'toolbar', 'topbar', 'navbar', 
        'sidebar', 'breadcrumb', 'pagination', 'tabs', 'tab-', 'masthead',
        'menubar', 'searchbar', 'titlebar', 'statusbar', 'banner'
    ];
    
    for (const pattern of patterns) {
        if (className.includes(pattern) || id.includes(pattern)) {
            return true;
        }
    }
    
    // Check if element is positioned as fixed/sticky (likely nav)
    const computedStyle = window.getComputedStyle(element);
    if (['fixed', 'sticky'].includes(computedStyle.position)) {
        return true;
    }
    
    return false;
}

// Check if element is a UI control element
export function isUIElement(element) {
    if (!element || !element.tagName) return false;
    
    const tag = element.tagName.toLowerCase();
    const uiTags = ['button', 'input', 'select', 'textarea', 'form', 'fieldset', 'label'];
    if (uiTags.includes(tag)) return true;
    
    const className = element.className ? element.className.toString().toLowerCase() : '';
    const uiPatterns = ['btn', 'button', 'input', 'form', 'control', 'field', 'widget'];
    
    return uiPatterns.some(pattern => className.includes(pattern));
}

// Calculate UI complexity score
export function getUIComplexity(element) {
    if (!element) return 0;
    
    let score = 0;
    
    // Count interactive elements
    const interactiveElements = element.querySelectorAll('button, input, select, textarea, a[href]');
    score += interactiveElements.length;
    
    // Count nested levels
    let depth = 0;
    let current = element;
    while (current.parentElement && depth < 10) {
        depth++;
        current = current.parentElement;
    }
    score += Math.floor(depth / 2);
    
    // Penalize small elements
    const rect = element.getBoundingClientRect();
    if (rect.width < 200 || rect.height < 100) score += 5;
    
    return score;
}

// Check if element is a valid container for ads
export function isValidAdContainer(element) {
    return element && 
           element.getBoundingClientRect &&
           !isOverlayElement(element);
}

// Check if element is an overlay or modal
export function isOverlayElement(element) {
    if (!element) return false;
    
    const computedStyle = window.getComputedStyle(element);
    const zIndex = parseInt(computedStyle.zIndex) || 0;
    
    // High z-index suggests overlay
    if (zIndex > 1000) return true;
    
    // Check for common overlay/modal classes
    const className = element.className ? element.className.toString().toLowerCase() : '';
    const overlayPatterns = ['modal', 'overlay', 'popup', 'dialog', 'dropdown', 'tooltip'];
    
    return overlayPatterns.some(pattern => className.includes(pattern));
}

// Check if element would make a good content break
export function isGoodContentBreak(element) {
    if (!element || isHeaderFooterNav(element) || isUIElement(element)) {
        return false;
    }
    
    const rect = element.getBoundingClientRect();
    if (rect.width < 200 || rect.height < 50) return false;
    
    // Check for content indicators
    const text = element.textContent || '';
    const className = element.className ? element.className.toString().toLowerCase() : '';
    
    // Good content elements
    const goodPatterns = ['article', 'post', 'content', 'story', 'news', 'blog', 'entry'];
    const hasGoodPattern = goodPatterns.some(pattern => className.includes(pattern));
    
    // Bad content elements  
    const badPatterns = ['ad', 'sponsor', 'promo', 'widget', 'sidebar', 'nav', 'menu'];
    const hasBadPattern = badPatterns.some(pattern => className.includes(pattern));
    
    // Prefer elements with substantial text content
    const hasSubstantialText = text.length > 100;
    
    return (hasGoodPattern || hasSubstantialText) && !hasBadPattern;
}

// Get optimal banner type for different placement needs
export function getDifferentBannerType() {
    return Math.floor(Math.random() * window.BANNER_TYPES.length);
}

// Find best insertion point for a specific banner type
export function getBestInsertionPointForBanner(bannerType, insertionPoints) {
    if (!insertionPoints.length) return null;
    
    // Filter points that match banner's preferred placements
    const preferredPoints = insertionPoints.filter(point => 
        bannerType.preferredPlacements.includes(point.type)
    );
    
    // Use preferred points if available, otherwise use any valid point
    const candidatePoints = preferredPoints.length > 0 ? preferredPoints : insertionPoints;
    
    // Sort by score (higher is better)
    candidatePoints.sort((a, b) => b.score - a.score);
    
    return candidatePoints[0];
}

// Find a different insertion point (avoid duplicates)
export function findDifferentInsertionPoint(allPoints, usedPoint) {
    const availablePoints = allPoints.filter(point => 
        point.element !== usedPoint.element && 
        point.type !== usedPoint.type
    );
    
    return availablePoints.length > 0 ? availablePoints[0] : null;
} 