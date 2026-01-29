/**
 * ============================================
 * NAVIGATION GUARDS FOR ADMIN
 * ============================================
 * Enforces a specific navigation flow:
 * 1. Login required first
 * 2. Must visit dashboard after login
 * 3. Can access inventory/stock features
 * 4. Cannot skip pages directly
 */

// ============================================
// ALLOWED ROUTES FOR ADMIN ROLE
// ============================================
const allowedPagesForRole = {
    admin: [
        'home',
        'inventory',
        'inventory_orders',
        'inventory_staff',
        'inventory_staff_attendance',
        'stock_adjustment',
        'stock_movement',
        'stockAdjustment',
        'stockMovement',
        'items',
        'client',
        'user',
        'shop',
        'bank',
        'expense_category',
        'staff_expense',
        'expances',
        'expancesReport',
        'staff',
        'staff_attendance_reports',
        'staffAttendanceReports',
        'staff_expenses_report',
        'staffExpReports',
        'general_expenses_report',
        'payment_details',
        'notifications',
        'company_info',
        'company',
        'profile',
        'kitchen_summary',
        'kitchenSummary',
        'current_stock',
        'currentStock',
        'clientMonthlyReport',
        'clientDues',
        'payment',
        'paymentHistory',
        'paymentDetails'
    ]
};

// ============================================
// MANDATORY NAVIGATION FLOW FOR ADMIN
// ============================================
const mandatoryFlow = [
    'home'  // Admin must see home/dashboard first
];

let navigationGuardsEnabled = true;
let navigationCompletionStatus = {
    visitedHome: false
};

// ============================================
// INITIALIZE GUARDS
// ============================================
export function initNavigationGuards(userRole) {
    console.log('🛡️ Navigation Guards initialized for admin role:', userRole);
    navigationGuardsEnabled = true;
    
    // Check if user has already completed the mandatory flow
    const completion = localStorage.getItem('adminNavigationCompletion');
    if (completion) {
        try {
            navigationCompletionStatus = JSON.parse(completion);
            console.log('📋 Restoring admin navigation completion status:', navigationCompletionStatus);
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
            reason: `Page "${targetPage}" is not allowed for admin role`
        };
    }

    // If mandatory flow not completed, enforce it
    if (!navigationCompletionStatus.visitedHome) {
        if (targetPage !== 'home') {
            return {
                allowed: false,
                reason: 'You must view the dashboard first'
            };
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
        console.log('✅ Admin: Marked home as visited');
    }

    // Check if mandatory flow is complete
    if (navigationCompletionStatus.visitedHome) {
        console.log('🎯 Admin: Mandatory navigation flow completed!');
        navigationGuardsEnabled = false;
    }

    // Save to localStorage
    localStorage.setItem('adminNavigationCompletion', JSON.stringify(navigationCompletionStatus));
}

// ============================================
// RESET GUARDS (on logout)
// ============================================
export function resetNavigationGuards() {
    resetNavigationCompletion();
    navigationGuardsEnabled = true;
    console.log('🔄 Admin: Navigation guards reset');
}

function resetNavigationCompletion() {
    navigationCompletionStatus = {
        visitedHome: false
    };
    localStorage.setItem('adminNavigationCompletion', JSON.stringify(navigationCompletionStatus));
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
    console.log('🔓 Admin: Navigation guards disabled - user can now visit any page');
}

// Make functions globally accessible if needed
window.adminNavigationGuards = {
    validateNavigation,
    markPageVisited,
    resetNavigationGuards,
    getGuardStatus,
    disableNavigationGuards
};
