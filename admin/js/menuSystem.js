/**
 * ============================================
 * MENU MANAGEMENT SYSTEM FOR ADMIN
 * ============================================
 * Handles sidebar menu toggling:
 * - Only one menu/submenu open at a time
 * - Proper highlighting of active menu items
 * - Smooth open/close transitions
 */

let activeMenu = null;
let activeSubmenu = null;

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

    // Handle main menu items
    const mainMenuItem = document.querySelector(`.menu-item[onclick*="${page}"]`);
    if (mainMenuItem) {
        mainMenuItem.classList.add("active");
        console.log(`✅ Highlighted main menu item for: ${page}`);
        closeAllSubmenus();
        return;
    }

    // Handle submenu items
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
    console.log('⚙️ Menu system initialized for admin');
    console.log('✅ Menu system ready');
}

// ============================================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================================
window.adminMenuSystem = {
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
//     closeSidebarAfterNavigation,
//     initMenuSystem
// };
