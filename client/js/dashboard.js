import { renderclientTable } from "./client.js";
import { renderItemsTable } from "./items.js";
import { renderstaffTable } from "./staff.js";
import { renderbankTable } from "./bank.js";
import { renderuserTable } from "./user.js";
import { rendershopTable } from "./shops.js";
import { renderHomePage, initHomePage } from "./home.js";
import { renderExpenseCategoryTable } from "./expense_category.js";
import { renderInventoryExpancesPage } from "./expances.js";
import { renderStaffExpensePage } from "./staffExpense.js";
import { initBackNavigation, addToHistory } from "./backNavigation.js";
import { initNavigationGuards, validateNavigation, markPageVisited, resetNavigationGuards } from "./navigationGuards.js";
import { closeAllSubmenus, highlightMenuItemForPage, closeSidebarAfterNavigation, initMenuSystem, toggleSubmenuWithGuard } from "./menuSystem.js";
import { showMessage } from "./message.js";

// 🔹 NEW: Inventory module imports
import { renderInventoryStaffPage, initInventoryStaffPage } from "./inventory.js";
import { renderStaffAttendancePage } from "./inventory_attendance.js";
import { renderStaffAttendanceReportsTable, initMonthDropdown } from "./staffAttendanceReports.js";
import { initStaffExpMothlyReportCard, initStaffExpMonthDropdown } from "./staffExpancesReport.js";
import { initGeneralMothlyReportCard, initGeneralMonthDropdown } from "./General_Expenses_Report.js";
import { renderInventoryOrdersPage, openorderform, calculateOrderTotal, calculateItemTotal } from "./inventory_orders.js";
import { initPaymentHistoryCard, initClientDropdown } from "./Billing/payment_history.js";
import { renderPaymentDetailsPage } from "./payment_details.js";
import { renderNotificationsPage } from "./notifications_page.js";
import { renderCompanyInfoPage } from "./company_info.js";


// GLOBAL VARIABLES
// ============================================
let currentUser = null;
let currentPage = "home";
let sidebarOpen = false;

// ============================================
// INITIALIZATION - Runs when page loads
// ============================================
document.addEventListener("DOMContentLoaded", function () {
    console.log("📌 Dashboard DOMContentLoaded");

    let userData = localStorage.getItem("rememberedUser");

    if (!userData) {
        userData = sessionStorage.getItem("rememberedUser");
    }

    if (userData) {
        currentUser = typeof userData === "string" ? JSON.parse(userData) : userData;
        console.log("✅ Logged in user found:", currentUser);

        // 🔹 Initialize menu system
        initMenuSystem();

        // Initialize back navigation
        initBackNavigation();

        initializeDashboard();
    } else {
        console.warn("⚠️ No rememberedUser found, redirecting to login");
        window.location.href = "../index.html";
    }

    const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");
    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener("click", closeSidebar);
    }

    initializeSidebarState();
});

// ============================================
// INITIALIZE SIDEBAR STATE
// ============================================
function initializeSidebarState() {
    console.log("🔧 Initializing sidebar state");

    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    const mainContent = document.getElementById("mainContent");

    if (!sidebar || !overlay || !mainContent) return;

    // Always start with sidebar closed
    sidebarOpen = false;
    sidebar.classList.remove("open");
    overlay.classList.remove("active");
    mainContent.classList.remove("sidebar-open");
}

// ============================================
// INITIALIZE DASHBOARD
// ============================================
function initializeDashboard() {
    const userAvatar = document.getElementById("userAvatar");
    if (userAvatar && currentUser?.name) {
        userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
    }

    // Check URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = urlParams.get('page');

    // If page parameter exists in URL, use it (first login with ?page=home)
    // Otherwise use saved page from localStorage (reload behavior)
    const pageToLoad = pageParam || localStorage.getItem("lastPage") || "home";
    console.log("🔁 Restoring last page:", pageToLoad);

    // Remove the URL parameter after first use so subsequent reloads use lastPage
    if (pageParam) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    navigateTo(pageToLoad);
}

// ============================================
// SIDEBAR FUNCTIONS
// ============================================

