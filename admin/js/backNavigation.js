// ============================================
// BROWSER BACK BUTTON NAVIGATION HANDLER
// No visible buttons, uses existing notification system
// ============================================

import { showConfirm } from "./notification.js";

// Navigation history stack
let navigationHistory = [];
let isNavigatingBack = false;

// Initialize navigation history from localStorage
function initializeNavigationHistory() {
    const savedHistory = localStorage.getItem('navigationHistory');
    if (savedHistory) {
        try {
            navigationHistory = JSON.parse(savedHistory);
        } catch (e) {
            navigationHistory = [];
        }
    }
    
    // If history is empty, add home as initial page
    if (navigationHistory.length === 0) {
        navigationHistory.push('home');
    }
    
    // Push initial state to browser history
    history.pushState({ page: navigationHistory[navigationHistory.length - 1] }, '', '');
}

// Save navigation history to localStorage
function saveNavigationHistory() {
    localStorage.setItem('navigationHistory', JSON.stringify(navigationHistory));
}

// Add page to navigation history
function addToHistory(page) {
    if (!isNavigatingBack) {
        const currentIndex = navigationHistory.length - 1;
        
        // Only add if it's different from the last page
        if (navigationHistory[currentIndex] !== page) {
            navigationHistory.push(page);
            // Limit history to last 50 pages to prevent memory issues
            if (navigationHistory.length > 50) {
                navigationHistory.shift();
            }
            saveNavigationHistory();
            
            // Push to browser history
            history.pushState({ page: page }, '', '');
        }
    }
    isNavigatingBack = false;
}

// Handle browser back button press
async function handleBrowserBack() {
    console.log('📱 Browser back button pressed. Current history:', navigationHistory);
    
    // If we're at the first page (home or initial page)
    if (navigationHistory.length <= 1) {
        // Show exit confirmation using existing notification system
        const confirmed = await showConfirm(
            "Are you sure you want to exit the dashboard?",
            "warning"
        );
        
        if (confirmed) {
            // User wants to exit
            confirmExit();
        } else {
            // User cancelled, push state back to prevent actual browser navigation
            history.pushState({ page: navigationHistory[0] }, '', '');
        }
        return;
    }
    
    // Remove current page
    navigationHistory.pop();
    saveNavigationHistory();
    
    // Get previous page
    const previousPage = navigationHistory[navigationHistory.length - 1];
    
    // Set flag to prevent adding to history during back navigation
    isNavigatingBack = true;
    
    console.log('⬅️ Navigating back to:', previousPage);
    navigateTo(previousPage);
}

// Confirm exit - logout user
function confirmExit() {
    console.log('👋 User confirmed exit');
    // Clear navigation history
    localStorage.removeItem('navigationHistory');
    localStorage.removeItem('lastPage');
    // Logout user
    logout();
}

// Listen to browser back/forward button
window.addEventListener('popstate', function(event) {
    event.preventDefault();
    handleBrowserBack();
});

// ============================================
// INITIALIZATION
// ============================================
function initBackNavigation() {
    initializeNavigationHistory();
    console.log('✅ Browser back button handler initialized');
}

// ============================================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================================
window.initBackNavigation = initBackNavigation;
window.addToHistory = addToHistory;

// Export for use in other modules
export { 
    initBackNavigation,
    addToHistory 
};