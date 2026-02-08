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

// Check if any modal/form is open
function isModalOrFormOpen() {
    // Check for any open modals
    const modals = document.querySelectorAll('.modal.show');
    if (modals.length > 0) {
        return true;
    }
    
    // Check for order form modal
    const orderFormModal = document.getElementById("orderFormModal");
    const viewOrderModal = document.getElementById("viewOrderModal");
    
    if ((orderFormModal && orderFormModal.classList.contains('show')) ||
        (viewOrderModal && viewOrderModal.classList.contains('show'))) {
        return true;
    }
    
    return false;
}

// Close all open modals and forms
function closeAllModalsAndForms() {
    console.log('🔄 Closing all open modals and forms...');
    
    // Close all modals with animation
    const modals = document.querySelectorAll('.modal.show');
    modals.forEach(modal => {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    });
    
    // Close order form if open
    if (window.closeOrderForm) {
        window.closeOrderForm();
    }
    
    // Close view order modal if open
    if (window.closeViewOrderModal) {
        window.closeViewOrderModal();
    }
    
    // Force close any remaining modals
    const orderFormModal = document.getElementById("orderFormModal");
    const viewOrderModal = document.getElementById("viewOrderModal");
    
    if (orderFormModal) {
        orderFormModal.classList.remove('show');
        orderFormModal.style.display = 'none';
    }
    if (viewOrderModal) {
        viewOrderModal.classList.remove('show');
        viewOrderModal.style.display = 'none';
    }
    
    return true;
}

// Handle browser back button press
async function handleBrowserBack() {
    console.log('📱 Browser back button pressed. Current history:', navigationHistory);
    
    // PRIORITY 1: Check if any modal/form is open
    if (isModalOrFormOpen()) {
        console.log('⚠️ Modal/Form is open. Closing it first...');
        closeAllModalsAndForms();
        // Prevent actual back navigation
        history.pushState({ page: navigationHistory[navigationHistory.length - 1] }, '', '');
        return;
    }
    
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