// Toggle sidebar open/close
export function toggleSidebar() {
    sidebarOpen = !sidebarOpen;

    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    const mainContent = document.getElementById("mainContent");

    if (!sidebar || !overlay || !mainContent) return;

    if (sidebarOpen) {
        console.log("📂 Sidebar opened");
        sidebar.classList.add("open");
        overlay.classList.add("active");
    } else {
        console.log("📁 Sidebar closed");
        sidebar.classList.remove("open");
        overlay.classList.remove("active");
        mainContent.classList.remove("sidebar-open");
    }
}

function toggleBillingSubmenu() {
    console.log("🔽 Billing submenu toggle clicked");
    toggleSubmenuWithGuard("billingSubMenu");
}

function toggleExpancesSubmenu() {
    console.log("🔽 toggleExpancesSubmenu submenu toggle clicked");
    toggleSubmenuWithGuard("expancesSubmenu");
}

// Close sidebar
function closeSidebar() {
    sidebarOpen = false;

    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    const mainContent = document.getElementById("mainContent");

    if (sidebar) sidebar.classList.remove("open");
    if (overlay) overlay.classList.remove("active");
    if (mainContent) mainContent.classList.remove("sidebar-open");
}

function toggleSubmenu() {
    console.log("🔽 Master submenu toggle clicked");
    toggleSubmenuWithGuard("masterSubmenu");
}

// 🔹 NEW: INVENTORY submenu toggle
function toggleInventorySubmenu() {
    console.log("🔽 Inventory submenu toggle clicked");
    toggleSubmenuWithGuard("inventorySubmenu");
}

function toggleExpensesSubmenu() {
    console.log("🔽 Expenses submenu toggle clicked");
    toggleSubmenuWithGuard("expensesSubmenu");
}

function toggleReportSubmenu() {
    console.log("🔽 Reports submenu toggle clicked");
    toggleSubmenuWithGuard("reportSubMenu");
}

// Close sidebar on Escape key
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidebarOpen) {
        closeSidebar();
    }
});

// ============================================
// USER MENU FUNCTIONS
// ============================================

function toggleUserMenu() {
    const dropdown = document.getElementById("userDropdown");
    if (!dropdown) return;
    dropdown.classList.toggle("hidden");
}

document.addEventListener("click", function (event) {
    const userMenu = document.querySelector(".user-menu");
    const dropdown = document.getElementById("userDropdown");

    if (!userMenu || !dropdown) return;

    if (!userMenu.contains(event.target)) {
        dropdown.classList.add("hidden");
    }
});

