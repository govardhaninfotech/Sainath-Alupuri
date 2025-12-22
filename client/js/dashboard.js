import { renderclientTable } from "./client.js";
import { renderItemsTable } from "./items.js";
import { renderstaffTable } from "./staff.js";
import { renderbankTable } from "./bank.js";
import { renderuserTable } from "./user.js";
import { rendershopTable } from "./shops.js";
import { renderHomePage, initHomePage } from "./home.js";
import { renderExpenseCategoryTable } from "./expense_category.js";
import { renderInventoryExpancesPage } from "./expances.js";

// 🔹 NEW: Inventory module imports
import { renderInventoryStaffPage, initInventoryStaffPage } from "./inventory.js";
import { renderInventoryOrdersPage, openorderform, calculateOrderTotal, calculateItemTotal } from "./inventory_orders.js";

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

    // ✅ Try to restore last opened page
    const savedPage = localStorage.getItem("lastPage") || "home";
    console.log("🔁 Restoring last page:", savedPage);
    navigateTo(savedPage);
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

// MASTER submenu toggle
function toggleSubmenu() {
    console.log("🔽 Master submenu toggle clicked");

    const submenu = document.getElementById("masterSubmenu");
    if (!submenu) return;

    submenu.classList.toggle("open");

    const masterButton = submenu.previousElementSibling;
    if (masterButton) {
        const chevron = masterButton.querySelector(".chevron");
        if (chevron) {
            chevron.classList.toggle("down");
        }
    }
}

// 🔹 NEW: INVENTORY submenu toggle
function toggleInventorySubmenu() {
    console.log("🔽 Inventory submenu toggle clicked");

    const submenu = document.getElementById("inventorySubmenu");
    if (!submenu) return;

    submenu.classList.toggle("open");

    const inventoryButton = submenu.previousElementSibling;
    if (inventoryButton) {
        const chevron = inventoryButton.querySelector(".chevron");
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

        // 🔹 NEW: Inventory → Staff page
        case "inventory_staff":
            mainContent.innerHTML = await renderInventoryStaffPage();
            document
                .querySelector('.submenu-item[onclick*="inventory_staff"]')
                ?.classList.add("active");
            // After HTML inject, hook up events
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
            // Load the external HTML file
            try {
                const response = await fetch("inventory_staff_attendance.html");
                const html = await response.text();
                mainContent.innerHTML = html;
                document
                    .querySelector('.submenu-item[onclick*="inventory_staff_attendance"]')
                    ?.classList.add("active");
                // Dynamic import and initialize the JS module
                const module = await import("./inventory_attendance.js");
            } catch (err) {
                console.error("Error loading Staff Attendance page:", err);
                mainContent.innerHTML = "<p>Error loading page</p>";
            }
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

function getHomeContent() {
    return `
            <div class="content-card">
                <h2>Welcome to Dashboard</h2>
                <p>Hello, ${currentUser.name}! This is your home page.</p>
            </div>

            <div class="stats-grid">
                <div class="stat-card blue">
                    <h3>Total Users</h3>
                    <div class="stat-value">1,234</div>
                </div>
                <div class="stat-card green">
                    <h3>Active Sessions</h3>
                    <div class="stat-value">89</div>
                </div>
                <div class="stat-card purple">
                    <h3>Total Revenue</h3>
                    <div class="stat-value">$45,678</div>
                </div>
            </div>
        `;
}

function getRowMatirealContent() {
    return `
            <div class="content-card">
                <h2>Raw Material</h2>
                <p style="margin-bottom: 20px;">
                    This is the Raw Material page. You can configure it later with real data.
                </p>
            </div>
        `;
}

function getInventoryContent() {
    // Old generic inventory placeholder (can be removed later)
    return `
            <div class="content-card">
                <h2>Inventory Management</h2>
                <p style="margin-bottom: 20px;">Manage your inventory items here.</p>
                
                <div style="overflow-x: auto;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Item Name</th>
                                <th>SKU</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Product A</td>
                                <td>SKU-001</td>
                                <td>150</td>
                                <td>$25.99</td>
                                <td><span class="badge success">In Stock</span></td>
                            </tr>
                            <tr>
                                <td>Product B</td>
                                <td>SKU-002</td>
                                <td>5</td>
                                <td>$45.50</td>
                                <td><span class="badge warning">Low Stock</span></td>
                            </tr>
                            <tr>
                                <td>Product C</td>
                                <td>SKU-003</td>
                                <td>200</td>
                                <td>$15.00</td>
                                <td><span class="badge success">In Stock</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
}

// 🔹 NEW: simple placeholder for Inventory Orders
function getInventoryOrdersContent() {
    return `
            <div class="content-card">
                <h2>Inventory - Orders</h2>
                <p>This is a placeholder for orders. You can implement it later.</p>
            </div>
        `;
}

function getProfileContent() {
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
window.toggleUserMenu = toggleUserMenu;
window.logout = logout;
window.navigateTo = navigateTo;
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
