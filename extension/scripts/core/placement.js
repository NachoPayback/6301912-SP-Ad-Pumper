// Main Ad Placement Engine
import { findGoogleAdPlacements } from '../sites/google.js';
import { findYouTubeAdPlacements } from '../sites/youtube.js';
import { findRedditAdPlacements } from '../sites/reddit.js';
import { findTwitterAdPlacements } from '../sites/twitter.js';
import { findFacebookAdPlacements } from '../sites/facebook.js';
import { findGenericAdPlacements } from '../sites/generic.js';

// Find proper ad placement locations (site-specific logic)
export function findAdInsertionPoints() {
    const hostname = window.location.hostname;
    
    console.log(`SP: Finding ad insertion points for ${hostname}`);
    
    // Site-specific ad placement logic
    if (hostname.includes('google.com')) {
        return findGoogleAdPlacements();
    } else if (hostname.includes('youtube.com')) {
        return findYouTubeAdPlacements();
    } else if (hostname.includes('reddit.com')) {
        return findRedditAdPlacements();
    } else if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
        return findTwitterAdPlacements();
    } else if (hostname.includes('facebook.com')) {
        return findFacebookAdPlacements();
    } else {
        return findGenericAdPlacements();
    }
}

// Insert banner at specific point with optimal sizing
export function insertBannerAtPoint(banner, bannerType, insertionPoint) {
    if (!banner || !bannerType || !insertionPoint) {
        console.error('SP: Missing required parameters for banner insertion');
        return false;
    }
    
    const targetElement = insertionPoint.element;
    const placementType = insertionPoint.type;
    
    console.log(`SP: Inserting ${bannerType.type} banner at ${placementType} placement`);
    
    // Calculate optimal size
    const optimalSize = window.calculateOptimalBannerSize(bannerType, targetElement, insertionPoint);
    
    // Apply the calculated size
    const bannerImg = banner.querySelector('.sp-banner-image');
    if (bannerImg) {
        bannerImg.style.width = optimalSize.width + 'px';
        bannerImg.style.height = optimalSize.height + 'px';
        bannerImg.style.maxWidth = '100%';
        bannerImg.style.height = 'auto';
    }
    
    // Set container constraints
    banner.style.maxWidth = '100%';
    banner.style.maxHeight = '80vh';
    banner.style.overflow = 'hidden';
    
    // Site-specific insertion logic
    let inserted = false;
    
    try {
        if (placementType.includes('sidebar')) {
            // Insert at beginning of sidebar
            if (targetElement.firstChild) {
                targetElement.insertBefore(banner, targetElement.firstChild);
            } else {
                targetElement.appendChild(banner);
            }
            inserted = true;
            
        } else if (placementType.includes('between') || placementType.includes('before')) {
            // Insert before the target element
            if (targetElement.parentNode) {
                targetElement.parentNode.insertBefore(banner, targetElement);
            }
            inserted = true;
            
        } else if (placementType.includes('after') || placementType.includes('bottom')) {
            // Insert after the target element
            if (targetElement.parentNode && targetElement.nextSibling) {
                targetElement.parentNode.insertBefore(banner, targetElement.nextSibling);
            } else if (targetElement.parentNode) {
                targetElement.parentNode.appendChild(banner);
            }
            inserted = true;
            
        } else {
            // Default: try to insert at the end of the target element
            targetElement.appendChild(banner);
            inserted = true;
        }
        
        if (inserted) {
            console.log(`SP: Successfully inserted banner at ${placementType}`);
            
            // Add spacing around banner
            banner.style.margin = '15px 0';
            banner.style.textAlign = 'center';
            banner.style.clear = 'both';
            
            // Add to active banners tracking
            if (!window.activeBanners) window.activeBanners = [];
            window.activeBanners.push({
                id: banner.id,
                type: bannerType.type,
                placement: placementType,
                insertedAt: Date.now()
            });
            
            return true;
        }
        
    } catch (error) {
        console.error('SP: Error inserting banner:', error);
    }
    
    return false;
}

// Insert banner at a specific insertion point
export function insertBannerAtSpecificPoint(insertionPoint, forceDifferentType = false) {
    if (!insertionPoint) {
        console.log('SP: No insertion point provided');
        return false;
    }
    
    console.log(`SP: Attempting to insert banner at ${insertionPoint.type} point`);
    
    // Choose banner type
    let bannerTypeIndex;
    if (forceDifferentType) {
        bannerTypeIndex = window.getDifferentBannerType();
    } else {
        bannerTypeIndex = Math.floor(Math.random() * window.BANNER_TYPES.length);
    }
    
    const bannerType = window.BANNER_TYPES[bannerTypeIndex];
    const bannerData = window.createBanner(bannerType);
    
    if (!bannerData) {
        console.error('SP: Failed to create banner');
        return false;
    }
    
    const banner = bannerData.element;
    
    // Add event listeners
    const bannerLink = banner.querySelector('.sp-banner-link');
    const closeButton = banner.querySelector('.sp-banner-close');
    
    if (bannerLink) {
        bannerLink.addEventListener('click', window.handleBannerClick);
    }
    
    if (closeButton) {
        closeButton.addEventListener('click', window.handleBannerCloseClick);
    }
    
    // Insert the banner
    const success = insertBannerAtPoint(banner, bannerType, insertionPoint);
    
    if (success) {
        console.log('SP: Banner inserted successfully');
        return true;
    } else {
        console.log('SP: Failed to insert banner');
        if (banner.parentNode) {
            banner.parentNode.removeChild(banner);
        }
        return false;
    }
} 