// ============================================
// LOGOUT FUNCTION
// ============================================
function logout() {
    localStorage.removeItem("rememberedUser");
    sessionStorage.removeItem("rememberedUser");
    localStorage.removeItem("navigationHistory");
    localStorage.removeItem("lastPage");
    localStorage.removeItem("navigationCompletion");
    currentUser = null;
    window.location.replace("../index.html");
}
// ============================================
// NAVIGATION FUNCTION
// ============================================
async function navigateTo(page) {
    console.log(`➡️ navigateTo("${page}")`);


    // 📍 ADD TO HISTORY
    addToHistory(page);

    // 🎯 HIGHLIGHT MENU ITEM
    highlightMenuItemForPage(page);

    // 📱 CLOSE SIDEBAR AFTER NAVIGATION (mobile)
    closeSidebarAfterNavigation();

    currentPage = page;
    localStorage.setItem("lastPage", page);

    const mainContent = document.getElementById("mainContent");
    if (!mainContent) return;

    switch (page) {
        case "inventory_orders":
            mainContent.innerHTML = await renderInventoryOrdersPage();
            document
                .querySelector('.submenu-item[onclick*="inventory_orders"]')
                ?.classList.add("active");
            break;

        case "staff":
            mainContent.innerHTML = await renderstaffTable();
            document
                .querySelector('.submenu-item[onclick*="staff"]')
                ?.classList.add("active");
            break;

        case "bank":
            mainContent.innerHTML = await renderbankTable();
            document
                .querySelector('.submenu-item[onclick*="bank"]')
                ?.classList.add("active");
            break;

        case "expense_category":
            mainContent.innerHTML = await renderExpenseCategoryTable();
            document
                .querySelector('.submenu-item[onclick*="expense_category"]')
                ?.classList.add("active");
            break;

        case "staff_expense":
            mainContent.innerHTML = await renderStaffExpensePage();
            document.querySelector('.submenu-item[onclick*="staff_expense"]')?.classList.add("active");
            break;

        case "inventory":
            mainContent.innerHTML = getInventoryContent();
            document
                .querySelector('.menu-item[onclick*="inventory"]')
                ?.classList.add("active");
            break;


        case "inventory_staff":
            mainContent.innerHTML = await renderInventoryStaffPage();
            document.querySelector('.submenu-item[onclick*="inventory_staff"]')?.classList.add("active");
            initInventoryStaffPage();
            break;

        case "expancesReport":
            mainContent.innerHTML = await initGeneralMothlyReportCard();
            document.querySelector('.submenu-item[onclick*="expancesReport"]')?.classList.add("active");
            initGeneralMonthDropdown();
            break;

        case "expances":
            mainContent.innerHTML = await renderInventoryExpancesPage();
            document
                .querySelector('.submenu-item[onclick*="inventory_orders"]')
                ?.classList.add("active");
            // After HTML inject, hook up events
            // OrdersPage();    
            break;

        // 🔹 NEW: Inventory → Staff Attendance
        case "inventory_staff_attendance":
            // showLoadingSpinner();
            if (typeof renderStaffAttendancePage === "function") {
                mainContent.innerHTML = await renderStaffAttendancePage();
            }
            document.querySelector('.submenu-item[onclick*="Staff_Attendance"]')?.classList.add("active");
            break;


        case "staffAttendanceReports":
            mainContent.innerHTML = await renderStaffAttendanceReportsTable();
            document.querySelector('.submenu-item[onclick*="staffAttendanceReports"]')?.classList.add("active");
            initMonthDropdown();
            break;

        case "staffExpReports":
            mainContent.innerHTML = await initStaffExpMothlyReportCard();
            document.querySelector('.submenu-item[onclick*="staffExpReports"]')?.classList.add("active");
            initStaffExpMonthDropdown();
            break;

        case "expancesReport":
            mainContent.innerHTML = await renderGeneralExpensesReportTable();
            document
                .querySelector('.submenu-item[onclick*="inventory_orders"]')
                ?.classList.add("active");
            initMonthDropdown();


            break;
        // 🔹 NEW: Payment pages
        case "addPayment":

            mainContent.innerHTML = getPaymentHistoryContent();
            break;

        case "paymentHistory":
            mainContent.innerHTML = await initPaymentHistoryCard();
            document.querySelector('.submenu-item[onclick*="paymentHistory"]')?.classList.add("active");
            initClientDropdown();
            break;

        case "paymentDetails":
            mainContent.innerHTML = renderPaymentDetailsPage();
            document.querySelector('.submenu-item[onclick*="paymentDetails"]')?.classList.add("active");
            // highlightMenuItem('.menu-item[onclick*="paymentDetails"]');
            break;

        case "notifications":
            renderNotificationsPage();
            document.querySelector('.menu-item[onclick*="notifications"]')?.classList.add("active");
            break;

        case "company":
            renderCompanyInfoPage();
            document.querySelector('.menu-item[onclick*="company"]')?.classList.add("active");
            break;

        case "profile":
            mainContent.innerHTML = getProfileContent();
            break;

        case "profile":
            mainContent.innerHTML = getProfileContent();
            break;
    }

    // ALWAYS close sidebar after navigation (on all screen sizes)
    closeSidebar();

    // Close user dropdown
    const dropdown = document.getElementById("userDropdown");
    if (dropdown) dropdown.classList.add("hidden");
}

// ============================================
// CONTENT TEMPLATES
// ============================================
// 🔹 NEW: Add Payment Content
function getAddPaymentContent() {
    return `
        <div class="content-card">
            <h2>Add Payment</h2>
            <form style="max-width: 600px;">
                <div class="form-group">
                    <label>Client Name</label>
                    <select style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                        <option>Select Client</option>
                        <option>Client 1</option>
                        <option>Client 2</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Payment Amount</label>
                    <input type="number" placeholder="Enter amount" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                </div>

                <div class="form-group">
                    <label>Payment Method</label>
                    <select style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                        <option>Cash</option>
                        <option>UPI</option>
                        <option>Bank Transfer</option>
                        <option>Cheque</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Payment Date</label>
                    <input type="date" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                </div>

                <div class="form-group">
                    <label>Notes</label>
                    <textarea rows="3" placeholder="Add notes..." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;"></textarea>
                </div>

                <button type="submit" style="background: #667eea; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer;">
                    Submit Payment
                </button>
            </form>
        </div>
    `;
}

