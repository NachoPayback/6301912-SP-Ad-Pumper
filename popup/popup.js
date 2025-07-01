// Scammer Payback Promoter Popup Script
document.addEventListener('DOMContentLoaded', function() {
    const enabledToggle = document.getElementById('enabled');
    const frequencySlider = document.getElementById('frequency');
    const displayTimeSlider = document.getElementById('displayTime');
    const cooldownSlider = document.getElementById('cooldown');
    const frequencyValue = document.getElementById('frequencyValue');
    const displayTimeValue = document.getElementById('displayTimeValue');
    const cooldownValue = document.getElementById('cooldownValue');
    const resetBtn = document.getElementById('resetBtn');
    const visitChannelBtn = document.getElementById('visitChannel');
    const statusDiv = document.getElementById('status');
    const toggleButton = document.getElementById('toggle');
    const clearButton = document.getElementById('clearAds');
    const prerollToggle = document.getElementById('prerollToggle');

    // Load current settings
    chrome.storage.sync.get(['enabled', 'showProbability', 'bannerDisplayTime', 'cooldownTime', 'extensionEnabled', 'prerollEnabled'], function(result) {
        enabledToggle.checked = result.enabled !== false;
        frequencySlider.value = result.showProbability || 0.3;
        displayTimeSlider.value = result.bannerDisplayTime || 8000;
        cooldownSlider.value = result.cooldownTime || 300000;
        const isEnabled = result.extensionEnabled !== false;
        const prerollEnabled = result.prerollEnabled || false;
        
        updateDisplayValues();
        updateUI(isEnabled);
        
        if (prerollToggle) {
            prerollToggle.checked = prerollEnabled;
        }
    });

    // Update display values
    function updateDisplayValues() {
        frequencyValue.textContent = Math.round(frequencySlider.value * 100) + '%';
        displayTimeValue.textContent = Math.round(displayTimeSlider.value / 1000);
        cooldownValue.textContent = Math.round(cooldownSlider.value / 60000);
    }

    // Save settings
    function saveSettings() {
        const settings = {
            enabled: enabledToggle.checked,
            showProbability: parseFloat(frequencySlider.value),
            bannerDisplayTime: parseInt(displayTimeSlider.value),
            cooldownTime: parseInt(cooldownSlider.value)
        };

        chrome.storage.sync.set(settings, function() {
            // Show save confirmation (briefly)
            const originalText = document.querySelector('.header p').textContent;
            document.querySelector('.header p').textContent = 'Settings saved!';
            setTimeout(() => {
                document.querySelector('.header p').textContent = originalText;
            }, 1000);
        });
    }

    // Event listeners
    enabledToggle.addEventListener('change', saveSettings);
    
    frequencySlider.addEventListener('input', function() {
        updateDisplayValues();
        saveSettings();
    });
    
    displayTimeSlider.addEventListener('input', function() {
        updateDisplayValues();
        saveSettings();
    });
    
    cooldownSlider.addEventListener('input', function() {
        updateDisplayValues();
        saveSettings();
    });

    // Reset button
    resetBtn.addEventListener('click', function() {
        enabledToggle.checked = true;
        frequencySlider.value = 0.3;
        displayTimeSlider.value = 8000;
        cooldownSlider.value = 300000;
        
        updateDisplayValues();
        saveSettings();
    });

    // Visit channel button
    visitChannelBtn.addEventListener('click', function() {
        chrome.tabs.create({
            url: 'https://www.youtube.com/c/ScammerPayback?sub_confirmation=1'
        });
        window.close();
    });

    // Toggle main extension
    if (toggleButton) {
        toggleButton.addEventListener('click', function() {
            chrome.storage.sync.get(['extensionEnabled'], function(result) {
                const currentState = result.extensionEnabled !== false;
                const newState = !currentState;
                
                chrome.storage.sync.set({extensionEnabled: newState}, function() {
                    updateUI(newState);
                    
                    // Reload all tabs to apply changes
                    chrome.tabs.query({}, function(tabs) {
                        tabs.forEach(tab => {
                            if (tab.url && !tab.url.startsWith('chrome://')) {
                                chrome.tabs.reload(tab.id);
                            }
                        });
                    });
                });
            });
        });
    }
    
    // Toggle pre-roll feature
    if (prerollToggle) {
        prerollToggle.addEventListener('change', function() {
            const prerollEnabled = prerollToggle.checked;
            
            chrome.storage.sync.set({prerollEnabled: prerollEnabled}, function() {
                console.log('Pre-roll setting saved:', prerollEnabled);
                
                // Reload tabs to apply pre-roll setting
                chrome.tabs.query({}, function(tabs) {
                    tabs.forEach(tab => {
                        if (tab.url && !tab.url.startsWith('chrome://')) {
                            chrome.tabs.reload(tab.id);
                        }
                    });
                });
            });
        });
    }
    
    // Clear ads button
    if (clearButton) {
        clearButton.addEventListener('click', function() {
            // Send message to content script to clear ads
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs[0] && tabs[0].id) {
                    chrome.tabs.sendMessage(tabs[0].id, {action: 'clearAds'}, function(response) {
                        if (chrome.runtime.lastError) {
                            console.log('Could not clear ads on this page');
                        } else {
                            console.log('Ads cleared on current page');
                        }
                    });
                }
            });
        });
    }

    function updateUI(isEnabled) {
        if (statusDiv) {
            statusDiv.textContent = isEnabled ? 'Extension is ACTIVE' : 'Extension is DISABLED';
            statusDiv.className = isEnabled ? 'status active' : 'status disabled';
        }
        
        if (toggleButton) {
            toggleButton.textContent = isEnabled ? 'Disable Extension' : 'Enable Extension';
            toggleButton.className = isEnabled ? 'button danger' : 'button primary';
        }
    }

    // Initial display values update
    updateDisplayValues();
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'updateStatus') {
        const statusDiv = document.getElementById('status');
        if (statusDiv) {
            statusDiv.textContent = request.message;
        }
    }
}); 