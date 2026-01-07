// import { renderclientTable } from "./client.js";
import { renderItemsTable } from "./items.js";
import { renderstaffTable } from "./staff.js";
import { renderbankTable } from "./bank.js";
import { renderuserTable } from "./user.js";
import { rendershopTable } from "./shops.js";
import { renderHomePage, initHomePage } from "./home.js";
import { renderExpenseCategoryTable } from "./expense_category.js";
import { renderInventoryExpancesPage } from "./expances.js";
import { renderStaffExpensePage } from "./staffExpense.js";
import { renderProfilePage } from "./profile.js";

// 🔹 NEW: Inventory module imports
import { renderInventoryStaffPage, initInventoryStaffPage } from "./inventory.js";
import { renderInventoryOrdersPage } from "./inventory_orders.js";
import { renderStaffAttendancePage } from "./inventory_attendance.js";
import { renderKitchenSummary } from "./kitchenSummary.js";
import { initClientMothlyReportCard, initClientMonthDropdown } from "./clientMonthlyReports.js";
import { initStaffAttendanceReportsCard, initStaffMonthDropdown } from "./staffAttendanceReports.js";
import { initStaffExpMothlyReportCard, initStaffExpMonthDropdown } from "./staffExpancesReport.js";
import { initGeneralMothlyReportCard, initGeneralMonthDropdown } from "./General_Expenses_Report.js";
import { renderCurrentStockPage } from "./currentStock.js";
import { renderCurrentStockMovementPage } from "./stockMovement.js";
import { renderStockAdjustmentPage } from "./stockAdjustment.js";
import { initClientDuesReportCard, initClientDuesDropdown } from "./Billing/clientDue.js";
import { initPaymentHistoryCard, initClientDropdown } from "./Billing/payment_history.js";
import { initPaymentHistoryCard as initPaymentCard, initClientDropdown as initPaymentClientDropdown } from "./Billing/payment.js";

// GLOBAL VARIABLES
// ============================================
let currentUser = null;
let currentPage = "home";
let sidebarOpen = false;

currentUser = JSON.parse(localStorage.getItem("rememberedUser") || sessionStorage.getItem("rememberedUser") || "null");
const user_id = currentUser?.id || "";
if (!user_id) {
    sessionStorage.removeItem("rememberedUser");
    localStorage.removeItem("rememberedUser");
    window.location.replace("../index.html");
}

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

    sidebarOpen = false;
    sidebar.classList.remove("open");
    overlay.classList.remove("active");
    mainContent.classList.remove("sidebar-open");
}

// ============================================
// INITIALIZE DASHBOARD
// ============================================
function initializeDashboard() {
    // Validate user profile and set avatar
    const userAvatar = document.getElementById("userAvatar");
    if (userAvatar) {
        if (currentUser && (currentUser.name || currentUser.username || currentUser.mobile)) {
            // Try to get name from different possible fields
            const userName = currentUser.name || currentUser.username || currentUser.mobile || "U";
            const firstLetter = String(userName).charAt(0).toUpperCase();
            userAvatar.textContent = firstLetter;
            userAvatar.title = userName; // Show full name on hover
            console.log("✅ User avatar set:", firstLetter, "for user:", userName);
        } else {
            console.warn("⚠️ No valid user name found");
            userAvatar.textContent = "U";
        }
    } else {
        console.error("❌ User avatar element not found");
    }

    // Load home page on first login
    // Check URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = urlParams.get('page');

    // If page parameter exists in URL, use it (first login with ?page=home)
    // Otherwise use saved page from localStorage (reload behavior)
    const pageToLoad = pageParam || localStorage.getItem("lastPage") || "home";
    console.log("🔁 Loading page:", pageToLoad);

    // Remove the URL parameter after first use so subsequent reloads use lastPage
    if (pageParam) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    navigateTo(pageToLoad);
}

