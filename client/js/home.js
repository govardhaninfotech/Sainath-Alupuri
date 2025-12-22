// home.js
// Responsible only for Dashboard Home Page
// All logs included for debugging & flow understanding

import { ordersURLphp, staffURLphp } from "../apis/api.js";
import { userURLphp } from "../apis/api.js";

console.log("✅ home.js loaded");

// Fake APIs for now (you can replace later)
const ORDERS_URL = "http://localhost:3000/orders";
const STATUS_URL = "http://localhost:3000/status";

let allOrders = [];
let allUsers = [];

// Init Home
export function initHomePage() {
    console.log("📌 Initializing Home Dashboard...");

    return Promise.all([
        fetchOrders(),
        fetchUsers()
    ]).then(() => {
        renderHomeStats();
    });
}

// ===============================
// FETCH FUNCTIONS
// ===============================

async function fetchOrders() {
    console.log("📡 Fetching orders from:", ordersURLphp);

    return fetch(ordersURLphp).then(res => res.json()).then(data => {
        console.log("✅ Orders fetched:", data);
        allOrders = Array.isArray(data) ? data : [];
    }).catch(err => {
        console.error("❌ Failed to load orders:", err);
        allOrders = [];
    });
}

async function fetchUsers() {
    console.log("📡 Fetching users/staff from:", staffURLphp);

    return fetch(staffURLphp).then(res => res.json()).then(data => {
        console.log("✅ Staff API response:", data);

        if (Array.isArray(data)) {
            allUsers = data;
        } else if (Array.isArray(data.data)) {
            allUsers = data.data;
        } else {
            allUsers = [];
        }
    }).catch(error => {
        console.error("❌ Failed to load staff/users:", error);
        allUsers = [];
    });
}

// ===============================
// RENDER HOME DATA
// ===============================

