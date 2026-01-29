/**
 * ============================================
 * MENU MANAGEMENT SYSTEM
 * ============================================
 * Handles sidebar menu toggling:
 * - Only one menu/submenu open at a time
 * - Proper highlighting of active menu items
 * - Smooth open/close transitions
 */

let activeMenu = null;
let activeSubmenu = null;

// ============================================
// MENU IDS AND THEIR CONFIGURATIONS
// ============================================
const menuConfigs = {
    masterSubmenu: {
        type: 'submenu',
        parentButtonSelector: '.menu-item[onclick*="Master"]',
        menuId: 'masterSubmenu',
        chevronSelector: '.menu-item[onclick*="Master"] .chevron'
    },
    inventorySubmenu: {
        type: 'submenu',
        parentButtonSelector: '.menu-item[onclick*="toggleInventorySubmenu"]',
        menuId: 'inventorySubmenu',
        chevronSelector: '.menu-item[onclick*="toggleInventorySubmenu"] .chevron'
    },
    billingSubMenu: {
        type: 'submenu',
        parentButtonSelector: '.menu-item[onclick*="toggleBillingSubmenu"]',
        menuId: 'billingSubMenu',
        chevronSelector: '.menu-item[onclick*="toggleBillingSubmenu"] .chevron'
    },
    expancesSubmenu: {
        type: 'submenu',
        parentButtonSelector: '.menu-item[onclick*="toggleExpancesSubmenu"]',
        menuId: 'expancesSubmenu',
        chevronSelector: '.menu-item[onclick*="toggleExpancesSubmenu"] .chevron'
    },
    expensesSubmenu: {
        type: 'submenu',
        parentButtonSelector: '.menu-item[onclick*="toggleExpensesSubmenu"]',
        menuId: 'expensesSubmenu',
        chevronSelector: '.menu-item[onclick*="toggleExpensesSubmenu"] .chevron'
    }
};

// ============================================
// CLOSE ALL SUBMENUS AND RESET ACTIVE STATES
// ============================================
export function closeAllSubmenus() {
    console.log('🔐 Closing all submenus');
    
    // Close all submenu elements
    const allSubmenus = document.querySelectorAll(".submenu");
    allSubmenus.forEach(submenu => {
        submenu.classList.remove("open");
        
        // Find parent button and remove highlight
        const parentButton = submenu.previousElementSibling;
        if (parentButton) {
            parentButton.classList.remove("active");
            
            // Reset chevron
            const chevron = parentButton.querySelector(".chevron");
            if (chevron) {
                chevron.classList.remove("down");
            }
        }
    });
    
    activeSubmenu = null;
}

// ============================================
// TOGGLE SPECIFIC SUBMENU
// ============================================
export function toggleSubmenuWithGuard(submenuId) {
    console.log(`🔄 Toggle submenu: ${submenuId}`);
    
    const submenu = document.getElementById(submenuId);
    if (!submenu) {
        console.warn(`⚠️ Submenu ${submenuId} not found`);
        return;
    }

    const isCurrentlyOpen = submenu.classList.contains("open");
    
    // If this submenu is already open, close it
    if (isCurrentlyOpen) {
        submenu.classList.remove("open");
        activeSubmenu = null;
        
        const parentButton = submenu.previousElementSibling;
        if (parentButton) {
            parentButton.classList.remove("active");
            const chevron = parentButton.querySelector(".chevron");
            if (chevron) {
                chevron.classList.remove("down");
            }
        }
        console.log(`✖️ Submenu ${submenuId} closed`);
        return;
    }

    // Close all other submenus first
    closeAllSubmenus();

    // Open this submenu
    submenu.classList.add("open");
    activeSubmenu = submenuId;

    const parentButton = submenu.previousElementSibling;
    if (parentButton) {
        parentButton.classList.add("active");
        
        const chevron = parentButton.querySelector(".chevron");
        if (chevron) {
            chevron.classList.add("down");
        }
    }
    
    console.log(`✅ Submenu ${submenuId} opened and highlighted`);
}

// ============================================
// HIGHLIGHT MENU ITEM WHEN NAVIGATING
// ============================================
export function highlightMenuItemForPage(page) {
    console.log(`⭐ Highlighting menu item for page: ${page}`);
    
    // Remove active from all menu items
    const allMenuItems = document.querySelectorAll(".menu-item");
    allMenuItems.forEach(item => item.classList.remove("active"));

    // Handle main menu items (orders, bank, etc)
    const mainMenuItem = document.querySelector(`.menu-item[onclick*="${page}"]`);
    if (mainMenuItem) {
        mainMenuItem.classList.add("active");
        console.log(`✅ Highlighted main menu item for: ${page}`);
        closeAllSubmenus();
        return;
    }

    // Handle submenu items (staff, staff_expenses, etc)
    const submenuItem = document.querySelector(`.submenu-item[onclick*="${page}"]`);
    if (submenuItem) {
        submenuItem.classList.add("active");
        
        // Find parent submenu and open it
        const parentSubmenu = submenuItem.closest(".submenu");
        if (parentSubmenu) {
            const submenuId = parentSubmenu.id;
            toggleSubmenuWithGuard(submenuId);
            console.log(`✅ Highlighted submenu item for: ${page}, opened ${submenuId}`);
        }
        return;
    }

    console.log(`⚠️ No menu item found for page: ${page}`);
}

// ============================================
// CLOSE SIDEBAR ON MOBILE AFTER SELECTION
// ============================================
export function closeSidebarAfterNavigation() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    
    if (sidebar && sidebar.classList.contains("open")) {
        sidebar.classList.remove("open");
        if (overlay) {
            overlay.classList.remove("active");
        }
        console.log('📱 Sidebar closed after navigation');
    }
}

// ============================================
// INITIALIZE MENU SYSTEM
// ============================================
export function initMenuSystem() {
    console.log('⚙️ Menu system initialized');
    
    // Add event listeners to all submenu toggle buttons
    const billingBtn = document.querySelector('.menu-item[onclick*="toggleBillingSubmenu"]');
    const expancesBtn = document.querySelector('.menu-item[onclick*="toggleExpancesSubmenu"]');
    const inventoryBtn = document.querySelector('.menu-item[onclick*="toggleInventorySubmenu"]');
    const expensesBtn = document.querySelector('.menu-item[onclick*="toggleExpensesSubmenu"]');
    const masterBtn = document.querySelector('.menu-item[onclick*="toggleSubmenu"]');

    // Close all when clicking outside
    document.addEventListener('click', function(event) {
        const sidebar = document.getElementById("sidebar");
        const sidebarMenu = document.querySelector(".sidebar-menu");
        
        if (sidebar && sidebarMenu && 
            !sidebarMenu.contains(event.target) && 
            !event.target.closest('.hamburger-menu')) {
            // Click was outside sidebar menu, don't close submenus here
            // as they're inside sidebar
        }
    });

    console.log('✅ Menu system ready');
}

// ============================================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================================
window.menuSystem = {
    closeAllSubmenus,
    toggleSubmenuWithGuard,
    highlightMenuItemForPage,
    closeSidebarAfterNavigation,
    initMenuSystem
};

// Export for module usage
// export {
//     closeAllSubmenus,
//     toggleSubmenuWithGuard,
//     highlightMenuItemForPage,
//     closeSidebarAfterNavigation
//     initMenuSystem
// };
