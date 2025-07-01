// Background script for Scammer Payback Promoter Extension

console.log('SP: Background script loaded');

// Extension installation/update handler
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('SP: Extension installed');
        
        // Set default settings
        chrome.storage.sync.set({
            extensionEnabled: true,
            prerollEnabled: false // Default to disabled for safety
        });
    } else if (details.reason === 'update') {
        console.log('SP: Extension updated');
    }
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('SP: Background received message:', request);
    
    if (request.action === 'getSettings') {
        chrome.storage.sync.get(['extensionEnabled', 'prerollEnabled'], (result) => {
            sendResponse(result);
        });
        return true; // Keep channel open for async response
    }
    
    if (request.action === 'updateSettings') {
        chrome.storage.sync.set(request.settings, () => {
            sendResponse({success: true});
        });
        return true;
    }
});

// Tab update handler (for YouTube SPA navigation)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com')) {
        console.log('SP: YouTube page loaded/updated');
        // Could send message to content script here if needed
    }
});

// Keep track of extension usage
chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id, { action: 'toggleBanner' });
}); 