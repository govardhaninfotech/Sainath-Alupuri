/**
 * ============================================
 * NAVIGATION GUARDS
 * ============================================
 * Enforces a specific navigation flow:
 * 1. Login required first
 * 2. Must visit dashboard after login
 * 3. Must visit orders before accessing bank/staff/etc
 * 4. Cannot skip pages directly
 */

// ============================================
// ALLOWED ROUTES FOR EACH USER ROLE
// ============================================
const allowedPagesForRole = {
    client: [
        'home',
        'inventory_orders',
        'bank',
        'staff',
        'inventory_staff',
        'inventory_staff_attendance',
        'inventory',
        'items',
        'client',
        'user',
        'shop',
        'expense_category',
        'staff_expense',
        'expances',
        'staff_attendance_reports',
        'staff_expenses_report',
        'general_expenses_report',
        'payment_details',
        'notifications',
        'company_info',
        'profile'
    ],
    admin: [
        'home',
        'inventory_orders',
        'bank',
        'staff',
        'inventory_staff',
        'inventory_staff_attendance',
        'inventory',
        'items',
        'client',
        'user',
        'shop',
        'expense_category',
        'staff_expense',
        'expances',
        'staff_attendance_reports',
        'staff_expenses_report',
        'general_expenses_report',
        'payment_details',
        'notifications',
        'company_info',
        'profile'
    ]
};

// ============================================
// MANDATORY NAVIGATION FLOW
// ============================================
const mandatoryFlow = [
    'home',           // Step 1: Must see home/dashboard first
    'inventory_orders' // Step 2: Then orders
    // After this, user can visit any allowed page
];

let navigationGuardsEnabled = true;
let navigationCompletionStatus = {
    visitedHome: false,
    visitedOrders: false
};

// ============================================
// INITIALIZE GUARDS
// ============================================
export function initNavigationGuards(userRole) {
    console.log('🛡️ Navigation Guards initialized for role:', userRole);
    navigationGuardsEnabled = true;
    
    // Check if user has already completed the mandatory flow
    const completion = localStorage.getItem('navigationCompletion');
    if (completion) {
        try {
            navigationCompletionStatus = JSON.parse(completion);
            console.log('📋 Restoring navigation completion status:', navigationCompletionStatus);
        } catch (e) {
            resetNavigationCompletion();
        }
    }
}

// ============================================
// VALIDATE NAVIGATION
// ============================================
export function validateNavigation(targetPage, userRole) {
    // If guards are disabled, allow all navigation
    if (!navigationGuardsEnabled) {
        return { allowed: true, reason: null };
    }

    // Check if page is allowed for this role
    const allowedPages = allowedPagesForRole[userRole] || [];
    if (!allowedPages.includes(targetPage)) {
        return {
            allowed: false,
            reason: `Page "${targetPage}" is not allowed for role "${userRole}"`
        };
    }

    // If mandatory flow not completed, enforce it
    if (!navigationCompletionStatus.visitedHome || !navigationCompletionStatus.visitedOrders) {
        
        // Must visit home first
        if (!navigationCompletionStatus.visitedHome) {
            if (targetPage !== 'home') {
                return {
                    allowed: false,
                    reason: 'You must view the dashboard first'
                };
            }
        }
        
        // Must visit orders after home
        if (navigationCompletionStatus.visitedHome && !navigationCompletionStatus.visitedOrders) {
            if (targetPage !== 'home' && targetPage !== 'inventory_orders') {
                return {
                    allowed: false,
                    reason: 'You must view orders before accessing other pages'
                };
            }
        }
    }

    // All checks passed
    return { allowed: true, reason: null };
}

// ============================================
// MARK PAGE AS VISITED
// ============================================
export function markPageVisited(page) {
    if (page === 'home') {
        navigationCompletionStatus.visitedHome = true;
        console.log('✅ Marked home as visited');
    }
    
    if (page === 'inventory_orders') {
        navigationCompletionStatus.visitedOrders = true;
        console.log('✅ Marked orders as visited');
    }

    // Check if mandatory flow is complete
    if (navigationCompletionStatus.visitedHome && navigationCompletionStatus.visitedOrders) {
        console.log('🎯 Mandatory navigation flow completed!');
        navigationGuardsEnabled = false;
    }

    // Save to localStorage
    localStorage.setItem('navigationCompletion', JSON.stringify(navigationCompletionStatus));
}

// ============================================
// RESET GUARDS (on logout)
// ============================================
export function resetNavigationGuards() {
    resetNavigationCompletion();
    navigationGuardsEnabled = true;
    console.log('🔄 Navigation guards reset');
}

function resetNavigationCompletion() {
    navigationCompletionStatus = {
        visitedHome: false,
        visitedOrders: false
    };
    localStorage.setItem('navigationCompletion', JSON.stringify(navigationCompletionStatus));
}

// ============================================
// GET GUARD STATUS
// ============================================
export function getGuardStatus() {
    return {
        enabled: navigationGuardsEnabled,
        completion: navigationCompletionStatus
    };
}

// ============================================
// DISABLE GUARDS (when mandatory flow is complete)
// ============================================
export function disableNavigationGuards() {
    navigationGuardsEnabled = false;
    console.log('🔓 Navigation guards disabled - user can now visit any page');
}

// Make functions globally accessible if needed
window.navigationGuards = {
    validateNavigation,
    markPageVisited,
    resetNavigationGuards,
    getGuardStatus,
    disableNavigationGuards
};
