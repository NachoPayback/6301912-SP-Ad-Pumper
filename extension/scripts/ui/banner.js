// Banner UI Management
import { BANNER_TYPES, CONFIG } from '../core/config.js';

// Create banner element using actual banner images
export function createBanner(specificBannerType = null) {
    const bannerType = specificBannerType || BANNER_TYPES[Math.floor(Math.random() * BANNER_TYPES.length)];
    const bannerId = 'sp-banner-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    const banner = document.createElement('div');
    banner.id = bannerId;
    banner.className = `sp-inserted-banner sp-banner-${bannerType.type}`;
    banner.setAttribute('data-sp-banner', 'true');
    banner.setAttribute('data-banner-type', bannerType.type);
    
    const extensionUrl = chrome.runtime.getURL('');
    const imgSrc = extensionUrl + 'assets/banners/' + bannerType.file;
    
    banner.innerHTML = `
        <a href="#" class="sp-banner-link" target="_blank">
            <img src="${imgSrc}" 
                 alt="Scammer Payback - Fight Back Against Scammers" 
                 width="${bannerType.width}" 
                 height="${bannerType.height}"
                 class="sp-banner-image">
        </a>
        <div class="sp-banner-close" title="Close Ad">&times;</div>
    `;
    
    return { element: banner, type: bannerType };
}

// Calculate optimal banner size for container
export function calculateOptimalBannerSize(bannerType, targetElement, insertionPoint) {
    if (!targetElement || !bannerType) {
        console.warn('SP: Missing target element or banner type for size calculation');
        return { width: bannerType.width, height: bannerType.height };
    }
    
    const rect = targetElement.getBoundingClientRect();
    const parentRect = targetElement.parentElement ? 
        targetElement.parentElement.getBoundingClientRect() : 
        { width: window.innerWidth, height: window.innerHeight };
    
    console.log(`SP: Calculating size for ${bannerType.type} banner in ${insertionPoint.type} placement`);
    console.log(`SP: Target container dimensions: ${rect.width}x${rect.height}`);
    console.log(`SP: Parent container dimensions: ${parentRect.width}x${parentRect.height}`);
    
    // Use the smaller of target and parent widths as constraint
    const availableWidth = Math.min(rect.width || parentRect.width, parentRect.width);
    const availableHeight = Math.min(rect.height || parentRect.height, parentRect.height);
    
    // Apply placement-specific constraints
    let maxWidth = availableWidth;
    let maxHeight = availableHeight;
    
    // Placement type constraints
    if (insertionPoint.type.includes('sidebar')) {
        maxWidth = Math.min(maxWidth, 400); // Sidebars shouldn't be too wide
        maxHeight = Math.min(maxHeight, window.innerHeight * 0.6); // Max 60% of viewport height
    } else if (insertionPoint.type.includes('main') || insertionPoint.type.includes('between')) {
        maxWidth = Math.min(maxWidth, 1000); // Main content max width
        maxHeight = Math.min(maxHeight, 400); // Reasonable height for content areas
    } else if (insertionPoint.type.includes('article')) {
        maxWidth = Math.min(maxWidth, 600); // Article content constraint
        maxHeight = Math.min(maxHeight, 300);
    }
    
    // Original banner dimensions
    const originalWidth = bannerType.width;
    const originalHeight = bannerType.height;
    const aspectRatio = originalWidth / originalHeight;
    
    // Calculate scale factor needed to fit constraints
    const scaleByWidth = maxWidth / originalWidth;
    const scaleByHeight = maxHeight / originalHeight;
    const scaleFactor = Math.min(scaleByWidth, scaleByHeight, 1); // Never scale up
    
    // Apply scaling
    let finalWidth = Math.floor(originalWidth * scaleFactor);
    let finalHeight = Math.floor(originalHeight * scaleFactor);
    
    // Ensure minimum readable size
    const minWidth = 120;
    const minHeight = 50;
    
    if (finalWidth < minWidth) {
        finalWidth = minWidth;
        finalHeight = Math.floor(finalWidth / aspectRatio);
    }
    
    if (finalHeight < minHeight) {
        finalHeight = minHeight;
        finalWidth = Math.floor(finalHeight * aspectRatio);
    }
    
    // Final constraint check - if still too large, scale down proportionally
    if (finalWidth > maxWidth || finalHeight > maxHeight) {
        const finalScale = Math.min(maxWidth / finalWidth, maxHeight / finalHeight);
        finalWidth = Math.floor(finalWidth * finalScale);
        finalHeight = Math.floor(finalHeight * finalScale);
    }
    
    console.log(`SP: Original banner size: ${originalWidth}x${originalHeight}`);
    console.log(`SP: Constraints: max ${maxWidth}x${maxHeight}`);
    console.log(`SP: Scale factor: ${scaleFactor.toFixed(3)}`);
    console.log(`SP: Final banner size: ${finalWidth}x${finalHeight}`);
    
    return { width: finalWidth, height: finalHeight };
}

// Handle banner click events
export function handleBannerClick(e) {
    e.preventDefault();
    window.open(CONFIG.scammerPaybackUrl, '_blank');
}

// Handle banner close button clicks
export function handleBannerCloseClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const banner = e.target.closest('[data-sp-banner]');
    if (banner) {
        banner.style.opacity = '0';
        banner.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
            if (banner.parentNode) {
                banner.parentNode.removeChild(banner);
            }
            
            // Remove from active banners list
            if (window.activeBanners) {
                window.activeBanners = window.activeBanners.filter(b => b.id !== banner.id);
            }
            
            // Create replacement banner after delay
            setTimeout(() => {
                if (typeof window.createReplacementBanner === 'function') {
                    window.createReplacementBanner();
                }
            }, 2000);
        }, 300);
    }
}

// Create replacement banner when one is closed
export function createReplacementBanner() {
    console.log('SP: Creating replacement banner...');
    
    // Find valid insertion points
    const insertionPoints = window.findAdInsertionPoints ? window.findAdInsertionPoints() : [];
    
    if (insertionPoints.length === 0) {
        console.log('SP: No valid insertion points found for replacement banner');
        return;
    }
    
    // Get a different banner type
    const bannerTypeIndex = Math.floor(Math.random() * BANNER_TYPES.length);
    const bannerType = BANNER_TYPES[bannerTypeIndex];
    
    // Find unused insertion point
    const usedElements = window.activeBanners ? 
        window.activeBanners.map(b => document.getElementById(b.id)?.parentElement).filter(Boolean) : [];
    
    const availablePoints = insertionPoints.filter(point => 
        !usedElements.includes(point.element)
    );
    
    if (availablePoints.length === 0) {
        console.log('SP: All insertion points already in use');
        return;
    }
    
    // Insert replacement banner
    const insertionPoint = availablePoints[0];
    if (typeof window.insertBannerAtSpecificPoint === 'function') {
        window.insertBannerAtSpecificPoint(insertionPoint, true);
    }
} 