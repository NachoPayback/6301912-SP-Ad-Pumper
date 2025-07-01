// Toast Notification UI Management
import { TOAST_MESSAGES, CONFIG } from '../core/config.js';

// Create corner toast notification
export function createToast() {
    const message = TOAST_MESSAGES[Math.floor(Math.random() * TOAST_MESSAGES.length)];
    const toastId = 'sp-toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = 'sp-corner-toast';
    toast.setAttribute('data-sp-toast', 'true');
    
    toast.innerHTML = `
        <div class="sp-toast-content">
            <div class="sp-toast-icon">${message.icon}</div>
            <div class="sp-toast-text">
                <div class="sp-toast-title">${message.title}</div>
                <div class="sp-toast-subtitle">${message.subtitle}</div>
            </div>
            <div class="sp-toast-close">&times;</div>
        </div>
    `;
    
    return toast;
}

// Show toast notification
export function showToast() {
    // Remove any existing toast
    const existingToast = document.querySelector('[data-sp-toast]');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = createToast();
    
    const appendToast = () => {
        document.body.appendChild(toast);
        
        // Add click handlers
        const toastContent = toast.querySelector('.sp-toast-content');
        const closeButton = toast.querySelector('.sp-toast-close');
        
        if (toastContent) {
            toastContent.addEventListener('click', handleToastClick);
        }
        
        if (closeButton) {
            closeButton.addEventListener('click', handleToastCloseClick);
        }
        
        // Animate in
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        });
        
        // Auto-remove after delay
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                    window.currentToast = null;
                }, 300);
            }
        }, 8000);
        
        window.currentToast = toast;
    };
    
    // Wait for DOM to be ready
    if (document.body) {
        appendToast();
    } else {
        document.addEventListener('DOMContentLoaded', appendToast);
    }
    
    console.log('SP: Toast notification displayed');
}

// Handle toast click events
export function handleToastClick(e) {
    // Don't trigger if clicking close button
    if (e.target.closest('.sp-toast-close')) {
        return;
    }
    
    e.preventDefault();
    window.open(CONFIG.scammerPaybackUrl, '_blank');
    
    // Remove toast after click
    const toast = e.target.closest('[data-sp-toast]');
    if (toast) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            window.currentToast = null;
        }, 300);
    }
}

// Handle toast close button clicks
export function handleToastCloseClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const toast = e.target.closest('[data-sp-toast]');
    if (toast) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            window.currentToast = null;
        }, 300);
    }
} 