// 🔹 NEW: Payment History Content
function getPaymentHistoryContent() {
    return `
        <div class="content-card">
            <h2>Payment History</h2>
            <div style="overflow-x: auto;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Client</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>2024-12-20</td>
                            <td>Client 1</td>
                            <td>₹5,000</td>
                            <td>UPI</td>
                            <td><span class="badge success">Completed</span></td>
                            <td>
                                <button style="padding: 6px 12px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">View</button>
                            </td>
                        </tr>
                        <tr>
                            <td>2024-12-19</td>
                            <td>Client 2</td>
                            <td>₹3,500</td>
                            <td>Cash</td>
                            <td><span class="badge success">Completed</span></td>
                            <td>
                                <button style="padding: 6px 12px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">View</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}
function getProfileContent() {
    // currentUser = JSON.parse(localStorage.getItem("rememberedUser")) || JSON.parse(sessionStorage.getItem("rememberedUser")) || currentUser || { name: "User", email: "user@gmail.com" };
    currentUser = { name: "User", email: "user@gmail.com" };
    console.log(currentUser);

    return `
            <div class="content-card">
                <h2>User Profile</h2>
                
                <div class="profile-header">
                    <div class="profile-avatar">
                        ${currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="profile-info">
                        <h3>${currentUser.name}</h3>
                        <p>${currentUser.email}</p>
                    </div>
                </div>

                <div style="margin-top: 30px;">
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" value="${currentUser.name}" readonly style="background: #f5f5f5;">
                    </div>

                    <div class="form-group">
                        <label>Email Address</label>
                        <input type="email" value="${currentUser.email}" readonly style="background: #f5f5f5;">
                    </div>

                    <div class="form-group">
                        <label>User ID</label>
                        <input type="text" value="${currentUser.id}" readonly style="background: #f5f5f5;">
                    </div>

                    <div style="margin-top: 30px; padding: 16px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #667eea;">
                        <p style="color: #1e40af; font-weight: 500; margin-bottom: 8px;">Account Information</p>
                        <p style="color: #666; font-size: 14px;">
                            Your account is active and all features are enabled. 
                            For any account-related queries, please contact support.
                        </p>
                    </div>
                </div>
            </div>
        `;
}

// ============================================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================================
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.toggleSubmenu = toggleSubmenu;
window.toggleInventorySubmenu = toggleInventorySubmenu; // 🔹 NEW
window.toggleExpensesSubmenu = toggleExpensesSubmenu; // 🔹 NEW (Fixed spelling)
window.toggleUserMenu = toggleUserMenu;
window.logout = logout;
window.toggleBillingSubmenu = toggleBillingSubmenu;
window.toggleExpancesSubmenu = toggleExpancesSubmenu;
window.navigateTo = navigateTo;
window.getProfileContent = getProfileContent;
window.toggleReportSubmenu = toggleReportSubmenu;
window.closeAllSubmenus = closeAllSubmenus;
// window.OrdersPage = OrdersPage; 

// ============================================
// RESPONSIVE HANDLING
// ============================================
window.addEventListener("resize", function () {
    // If sidebar is open and user resizes, keep the current state
    // No automatic adjustments based on screen size
    const mainContent = document.getElementById("mainContent");

    // Remove margin class on resize to prevent layout issues
    if (mainContent && !sidebarOpen) {
        mainContent.classList.remove("sidebar-open");
    }
});

// ============================================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================================
window.navigateTo = navigateTo;
window.logout = logout;
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.toggleSubmenu = toggleSubmenu;
window.toggleInventorySubmenu = toggleInventorySubmenu;
window.toggleBillingSubmenu = toggleBillingSubmenu;
window.toggleExpancesSubmenu = toggleExpancesSubmenu;
window.toggleExpensesSubmenu = toggleExpensesSubmenu;
window.toggleReportSubmenu = toggleReportSubmenu;
window.toggleUserMenu = toggleUserMenu;
