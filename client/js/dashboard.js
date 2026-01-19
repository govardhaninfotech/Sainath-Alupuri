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

// 🔹 NEW: Inventory module imports
import { renderInventoryStaffPage, initInventoryStaffPage } from "./inventory.js";
import { renderStaffAttendancePage } from "./inventory_attendance.js";
import { renderStaffAttendanceReportsTable, initMonthDropdown } from "./staffAttendanceReports.js";
import { renderstaffExpancesReportTable } from "./staffExpancesReport.js";
import { renderGeneralExpensesReportTable } from "./General_Expenses_Report.js";
import { renderInventoryOrdersPage, openorderform, calculateOrderTotal, calculateItemTotal } from "./inventory_orders.js";
// import { initPaymentHistoryCard, initClientDropdown } from "./Billing/payment_history.js";

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

    // Check localStorage first (if remember me was checked)
    let userData = localStorage.getItem("rememberedUser");

    // If not in localStorage, check sessionStorage (if remember me was NOT checked)
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

    // Hook close button
    const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");
    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener("click", closeSidebar);
    }

    // Initialize sidebar state based on screen size
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

    const billingSubmenu = document.getElementById("billingSubMenu");
    if (!billingSubmenu) return;

    // Close all other submenus when opening this one
    closeAllSubmenus();

    billingSubmenu.classList.toggle("open");
    const billingBtn = billingSubmenu.previousElementSibling;
    if (billingBtn) {
        const chevron = billingBtn.querySelector(".chevron");
        if (chevron) {
            chevron.classList.toggle("down");
        }
    }
}
function toggleExpancesSubmenu() {
    console.log("🔽 toggleExpancesSubmenu submenu toggle clicked");

    const expancesSubmenu = document.getElementById("expancesSubmenu");
    if (!expancesSubmenu) return;

    // Close all other submenus when opening this one
    closeAllSubmenus();

    expancesSubmenu.classList.toggle("open");
    const billingBtn = expancesSubmenu.previousElementSibling;
    if (billingBtn) {
        const chevron = billingBtn.querySelector(".chevron");
        if (chevron) {
            chevron.classList.toggle("down");
        }
    }
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

// Function to close all submenus
function closeAllSubmenus() {
    const allSubmenus = document.querySelectorAll(".submenu");
    allSubmenus.forEach(submenu => {
        submenu.classList.remove("open");
        const button = submenu.previousElementSibling;
        if (button) {
            const chevron = button.querySelector(".chevron");
            if (chevron) {
                chevron.classList.remove("down");
            }
        }
    });
}

function toggleSubmenu() {
    console.log("🔽 Master submenu toggle clicked");

    const masterMenu = document.getElementById("masterSubmenu");
    const isCurrentlyOpen = masterMenu.classList.contains("open");

    // Close all other main menus
    closeAllSubmenus();

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

// 🔹 NEW: INVENTORY submenu toggle
function toggleInventorySubmenu() {
    console.log("🔽 Inventory submenu toggle clicked");

    const submenu = document.getElementById("inventorySubmenu");
    if (!submenu) return;

    // Close all other submenus when opening this one
    closeAllSubmenus();

    submenu.classList.toggle("open");

    const inventoryButton = submenu.previousElementSibling;
    if (inventoryButton) {
        const chevron = inventoryButton.querySelector(".chevron");
        if (chevron) {
            chevron.classList.toggle("down");
        }
    }
}

function toggleExpensesSubmenu() {
    console.log("🔽 Expenses submenu toggle clicked");

    const submenu = document.getElementById("expensesSubmenu");
    if (!submenu) return;

    // Close all other submenus when opening this one
    closeAllSubmenus();

    submenu.classList.toggle("open");

    const expensesButton = submenu.previousElementSibling;
    if (expensesButton) {
        const chevron = expensesButton.querySelector(".chevron");
        if (chevron) {
            chevron.classList.toggle("down");
        }
    }
}
function toggleReportSubmenu() {
    console.log("🔽 Reports submenu toggle clicked");

    const submenu = document.getElementById("reportSubMenu");
    if (!submenu) return;

    // Close all other submenus when opening this one
    closeAllSubmenus();

    submenu.classList.toggle("open");

    const reportButton = submenu.previousElementSibling;
    if (reportButton) {
        const chevron = reportButton.querySelector(".chevron");
        if (chevron) {
            chevron.classList.toggle("down");
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

    // ✅ store this page so after reload we come back here
    localStorage.setItem("lastPage", page);

    // Clear active classes
    const menuItems = document.querySelectorAll(".menu-item");
    menuItems.forEach((item) => item.classList.remove("active"));

    const mainContent = document.getElementById("mainContent");
    if (!mainContent) return;

    switch (page) {
        case "home":
            mainContent.innerHTML = renderHomePage();
            initHomePage();
            document
                .querySelector('.menu-item[onclick*="home"]')
                ?.classList.add("active");
            break;


        case "items":
            mainContent.innerHTML = await renderItemsTable();
            document
                .querySelector('.submenu-item[onclick*="items"]')
                ?.classList.add("active");
            break;

        case "client":
            mainContent.innerHTML = await renderclientTable();
            document
                .querySelector('.submenu-item[onclick*="client"]')
                ?.classList.add("active");
            break;

        case "user":
            if (typeof renderuserTable === "function") {
                mainContent.innerHTML = await renderuserTable();
            }
            document
                .querySelector('.submenu-item[onclick*="user"]')
                ?.classList.add("active");
            break;

        case "shop":
            if (typeof rendershopTable === "function") {
                mainContent.innerHTML = await rendershopTable();
            }
            document
                .querySelector('.submenu-item[onclick*="shop"]')
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

        // case "row_matireal":
        //     mainContent.innerHTML = getRowMatirealContent();
        //     document
        //         .querySelector('.submenu-item[onclick*="row_matireal"]')
        //         ?.classList.add("active");
        //     break;

        case "staff":
            mainContent.innerHTML = await renderstaffTable();
            document
                .querySelector('.submenu-item[onclick*="staff"]')
                ?.classList.add("active");
            break;

        // 🔹 OLD Inventory page (can keep for future)
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

        // 🔹 NEW: Inventory → Orders
        case "inventory_orders":
            mainContent.innerHTML = await renderInventoryOrdersPage();
            document
                .querySelector('.submenu-item[onclick*="inventory_orders"]')
                ?.classList.add("active");
            // After HTML inject, hook up events
            // OrdersPage();    
            // var date = document.getElementById("btnDate").value = new Date().toISOString().split("T")[0];
            // console.log(date);

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
            mainContent.innerHTML = await renderstaffExpancesReportTable();
            document
                .querySelector('.submenu-item[onclick*="inventory_orders"]')
                ?.classList.add("active");
            initMonthDropdown();


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

        // case "paymentHistory":
        //     mainContent.innerHTML = await initPaymentHistoryCard();
        //     document.querySelector('.submenu-item[onclick*="stockMovement"]')?.classList.add("active");
        //     initClientDropdown();
        //     break;



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

