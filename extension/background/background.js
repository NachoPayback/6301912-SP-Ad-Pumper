// SP Extension - Simple Background Script
console.log('SP: Simple background script loaded');

// Just basic extension lifecycle handling
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('SP: Extension installed');
    } else if (details.reason === 'update') {
        console.log('SP: Extension updated');
    }
});

// Minimal tab tracking for potential analytics
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        console.log('SP: Tab loaded:', tab.url);
    }
}); 