// Enhanced Stealth Extension - Background Service Worker
// Minimal background script for remote-controlled stealth extension

console.log('SP: Enhanced stealth background script loaded');

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('SP: Enhanced stealth extension installed');
        
        // Set minimal default settings
        chrome.storage.local.set({
            sp_extension_installed: true,
            sp_installation_date: Date.now()
        });
        
    } else if (details.reason === 'update') {
        console.log('SP: Enhanced stealth extension updated');
    }
});

// Handle emergency shutdown messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'emergency_shutdown') {
        console.log('SP: Emergency shutdown received');
        
        // Clear all stored data
        chrome.storage.local.clear();
        
        // Send shutdown signal to all tabs
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { action: 'emergency_shutdown' }).catch(() => {
                    // Tab might not have content script, ignore errors
                });
            });
        });
        
        sendResponse({success: true});
    }
    
    return true; // Keep message channel open
});

// Minimal tab tracking for analytics
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // Log tab changes for potential analytics
        console.log('SP: Tab updated:', tab.url);
    }
}); 