function renderHomeStats() {

    const totalOrders = allOrders.length;
    const delivered = allOrders.filter(o => o.status === "delivered").length;
    const pending = allOrders.filter(o => o.status === "pending").length;
    const sameDay = allOrders.filter(o => o.delivery_type === "same_day").length;
    const nextDay = allOrders.filter(o => o.delivery_type === "next_day").length;

    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter(u => u.status === "active");
    const inactiveUsers = allUsers.filter(u => u.status === "inactive");
    const activeCount = activeUsers.length;
    const inactiveCount = inactiveUsers.length;

    const totalAmountReceived = allOrders
        .filter(o => o.status === "delivered")
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    const dueAmount = allOrders
        .filter(o => o.status === "pending")
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    // Performance metrics
    const deliveryRate = totalOrders > 0 ? ((delivered / totalOrders) * 100).toFixed(1) : 0;
    const sameDayPercent = totalOrders > 0 ? ((sameDay / totalOrders) * 100).toFixed(1) : 0;

    console.log("📊 Dashboard Stats Calculated");

    // Orders stats grid - Professional Design
    document.getElementById("homeOrdersStats").innerHTML = `
        <div class="order-card">
            <div class="order-card-header">
                <span class="order-label">TOTAL ORDERS</span>
                <span class="order-icon blue-icon">📦</span>
            </div>
            <div class="order-value">${totalOrders}</div>
            <div class="order-footer">All-time orders</div>
        </div>
        
        <div class="order-card">
            <div class="order-card-header">
                <span class="order-label">DELIVERED</span>
                <span class="order-icon green-icon">✓</span>
            </div>
            <div class="order-value">${delivered}</div>
            <div class="order-footer">${deliveryRate}% success rate</div>
        </div>
        
        <div class="order-card">
            <div class="order-card-header">
                <span class="order-label">PENDING</span>
                <span class="order-icon orange-icon">⏱</span>
            </div>
            <div class="order-value">${pending}</div>
            <div class="order-footer">Awaiting action</div>
        </div>
        
        <div class="order-card">
            <div class="order-card-header">
                <span class="order-label">SAME DAY</span>
                <span class="order-icon purple-icon">⚡</span>
            </div>
            <div class="order-value">${sameDay}</div>
            <div class="order-footer">${sameDayPercent}% of orders</div>
        </div>
        
        <div class="order-card">
            <div class="order-card-header">
                <span class="order-label">NEXT DAY</span>
                <span class="order-icon teal-icon">📅</span>
            </div>
            <div class="order-value">${nextDay}</div>
            <div class="order-footer">Scheduled delivery</div>
        </div>
    `;

    // Finance stats grid
    document.getElementById("homeFinanceStats").innerHTML = `
        <div class="home-card green">
            <div class="card-header">💚 Received</div>
            <div class="card-value">₹${totalAmountReceived.toLocaleString('en-IN')}</div>
            <div class="card-footer">Completed transactions</div>
        </div>
        <div class="home-card red">
            <div class="card-header">❌ Due</div>
            <div class="card-value">₹${dueAmount.toLocaleString('en-IN')}</div>
            <div class="card-footer">Outstanding payments</div>
        </div>
        <div class="home-card blue">
            <div class="card-header">💰 Total Revenue</div>
            <div class="card-value">₹${(totalAmountReceived + dueAmount).toLocaleString('en-IN')}</div>
            <div class="card-footer">All orders combined</div>
        </div>
    `;

    // Users stats grid - NEW DESIGN
    document.getElementById("homeUsersStats").innerHTML = `
        <div class="users-layout">
            <!-- Left Side - User Lists -->
            <div class="users-lists">
                <!-- Active Users -->
                <div class="user-list-box active">
                    <div class="list-header">
                        <span class="list-icon">✅</span>
                        <h3>Active Users</h3>
                        <span class="list-count">${activeCount}</span>
                    </div>
                    <div class="list-content">
                        ${activeUsers.length > 0 ? activeUsers.map(user => `
                            <div class="user-item">
                                <div class="user-avatar">${(user.name || 'U').charAt(0).toUpperCase()}</div>
                                <div class="user-info">
                                    <p class="user-name">${user.name || 'Unknown'}</p>
                                    <p class="user-shop">${user.shop_name || 'N/A'}</p>
                                </div>
                            </div>
                        `).join('') : '<p class="empty-list">No active users</p>'}
                    </div>
                </div>

                <!-- Inactive Users -->
                <div class="user-list-box inactive">
                    <div class="list-header">
                        <span class="list-icon">⏸</span>
                        <h3>Inactive Users</h3>
                        <span class="list-count">${inactiveCount}</span>
                    </div>
                    <div class="list-content">
                        ${inactiveUsers.length > 0 ? inactiveUsers.map(user => `
                            <div class="user-item">
                                <div class="user-avatar">${(user.name || 'U').charAt(0).toUpperCase()}</div>
                                <div class="user-info">
                                    <p class="user-name">${user.name || 'Unknown'}</p>
                                    <p class="user-shop">${user.shop_name || 'N/A'}</p>
                                </div>
                            </div>
                        `).join('') : '<p class="empty-list">No inactive users</p>'}
                    </div>
                </div>
            </div>

            <!-- Right Side - All Users Table -->
            <div class="users-table-container">
                <div class="table-header">
                    <h3>All Users Directory</h3>
                    <span class="table-count">Total: ${totalUsers}</span>
                </div>
                <div class="users-table-wrapper">
                    <table class="users-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>User Name</th>
                                <th>Shop Name</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${allUsers.length > 0 ? allUsers.map((user, index) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>
                                        <div class="table-user-info">
                                            <div class="table-user-avatar">${(user.name || 'U').charAt(0).toUpperCase()}</div>
                                            <span>${user.name || 'Unknown'}</span>
                                        </div>
                                    </td>
                                    <td>${user.shop_name || 'N/A'}</td>
                                    <td>
                                        <span class="status-badge ${user.status === 'active' ? 'status-active' : 'status-inactive'}">
                                            ${user.status === 'active' ? '✓ Active' : '⏸ Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="4" class="empty-table">No users found</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // Metrics stats - Visual Progress Bars
    const processed = delivered;
    const processingRate = totalOrders > 0 ? ((processed / totalOrders) * 100).toFixed(1) : 0;
    const avgOrderValue = totalOrders > 0 ? ((totalAmountReceived + dueAmount) / totalOrders).toFixed(0) : 0;

    document.getElementById("homeMetricsStats").innerHTML = `
        <div class="metrics-visual-grid">
            <!-- Delivery Rate -->
            <div class="metric-card">
                <div class="metric-header">
                    <div class="metric-icon blue">📈</div>
                    <div class="metric-info">
                        <h4>Delivery Rate</h4>
                        <p>${delivered} of ${totalOrders} orders delivered</p>
                    </div>
                    <div class="metric-percentage">${deliveryRate}%</div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill blue" style="width: ${deliveryRate}%"></div>
                </div>
            </div>

            <!-- Same Day Rate -->
            <div class="metric-card">
                <div class="metric-header">
                    <div class="metric-icon purple">⚡</div>
                    <div class="metric-info">
                        <h4>Same Day Delivery</h4>
                        <p>${sameDay} fast delivery orders</p>
                    </div>
                    <div class="metric-percentage">${sameDayPercent}%</div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill purple" style="width: ${sameDayPercent}%"></div>
                </div>
            </div>

            <!-- Processing Rate -->
            <div class="metric-card">
                <div class="metric-header">
                    <div class="metric-icon teal">⏱</div>
                    <div class="metric-info">
                        <h4>Processing Rate</h4>
                        <p>${processed} orders handled</p>
                    </div>
                    <div class="metric-percentage">${processingRate}%</div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill teal" style="width: ${processingRate}%"></div>
                </div>
            </div>

            <!-- Average Order Value -->
            <div class="metric-card">
                <div class="metric-header">
                    <div class="metric-icon green">💰</div>
                    <div class="metric-info">
                        <h4>Avg Order Value</h4>
                        <p>Per order average</p>
                    </div>
                    <div class="metric-value">₹${avgOrderValue}</div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill green" style="width: ${Math.min((avgOrderValue / 5000) * 100, 100)}%"></div>
                </div>
            </div>
        </div>
    `;
}

// ===============================
// HTML Generator
// ===============================
export function renderHomePage() {
    return `<h1>Home Page</h1>`;

}

export function renderHomePage1() {
    console.log("🧱 Rendering Home HTML");

    return `
        <div class="home-wrapper">
            
            <!-- Welcome Header -->
            <div class="home-header">
                <h1 class="home-welcome">Sainath Dashboard</h1>
            </div>

            <!-- Orders Section -->
            <div class="home-section">
                <div class="section-header">
                    <h2>📊 Orders Overview</h2>
                </div>
                <div id="homeOrdersStats" class="home-grid"></div>
            </div>

            <!-- Financial Section -->
            <div class="home-section">
                <div class="section-header">
                    <h2>💰 Financial Summary</h2>
                </div>
                <div id="homeFinanceStats" class="home-grid"></div>
            </div>

            <!-- Users Section -->
            <div class="home-section">
                <div class="section-header">
                    <h2>👨‍💼 Users Status</h2>
                </div>
                <div id="homeUsersStats"></div>
            </div>

            <!-- Performance Metrics -->
            <div class="home-section">
                <div class="section-header">
                    <h2>📈 Performance Metrics</h2>
                </div>
                <div id="homeMetricsStats" class="home-grid"></div>
            </div>

        </div>
    `;
}