// ============================================
// LOADING INDICATOR
// ============================================
function showLoadingSpinner() {
    const mainContent = document.getElementById("mainContent");
    if (mainContent) {
        mainContent.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 60vh;">
                <div style="text-align: center;">
                    <div style="
                        width: 50px;
                        height: 50px;
                        border: 4px solid #f3f4f6;
                        border-top: 4px solid #667eea;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 20px;
                    "></div>
                    <p style="color: #6b7280; font-size: 16px;">Loading...</p>
                    <style>
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    </style>
                </div>
            </div>
        `;
    }
}

function hideLoadingSpinner() {
    // Spinner is replaced by actual content
}


// ============================================
// SIDEBAR FUNCTIONS
// ============================================

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

function closeSidebar() {
    sidebarOpen = false;

    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    const mainContent = document.getElementById("mainContent");

    if (sidebar) sidebar.classList.remove("open");
    if (overlay) overlay.classList.remove("active");
    if (mainContent) mainContent.classList.remove("sidebar-open");
}

// ============================================
// HELPER FUNCTION TO CLOSE ALL MENUS
// ============================================
function closeAllMenus() {
    const allMenus = [
        { menu: document.getElementById("masterSubmenu"), btn: "toggleSubmenu", type: "master" },
        { menu: document.getElementById("inventorySubmenu"), btn: "toggleInventorySubmenu", type: "inventory" },
        { menu: document.getElementById("stockSubmenu"), btn: "toggleStockSubmenu", type: "stock" },
        { menu: document.getElementById("reportSubMenu"), btn: "toggleReportSubmenu", type: "report" },
        { menu: document.getElementById("billingSubMenu"), btn: "toggleBillingSubmenu", type: "billing" },
        { menu: document.getElementById("paymentSubmenu"), btn: "togglePaymentSubmenu", type: "payment" }
    ];

    allMenus.forEach(({ menu, type }) => {
        if (menu && menu.classList.contains("open")) {
            menu.classList.remove("open");

            // Find and reset chevron
            const btn = menu.previousElementSibling;
            if (btn) {
                const chevron = btn.querySelector(".chevron");
                if (chevron) chevron.classList.remove("down");
                // Remove highlight from menu button
                btn.classList.remove("active");
            }
        }
    });
}

// ============================================
// MENU TOGGLE FUNCTIONS
// ============================================

function toggleStockSubmenu() {
    console.log("📦 Stock submenu toggle");

    const stockSubmenu = document.getElementById("stockSubmenu");
    const isCurrentlyOpen = stockSubmenu.classList.contains("open");

    // Toggle this submenu
    stockSubmenu.classList.toggle("open");

    const btn = stockSubmenu.previousElementSibling;
    if (btn) {
        const chevron = btn?.querySelector(".chevron");
        chevron?.classList.toggle("down");

        // Highlight when open, remove highlight when closed
        if (isCurrentlyOpen) {
            btn.classList.remove("active");
        } else {
            btn.classList.add("active");
        }
    }
}

function toggleSubmenu() {
    console.log("🔽 Master submenu toggle clicked");

    const masterMenu = document.getElementById("masterSubmenu");
    const isCurrentlyOpen = masterMenu.classList.contains("open");

    // Close all other main menus
    closeAllMenus();

    // Toggle master menu
    if (!isCurrentlyOpen) {
        masterMenu.classList.add("open");
        const masterBtn = masterMenu.previousElementSibling;
        if (masterBtn) {
            const chevron = masterBtn.querySelector(".chevron");
            chevron?.classList.add("down");
            // Highlight the active menu button
            masterBtn.classList.add("active");
        }
    }
}

function toggleInventorySubmenu() {
    console.log("🔽 Inventory submenu toggle clicked");

    const inventoryMenu = document.getElementById("inventorySubmenu");
    const isCurrentlyOpen = inventoryMenu.classList.contains("open");

    // Close all other main menus
    closeAllMenus();

    // Toggle inventory menu
    if (!isCurrentlyOpen) {
        inventoryMenu.classList.add("open");
        const inventoryBtn = inventoryMenu.previousElementSibling;
        if (inventoryBtn) {
            const chevron = inventoryBtn.querySelector(".chevron");
            chevron?.classList.add("down");
            // Highlight the active menu button
            inventoryBtn.classList.add("active");
        }
    }
}

function toggleBillingSubmenu() {
    console.log("🔽 Billing submenu toggle clicked");

    const billingSubmenu = document.getElementById("billingSubMenu");
    const isCurrentlyOpen = billingSubmenu.classList.contains("open");

    // Close all other main menus
    closeAllMenus();

    // Toggle billing menu
    if (!isCurrentlyOpen) {
        billingSubmenu.classList.add("open");
        const billingBtn = billingSubmenu.previousElementSibling;
        if (billingBtn) {
            const chevron = billingBtn.querySelector(".chevron");
            chevron?.classList.add("down");
            // Highlight the active menu button
            billingBtn.classList.add("active");
        }
    }
}

function toggleReportSubmenu() {
    console.log("🔽 Report submenu toggle clicked");

    const reportSubMenu = document.getElementById("reportSubMenu");
    const isCurrentlyOpen = reportSubMenu.classList.contains("open");

    // Close all other main menus
    closeAllMenus();

    // Toggle report menu
    if (!isCurrentlyOpen) {
        reportSubMenu.classList.add("open");
        const reportBtn = reportSubMenu.previousElementSibling;
        if (reportBtn) {
            const chevron = reportBtn.querySelector(".chevron");
            chevron?.classList.add("down");
            // Highlight the active menu button
            reportBtn.classList.add("active");
        }
    }
}

// 🔹 NEW: Payment submenu toggle
function togglePaymentSubmenu() {
    console.log("💳 Payment submenu toggle");

    const paymentSubmenu = document.getElementById("paymentSubmenu");
    const isCurrentlyOpen = paymentSubmenu.classList.contains("open");

    // Toggle this submenu (don't close parent billing menu)
    paymentSubmenu.classList.toggle("open");

    const btn = paymentSubmenu.previousElementSibling;
    if (btn) {
        const chevron = btn?.querySelector(".chevron");
        chevron?.classList.toggle("down");

        // Highlight when open, remove highlight when closed
        if (isCurrentlyOpen) {
            btn.classList.remove("active");
        } else {
            btn.classList.add("active");
        }
    }
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
    console.log("👋 Logging out user");
    localStorage.removeItem("rememberedUser");
    sessionStorage.removeItem("rememberedUser");
    currentUser = null;
    window.location.replace("../index.html");
}

// ============================================
// NAVIGATION FUNCTION
// ============================================
async function navigateTo(page) {
    console.log(`➡️ navigateTo("${page}")`);
    currentPage = page;

    localStorage.setItem("lastPage", page);

    const menuItems = document.querySelectorAll(".menu-item");
    menuItems.forEach((item) => item.classList.remove("active"));

    const mainContent = document.getElementById("mainContent");
    if (!mainContent) return;

    switch (page) {
        case "home":
            mainContent.innerHTML = renderHomePage();
            initHomePage();
            document.querySelector('.menu-item[onclick*="home"]')?.classList.add("active");
            break;

        case "items":
            mainContent.innerHTML = await renderItemsTable();
            document.querySelector('.submenu-item[onclick*="items"]')?.classList.add("active");
            break;

        case "user":
            if (typeof renderuserTable === "function") {
                mainContent.innerHTML = await renderuserTable();
            }
            document.querySelector('.submenu-item[onclick*="user"]')?.classList.add("active");
            break;

        case "shop":
            if (typeof rendershopTable === "function") {
                mainContent.innerHTML = await rendershopTable();
            }
            document.querySelector('.submenu-item[onclick*="shop"]')?.classList.add("active");
            break;

        case "inventory_staff_attendance":
            // showLoadingSpinner();
            if (typeof renderStaffAttendancePage === "function") {
                mainContent.innerHTML = await renderStaffAttendancePage();
            }
            document.querySelector('.submenu-item[onclick*="Staff_Attendance"]')?.classList.add("active");
            break;

        case "inventory_staff":
            mainContent.innerHTML = await renderInventoryStaffPage();
            document.querySelector('.submenu-item[onclick*="inventory_staff"]')?.classList.add("active");
            initInventoryStaffPage();
            break;

        case "bank":
            mainContent.innerHTML = await renderbankTable();
            document.querySelector('.submenu-item[onclick*="bank"]')?.classList.add("active");
            break;

        case "expense_category":
            mainContent.innerHTML = await renderExpenseCategoryTable();
            document.querySelector('.submenu-item[onclick*="expense_category"]')?.classList.add("active");
            break;

        case "staff":
            mainContent.innerHTML = await renderstaffTable();
            document.querySelector('.submenu-item[onclick*="staff"]')?.classList.add("active");
            break;

        case "staff_expense":
            mainContent.innerHTML = await renderStaffExpensePage();
            document.querySelector('.submenu-item[onclick*="staff_expense"]')?.classList.add("active");
            break;

        case "inventory_orders":
            mainContent.innerHTML = await renderInventoryOrdersPage();
            document.querySelector('.submenu-item[onclick*="inventory_orders"]')?.classList.add("active");
            break;

        case "expances":
            mainContent.innerHTML = await renderInventoryExpancesPage();
            document.querySelector('.submenu-item[onclick*="expances"]')?.classList.add("active");
            break;

        case "kitchenSummary":
            mainContent.innerHTML = await renderKitchenSummary();
            document.querySelector('.submenu-item[onclick*="kitchenSummary"]')?.classList.add("active");
            break;

        case "clientMonthlyReport":
            // console.log(400);
            // mainContent.innerHTML = "";
            mainContent.innerHTML = await initClientMothlyReportCard();
            document.querySelector('.submenu-item[onclick*="clientMonthlyReport"]')?.classList.add("active");
            initClientMonthDropdown();
            break;

        case "staffAttendanceReports":
            mainContent.innerHTML = await initStaffAttendanceReportsCard();
            document.querySelector('.submenu-item[onclick*="staffAttendanceReports"]')?.classList.add("active");
            initStaffMonthDropdown();
            break;

        case "staffExpReports":
            mainContent.innerHTML = await initStaffExpMothlyReportCard();
            document.querySelector('.submenu-item[onclick*="staffExpReports"]')?.classList.add("active");
            initStaffExpMonthDropdown();
            break;

        case "expancesReport":
            mainContent.innerHTML = await initGeneralMothlyReportCard();
            document.querySelector('.submenu-item[onclick*="expancesReport"]')?.classList.add("active");
            initGeneralMonthDropdown();
            break;

        case "currentStock":
            mainContent.innerHTML = await renderCurrentStockPage();
            document.querySelector('.submenu-item[onclick*="currentStock"]')?.classList.add("active");
            // initMonthDropdown();
            break;


        case "stockMovement":
            mainContent.innerHTML = await renderCurrentStockMovementPage();
            document.querySelector('.submenu-item[onclick*="stockMovement"]')?.classList.add("active");
            // initMonthDropdown();
            break;

        case "stockAdjustment":
            mainContent.innerHTML = await renderStockAdjustmentPage();
            document.querySelector('.submenu-item[onclick*="stockMovement"]')?.classList.add("active");
            break;

        case "clientDues":
            mainContent.innerHTML = await initClientDuesReportCard();
            document.querySelector('.submenu-item[onclick*="stockMovement"]')?.classList.add("active");
            initClientDuesDropdown();
            break;

        // 🔹 NEW: Payment pages
        case "addPayment":
            mainContent.innerHTML = await initPaymentCard();
            document.querySelector('.submenu-item[onclick*="addPayment"]')?.classList.add("active");
            initPaymentClientDropdown();
            break;

        case "paymentHistory":
            mainContent.innerHTML = await initPaymentHistoryCard();
            document.querySelector('.submenu-item[onclick*="stockMovement"]')?.classList.add("active");
            initClientDropdown();
            break;

        case "profile":
            mainContent.innerHTML = renderProfilePage();
            break;
    }

    closeSidebar();

    const dropdown = document.getElementById("userDropdown");
    if (dropdown) dropdown.classList.add("hidden");
}

export function getProfileContent() {
    return renderProfilePage();
}

// ============================================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================================
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.toggleSubmenu = toggleSubmenu;
window.toggleInventorySubmenu = toggleInventorySubmenu;
window.toggleReportSubmenu = toggleReportSubmenu;
window.toggleBillingSubmenu = toggleBillingSubmenu;
window.togglePaymentSubmenu = togglePaymentSubmenu;
window.toggleUserMenu = toggleUserMenu;
window.logout = logout;
window.navigateTo = navigateTo;
window.getProfileContent = getProfileContent;
window.toggleStockSubmenu = toggleStockSubmenu;

// ============================================
// RESPONSIVE HANDLING
// ============================================
window.addEventListener("resize", function () {
    const mainContent = document.getElementById("mainContent");
    if (mainContent && !sidebarOpen) {
        mainContent.classList.remove("sidebar-open");
    }
});